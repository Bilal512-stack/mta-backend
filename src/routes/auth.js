const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mta-logistique';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

connectDB();

const router = express.Router();

// Modèle User simple
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }
}));

// Register
router.post('/register', function (req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  User.findOne({ email })
    .then(existing => {
      if (existing) {
        return res.status(409).json({ error: 'Utilisateur existe déjà' });
      }

      return bcrypt.hash(password, 10)
        .then(hash => {
          const newUser = new User({ email, password: hash, name });
          return newUser.save();
        })
        .then(savedUser => {
          res.status(201).json({ message: 'Inscription réussie', user: savedUser });
        });
    })
    .catch(error => {
      console.error('Erreur Register:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    });
});

// Login
router.post('/login', function (req, res) {
  const { email, password } = req.body;

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      return bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) {
            return res.status(401).json({ error: 'Mot de passe incorrect' });
          }

          res.status(200).json({ message: 'Connexion réussie', user });
        });
    })
    .catch(error => {
      console.error('Erreur Login:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    });
});

module.exports = router;
