require('dotenv').config();
const { verifyToken } = require('@clerk/backend');

async function verifyClerkToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization manquante' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    req.user = payload;
    next();
  } catch (err) {
    console.error('❌ Erreur de vérification Clerk:', err.message);
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = verifyClerkToken;
