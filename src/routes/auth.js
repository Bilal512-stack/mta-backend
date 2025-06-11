// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transporter = require('../models/Transporter');

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Utilisateur existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    // Créer le document Transporter lié
    const newTransporter = await Transporter.create({
      name,
      email, // important pour lien
      phone: "",
      truckType: "",
      isAvailable: true,
      currentOrderId: null,
      routes: [],
      workDays: [],
      workHours: [],
      vehicles: [],
      onboardingCompleted: false,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      uid: newTransporter._id.toString(), // 👉 l’_id MongoDB
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Erreur Register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Erreur Login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ONBOARDING
router.post('/onboarding', async (req, res) => {
  const { uid, routes, workDays, workHours, vehicles } = req.body;

  if (!mongoose.Types.ObjectId.isValid(uid)) {
    return res.status(400).json({ error: 'ID invalide' });
  }

  try {
    const result = await Transporter.updateOne(
      { _id: uid }, // 👉 utilise l’_id Mongo natif
      {
        $set: {
          routes,
          workDays,
          workHours,
          vehicles,
          onboardingCompleted: true,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    res.status(200).json({ message: 'Onboarding enregistré avec succès' });
  } catch (error) {
    console.error('Erreur onboarding backend :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
