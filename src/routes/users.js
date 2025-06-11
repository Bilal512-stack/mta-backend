
// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Exemple : mise à jour profil
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.status(200).json({ message: 'Profil mis à jour', data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
