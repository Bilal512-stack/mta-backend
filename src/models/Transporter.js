const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  from: String,
  to: String,
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  type: String,
  capacity: String,
  plate: String,
}, { _id: false });

const transporterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: false, trim: true },
  truckType: { type: String, required: false, trim: true },
  isAvailable: { type: Boolean, default: true },
  currentorderId: { type: String, default: null },
  routes: [routeSchema], // tableau d’objets routes
  workDays: { type: [String], default: [] }, // ex: ['Monday', 'Tuesday']
  workHours: { type: Object, default: {} }, // horaires de travail
  vehicles: [vehicleSchema], // tableau d’objets vehicles
  onboardingCompleted: { type: Boolean, default: false },
  licensePlate: String,
  truckCapacity: Number,
  lastActive: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transporter', transporterSchema);
