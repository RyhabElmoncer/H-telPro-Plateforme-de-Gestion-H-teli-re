const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Accès non autorisé. Veuillez vous connecter.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Compte désactivé. Contactez l\'administration.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle '${req.user.role}' n'a pas accès à cette ressource.`
      });
    }
    next();
  };
};

// Check receptionist permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    if (req.user.role === 'receptionist' && req.user.permissions[permission]) return next();
    return res.status(403).json({
      success: false,
      message: 'Permission insuffisante pour cette action.'
    });
  };
};
