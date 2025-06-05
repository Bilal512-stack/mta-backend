const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

require('dotenv').config();

const connectDB = require('./connectDB'); // importe ta fonction de connexion
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur lancé sur http://0.0.0.0:${PORT}`);
});
// Connexion à la base puis lancement serveur
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Impossible de démarrer le serveur:', err);
  });
