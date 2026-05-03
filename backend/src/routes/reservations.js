const express = require('express');
const router = express.Router();
const {
  createReservation, getReservations, getMyReservations,
  getReservation, updateReservationStatus, cancelReservation, updateReservation
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', createReservation);
router.get('/my', getMyReservations);
router.get('/', authorize('admin', 'receptionist'), getReservations);
router.get('/:id', getReservation);
router.put('/:id', authorize('admin', 'receptionist'), updateReservation);
router.patch('/:id/status', authorize('admin', 'receptionist'), updateReservationStatus);
router.patch('/:id/cancel', cancelReservation);

module.exports = router;
