const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  from: String,
  to: String,
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  type: { type: String, required: true }, // exemple : "Tautliner"
}, { _id: false });

const transporterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: false, trim: true },
  isAvailable: { type: Boolean, default: true },
  currentorderId: { type: String, default: null },
  routes: [routeSchema], // tableau d’objets routes
  workDays: { type: [String], default: [] }, // ex: ['Monday', 'Tuesday']
  workHours: { type: Object, default: {} }, // ex: { start: "08:00", end: "17:00" }
  vehicles: [vehicleSchema], // tableau de types de véhicules
  onboardingCompleted: { type: Boolean, default: false },
  licensePlate: String, // reste séparé
  truckCapacity: Number, // reste séparé
  lastActive: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transporter', transporterSchema);
