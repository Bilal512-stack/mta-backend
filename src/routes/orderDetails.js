const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const mongoose = require('mongoose');

// GET order details by ID
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
