const mongoose = require('mongoose');

const TransportOrderSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Order' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  sender: {
    name: String,
    address: String,
    phone: String,
  },
  recipient: {
    name: String,
    address: String,
    phone: String,
  },
  nature: String,
  weight: Number,
  volume: Number,
  transportMode: String,
  route: {
    from: String,
    to: String,
  },
  estimatedByClient: Number,
  agreedPrice: Number,

  shippingDate: String,
  loadingDate: String,
  loadingHour: String,
  deliveryDate: String,
  deliveryHour: String,

  commitments: String,
  paymentConditions: String,
  notes: String,
});

module.exports = mongoose.model('TransportOrder', TransportOrderSchema);
