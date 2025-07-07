// routes/assign.js
const express = require('express');
const Transporter = require('../models/Transporter');
const Order = require('../models/Order');
const router = express.Router();

const getCurrentDay = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // format "HH:MM"
};

router.post('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1️⃣ Récupérer la commande
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    if (order.status !== 'en attente') {
      return res.status(400).json({ error: 'La commande n\'est pas disponible pour l\'assignation' });
    }

    const today = getCurrentDay();
    const currentTime = getCurrentTime();

    // 2️⃣ Recherche d’un transporteur disponible et compatible
    const transporters = await Transporter.find({
      isAvailable: true,
      currentorderId: null,
      truckCapacity: { $gte: order.weight },
      workDays: today,
    });

    if (transporters.length === 0) {
      return res.status(404).json({ error: 'Aucun transporteur disponible aujourd\'hui' });
    }

    // 3️⃣ Filtrer par horaires et itinéraires
    const compatibleTransporter = transporters.find(transporter => {
      if (transporter.workHours && transporter.workHours.start && transporter.workHours.end) {
        if (currentTime < transporter.workHours.start || currentTime > transporter.workHours.end) {
          return false;
        }
      }

      return transporter.routes.some(route =>
        route.from && route.to &&
        order.senderAddress.includes(route.from) &&
        order.recipientAddress.includes(route.to)
      );
    });

    if (!compatibleTransporter) {
      return res.status(404).json({ error: 'Aucun transporteur disponible sur cet itinéraire ou en ce moment' });
    }

    // 4️⃣ Mise à jour du transporteur
    compatibleTransporter.currentorderId = order._id;
    compatibleTransporter.isAvailable = false;
    await compatibleTransporter.save();

    // 5️⃣ Mise à jour de la commande
    order.transporterId = compatibleTransporter._id;
    order.status = 'assignée';
    await order.save();

    // ✅ Émettre la notification socket.io
    const io = req.app.get('io'); // Récupérer io injecté dans app.js
    if (io) {
      io.emit('orderAssigned', {
        orderId: order._id,
        transporterId: compatibleTransporter._id,
        transporterName: compatibleTransporter.name,
        transporterPhone: compatibleTransporter.phone,
      });
    }

    return res.status(200).json({
      message: 'Transporteur assigné avec succès',
      transporter: {
        name: compatibleTransporter.name,
        phone: compatibleTransporter.phone,
        email: compatibleTransporter.email,
      },
    });

  } catch (error) {
    console.error('Erreur assignation automatique:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'assignation' });
  }
});

module.exports = router;
