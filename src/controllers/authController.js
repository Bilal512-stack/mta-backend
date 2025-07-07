// authController.js ou auth route
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' }, // Ajout du rôle
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Erreur login admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
