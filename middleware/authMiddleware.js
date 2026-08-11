/**
 * Admin Authentication & Session Management Middleware
 * Handles session validation, inactivity timeout, guest redirection,
 * and view locals injection for the PU NSS Portal.
 */

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Hours Inactivity Timeout

/**
 * Attaches session information to response locals for view templates
 */
exports.attachSessionLocals = (req, res, next) => {
  const admin = req.session && req.session.admin ? req.session.admin : null;
  res.locals.admin = admin;
  res.locals.isAuthenticated = !!admin;
  next();
};

/**
 * Ensures user is authenticated with a valid, non-expired session
 */
exports.isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.admin) {
    return res.redirect('/admin/login?error=Logged+out+because+another+device+logged+in+or+session+ended.');
  }


  const now = Date.now();
  const lastActivity = req.session.lastActivity || now;

  // Inactivity session expiration check (2 hours)
  if (now - lastActivity > IDLE_TIMEOUT_MS) {
    delete req.session.admin;
    delete req.session.pendingLogin;
    return req.session.destroy(() => {
      const cookieOptions = { path: '/', httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax' };
      res.clearCookie('nss_session_id', cookieOptions);
      res.clearCookie('nss_session_id', { path: '/' });
      res.clearCookie('nss_trusted_device', cookieOptions);
      res.clearCookie('nss_trusted_device', { path: '/' });
      res.clearCookie('connect.sid', cookieOptions);
      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('/admin/login?error=Session+expired+due+to+inactivity.+Please+log+in+again.');
    });
  }

  // Update last activity timestamp
  req.session.lastActivity = now;
  res.locals.admin = req.session.admin;
  res.locals.isAuthenticated = true;

  // Prevent browser back-button caching of protected admin pages after logout
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};

/**
 * Ensures authenticated admins are redirected to dashboard if accessing login/guest routes
 */
exports.isGuest = (req, res, next) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};
