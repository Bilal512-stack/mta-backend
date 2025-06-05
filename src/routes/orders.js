const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

// GET /orders → Liste tous les ordres
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
