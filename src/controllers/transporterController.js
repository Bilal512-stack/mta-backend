const Transporter = require('../models/Transporter');

const createTransporter = async (req, res) => {
  const { name, email, phone, truckType } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nom et email sont requis' });
  }

  try {
    const newTransporter = new Transporter({
      name,
      email,
      phone,
      truckType,
      isAvailable: true,
      onboardingCompleted: false,
      createdAt: new Date(),
    });

    await newTransporter.save();

    res.status(201).json({
      message: 'Transporteur créé avec succès',
      uid: newTransporter._id.toString(),
    });
  } catch (error) {
    console.error('Erreur création transporteur :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateTransporter = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedTransporter = await Transporter.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedTransporter) {
      return res.status(404).json({ message: "Transporteur non trouvé" });
    }

    res.status(200).json(updatedTransporter);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du transporteur", error });
  }
};

module.exports = {
  createTransporter,
  updateTransporter,
};
