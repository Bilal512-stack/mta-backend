const Order = require('../models/Order');

// Récupérer toutes les commandes
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des commandes' });
  }
};

// Récupérer une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la commande' });
  }
};

// Créer une nouvelle commande
exports.createOrder = async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la création de la commande' });
  }
};

// Mettre à jour une commande
exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
};

// Supprimer une commande
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la commande' });
  }
};
