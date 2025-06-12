const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transporter = require('../models/Transporter');

router.post('/:id', async (req, res) => {
const { id } = req.params;
const { routes, workDays, workHours, vehicles } = req.body;

if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID du transporteur invalide ou manquant' });
}

try {
    const updatedTransporter = await Transporter.findByIdAndUpdate(
    id,
    {
        $set: {
        routes,
        workDays,
        workHours,
        vehicles,
        onboardingCompleted: true,
        },
    },
    { new: true }
    );

    if (!updatedTransporter) {
    return res.status(404).json({ error: 'Transporteur non trouvé' });
    }

    res.status(200).json({
    message: 'Onboarding enregistré avec succès',
    transporterId: updatedTransporter._id.toString(),
    transporter: updatedTransporter,
    });
} catch (err) {
    console.error('❌ Erreur onboarding backend :', err);
    res.status(500).json({ error: 'Erreur serveur pendant l\'onboarding' });
}
});

module.exports = router;
