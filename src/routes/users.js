const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User'); // supposons que tu as ce modèle

// Route register
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

    res.status(201).json({ message: 'Inscription réussie', user: newUser });
  } catch (error) {
    console.error('Erreur Register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Ici tu peux générer un token JWT ou autre
    res.status(200).json({ message: 'Connexion réussie', user });
  } catch (error) {
    console.error('Erreur Login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
