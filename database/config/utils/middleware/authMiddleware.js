/**
 * Authentication & Route Protection Middleware
 * Restricts access to administrative endpoints based on session state.
 */

/**
 * Middleware to protect admin routes requiring authentication
 */
const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    // Admin is authenticated, proceed to controller
    res.locals.admin = req.session.admin;
    return next();
  }

  // Session expired or unauthenticated
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
};

/**
 * Middleware to redirect already authenticated admins away from login page
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

/**
 * Middleware to inject session admin data into response local variables
 */
const setLocalAdmin = (req, res, next) => {
  res.locals.admin = req.session ? req.session.admin || null : null;
  next();
};

module.exports = {
  requireAdminAuth,
  redirectIfAuthenticated,
  setLocalAdmin
};