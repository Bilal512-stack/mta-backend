const mongoose = require('mongoose');

const transporterSchema = new mongoose.Schema({
  uid: String,
  name: String,
  phone: String,
  truckType: String,
  isAvailable: String,
  currentorderId: String,
  routes: Array,
  workDays: Array,
  workHours: Object,
  vehicles: Array,
});

module.exports = mongoose.model('Transporter', transporterSchema);

