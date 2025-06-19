const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true },  // ajout clientId obligatoire
    status: {
      type: String,
      enum: ['en attente', 'assignée', 'en cours', 'livrée'], // enum français
      required: true,
    },
    truckType: { type: String },
    weight: { type: Number },
    distance: { type: Number },
    montant: { type: Number },
    pickup: {
      address: { type: String },
      time: { type: String },
    },
    delivery: {
      address: { type: String },
      time: { type: String },
    },
    transporterId: { type: String },
    currentOrderId: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
