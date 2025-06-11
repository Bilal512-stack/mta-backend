const express = require('express');
const router = express.Router();
const { createTransporter, updateTransporter } = require('../controllers/transporterController');

// ✅ Créer un transporteur
router.post('/', createTransporter);

// ✅ Onboarding par UID
router.post('/onboarding', async (req, res) => {
const { uid, routes, workDays, workHours, vehicles } = req.body;

if (!uid || !mongoose.Types.ObjectId.isValid(uid)) {
    return res.status(400).json({ error: 'UID invalide ou manquant' });
}

try {
    const result = await Transporter.updateOne(
    { _id: uid },
    {
        $set: {
        routes,
        workDays,
        workHours,
        vehicles,
        onboardingCompleted: true,
        },
    }
    );

    if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    res.status(200).json({ message: 'Onboarding enregistré avec succès' });
} catch (err) {
    console.error('Erreur onboarding backend :', err);
    res.status(500).json({ error: 'Erreur serveur pendant l\'onboarding' });
}
});

module.exports = router;
