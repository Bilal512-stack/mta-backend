const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

// Fonction utilitaire pour calculer le montant
function calculateOrderAmount(order) {
  const baseAmount = (order.distance || 0) * 0.01 + (order.weight || 0) * 2;

  let truckTypeBonus = 0;
  switch (order.truckType) {
    case 'Camion benne':
      truckTypeBonus = 30;
      break;
    case 'Camion plateau':
      truckTypeBonus = 50;
      break;
    case 'Camion-citerne':
      truckTypeBonus = 100;
      break;
  }

  const natureBonus = order.nature === 'Camion frigorifique' ? 150 : 0;

  return Math.round(baseAmount + truckTypeBonus + natureBonus);
}

/**
 * GET /orders - Récupère toutes les commandes avec données clients et transporteurs + montant calculé
 */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.aggregate([
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
      {
        $unwind: {
          path: '$transporter',
          preserveNullAndEmptyArrays: true,
        },
      },
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
                  {
                    $cond: [{ $eq: ['$nature', 'Camion frigorifique'] }, 150, 0],
                  },
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
        },
      },
    ]);

    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes avec jointure :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /orders - Crée une nouvelle commande
 */
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;

    // Valide ici les champs requis (exemple minimal)
    if (!orderData.clientId || !orderData.pickup || !orderData.delivery) {
      return res.status(400).json({ error: 'Champs clientId, pickup et delivery obligatoires' });
    }

    // Calculer et ajouter le montant
    orderData.montant = calculateOrderAmount(orderData);
    orderData.status = 'en attente'; // statut par défaut à la création

    // Créer et sauvegarder la commande
    const newOrder = new Order(orderData);
    await newOrder.save();

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la commande' });
  }
});

/**
 * PUT /orders/:id - Met à jour une commande existante
 */
router.put('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    // Recalculer le montant si besoin
    if (updateData.distance || updateData.weight || updateData.truckType || updateData.nature) {
      updateData.montant = calculateOrderAmount(updateData);
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });

    if (!updatedOrder) return res.status(404).json({ error: 'Commande non trouvée' });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

/**
 * DELETE /orders/:id - Supprime une commande
 */
router.delete('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) return res.status(404).json({ error: 'Commande non trouvée' });

    res.json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression commande:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

module.exports = router;
