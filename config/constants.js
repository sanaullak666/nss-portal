const UNITS = ['UNIT 1', 'UNIT 2', 'UNIT 5', 'UNIT 6'];

const DEPARTMENT_UNIT_MAP = {
  'UNIT 1': [
    'Department of Biochemistry & Molecular Biology',
    'Department of Biotechnology',
    'Department of Bioinformatics',
    'Department of Ecological Science',
    'Department of Food Science & Technology',
    'Department of Earth Sciences',
    'Department of Chemistry',
    'Department of Physics',
    'Department of Computer Science'
  ],
  'UNIT 2': [
    'Department of Anthropology',
    'Department of History',
    'Department of Politics & International Studies',
    'Department of Sociology',
    'Department of Social Work',
    'Department of Philosophy'
  ],
  'UNIT 5': [
    'Department of Management Studies',
    'Department of Commerce',
    'Department of Economics',
    'Department of Tourism Studies',
    'Department of Banking Technology'
  ],
  'UNIT 6': [
    'Department of Education',
    'Department of Physical Education',
    'Department of English',
    'Department of French',
    'Department of Hindi',
    'Department of Tamil',
    'Department of Sanskrit',
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

const YEAR_OF_STUDY = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year'];

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
