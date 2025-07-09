// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transporter = require('../models/Transporter');

// ✅ REGISTER - Transporteur
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    const existingTransporter = await Transporter.findOne({ email });
    if (existingTransporter) {
      return res.status(409).json({ error: 'Un transporteur avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTransporter = new Transporter({
      name,
      email,
      password: hashedPassword,
      phone: "",
      truckType: "",
      isAvailable: true,
      currentorderId: null,
      routes: [],
      workDays: [],
      workHours: { start: '', end: '' },
      vehicles: [],
      onboardingCompleted: false,
      createdAt: new Date(),
    });

    await newTransporter.save();

    const token = jwt.sign(
      { id: newTransporter._id, email: newTransporter.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        _id: newTransporter._id,
        email: newTransporter.email,
        name: newTransporter.name,
      }
    });

  } catch (error) {
    console.error('Erreur Register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ✅ LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const transporter = await Transporter.findOne({ email });
    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, transporter.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: transporter._id, email: transporter.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        _id: transporter._id,
        email: transporter.email,
        name: transporter.name,
      },
    });
  } catch (error) {
    console.error('Erreur login transporteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ✅ ONBOARDING
router.post('/onboarding', async (req, res) => {
  const { uid, routes, workDays, workHours, vehicles } = req.body;

  if (!mongoose.Types.ObjectId.isValid(uid)) {
    return res.status(400).json({ error: 'ID invalide' });
  }

  try {
    const updated = await Transporter.findByIdAndUpdate(
      uid,
      {
        $set: {
          routes,
          workDays,
          workHours,
          vehicles,
          onboardingCompleted: true,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    res.status(200).json({ message: 'Onboarding enregistré avec succès' });
  } catch (error) {
    console.error('Erreur onboarding backend :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ✅ GET by ID (⚠️ à mettre à la fin pour éviter les conflits avec /login)
router.get('/:id', async (req, res) => {
  try {
    const transporter = await Transporter.findById(req.params.id);
    if (!transporter) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    res.status(200).json(transporter);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
