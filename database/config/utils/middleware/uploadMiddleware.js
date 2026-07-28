/**
 * Multer File Upload Middleware
 * Configures secure file upload for NSS volunteer certificates with size & type restrictions.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists synchronously on load
const uploadDir = path.join(__dirname, '../public/uploads/nss-certificates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Storage configuration for Multer
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure unique filename: CERT-<TIMESTAMP>-<RANDOM>.<EXT>
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `CERT-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter for validating allowed MIME types and extensions
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.pdf'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPG, JPEG, and PDF files are allowed.'),
      false
    );
  }
};

/**
 * Multer Instance with 250 KB File Size Limit (256,000 bytes)
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 256000 // 250 KB
  },
  fileFilter: fileFilter
});

/**
 * Middleware wrapper to handle Multer upload errors cleanly
 */
const handleCertificateUpload = (req, res, next) => {
  const uploadSingle = upload.single('certificate');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.fileValidationError = 'File size exceeds maximum allowed limit of 250 KB.';
      } else {
        req.fileValidationError = `Upload error: ${err.message}`;
      }
    } else if (err) {
      req.fileValidationError = err.message;
    }
    next();
  });
};

module.exports = {
  handleCertificateUpload
};