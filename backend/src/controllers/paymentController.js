const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const notificationService = require('../services/notificationService');

// @desc    Process payment (static/dev - no real gateway)
// @route   POST /api/payments
// @access  Private
exports.processPayment = async (req, res) => {
  try {
    const { reservationId, method, cardInfo } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('client room');
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Réservation non trouvée.' });
    }

    if (reservation.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Cette réservation est déjà payée.' });
    }

    // Validate card (static dev validation)
    if (method === 'card') {
      if (!cardInfo || !cardInfo.number || !cardInfo.expiryMonth || !cardInfo.expiryYear || !cardInfo.cvv) {
        return res.status(400).json({ success: false, message: 'Informations de carte invalides.' });
      }
      // Simulate declined card (last 4 digits: 0000)
      const last4 = cardInfo.number.replace(/\s/g, '').slice(-4);
      if (last4 === '0000') {
        return res.status(400).json({ success: false, message: 'Carte refusée. Veuillez utiliser une autre carte.' });
      }
    }

    // Create payment record
    const payment = await Payment.create({
      reservation: reservationId,
      client: reservation.client._id,
      amount: reservation.pricing.total,
      currency: reservation.pricing.currency || 'EUR',
      method,
      cardInfo: method === 'card' ? {
        last4: cardInfo.number.replace(/\s/g, '').slice(-4),
        brand: detectCardBrand(cardInfo.number),
        expiryMonth: cardInfo.expiryMonth,
        expiryYear: cardInfo.expiryYear,
        holderName: cardInfo.holderName
      } : undefined,
      status: 'completed',
      description: `Paiement pour réservation ${reservation.reservationNumber}`
    });

    // Update reservation
    reservation.paymentStatus = 'paid';
    reservation.paymentId = payment._id;
    if (reservation.status === 'pending') reservation.status = 'confirmed';
    await reservation.save();

    // n8n notification
    await notificationService.sendPaymentConfirmation(reservation, payment);

    res.status(201).json({
      success: true,
      message: 'Paiement traité avec succès.',
      data: {
        payment,
        reservation
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: detect card brand
const detectCardBrand = (number) => {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  return 'Unknown';
};

// @desc    Get payments
// @route   GET /api/payments
// @access  Admin/Receptionist
exports.getPayments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.processedAt = {};
      if (startDate) query.processedAt.$gte = new Date(startDate);
      if (endDate) query.processedAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('client', 'firstName lastName email')
      .populate({ path: 'reservation', select: 'reservationNumber checkIn checkOut' })
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, count: payments.length, total, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my payments
// @route   GET /api/payments/my
// @access  Private client
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ client: req.user.id })
      .populate({ path: 'reservation', select: 'reservationNumber checkIn checkOut room', populate: { path: 'room', select: 'name number' } })
      .sort({ processedAt: -1 });

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Refund payment
// @route   PATCH /api/payments/:id/refund
// @access  Admin
exports.refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id).populate('reservation');

    if (!payment) return res.status(404).json({ success: false, message: 'Paiement non trouvé.' });
    if (payment.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'Ce paiement a déjà été remboursé.' });
    }

    payment.status = 'refunded';
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    payment.refundedBy = req.user.id;
    await payment.save();

    await Reservation.findByIdAndUpdate(payment.reservation._id, { paymentStatus: 'refunded' });

    res.json({ success: true, message: 'Remboursement traité.', data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
