/**
 * Registration ID Generator
 * Generates unique, formatted registration identifiers for NSS applicants.
 * Format: NSS-PU-YYYY-XXXX (e.g., NSS-PU-2026-0001)
 */

const db = require('../config/database');

/**
 * Generates a unique NSS Registration ID based on current year and sequence count
 * @returns {Promise<string>} Unique Registration ID
 */
const generateRegistrationId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `NSS-PU-${currentYear}-`;

  try {
    // Get highest current sequential registration ID for the current year
    const [rows] = await db.execute(
      `SELECT registration_id FROM registrations 
       WHERE registration_id LIKE ? 
       ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextSequence = 1;

    if (rows.length > 0) {
      const lastId = rows[0].registration_id;
      const parts = lastId.split('-');
      const lastSequence = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }

    // Format sequence to 4 digits with leading zeros
    const formattedSequence = String(nextSequence).padStart(4, '0');
    return `${prefix}${formattedSequence}`;
  } catch (error) {
    console.error('Error generating registration ID:', error);
    // Fallback using timestamp in case of database collision issue
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomSuffix}`;
  }
};

module.exports = {
  generateRegistrationId
};