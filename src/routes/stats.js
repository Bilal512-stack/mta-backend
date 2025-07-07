const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

// ➕ Fonction utilitaire pour calculer une somme
const calculateSum = (array, field) => {
  return array.reduce((sum, item) => sum + (item[field] || 0), 0);
};

router.get('/', async (req, res) => {
  try {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const orders = await Order.find({});
    const ordersThisMonth = await Order.find({ date: { $gte: startOfMonth } });
    const ordersLastMonth = await Order.find({ date: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

    const users = await User.find({ role: 'client' });
    const usersThisMonth = await User.find({ role: 'client', createdAt: { $gte: startOfMonth } });
    const usersLastMonth = await User.find({ role: 'client', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

    const totalSales = calculateSum(orders, 'montant');
    const salesThisMonth = calculateSum(ordersThisMonth, 'montant');
    const salesLastMonth = calculateSum(ordersLastMonth, 'montant');

    const salesGrowth = salesLastMonth === 0 ? 100 : ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100;
    const ordersGrowth = ordersLastMonth.length === 0 ? 100 : ((ordersThisMonth.length - ordersLastMonth.length) / ordersLastMonth.length) * 100;
    const clientsGrowth = usersLastMonth.length === 0 ? 100 : ((usersThisMonth.length - usersLastMonth.length) / usersLastMonth.length) * 100;

    const commandesParStatut = {
      'En attente': 0,
      'Assignée': 0,
      'En cours': 0,
      'Livrée': 0,
      'Annulée': 0,
    };

    orders.forEach(order => {
      if (commandesParStatut.hasOwnProperty(order.status)) {
        commandesParStatut[order.status]++;
      }
    });

    const stats = {
      ventes: {
        total: totalSales,
        pourcentage: parseFloat(salesGrowth.toFixed(1)),
        periode: 'ce mois',
      },
      commandes: {
        total: orders.length,
        pourcentage: parseFloat(ordersGrowth.toFixed(1)),
        periode: 'ce mois',
      },
      clients: {
        total: users.length,
        pourcentage: parseFloat(clientsGrowth.toFixed(1)),
        periode: 'ce mois',
      },
      commandesParStatut,
    };

    console.log('📊 Stats calculées:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Erreur API stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
