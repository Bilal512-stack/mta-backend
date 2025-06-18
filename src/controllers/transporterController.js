const bcrypt = require('bcryptjs');
const Transporter = require('../models/Transporter');

const createTransporter = async (req, res) => {
  const {
    name,
    email,
    password, // ➕ on récupère le password
    phone,
    truckType,
    licensePlate,
    truckCapacity,
    lastActive,
    isAvailable,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, email et mot de passe sont requis.' });
  }

  try {
    const existing = await Transporter.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Un transporteur avec cet email existe déjà.' });
    }

    // 🔐 Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTransporter = new Transporter({
      name,
      email,
      password: hashedPassword, // ✅ mot de passe hashé
      phone,
      truckType,
      licensePlate,
      truckCapacity,
      lastActive,
      isAvailable: isAvailable ?? true,
      onboardingCompleted: false,
      createdAt: new Date(),
    });

    await newTransporter.save();

    res.status(201).json({
      message: 'Transporteur créé avec succès',
      _id: newTransporter._id.toString(),
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
