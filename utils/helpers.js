const db = require('../config/database');

async function generateRegistrationId(unitNumber) {
  const cleanUnit = unitNumber.replace(/\s+/g, '').toUpperCase();
  const year = '2026';
  
  // Fetch the current count for this unit to make a sequential 6-digit number
  const [[{ count }]] = await db.query(
    'SELECT COUNT(*) as count FROM registrations WHERE unit_number = ?',
    [unitNumber]
  );
  
  const nextSeq = (count + 1).toString().padStart(6, '0');
  return `NSS-${year}-${cleanUnit}-${nextSeq}`;
}

module.exports = { generateRegistrationId };
