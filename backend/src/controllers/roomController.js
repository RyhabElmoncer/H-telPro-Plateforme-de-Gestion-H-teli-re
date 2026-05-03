const Room = require('../models/Room');
const Reservation = require('../models/Reservation');

// @desc    Get all rooms (non-archived)
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const { type, minPrice, maxPrice, capacity, amenities, status, showArchived } = req.query;
    const query = {};

    // Only admin/receptionist can see archived
    if (showArchived === 'true' && req.user && ['admin', 'receptionist'].includes(req.user.role)) {
      // show all including archived
    } else {
      query.isArchived = false;
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (minPrice || maxPrice) {
      query['price.perNight'] = {};
      if (minPrice) query['price.perNight'].$gte = Number(minPrice);
      if (maxPrice) query['price.perNight'].$lte = Number(maxPrice);
    }
    if (capacity) query['capacity.adults'] = { $gte: Number(capacity) };
    if (amenities) {
      const amenitiesArr = amenities.split(',');
      query.amenities = { $all: amenitiesArr };
    }

    const rooms = await Room.find(query).sort({ 'price.perNight': 1 });
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Chambre non trouvée.' });
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Admin
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room, message: 'Chambre créée avec succès.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce numéro de chambre existe déjà.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Admin / Receptionist (with permission)
exports.updateRoom = async (req, res) => {
  try {
    // Prevent changing archive status via update
    delete req.body.isArchived;
    delete req.body.archivedAt;

    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!room) return res.status(404).json({ success: false, message: 'Chambre non trouvée.' });
    res.json({ success: true, data: room, message: 'Chambre mise à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Archive room (NOT delete)
// @route   PATCH /api/rooms/:id/archive
// @access  Admin
exports.archiveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Chambre non trouvée.' });

    // Check for active reservations
    const activeReservations = await Reservation.countDocuments({
      room: req.params.id,
      status: { $in: ['pending', 'confirmed', 'checked_in'] }
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible d'archiver: ${activeReservations} réservation(s) active(s) sur cette chambre.`
      });
    }

    room.isArchived = true;
    room.archivedAt = new Date();
    room.archivedBy = req.user.id;
    await room.save();

    res.json({ success: true, message: 'Chambre archivée avec succès.', data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Restore archived room
// @route   PATCH /api/rooms/:id/restore
// @access  Admin
exports.restoreRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isArchived: false, archivedAt: null, archivedBy: null },
      { new: true }
    );
    if (!room) return res.status(404).json({ success: false, message: 'Chambre non trouvée.' });
    res.json({ success: true, message: 'Chambre restaurée avec succès.', data: room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get room availability
// @route   GET /api/rooms/:id/availability
// @access  Public
exports.getRoomAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'Dates requises.' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflicting = await Reservation.findOne({
      room: req.params.id,
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
      ]
    });

    res.json({
      success: true,
      data: {
        roomId: req.params.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        isAvailable: !conflicting
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get available rooms for date range
// @route   GET /api/rooms/available
// @access  Public
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, adults, type } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'Dates requises.' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Find rooms with conflicting reservations
    const bookedRooms = await Reservation.distinct('room', {
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
      ]
    });

    const query = {
      _id: { $nin: bookedRooms },
      isArchived: false,
      status: { $in: ['available', 'cleaning'] }
    };

    if (adults) query['capacity.adults'] = { $gte: Number(adults) };
    if (type) query.type = type;

    const rooms = await Room.find(query).sort({ 'price.perNight': 1 });
    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
