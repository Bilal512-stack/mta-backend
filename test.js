require('dotenv').config();
const jwt = require('jsonwebtoken');

// Middleware à tester
const authMiddleware = require('./src/middlewares/authmiddleware');

// Simulation d'une requête Express
const req = {
  headers: {
    // Ici on génère un token valide à la volée pour le test
    authorization: 'Bearer ' + jwt.sign({ id: 'testUserId', email: 'test@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' }),
  },
};
const res = {
  status: (code) => {
    console.log('Status code:', code);
    return res;
  },
  json: (data) => {
    console.log('Response JSON:', data);
  },
};
const next = () => {
  console.log('Middleware next() appelé : Token validé avec succès.');
};

// Appel du middleware avec les mocks
authMiddleware(req, res, next);
