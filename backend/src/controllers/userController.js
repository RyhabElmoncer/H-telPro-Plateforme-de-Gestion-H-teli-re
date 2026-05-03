const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, count: users.length, total, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create staff user (receptionist)
// @route   POST /api/users/staff
// @access  Admin
exports.createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, permissions } = req.body;

    if (!['receptionist'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide pour la création de personnel.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email déjà utilisé.' });

    const user = await User.create({
      firstName, lastName, email, password, phone, role,
      permissions: permissions || {}
    });

    res.status(201).json({ success: true, data: user, message: 'Compte personnel créé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, isActive, permissions, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phone, isActive, permissions, role },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    res.json({ success: true, data: user, message: 'Utilisateur mis à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/toggle-active
// @access  Admin
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Impossible de désactiver un administrateur.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Compte ${user.isActive ? 'activé' : 'désactivé'}.`,
      data: { isActive: user.isActive }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update receptionist permissions
// @route   PATCH /api/users/:id/permissions
// @access  Admin
exports.updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    if (user.role !== 'receptionist') {
      return res.status(400).json({ success: false, message: 'Les permissions ne s\'appliquent qu\'aux réceptionnistes.' });
    }

    user.permissions = { ...user.permissions.toObject(), ...permissions };
    await user.save();

    res.json({ success: true, data: user.permissions, message: 'Permissions mises à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
