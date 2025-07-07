const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  prenom: { type: String, default: '' }, // optionnel à l'inscription
  nom: { type: String, default: '' },    // optionnel à l'inscription
  email: { type: String, required: true, unique: true },
  password: { type: String }, // obligatoire, sauf si spécifié autrement
  telephone: { type: String, default: '' },
  adresse: { type: String, default: '' },
  ville: { type: String, default: '' },
  companyName: { type: String, default: '' },
  role: { type: String, enum: ['client', 'admin'], default: 'client' },
  status: { type: String, enum: ['actif', 'inactif'], default: 'actif' },
  dateInscription: { type: Date, default: Date.now },
  commandes: { type: Number, default: 0 },
  derniereCommande: { type: Date },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
