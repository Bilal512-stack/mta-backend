const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['En attente', 'Assignée', 'En cours', 'Livrée'],
      default: 'En attente',
      required: true,
    },
    truckType: { type: String, required: true },
    weight: { type: Number, required: true },
    distance: { type: Number, default: 0 },
    montant: { type: Number, default: 0 },
    nature: { type: String, required: true },

    pickup: {
      address: { type: String },
      time: { type: String },
      senderName: { type: String },
      senderPhone: { type: String },
    },

    delivery: {
      address: { type: String },
      time: { type: String },
      recipientName: { type: String },
      recipientPhone: { type: String },
    },

    transporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter' },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
