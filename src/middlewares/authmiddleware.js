const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transporter = require('../models/Transporter');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token mal formaté' });

  const token = parts[1];
  if (!token) return res.status(401).json({ error: 'Token mal formaté' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let userDoc = null;
    if (decoded.role === 'client') {
      userDoc = await User.findById(decoded.id);
    } else if (decoded.role === 'transporter') {
      userDoc = await Transporter.findById(decoded.id);
    } else {
      return res.status(401).json({ error: 'Rôle utilisateur invalide' });
    }

    if (!userDoc) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = {
      id: userDoc._id,
      email: userDoc.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

module.exports = authMiddleware;
