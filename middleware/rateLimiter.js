const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 submissions per hour
  message: 'Too many registration requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP attempts per 10 minutes
  message: 'Too many OTP verification attempts from this IP. Please wait 10 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false
});

const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 PDF downloads per 15 minutes
  message: 'Too many PDF download requests from this IP. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 tracking lookups per 15 minutes
  message: 'Too many status tracking searches from this IP. Please try again in a few minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  registrationLimiter,
  otpLimiter,
  pdfLimiter,
  trackingLimiter
};

