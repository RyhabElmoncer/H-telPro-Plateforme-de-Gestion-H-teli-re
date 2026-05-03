const express = require('express');
const router = express.Router();
const { getUsers, getUser, createStaff, updateUser, toggleActive, updatePermissions } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/staff', createStaff);
router.put('/:id', updateUser);
router.patch('/:id/toggle-active', toggleActive);
router.patch('/:id/permissions', updatePermissions);

module.exports = router;
