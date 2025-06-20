const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // facultatif si pas encore de login
  telephone: { type: String },
  adresse: { type: String },
  ville: { type: String },
  companyName: { type: String },
  role: { type: String, enum: ['client', 'admin'], default: 'client' },
  status: { type: String, enum: ['actif', 'inactif'], default: 'actif' },
  dateInscription: { type: Date, default: Date.now },
  commandes: { type: Number, default: 0 },
  derniereCommande: { type: Date },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
