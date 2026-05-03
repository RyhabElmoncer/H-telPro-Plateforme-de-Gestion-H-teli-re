const express = require('express');
const router = express.Router();
const {
  getRooms, getRoom, createRoom, updateRoom,
  archiveRoom, restoreRoom, getRoomAvailability, getAvailableRooms
} = require('../controllers/roomController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

router.get('/', getRooms);
router.get('/available', getAvailableRooms);
router.get('/:id', getRoom);
router.get('/:id/availability', getRoomAvailability);

router.post('/', protect, authorize('admin'), createRoom);
router.put('/:id', protect, authorize('admin', 'receptionist'), checkPermission('canManageRooms'), updateRoom);
router.patch('/:id/archive', protect, authorize('admin'), archiveRoom);
router.patch('/:id/restore', protect, authorize('admin'), restoreRoom);

module.exports = router;
