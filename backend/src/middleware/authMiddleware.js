
function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Kamu belum login.",
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "Kamu belum login.",
    });
  }

  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Khusus admin.",
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
