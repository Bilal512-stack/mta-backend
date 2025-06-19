const bcrypt = require('bcryptjs');
const Transporter = require('../models/Transporter');

const createTransporter = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    truckType,
    licensePlate,
    truckCapacity,
    lastActive,
    isAvailable,
    routes,
    workDays,
    workHours,
    vehicles,
  } = req.body;

  // Affiche ce que le backend reçoit pour debug
  console.log('Données reçues pour création transporteur:', req.body);

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, email et mot de passe sont requis.' });
  }

  try {
    const existing = await Transporter.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Un transporteur avec cet email existe déjà.' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse workHours s'il est string (ex: "08:00 - 17:00")
    let parsedWorkHours = {};
    if (typeof workHours === 'string') {
      const [start, end] = workHours.split(' - ').map(str => str.trim());
      parsedWorkHours = { start, end };
    } else if (typeof workHours === 'object' && workHours !== null) {
      parsedWorkHours = workHours;
    }

    // Création de l'objet Transporter avec tous les champs
    const newTransporter = new Transporter({
      name,
      email,
      password: hashedPassword,
      phone,
      truckType,
      licensePlate,
      truckCapacity,
      lastActive: lastActive ? new Date(lastActive) : undefined,
      isAvailable: isAvailable ?? true,
      onboardingCompleted: false,
      createdAt: new Date(),
      routes: Array.isArray(routes) ? routes : [],
      workDays: Array.isArray(workDays) ? workDays : [],
      workHours: parsedWorkHours,
      vehicles: Array.isArray(vehicles) ? vehicles : [],
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
