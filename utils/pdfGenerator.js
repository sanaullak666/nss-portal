const PDFDocument = require('pdfkit');

function generateRegistrationPDF(registration, res) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="NSS_Registration_${registration.registration_id}.pdf"`);

  doc.pipe(res);

  doc.fontSize(18).text('Pondicherry University - NSS Registration Slip', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Registration ID: ${registration.registration_id}`);
  doc.text(`Name: ${registration.applicant_name}`);
  doc.text(`University Reg No: ${registration.univ_reg_no}`);
  doc.text(`Department: ${registration.department}`);
  doc.text(`Unit Assigned: ${registration.unit_number}`);
  doc.text(`Email: ${registration.email}`);
  doc.text(`Contact: ${registration.contact_number}`);

  doc.end();
}

module.exports = { generateRegistrationPDF };
