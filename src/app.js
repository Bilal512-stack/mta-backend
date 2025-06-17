require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./connectDB');

// 📦 Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const transporterRoutes = require('./routes/transporter');
const driverRoutes = require('./routes/driver');
const orderDetailsRoutes = require('./routes/orderDetails');

// 🔐 Middleware Clerk personnalisé (via @clerk/backend)
// const verifyToken = require('./middlewares/verifyToken');

const app = express();
const PORT = process.env.PORT || 5000;

// 🌍 Middlewares globaux
app.use(cors());
app.use(express.json());

// 📌 Routes publiques
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api', driverRoutes);
app.use('/api', require('./routes/orderDetails'));


// 🔐 Routes protégées (vérifiées via verifyToken.js)

// 🧾 Gestion des 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 💥 Gestion des erreurs serveur
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// 🚀 Connexion DB + lancement serveur
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible de démarrer le serveur :', err);
  });
