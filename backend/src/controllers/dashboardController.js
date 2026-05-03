const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const User = require('../models/User');
const Payment = require('../models/Payment');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Admin/Receptionist
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Room stats
    const [totalRooms, archivedRooms, roomsByStatus] = await Promise.all([
      Room.countDocuments({ isArchived: false }),
      Room.countDocuments({ isArchived: true }),
      Room.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Reservation stats
    const [totalReservations, todayCheckIns, todayCheckOuts, activeReservations] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ checkIn: { $gte: today, $lt: tomorrow } }),
      Reservation.countDocuments({ checkOut: { $gte: today, $lt: tomorrow } }),
      Reservation.countDocuments({ status: { $in: ['confirmed', 'checked_in'] } })
    ]);

    // Revenue stats
    const [monthlyRevenue, totalRevenue] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed', processedAt: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Client stats
    const totalClients = await User.countDocuments({ role: 'client', isActive: true });

    // Occupation rate
    const occupiedRooms = roomsByStatus.find(r => r._id === 'occupied')?.count || 0;
    const occupationRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Monthly revenue chart (last 6 months)
    const revenueByMonth = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          processedAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$processedAt' }, month: { $month: '$processedAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Reservations by status
    const reservationsByStatus = await Reservation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        rooms: {
          total: totalRooms,
          archived: archivedRooms,
          byStatus: roomsByStatus,
          occupationRate
        },
        reservations: {
          total: totalReservations,
          todayCheckIns,
          todayCheckOuts,
          active: activeReservations,
          byStatus: reservationsByStatus
        },
        revenue: {
          monthly: monthlyRevenue[0]?.total || 0,
          total: totalRevenue[0]?.total || 0,
          byMonth: revenueByMonth
        },
        clients: {
          total: totalClients
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Admin/Receptionist
exports.getActivity = async (req, res) => {
  try {
    const recentReservations = await Reservation.find()
      .populate('client', 'firstName lastName')
      .populate('room', 'number name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('client', 'firstName lastName')
      .sort({ processedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: { recentReservations, recentPayments }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
