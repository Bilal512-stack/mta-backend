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

    // Dates de référence
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Toutes les commandes
    const orders = await Order.find({});
    const ordersThisMonth = await Order.find({ date: { $gte: startOfMonth } });
    const ordersLast30Days = await Order.find({ date: { $gte: thirtyDaysAgo } });

    // Tous les utilisateurs
    const users = await User.find({ role: 'client' });

    // Statistiques
    const totalSales = calculateSum(orders, 'montant');
    const salesThisMonth = calculateSum(ordersThisMonth, 'montant');
    const salesLastMonth = calculateSum(await Order.find({
      date: { $gte: lastMonth, $lt: startOfMonth }
    }), 'montant');

    // % d’évolution
    const salesGrowth =
      salesLastMonth === 0 ? '+100%' :
      ((salesThisMonth - salesLastMonth) / salesLastMonth * 100).toFixed(1) + '%';

    const ordersGrowth = (
      (ordersThisMonth.length - ordersLast30Days.length) / (ordersLast30Days.length || 1)
    ).toFixed(1) + '%';

    const clientsGrowth = (
      (users.length - 10) / 10 * 100 // Remplace 10 par la valeur du mois précédent si tu la stockes
    ).toFixed(1) + '%';

    const stats = {
      ventes: {
        total: totalSales,
        pourcentage: salesGrowth,
        periode: 'ce mois'
      },
      commandes: {
        total: orders.length,
        pourcentage: ordersGrowth,
        periode: '30 derniers jours'
      },
      clients: {
        total: users.length,
        pourcentage: clientsGrowth,
        periode: '30 derniers jours'
      }
    };

    console.log('📊 Stats calculées:', stats);

    res.json(stats);
  } catch (error) {
    console.error('Erreur API stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
