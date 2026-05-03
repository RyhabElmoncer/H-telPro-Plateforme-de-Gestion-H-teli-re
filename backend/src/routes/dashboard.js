const express = require('express');
const router = express.Router();
const { getStats, getActivity } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'receptionist'));

router.get('/stats', getStats);
router.get('/activity', getActivity);

module.exports = router;
