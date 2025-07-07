// models/Admin.ts
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }, // en vrai tu dois hasher avec bcrypt
  role: { type: String, default: 'admin' } // on peut aussi avoir superadmin plus tard
});

module.exports = mongoose.model('Admin', AdminSchema);
