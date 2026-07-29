const db = require('../config/database');

async function generateRegistrationId(unitNumber) {
  // Extract number from UNIT 1, UNIT 2, UNIT 5, UNIT 6 (default 1)
  const unitDigit = (unitNumber || 'UNIT 1').replace(/[^0-9]/g, '') || '1';
  const prefix = `PUNSS-U${unitDigit}`;

  // Query highest existing registration_id with this prefix
  const [rows] = await db.query(
    'SELECT registration_id FROM registrations WHERE registration_id LIKE ? ORDER BY id DESC LIMIT 1',
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastId = rows[0].registration_id;
    const numPart = lastId.replace(prefix, '');
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      nextNum = parsed + 1;
    }
  }

  // Format 3-digit sequence: PUNSS-U1001, PUNSS-U1002, PUNSS-U2001, etc.
  const paddedSeq = nextNum.toString().padStart(3, '0');
  return `${prefix}${paddedSeq}`;
}

function calculateAge(dobString) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

module.exports = {
  generateRegistrationId,
  calculateAge
};
