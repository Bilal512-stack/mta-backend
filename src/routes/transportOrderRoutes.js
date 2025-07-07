const express = require('express');
const mongoose = require('mongoose');
const TransportOrder = require('../routes/transportOrderRoutes');
const authMiddleware = require('../middlewares/authmiddleware');
const { ObjectId } = require('mongodb');

const router = express.Router();

// ✅ Créer un Ordre de Transport
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('🔗 Création OT - Utilisateur connecté :', req.userId);
    console.log('📦 Données reçues :', req.body);

    const otData = req.body;

    if (!otData.orderId || !otData.sender || !otData.recipient || !otData.shippingDate || !otData.agreedPrice) {
      return res.status(400).json({ error: 'Certains champs obligatoires sont manquants.' });
    }

    const newTransportOrder = new TransportOrder({
      ...otData,
      createdBy: req.userId,
      createdAt: new Date(),
    });

    await newTransportOrder.save();

    console.log('✅ OT enregistré avec succès :', newTransportOrder._id);

    res.status(201).json({ message: 'Ordre de Transport créé avec succès.', otId: newTransportOrder._id });
  } catch (error) {
    console.error('❌ Erreur création OT :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l’OT.' });
  }
});

// ✅ Récupérer tous les Ordres de Transport
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transportOrders = await TransportOrder.find().sort({ createdAt: -1 });
    res.status(200).json(transportOrders);
  } catch (error) {
    console.error('❌ Erreur récupération des OT :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des OT.' });
  }
});

// ✅ Récupérer un OT précis
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const otId = req.params.id;

    if (!ObjectId.isValid(otId)) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const transportOrder = await TransportOrder.findById(otId);

    if (!transportOrder) return res.status(404).json({ error: 'Ordre de Transport non trouvé.' });

    res.status(200).json(transportOrder);
  } catch (error) {
    console.error('❌ Erreur récupération OT :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l’OT.' });
  }
});

module.exports = router;
