const express = require('express');
const router = express.Router();
const Transporter = require('../models/Transporter');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// GET driver dashboard data
router.get('/driver-dashboard/:id', async (req, res) => {
try {
    const transporterId = req.params.id;

    // Vérifier validité ObjectId
    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
    return res.status(400).json({ error: 'Invalid transporter ID' });
    }

    // Récupérer transporteur
    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
    return res.status(404).json({ error: 'Transporter not found' });
    }

    // Prochaine commande (status assigned ou in-progress)
    const nextOrder = await Order.findOne({
    transporterId: transporter._id.toString(),
    status: { $in: ['assigned', 'in-progress'] }
    }).sort({ 'pickup.time': 1 }).lean();

    // Statistiques (total orders, total distance, total earnings)
const statsAggregation = await Order.aggregate([
  { $match: { transporterId: transporter._id.toString() } },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      totalDistance: { $sum: '$distance' },
      totalEarnings: { $sum: '$montant' }, // important : montant et pas amount
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
    console.error(error);
    res.status(500).json({ error: 'Server error' });
}
});

// POST update availability
router.post('/driver-availability/:id', async (req, res) => {
try {
    const transporterId = req.params.id;
    const { isAvailable } = req.body;

    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
    return res.status(400).json({ error: 'Invalid transporter ID' });
    }

    const transporter = await Transporter.findByIdAndUpdate(
    transporterId,
    { isAvailable },
    { new: true }
    );

    if (!transporter) {
    return res.status(404).json({ error: 'Transporter not found' });
    }

    res.json({ message: 'Availability updated', isAvailable: transporter.isAvailable });
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
}
});

module.exports = router;
