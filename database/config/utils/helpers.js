/**
 * Application Helper Utilities
 * Provides formatting, state/UT options, language options, media roles, and course mappings.
 */

/**
 * List of all Indian States and Union Territories
 */
const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

/**
 * List of Major Indian Languages
 */
const INDIAN_LANGUAGES = [
  'Assamese',
  'Bengali',
  'Bodo',
  'Dogri',
  'English',
  'Gujarati',
  'Hindi',
  'Kannada',
  'Kashmiri',
  'Konkani',
  'Maithili',
  'Malayalam',
  'Manipuri',
  'Marathi',
  'Nepali',
  'Odia',
  'Punjabi',
  'Sanskrit',
  'Santali',
  'Sindhi',
  'Tamil',
  'Telugu',
  'Urdu'
];

/**
 * Available Blood Groups
 */
const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Bombay Blood Group',
  'Rh-null',
  'Others'
];

/**
 * Courses offered at Pondicherry University
 */
const PU_COURSES = [
  'M.A',
  'B.A (Hons)',
  'M.Sc',
  'M.Tech',
  'MBA',
  'M.Com',
  'M.Ed',
  'MCA',
  'M.Lib.I.Sc',
  'M.P.A',
  'M.P.Ed',
  'M.S.W',
  'L.L.M',
  'M.V.A',
  'B.Sc.B.Ed',
  'B.A.B.Ed',
  'B.Sc. (Hons)',
  'B.Com (Hons.)',
  'B.V.A',
  'B.Tech',
  'B.Tech MBA (CSBS)',
  'M.A (Integrated)'
];

/**
 * NSS PU Media Team Specific Roles
 */
const MEDIA_TEAM_ROLES = [
  'Photographer',
  'Videographer',
  'Videographer cum Editor',
  'Video Editor',
  'Photo Editor',
  'Poster Editor',
  'Reel Creator',
  'Programme Report Writer'
];

/**
 * Department to NSS Unit Mapping Object
 */
const DEPARTMENT_UNIT_MAPPING = {
  'UNIT 1': [
    'Department of Computer Science',
    'Department of Electronics Engineering',
    'Centre for Pollution Control and Environmental Engineering',
    'Department of Mathematics',
    'Department of Statistics',
    'Department of Earth Sciences',
    'Department of Physics',
    'Department of Chemistry',
    'Department of Biochemistry and Molecular Biology',
    'Department of Biotechnology',
    'Department of Ecology and Environmental Sciences',
    'Department of Food Science and Technology',
    'Department of Microbiology',
    'Department of Bioinformatics',
    'Department of Green Energy Technology',
    'Centre for Nano Sciences & Technology'
  ],
  'UNIT 2': [
    'Sri Subramania Bharathi School of Tamil Language & Literature',
    'Department of Electronic Media and Mass Communication',
    'Department of Anthropology',
    'Department of Sociology',
    'Department of History',
    'Department of Politics and International Studies',
    'Department of Social Work',
    "Centre for Women's Studies",
    'Centre for South Asian Studies',
    'Centre for Study of Social Exclusion & Inclusive Policy',
    'Centre for Maritime Studies',
    'SEAL (Social & Economic Administration and Law)'
  ],
  'UNIT 5': [
    'Department of Management Studies',
    'Department of International Business',
    'Department of Banking Technology',
    'Department of Tourism Studies',
    'Department of Commerce',
    'Department of Economics',
    'Department of Library and Information Science',
    'Department of Physical Education and Sports'
  ],
  'UNIT 6': [
    'School of Education',
    'Department of Applied Psychology',
    'School of Performing Arts',
    'Department of English',
    'Department of French',
    'Department of Hindi',
    'Department of Sanskrit',
    'Department of Philosophy',
    'School of Law'
  ]
};

/**
 * Utility: Find Unit Number for a given Department
 * @param {string} departmentName
 * @returns {string} Unit Number or 'UNKNOWN'
 */
const getUnitForDepartment = (departmentName) => {
  for (const [unit, departments] of Object.entries(DEPARTMENT_UNIT_MAPPING)) {
    if (departments.includes(departmentName)) {
      return unit;
    }
  }
  return 'UNKNOWN';
};

/**
 * Utility: Format Date string to YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Utility: Format Date to Readable String (DD-MMM-YYYY)
 * @param {Date|string} date
 * @returns {string}
 */
const formatDateReadable = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

module.exports = {
  INDIAN_STATES_AND_UTS,
  INDIAN_LANGUAGES,
  BLOOD_GROUPS,
  PU_COURSES,
  MEDIA_TEAM_ROLES,
  DEPARTMENT_UNIT_MAPPING,
  getUnitForDepartment,
  formatDate,
  formatDateReadable
};