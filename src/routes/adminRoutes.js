const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Route de connexion sécurisée
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Recherche de l'admin par email
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Utilisateur non trouvé.' });

    // Vérification du mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect.' });

    // Génération du token JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Réponse avec le token et le rôle
    res.json({ token, role: admin.role });
  } catch (err) {
    console.error('Erreur serveur :', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
