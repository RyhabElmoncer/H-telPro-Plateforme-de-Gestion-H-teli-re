const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

router.use(protect);
router.use(authorize('admin'));

// Send promotion to all clients
router.post('/promo', async (req, res) => {
  try {
    const { subject, message, discountPercent, validUntil } = req.body;
    const clients = await User.find({ role: 'client', isActive: true });

    await notificationService.sendPromotion(clients, {
      subject,
      message,
      discountPercent,
      validUntil
    });

    res.json({ success: true, message: `Promotion envoyée à ${clients.length} client(s).` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test notification webhook
router.post('/test', async (req, res) => {
  try {
    const { type } = req.body;
    const testPayload = {
      type: type || 'test',
      timestamp: new Date().toISOString(),
      data: { message: `Test notification de type: ${type}`, source: 'Admin Panel' }
    };
    await notificationService.sendWebhook(type || 'test', testPayload);
    res.json({ success: true, message: `Notification test "${type}" envoyée à n8n.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Webhook n8n non disponible. Vérifiez votre configuration.' });
  }
});

module.exports = router;

