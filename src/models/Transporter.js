const mongoose = require('mongoose');

const TransporterSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  truckType: { type: String, required: true },
  isAvailable: { type: String, default: 'false' },
  currentOrderId: { type: String, default: null },
});

const Transporter = mongoose.model('Transporter', TransporterSchema);
module.exports = Transporter;
