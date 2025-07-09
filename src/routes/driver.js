const express = require('express');
const router = express.Router();
const Transporter = require('../models/Transporter');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// GET driver dashboard data
router.get('/driver-dashboard/:id', async (req, res) => {
  try {
    const transporterId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
      return res.status(400).json({ error: 'ID transporteur invalide' });
    }

    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    // Prochaine commande (status assignée ou en cours)
    const nextOrder = await Order.findOne({
      transporterId: transporter._id,
      status: { $in: ['assigned', 'in-progress'] },
    })
      .sort({ 'pickup.time': 1 })
      .lean();

    // Statistiques globales
    const statsAggregation = await Order.aggregate([
      { $match: { transporterId: transporter._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalDistance: { $sum: '$distance' },
          totalEarnings: { $sum: '$montant' },
        },
      },
    ]);

    const stats = statsAggregation[0] || {
      totalOrders: 0,
      totalDistance: 0,
      totalEarnings: 0,
    };

    res.json({
      isAvailable: transporter.isAvailable,
      nextOrder: nextOrder
        ? {
            id: nextOrder._id,
            status: nextOrder.status,
            pickupAddress: nextOrder.pickup?.address,
            pickupTime: nextOrder.pickup?.time,
          }
        : null,
      stats,
    });
  } catch (error) {
    console.error('Erreur driver dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH update availability (plus adapté que POST)
router.patch('/driver-availability/:id', async (req, res) => {
  try {
    const transporterId = req.params.id;
    const { isAvailable } = req.body;

    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
      return res.status(400).json({ error: 'ID transporteur invalide' });
    }

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'Le champ isAvailable doit être un booléen' });
    }

    const transporter = await Transporter.findByIdAndUpdate(
      transporterId,
      { isAvailable },
      { new: true }
    );

    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    // --- Notification temps réel via Socket.io ---
    const io = req.app.get('io');
    if (io) {
      io.emit('transporterAvailabilityChanged', {
        transporterId: transporter._id.toString(),
        isAvailable: transporter.isAvailable,
        name: transporter.name,
      });
    }

    res.json({ message: 'Disponibilité mise à jour', isAvailable: transporter.isAvailable });
  } catch (error) {
    console.error('Erreur update disponibilité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router;
