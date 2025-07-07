const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./src/models/Admin'); // adapte le chemin si besoin

require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');

    const email = 'admin@example.com';      // change par ton email
    const plainPassword = 'admin1234';      // choisis ton mot de passe

    // Vérifie si admin existe déjà
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin déjà existant');
      process.exit(0);
    }

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Crée l'admin
    const admin = new Admin({
      email,
      password: hashedPassword,
      role: 'admin',  // ou 'admin', selon ton besoin
    });

    await admin.save();
    console.log('Admin créé avec succès');
    process.exit(0);

  } catch (err) {
    console.error('Erreur création admin:', err);
    process.exit(1);
  }
}

createAdmin();
