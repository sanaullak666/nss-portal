const ExcelJS = require('exceljs');

async function exportRegistrationsToExcel(registrations, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('NSS Volunteers 2026');

  worksheet.columns = [
    { header: 'Registration ID', key: 'registration_id', width: 22 },
    { header: 'Unit', key: 'unit_number', width: 10 },
    { header: 'Name', key: 'applicant_name', width: 25 },
    { header: 'Univ Reg No', key: 'univ_reg_no', width: 20 },
    { header: 'Course', key: 'course', width: 18 },
    { header: 'Department', key: 'department', width: 30 },
    { header: 'Year of Study', key: 'year_of_study', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Contact', key: 'contact_number', width: 15 },
    { header: 'Alt Contact', key: 'alt_contact_number', width: 15 },
    { header: 'Gender', key: 'gender', width: 12 },
    { header: 'DOB', key: 'dob', width: 12 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Blood Group', key: 'blood_group', width: 15 },
    { header: 'Aadhaar No', key: 'aadhaar_number', width: 18 },
    { header: 'Native State', key: 'native_state', width: 20 },
    { header: 'Present Address', key: 'present_address', width: 30 },
    { header: 'Permanent Address', key: 'permanent_address', width: 30 },
    { header: 'Languages', key: 'languages_spoken', width: 25 },
    { header: 'Previous Volunteer', key: 'is_previous_volunteer', width: 18 },
    { header: 'Media Team Interest', key: 'interested_in_media', width: 18 },
    { header: 'Media Roles', key: 'media_roles', width: 25 }
  ];

  registrations.forEach((reg) => {
    worksheet.addRow({
      ...reg,
      languages_spoken: Array.isArray(reg.languages_spoken) ? reg.languages_spoken.join(', ') : reg.languages_spoken,
      media_roles: Array.isArray(reg.media_roles) ? reg.media_roles.join(', ') : reg.media_roles
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="NSS_Registrations_2026.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { exportRegistrationsToExcel };
