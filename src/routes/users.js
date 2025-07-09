const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middlewares/authmiddleware');

// ✅ Création d'utilisateur simple (Dashboard)
router.post('/create-user', authMiddleware, async (req, res) => {
  try {
    // ✅ Vérification si l'utilisateur connecté est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit. Seul un administrateur peut créer des utilisateurs.' });
    }

    const { email, prenom, nom, role, status, adresse, ville, telephone, commandes, derniereCommande } = req.body;

    if (!email || !prenom || !nom) {
      return res.status(400).json({ error: 'Email, prénom et nom obligatoires' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const newUser = new User({
      email,
      prenom,
      nom,
      adresse: adresse || '',
      ville: ville || '',
      telephone: telephone || '',
      role: role || 'client',
      status: status || 'actif',
      dateInscription: new Date(),
    });

    await newUser.save();

    // ✅ Si tu veux émettre un socket :
    // const io = req.app.get('io');
    // io.emit('newUserCreated', { email: newUser.email, prenom: newUser.prenom, nom: newUser.nom });

    res.status(201).json({ message: 'Utilisateur créé avec succès', user: newUser });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// ✅ Création d'un utilisateur par l'admin (dashboard)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    // 🔥 Ici c'était la mauvaise propriété
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const { email, password, name, prenom = '', nom = '', role, status } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom obligatoires' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      companyName: name,
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


// ✅ Inscription classique (publique)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, prenom = '', nom = '', role, status } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom obligatoires' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      companyName: name,
      prenom,
      nom,
      role: role || 'client',
      status: status || 'actif',
    });

    await newUser.save();

    // 🔑 Générer le token directement
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 🎯 Émettre l'event socket.io
    req.app.get('io').emit('newUserCreated', {
      _id: newUser._id,
      email: newUser.email,
      name: newUser.companyName,
      prenom: newUser.prenom,
      nom: newUser.nom,
      role: newUser.role,
      status: newUser.status,
    });

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        _id: newUser._id,
        email: newUser.email,
        name: newUser.companyName || '',
        prenom: newUser.prenom || '',
        nom: newUser.nom || '',
        role: newUser.role,
        status: newUser.status,
      },
    });
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
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.companyName || '',
        prenom: user.prenom || '',
        nom: user.nom || '',
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Erreur Login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Récupérer tous les utilisateurs
// ✅ Récupérer tous les utilisateurs
router.get('/', authMiddleware, async (req, res) => {
  try {
    // ✅ Correction : req.user.role au lieu de req.userRole
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit. Seul un administrateur peut voir tous les utilisateurs.' });
    }

    const users = await User.find().select('-password'); // On masque les mots de passe
    res.status(200).json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs.' });
  }
});


// ✅ Récupérer un utilisateur par ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Mise à jour d'un utilisateur
router.put('/:id', authMiddleware, async (req, res) => {
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

// ✅ Suppression d'un utilisateur
router.delete('/:id', authMiddleware, async (req, res) => {
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
