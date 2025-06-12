const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const authMiddleware = require('./middlewares/authmiddleware'); // ton middleware JWT
const transporterRoutes = require('./routes/transporters');
const router = express.Router();
const {updateTransporter } = require('../src/controllers/transporterController');
const onboardingRoutes = require('./routes/onboarding');


require('dotenv').config();
const connectDB = require('./connectDB');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes publiques (authentification, utilisateurs)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Routes protégées (exemple : commandes, nécessite JWT)
app.use('/api/orders', authMiddleware, ordersRoutes);


// Gestion 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Gestion erreurs serveur
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// Connexion DB puis lancement serveur
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Impossible de démarrer le serveur:', err);
  });
