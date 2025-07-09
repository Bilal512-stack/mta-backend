require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./connectDB');

// 📦 Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ordersModule = require('./routes/orders');
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

// ✅ CORS dynamique — autorise tous les domaines Vercel + localhost
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true); // ✅ Autoriser
    } else {
      callback(new Error('Not allowed by CORS')); // ❌ Refuser
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));


// ✅ Middleware CORS global
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Socket.io avec même config CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
  }
});
app.set('io', io);

// ✅ Socket events
io.on('connection', (socket) => {
  console.log('✅ Socket connecté :', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Socket déconnecté :', socket.id);
  });
});

// ✅ Inject io dans routes
ordersModule.setSocketIO(io);

// ✅ API routes
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

// ❌ Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

// ✅ Lancer serveur
connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur Railway, port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible de démarrer le serveur :', err);
  });
