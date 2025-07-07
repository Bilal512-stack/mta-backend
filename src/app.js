require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./connectDB');

// 📦 Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ordersModule = require('./routes/orders'); // Module complet avec io
const transporterRoutes = require('./routes/transporter');
const driverRoutes = require('./routes/driver');
const orderDetailsRoutes = require('./routes/orderDetails');
const assignRoutes = require('./routes/assign');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/adminRoutes');
const transportOrderRoutes = require('./routes/transportOrderRoutes');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

// ✅ Configuration CORS pour autoriser toutes les connexions pendant les tests
app.use(cors({
origin: '*', // 👉 pendant les tests tu laisses ouvert

  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*', // 👉 socket.io accepte aussi toutes les origines pendant les tests
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
app.set('io', io);

// 🔌 Gestion des connexions socket.io
io.on('connection', (socket) => {
  console.log('✅ Nouveau client connecté :', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté :', socket.id);
  });
});

// Injecter io dans les routes orders
ordersModule.setSocketIO(io);

// 📌 Routes publiques
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/orders', ordersModule.router);
app.use('/api/driver', driverRoutes);
app.use('/api/assign-order', assignRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/order-details', orderDetailsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transport-orders', transportOrderRoutes);

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
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur http://192.168.1.34:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible de démarrer le serveur :', err);
  });
