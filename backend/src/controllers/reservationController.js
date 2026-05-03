const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const notificationService = require('../services/notificationService');

// Helper: calculate pricing
const calculatePricing = (pricePerNight, checkIn, checkOut, discountPercent = 0) => {
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const subtotal = pricePerNight * nights;
  const discount = (subtotal * discountPercent) / 100;
  const taxes = (subtotal - discount) * 0.1; // 10% taxes
  const total = subtotal - discount + taxes;
  return { pricePerNight, nights, subtotal, discount, taxes: Math.round(taxes * 100) / 100, total: Math.round(total * 100) / 100 };
};

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private (client, receptionist, admin)
exports.createReservation = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, specialRequests, addons, source } = req.body;

    const room = await Room.findOne({ _id: roomId, isArchived: false });
    if (!room) return res.status(404).json({ success: false, message: 'Chambre non disponible.' });

    // Check availability
    const conflict = await Reservation.findOne({
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      $or: [{ checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }]
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: 'Chambre non disponible pour ces dates.' });
    }

    const pricing = calculatePricing(room.price.perNight, checkIn, checkOut);

    const reservation = await Reservation.create({
      client: req.user.id,
      room: roomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: guests || { adults: 1, children: 0 },
      pricing,
      specialRequests,
      addons: addons || [],
      createdBy: req.user.id,
      source: source || 'website'
    });

    await reservation.populate(['client', 'room']);

    // Trigger n8n notification
    await notificationService.sendReservationConfirmation(reservation);

    res.status(201).json({
      success: true,
      data: reservation,
      message: 'Réservation créée avec succès. Un email de confirmation vous a été envoyé.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Admin/Receptionist
exports.getReservations = async (req, res) => {
  try {
    const { status, startDate, endDate, clientId, roomId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (clientId) query.client = clientId;
    if (roomId) query.room = roomId;
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('client', 'firstName lastName email phone')
      .populate('room', 'number name type price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: reservations.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: reservations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get my reservations (client)
// @route   GET /api/reservations/my
// @access  Private (client)
exports.getMyReservations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { client: req.user.id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('room', 'number name type price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, count: reservations.length, total, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('client', 'firstName lastName email phone')
      .populate('room')
      .populate('createdBy', 'firstName lastName');

    if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée.' });

    // Client can only see their own
    if (req.user.role === 'client' && reservation.client._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
    }

    res.json({ success: true, data: reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id/status
// @access  Admin/Receptionist
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const reservation = await Reservation.findById(req.params.id).populate('client room');

    if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée.' });

    reservation.status = status;
    if (notes) reservation.notes = notes;
    await reservation.save();

    // Update room status based on reservation status
    if (status === 'checked_in') {
      await Room.findByIdAndUpdate(reservation.room._id, { status: 'occupied' });
    } else if (status === 'checked_out') {
      await Room.findByIdAndUpdate(reservation.room._id, { status: 'cleaning' });
    }

    res.json({ success: true, data: reservation, message: 'Statut mis à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Cancel reservation
// @route   PATCH /api/reservations/:id/cancel
// @access  Private
exports.cancelReservation = async (req, res) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id).populate('client room');

    if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée.' });

    // Client can only cancel their own
    if (req.user.role === 'client' && reservation.client._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé.' });
    }

    if (['cancelled', 'checked_out'].includes(reservation.status)) {
      return res.status(400).json({ success: false, message: 'Cette réservation ne peut plus être annulée.' });
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancelledBy = req.user.id;
    reservation.cancellationReason = reason || 'Annulée par le client';
    await reservation.save();

    // Notify via n8n
    await notificationService.sendCancellationNotification(reservation);

    res.json({ success: true, message: 'Réservation annulée.', data: reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update reservation details
// @route   PUT /api/reservations/:id
// @access  Admin/Receptionist
exports.updateReservation = async (req, res) => {
  try {
    const allowedFields = ['checkIn', 'checkOut', 'guests', 'specialRequests', 'addons', 'notes'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const reservation = await Reservation.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true
    }).populate('client room');

    if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée.' });
    res.json({ success: true, data: reservation, message: 'Réservation mise à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
