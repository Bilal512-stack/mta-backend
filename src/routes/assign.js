const express = require('express');
const router = express.Router();

// Import des modèles MongoDB (adapte les chemins si besoin)
const Order = require('../models/Order');
const Transporter = require('../models/Transporter');

router.post('/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    if (order.transporterId)
      return res.status(400).json({ error: 'Commande déjà assignée' });

    const transporters = await Transporter.find({ isAvailable: true });

    const eligibleByRoute = transporters.filter((t) =>
      t.routes.some(
        (r) =>
          order.pickup.address.toLowerCase().includes(r.from.toLowerCase()) &&
          order.delivery.address.toLowerCase().includes(r.to.toLowerCase())
      )
    );

    const eligibleByCapacity = eligibleByRoute.filter(
      (t) => t.truckCapacity >= order.weight
    );

    const eligibleByVehicle = eligibleByCapacity.filter((t) =>
      t.vehicles.some((v) =>
        v.type.toLowerCase().includes(order.truckType.toLowerCase())
      )
    );

    if (eligibleByVehicle.length === 0)
      return res.status(404).json({ error: 'Aucun transporteur éligible' });

    const selected = eligibleByVehicle[0];

    order.transporterId = selected._id;
    order.status = 'assignée';
    await order.save();

    selected.currentOrderId = order._id;
    selected.isAvailable = false;
    await selected.save();

    res.status(200).json({
      message: 'Commande assignée automatiquement',
      orderId: order._id,
      transporter: selected.name,
    });
  } catch (err) {
    console.error('❌ Erreur assignation :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
