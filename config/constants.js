const UNITS = ['UNIT 1', 'UNIT 2', 'UNIT 5', 'UNIT 6'];

const DEPARTMENT_UNIT_MAP = {
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
    'Centre for Women\'s Studies',
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

const DEPARTMENTS = Object.values(DEPARTMENT_UNIT_MAP).flat();

const COURSES = [
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

const YEAR_OF_STUDY = ['First Year', 'Second Year', 'Third Year'];

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'Bombay Blood Group (hh)', 'Rh-null', 'Others'
];

const NATIVE_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const INDIAN_LANGUAGES = [
  'Assamese', 'Bengali', 'Bodo', 'Dogri', 'English', 'Gujarati', 'Hindi', 'Kannada', 'Kashmiri',
  'Konkani', 'Maithili', 'Malayalam', 'Manipuri', 'Marathi', 'Nepali', 'Odia', 'Punjabi',
  'Sanskrit', 'Santali', 'Sindhi', 'Tamil', 'Telugu', 'Urdu'
];

const MEDIA_ROLES = [
  'Photographer',
  'Videographer',
  'Videographer cum Editor',
  'Video Editor',
  'Photo Editor',
  'Poster Editor',
  'Reel Creator',
  'Programme Report Writer'
];

module.exports = {
  UNITS,
  DEPARTMENTS,
  DEPARTMENT_UNIT_MAP,
  COURSES,
  YEAR_OF_STUDY,
  BLOOD_GROUPS,
  NATIVE_STATES,
  INDIAN_LANGUAGES,
  MEDIA_ROLES
};
