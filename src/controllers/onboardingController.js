const Transporter = require('../models/Transporter'); // Assure-toi d'importer ton modèle

const saveOnboarding = async (req, res) => {
  try {
    console.log('📥 Données reçues pour onboarding :', req.body);

    const { uid, routes, workDays, workHours, vehicles } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'UID requis pour l\'onboarding' });
    }

    // 🔧 Mise à jour du transporteur existant avec les données d'onboarding
    const updatedTransporter = await Transporter.findOneAndUpdate(
      { uid },
      {
        $set: {
          routes,
          workDays,
          workHours,
          vehicles,
        },
      },
      { new: true }
    );

    if (!updatedTransporter) {
      return res.status(404).json({ message: 'Transporteur non trouvé' });
    }

    return res.status(200).json({ message: 'Onboarding sauvegardé avec succès', transporter: updatedTransporter });

  } catch (error) {
    console.error('❌ Erreur côté backend onboarding :', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'onboarding' });
  }
};

module.exports = { saveOnboarding };
