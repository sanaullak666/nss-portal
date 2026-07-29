const ExcelJS = require('exceljs');

async function exportRegistrationsToExcel(registrations, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('NSS Volunteers 2026');

  worksheet.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Registration ID', key: 'registration_id', width: 25 },
    { header: 'NSS Unit', key: 'unit_number', width: 12 },
    { header: 'Full Name', key: 'applicant_name', width: 28 },
    { header: 'Univ Reg / App No', key: 'univ_reg_no', width: 22 },
    { header: 'Course', key: 'course', width: 18 },
    { header: 'Department', key: 'department', width: 35 },
    { header: 'Year of Study', key: 'year_of_study', width: 15 },
    { header: 'Email Address', key: 'email', width: 30 },
    { header: 'Contact Mobile', key: 'contact_number', width: 16 },
    { header: 'Alternate Contact', key: 'alt_contact_number', width: 16 },
    { header: 'Gender', key: 'gender', width: 12 },
    { header: 'Date of Birth', key: 'dob', width: 14 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Blood Group', key: 'blood_group', width: 15 },
    { header: 'Aadhaar Number', key: 'aadhaar_number', width: 20 },
    { header: 'Native State', key: 'native_state', width: 22 },
    { header: 'Present Address', key: 'present_address', width: 35 },
    { header: 'Permanent Address', key: 'permanent_address', width: 35 },
    { header: 'Languages Spoken', key: 'languages_spoken', width: 30 },
    { header: 'Previous Volunteer', key: 'is_previous_volunteer', width: 18 },
    { header: 'Certificate File', key: 'certificate_path', width: 25 },
    { header: 'Media Team Interest', key: 'interested_in_media', width: 20 },
    { header: 'Media Roles', key: 'media_roles', width: 30 },
    { header: 'Extra Curricular Skills', key: 'extra_curricular_skills', width: 30 },
    { header: 'Interested in Leadership (NSS PU)', key: 'interested_in_leadership', width: 25 },
    { header: 'Declaration Accepted', key: 'declaration_accepted', width: 20 },
    { header: 'Submission Date', key: 'created_at', width: 20 }
  ];

  // Header Styling
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F2042' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  registrations.forEach((reg, index) => {
    let languages = reg.languages_spoken;
    if (typeof languages === 'string') {
      try {
        const parsed = JSON.parse(languages);
        if (Array.isArray(parsed)) languages = parsed.join(', ');
      } catch (e) {}
    } else if (Array.isArray(languages)) {
      languages = languages.join(', ');
    }

    let roles = reg.media_roles;
    if (typeof roles === 'string') {
      try {
        const parsed = JSON.parse(roles);
        if (Array.isArray(parsed)) roles = parsed.join(', ');
      } catch (e) {}
    } else if (Array.isArray(roles)) {
      roles = roles.join(', ');
    }

    let formattedDob = reg.dob;
    if (reg.dob instanceof Date) {
      formattedDob = reg.dob.toISOString().split('T')[0];
    }

    let formattedCreatedAt = reg.created_at;
    if (reg.created_at instanceof Date) {
      formattedCreatedAt = reg.created_at.toLocaleString('en-IN');
    }

    worksheet.addRow({
      sno: index + 1,
      registration_id: reg.registration_id,
      unit_number: reg.unit_number,
      applicant_name: reg.applicant_name,
      univ_reg_no: reg.univ_reg_no,
      course: reg.course,
      department: reg.department,
      year_of_study: reg.year_of_study,
      email: reg.email,
      contact_number: reg.contact_number,
      alt_contact_number: reg.alt_contact_number || 'N/A',
      gender: reg.gender,
      dob: formattedDob,
      age: reg.age,
      blood_group: reg.blood_group,
      aadhaar_number: reg.aadhaar_number,
      native_state: reg.native_state,
      present_address: reg.present_address,
      permanent_address: reg.permanent_address,
      languages_spoken: languages || 'N/A',
      is_previous_volunteer: reg.is_previous_volunteer,
      certificate_path: reg.certificate_path || 'None',
      interested_in_media: reg.interested_in_media || 'No',
      media_roles: roles || 'N/A',
      extra_curricular_skills: reg.extra_curricular_skills || 'None',
      interested_in_leadership: reg.interested_in_leadership || 'No',
      declaration_accepted: reg.declaration_accepted ? 'Yes' : 'No',
      created_at: formattedCreatedAt
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Pondicherry_University_NSS_Registrations_2026.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { exportRegistrationsToExcel };
