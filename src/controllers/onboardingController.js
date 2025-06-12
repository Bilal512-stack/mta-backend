const mongoose = require('mongoose');
const Transporter = require('../models/Transporter');

const saveOnboarding = async (req, res) => {
  try {
    console.log('📥 Données reçues pour onboarding :', req.body);

    const { transporterId, routes, workDays, workHours, vehicles } = req.body;

    if (!transporterId || !mongoose.Types.ObjectId.isValid(transporterId)) {
      return res.status(400).json({ message: 'Identifiant transporteur invalide ou manquant' });
    }

    // Mise à jour du transporteur avec les données onboarding
    const updatedTransporter = await Transporter.findByIdAndUpdate(
      transporterId,
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
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }

    // Renvoie l'id sous le nom transporterId pour cohérence frontend
    return res.status(200).json({ 
      message: 'Onboarding sauvegardé avec succès', 
      transporterId: updatedTransporter._id.toString(),
      transporter: updatedTransporter
    });

  } catch (error) {
    console.error('❌ Erreur côté backend onboarding :', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'onboarding' });
  }
};

module.exports = { saveOnboarding };
