const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization header reçu :', authHeader);

  if (!authHeader) {
    console.log('Token manquant');
    return res.status(401).json({ error: 'Token manquant' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    console.log('Token mal formaté - parts:', parts);
    return res.status(401).json({ error: 'Token mal formaté' });
  }

  const token = parts[1];
  if (!token) {
    console.log('Token vide après extraction');
    return res.status(401).json({ error: 'Token mal formaté' });
  }

  console.log('Token extrait (premiers caractères) :', token.slice(0, 10) + '...');

  try {
    console.log('Clé secrète JWT utilisée :', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé :', decoded);

    // Remplacer req.userId, req.userEmail, req.userRole par un seul objet req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    console.log('Utilisateur connecté :', req.user);

    next();
  } catch (err) {
    console.error('Erreur vérification token :', err.message);
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

module.exports = authMiddleware;
