const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const authMiddleware = require('../middlewares/authmiddleware');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Variable globale pour stocker l'instance Socket.io
let io;
function setSocketIO(socketIO) {
  io = socketIO;
}

// Fonction utilitaire pour calculer le montant
function calculateOrderAmount(order) {
  const baseAmount = (order.distance || 0) * 0.01 + (order.weight || 0) * 2;

  let truckTypeBonus = 0;
  switch (order.truckType) {
    case 'Camion benne': truckTypeBonus = 30; break;
    case 'Camion plateau': truckTypeBonus = 50; break;
    case 'Camion-citerne': truckTypeBonus = 100; break;
  }

  const natureBonus = order.nature === 'Camion frigorifique' ? 150 : 0;
  return Math.round(baseAmount + truckTypeBonus + natureBonus);
}

// Récupérer une commande précise
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const order = await Order.aggregate([
      { $match: { _id: new ObjectId(orderId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$client' },
      {
        $lookup: {
          from: 'transporters',
          localField: 'transporterId',
          foreignField: '_id',
          as: 'transporter',
        },
      },
      { $unwind: { path: '$transporter', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          montant: {
            $round: [
              {
                $add: [
                  { $multiply: ['$distance', 0.01] },
                  { $multiply: ['$weight', 2] },
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$truckType', 'Camion benne'] }, then: 30 },
                        { case: { $eq: ['$truckType', 'Camion plateau'] }, then: 50 },
                        { case: { $eq: ['$truckType', 'Camion-citerne'] }, then: 100 },
                      ],
                      default: 0,
                    },
                  },
                  { $cond: [{ $eq: ['$nature', 'Camion frigorifique'] }, 150, 0] },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          clientId: 1,
          createdAt: 1,
          status: 1,
          pickup: 1,
          delivery: 1,
          transporterId: 1,
          weight: 1,
          distance: 1,
          nature: 1,
          truckType: 1,
          montant: 1,
          clientName: '$client.name',
          clientEmail: '$client.email',
          transporterName: '$transporter.name',
          transporterPhone: '$transporter.phone',
          senderName: { $ifNull: ['$pickup.senderName', 'Expéditeur inconnu'] },
          senderAddress: { $ifNull: ['$pickup.senderAddress', 'Adresse expéditeur inconnue'] },
          senderPhone: { $ifNull: ['$pickup.senderPhone', 'Tél expéditeur inconnu'] },
          recipientName: { $ifNull: ['$delivery.recipientName', 'Destinataire inconnu'] },
          recipientAddress: { $ifNull: ['$delivery.recipientAddress', 'Adresse destinataire inconnue'] },
          recipientPhone: { $ifNull: ['$delivery.recipientPhone', 'Tél destinataire inconnu'] },
        },
      },
    ]);

    if (!order || order.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(order[0]);
  } catch (error) {
    console.error('Erreur récupération commande :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer toutes les commandes
router.get('/', authMiddleware, async (req, res) => {
  try {
    let orders;

    if (req.user.role === 'admin') {
      orders = await Order.find()
        .populate('clientId', 'prenom nom email')
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ clientId: req.user.id })
        .populate('clientId', 'prenom nom email')
        .sort({ createdAt: -1 });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Erreur récupération des commandes :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une commande
router.post('/', authMiddleware, async (req, res) => {
  try {
    const orderData = req.body;
    orderData.status = 'En attente';

    orderData.pickup = {
      senderName: orderData.pickup?.senderName || orderData.senderName,
      senderPhone: orderData.pickup?.senderPhone || orderData.senderPhone,
      address: orderData.pickup?.address || orderData.senderAddress,
    };

    orderData.delivery = {
      recipientName: orderData.delivery?.recipientName || orderData.recipientName,
      recipientPhone: orderData.delivery?.recipientPhone || orderData.recipientPhone,
      address: orderData.delivery?.address || orderData.recipientAddress,
    };

    delete orderData.senderName;
    delete orderData.senderPhone;
    delete orderData.senderAddress;
    delete orderData.recipientName;
    delete orderData.recipientPhone;
    delete orderData.recipientAddress;

    if (!orderData.pickup.senderName || !orderData.pickup.address) {
      return res.status(400).json({ error: 'Informations expéditeur incomplètes.' });
    }
    if (!orderData.delivery.recipientName || !orderData.delivery.address) {
      return res.status(400).json({ error: 'Informations destinataire incomplètes.' });
    }
    if (!orderData.weight || !orderData.distance || !orderData.truckType || !orderData.nature) {
      return res.status(400).json({ error: 'Informations essentielles manquantes.' });
    }

    if (req.user.role === 'admin') {
      if (!orderData.clientId) return res.status(400).json({ error: 'clientId requis pour admin.' });
    } else {
      orderData.clientId = req.user.id;
    }

    orderData.montant = calculateOrderAmount(orderData);
    const newOrder = new Order(orderData);
    await newOrder.save();

    if (io) {
      io.emit('newOrderNotification', {
        id: newOrder._id,
        senderName: newOrder.pickup.senderName,
        recipientAddress: newOrder.delivery.address,
        status: newOrder.status,
      });
    }

    res.status(201).json({ orderId: newOrder._id });
  } catch (error) {
    console.error('Erreur création commande :', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// Modifier une commande
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updateData = req.body;
    if (updateData.pickup && updateData.delivery && updateData.weight && updateData.truckType && updateData.nature) {
      updateData.status = 'En attente';
      updateData.montant = calculateOrderAmount(updateData);
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: 'Commande non trouvée' });

    if (io) io.emit('orderUpdated', updatedOrder);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Erreur mise à jour commande :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une commande
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    if (order.clientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé à supprimer cette commande' });
    }

    await Order.findByIdAndDelete(req.params.id);
    if (io) io.emit('orderDeleted', { orderId: req.params.id });

    res.json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression commande :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = { router, setSocketIO };
