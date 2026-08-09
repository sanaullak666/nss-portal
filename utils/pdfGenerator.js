const PDFDocument = require('pdfkit');

function generateRegistrationPDF(registration, res, dispositionType = 'attachment') {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${dispositionType}; filename="NSS_Registration_${registration.registration_id}.pdf"`);

  doc.pipe(res);

  // Header Banner
  doc.rect(40, 40, 515, 60).fill('#0F2042');
  doc.fillColor('#FFFFFF')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('PONDICHERRY UNIVERSITY', 50, 52, { align: 'center', width: 495 })
     .fontSize(12)
     .font('Helvetica')
     .text('NATIONAL SERVICE SCHEME (NSS) REGISTRATION SLIP 2026', 50, 75, { align: 'center', width: 495 });

  doc.moveDown(2);

  // Registration Summary Box
  const startY = 120;
  doc.rect(40, startY, 515, 45).fillAndStroke('#F8FAFC', '#E2E8F0');
  doc.fillColor('#D32F2F').fontSize(14).font('Helvetica-Bold').text(`REGISTRATION ID: ${registration.registration_id}`, 55, startY + 12);
  doc.fillColor('#0F2042').fontSize(12).font('Helvetica-Bold').text(`ASSIGNED UNIT: ${registration.unit_number}`, 360, startY + 12);

  let currentY = startY + 60;

  function addSectionHeader(title) {
    doc.rect(40, currentY, 515, 22).fill('#E2E8F0');
    doc.fillColor('#0F2042').fontSize(10).font('Helvetica-Bold').text(title.toUpperCase(), 50, currentY + 6);
    currentY += 28;
  }

  function cleanVal(val) {
    if (val === undefined || val === null) return 'N/A';
    const str = String(val).replace(/\r\n/g, '\n').replace(/\r/g, '').trim();
    return str || 'N/A';
  }

  function addFieldRow(label1, val1, label2, val2, spacingAfter = 7) {
    const text1 = cleanVal(val1);
    const text2 = cleanVal(val2);

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(label1, 50, currentY);
    doc.font('Helvetica').fontSize(9.5).fillColor('#0F2042').text(text1, 160, currentY, { width: 130, lineGap: 2 });
    const h1 = doc.heightOfString(text1, { width: 130, fontSize: 9.5, lineGap: 2 });

    let h2 = 0;
    if (label2) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(label2, 310, currentY);
      doc.font('Helvetica').fontSize(9.5).fillColor('#0F2042').text(text2, 410, currentY, { width: 135, lineGap: 2 });
      h2 = doc.heightOfString(text2, { width: 135, fontSize: 9.5, lineGap: 2 });
    }

    const rowHeight = Math.max(h1, h2, 14);
    currentY += rowHeight + spacingAfter;
  }

  function addFullWidthField(label, val, spacingAfter = 8) {
    const text = cleanVal(val);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(label, 50, currentY);
    doc.font('Helvetica').fontSize(9.5).fillColor('#0F2042').text(text, 160, currentY, { width: 385, lineGap: 2.5 });
    const h = doc.heightOfString(text, { width: 385, fontSize: 9.5, lineGap: 2.5 });
    currentY += Math.max(h, 14) + spacingAfter;
  }

  // Section 1: Academic Information
  addSectionHeader('1. Academic Information');
  addFieldRow('Department:', registration.department, 'Course / Program:', registration.course);
  addFieldRow('Univ Reg No:', registration.univ_reg_no, 'Year of Study:', registration.year_of_study);

  currentY += 4;

  // Section 2: Personal Information
  addSectionHeader('2. Personal Details');
  addFieldRow('Full Name:', registration.applicant_name, 'Gender:', registration.gender);
  addFieldRow('Email Address:', registration.email, 'Contact Mobile:', registration.contact_number);
  addFieldRow('Alt Contact:', registration.alt_contact_number || 'N/A', 'Date of Birth:', registration.dob ? new Date(registration.dob).toISOString().split('T')[0] : 'N/A');
  addFieldRow('Age:', String(registration.age), 'Blood Group:', registration.blood_group);
  addFieldRow('Aadhaar No:', registration.aadhaar_number, 'Native State:', registration.native_state);

  currentY += 4;

  // Section 3: Address & NSS Skills
  addSectionHeader('3. Address & NSS Specializations');

  let languages = registration.languages_spoken;
  if (typeof languages === 'string') {
    try {
      const parsed = JSON.parse(languages);
      if (Array.isArray(parsed)) languages = parsed.join(', ');
    } catch (e) {}
  } else if (Array.isArray(languages)) {
    languages = languages.join(', ');
  }

  let roles = registration.media_roles;
  if (typeof roles === 'string') {
    try {
      const parsed = JSON.parse(roles);
      if (Array.isArray(parsed)) roles = parsed.join(', ');
    } catch (e) {}
  } else if (Array.isArray(roles)) {
    roles = roles.join(', ');
  }

  addFullWidthField('Present Address:', registration.present_address, 8);
  addFullWidthField('Permanent Address:', registration.permanent_address, 8);
  addFullWidthField('Languages Spoken:', languages || 'N/A', 8);
  addFieldRow('Prev Volunteer:', registration.is_previous_volunteer, 'Leadership Interest:', registration.interested_in_leadership || 'No', 8);
  addFieldRow('Media Interest:', registration.interested_in_media || 'No', 'Media Roles:', roles || 'N/A', 8);
  addFullWidthField('Extra Skills:', registration.extra_curricular_skills || 'None', 10);

  currentY += 10;

  // Declaration & Signature
  doc.rect(40, currentY, 515, 55).stroke('#CBD5E1');
  doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Oblique')
     .text('Declaration: I hereby declare that all information submitted in this application is true and complete to the best of my knowledge.', 50, currentY + 8, { width: 495 });

  doc.fillColor('#0F2042').fontSize(9).font('Helvetica-Bold')
     .text('Student Signature', 70, currentY + 36)
     .text('NSS Programme Officer Signature', 350, currentY + 36);

  currentY += 65;

  // For Official Use Only Box
  doc.rect(40, currentY, 515, 45).fillAndStroke('#F8FAFC', '#94A3B8');
  doc.fillColor('#0F2042').fontSize(9.5).font('Helvetica-Bold')
     .text('FOR OFFICIAL USE ONLY', 50, currentY + 8);

  // Side-by-Side Checkboxes & Remarks
  // Checkbox 1: Selected
  doc.rect(50, currentY + 24, 11, 11).stroke('#0F2042');
  doc.fillColor('#0F2042').fontSize(9.5).font('Helvetica-Bold')
     .text('Selected', 66, currentY + 24);

  // Checkbox 2: Rejected
  doc.rect(155, currentY + 24, 11, 11).stroke('#0F2042');
  doc.fillColor('#0F2042').fontSize(9.5).font('Helvetica-Bold')
     .text('Rejected', 171, currentY + 24);

  // Remarks / Officer Notes
  doc.fillColor('#475569').fontSize(9).font('Helvetica')
     .text('Remarks / Reason: _________________________________', 260, currentY + 24);

  // Footer
  doc.fontSize(8).fillColor('#94A3B8').text('Generated by Pondicherry University NSS Portal 2026', 40, 780, { align: 'center', width: 515 });

  doc.end();
}

module.exports = { generateRegistrationPDF };
