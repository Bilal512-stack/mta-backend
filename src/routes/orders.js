const express = require('express');
const Order = require('../models/Order');
const Transporter = require('../models/Transporter');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

// 🛡️ Appliquer verifyToken globalement à toutes les routes
router.use(verifyToken);

/**
 * Fonction utilitaire : calcul du montant d’une commande
 */
function calculateOrderAmount(order) {
  const baseAmount = order.distance * 0.01 + order.weight * 2;

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
 * GET /orders → Liste tous les ordres avec calcul du montant
 */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();

    const computedOrders = orders.map((order) => {
      const montant = calculateOrderAmount(order);
      return {
        ...order.toObject(),
        montant,
      };
    });

    res.json(computedOrders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /orders → Crée une nouvelle commande
 */
router.post('/', async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      senderAddress,
      recipientName,
      recipientPhone,
      recipientAddress,
      truckType,
      weight,
      distance,
      nature,
      clientId,
    } = req.body;

    const requiredFields = [
      'senderName', 'senderPhone', 'senderAddress',
      'recipientName', 'recipientPhone', 'recipientAddress',
      'truckType', 'weight', 'distance', 'nature', 'clientId'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        missingFields
      });
    }

    const parsedWeight = parseFloat(weight);
    const parsedDistance = parseFloat(distance);

    if (isNaN(parsedWeight)) return res.status(400).json({ error: 'Poids invalide' });
    if (isNaN(parsedDistance)) return res.status(400).json({ error: 'Distance invalide' });

    const montant = calculateOrderAmount({
      distance: parsedDistance,
      weight: parsedWeight,
      truckType,
      nature
    });

    const newOrder = new Order({
      senderName,
      senderPhone,
      senderAddress,
      recipientName,
      recipientPhone,
      recipientAddress,
      truckType,
      weight: parsedWeight,
      distance: parsedDistance,
      nature,
      montant,
      clientId,
      status: 'en_attente',
      date: new Date(),
    });

    await newOrder.save();
    return res.status(201).json({ message: 'Commande créée', order: newOrder });
  } catch (err) {
    console.error('Erreur création commande :', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /orders/assign/:orderId → Assignation simplifiée
 */
router.patch('/assign/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { transporterId } = req.body;

  if (!orderId || !transporterId) {
    return res.status(400).json({ error: 'Données manquantes.' });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const transporter = await Transporter.findById(transporterId);
    if (!transporter) return res.status(404).json({ error: 'Transporteur introuvable' });

    if (!transporter.isAvailable) {
      return res.status(400).json({ error: 'Transporteur indisponible' });
    }

    const matchingRoute = transporter.routes?.some(route =>
      route.from === order.senderAddress && route.to === order.recipientAddress
    );

    if (!matchingRoute) {
      return res.status(400).json({ error: 'Aucun itinéraire ne correspond à la commande' });
    }

    await Order.findByIdAndUpdate(orderId, {
      status: 'assignée',
      transporterId,
    });

    await Transporter.findByIdAndUpdate(transporterId, {
      isAvailable: false,
      currentOrderId: orderId,
    });

    return res.status(200).json({ message: 'Commande assignée avec succès' });
  } catch (err) {
    console.error('Erreur assignation :', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/**
 * POST /orders/:orderId/assign → Assignation complète
 */
router.post('/:orderId/assign', async (req, res) => {
  const { orderId } = req.params;
  const { transporterId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const transporter = await Transporter.findById(transporterId);
    if (!transporter) return res.status(404).json({ error: 'Transporteur introuvable' });

    if (!transporter.isAvailable) {
      return res.status(400).json({ error: 'Transporteur indisponible' });
    }

    const matchingRoute = transporter.routes?.some(route =>
      route.from === order.senderAddress && route.to === order.recipientAddress
    );

    if (!matchingRoute) {
      return res.status(400).json({ error: 'Aucun itinéraire ne correspond à la commande' });
    }

    order.transporterId = transporterId;
    order.status = 'assignée';
    await order.save();

    transporter.currentOrderId = orderId;
    transporter.isAvailable = false;
    await transporter.save();

    return res.status(200).json({ message: 'Commande assignée avec succès', order });
  } catch (err) {
    console.error('Erreur assignation :', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /orders/history → Récupère les commandes livrées, filtrées par période
 * Query param : filter = 'week' | 'month' | 'all'
 */
router.get('/history', async (req, res) => {
  const { filter } = req.query;
  const query = { status: 'livrée' }; // ou 'delivered' si ton status est en anglais
  const now = new Date();

  if (filter === 'week') {
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    query.date = { $gte: lastWeek };
  } else if (filter === 'month') {
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);
    query.date = { $gte: lastMonth };
  }

  try {
    const orders = await Order.find(query).sort({ date: -1 });
    const computed = orders.map(order => ({
      ...order.toObject(),
      montant: calculateOrderAmount(order),
    }));

    return res.json(computed);
  } catch (err) {
    console.error('Erreur /orders/history :', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});



module.exports = router;

