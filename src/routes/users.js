const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// Middleware JWT (conservé pour réactivation future)
// function authenticateToken(req, res, next) {
//  const authHeader = req.headers['authorization'];
//  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

 // if (!token) return res.status(401).json({ error: 'Token manquant' });

  //jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
  //  if (err) return res.status(403).json({ error: 'Token invalide' });
   // req.user = user;
   // next();
 // });
// }

// ✅ Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, prenom, nom, role, status } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom obligatoires' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      prenom,
      nom,
      role: role || 'client',
      status: status || 'actif',
    });

    await newUser.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Erreur Login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Profil utilisateur connecté (auth désactivée temporairement)
// router.get('/profile', authenticateToken, async (req, res) => {
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user?.id || '').select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Tous les utilisateurs (auth désactivée temporairement)
// router.get('/', authenticateToken, async (req, res) => {
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Un utilisateur par ID (auth désactivée temporairement)
// router.get('/:id', authenticateToken, async (req, res) => {
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Mise à jour utilisateur (auth désactivée temporairement)
// router.put('/:id', authenticateToken, async (req, res) => {
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.status(200).json({ message: 'Profil mis à jour', data: updated });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Suppression utilisateur (auth désactivée temporairement)
// router.delete('/:id', authenticateToken, async (req, res) => {
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.status(200).json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
