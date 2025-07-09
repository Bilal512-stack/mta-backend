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

// ✅ Autoriser seulement ton frontend Vercel et le localhost dev
const allowedOrigins = [
  'https://orderdash-delta.vercel.app',
  'http://localhost:3000',
  'https://orderdash-b711luc51-bilal-issas-projects.vercel.app',
];

// ✅ CORS pour Express
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

// ✅ Socket.io avec mêmes origines
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});

app.set('io', io);

// ✅ Événements socket
io.on('connection', (socket) => {
  console.log('✅ Socket connecté :', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Socket déconnecté :', socket.id);
  });
});

// ✅ Injecter io dans les routes qui en ont besoin
ordersModule.setSocketIO(io);

// ✅ Routes API
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

// ❌ 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ❌ Erreurs serveur
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// ✅ Connexion DB et lancement serveur
connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur Railway, port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible de démarrer le serveur :', err);
  });
