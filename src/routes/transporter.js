const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Transporter = require('../models/Transporter');
const { createTransporter, updateTransporter } = require('../controllers/transporterController');

// ✅ LOGIN (doit être défini en haut pour éviter les collisions avec /:id)
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
    console.error('❌ Erreur login transporteur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ➕ Créer un nouveau transporteur
router.post('/', createTransporter);

// 🛠️ Mettre à jour les infos d’un transporteur
router.put('/:id', updateTransporter);

// 🧭 Onboarding (ajout des itinéraires, jours, horaires, véhicules)
router.post('/onboarding/:id', async (req, res) => {
  const { id } = req.params;
  const { routes, workDays, workHours, vehicles } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID du transporteur invalide ou manquant' });
  }

  try {
    const updatedTransporter = await Transporter.findByIdAndUpdate(
      id,
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

    if (!updatedTransporter) {
      return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    res.status(200).json({
      message: 'Onboarding enregistré avec succès',
      transporterId: updatedTransporter._id.toString(),
      transporter: updatedTransporter,
    });
  } catch (err) {
    console.error('❌ Erreur onboarding backend :', err);
    res.status(500).json({ error: 'Erreur serveur pendant l\'onboarding' });
  }
});

// 📦 Liste de tous les transporteurs
router.get('/', async (req, res) => {
  try {
    const transporters = await Transporter.find();
    res.status(200).json(transporters);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// 🔍 Obtenir un transporteur par email
router.get('/by-email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const transporter = await Transporter.findOne({ email });
    if (!transporter) {
      return res.status(404).json({ error: 'Transporteur introuvable' });
    }
    res.json(transporter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Mettre à jour la disponibilité (toggle depuis le dashboard)
router.patch('/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({ error: 'Le champ isAvailable est requis (true ou false)' });
  }

  try {
    const updated = await Transporter.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }

    res.status(200).json({
      message: 'Disponibilité mise à jour avec succès',
      transporter: updated,
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour dispo :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// 🔍 Obtenir un transporteur par ID (⚠️ placer à la fin pour éviter les conflits)
router.get('/:id', async (req, res) => {
  try {
    const transporter = await Transporter.findById(req.params.id);
    if (!transporter) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }
    res.status(200).json(transporter);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

module.exports = router;
