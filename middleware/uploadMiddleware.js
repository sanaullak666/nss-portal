const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine writable upload directory dynamically (handles read-only filesystems on Vercel/Lambda)
const getUploadDir = () => {
  if (
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.NOW_REGION
  ) {
    return os.tmpdir();
  }

  const localDir = path.join(__dirname, '../uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, `.write-test-${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return localDir;
  } catch (e) {
    return os.tmpdir();
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDir = getUploadDir();
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cert-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files under 250 KB are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 250 * 1024 } // Strict 250 KB limit
});

module.exports = upload;
