const express = require('express');
const router = express.Router();
const { processPayment, getPayments, getMyPayments, refundPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', processPayment);
router.get('/my', getMyPayments);
router.get('/', authorize('admin', 'receptionist'), getPayments);
router.patch('/:id/refund', authorize('admin'), refundPayment);

module.exports = router;
