const RegistrationModel = require('../models/registrationModel');
const AdminModel = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const { UNITS, DEPARTMENTS, DEPARTMENT_UNIT_MAP, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, INDIAN_LANGUAGES, MEDIA_ROLES } = require('../config/constants');
const { exportRegistrationsToExcel } = require('../utils/excelExporter');
const { generateRegistrationPDF } = require('../utils/pdfGenerator');
const { logAudit } = require('../utils/auditLogger');

exports.renderDashboard = async (req, res) => {
  try {
    const data = await RegistrationModel.getDashboardStats();

    res.render('admin/dashboard', {
      title: 'Admin Analytics & Dashboard - PU NSS Portal',
      admin: req.session.admin,
      stats: data.stats,
      chartData: data.chartData,
      recentRegistrations: data.recentRegistrations
    });
  } catch (err) {
    console.error('Dashboard Render Error:', err);
    res.status(500).render('500');
  }
};

exports.getLiveDashboardStats = async (req, res) => {
  try {
    const data = await RegistrationModel.getDashboardStats();
    res.json({
      success: true,
      stats: data.stats,
      chartData: data.chartData,
      recentRegistrations: data.recentRegistrations
    });
  } catch (err) {
    console.error('Live Stats API Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.renderRegistrationsList = async (req, res) => {
  const { unit, department, course, year_of_study, gender, is_previous_volunteer, interested_in_media, search, page = 1 } = req.query;

  try {
    const result = await RegistrationModel.findAllFiltered({
      unit, department, course, year_of_study, gender, is_previous_volunteer, interested_in_media, search, page, limit: 15
    });

    res.render('admin/registrations', {
      title: 'Manage Student Registrations - PU NSS Portal',
      admin: req.session.admin,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      registrations: result.registrations,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount
      },
      filters: {
        unit: unit || '',
        department: department || '',
        course: course || '',
        year_of_study: year_of_study || '',
        gender: gender || '',
        is_previous_volunteer: is_previous_volunteer || '',
        interested_in_media: interested_in_media || '',
        search: search || ''
      },
      UNITS,
      DEPARTMENTS,
      COURSES,
      YEAR_OF_STUDY
    });
  } catch (err) {
    console.error('Registrations List Render Error:', err);
    res.status(500).render('500');
  }
};

exports.renderRegistrationView = async (req, res) => {
  try {
    const registration = await RegistrationModel.findById(req.params.id);
    if (!registration) return res.status(404).render('404');

    res.render('admin/registration-view', {
      title: `View Profile - ${registration.applicant_name}`,
      admin: req.session.admin,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      registration
    });
  } catch (err) {
    console.error('View Registration Error:', err);
    res.status(500).render('500');
  }
};

exports.renderRegistrationEdit = async (req, res) => {
  try {
    const registration = await RegistrationModel.findById(req.params.id);
    if (!registration) return res.status(404).render('404');

    res.render('admin/registration-edit', {
      title: `Edit Registration - ${registration.applicant_name}`,
      admin: req.session.admin,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      registration,
      constants: { UNITS, DEPARTMENTS, DEPARTMENT_UNIT_MAP, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, INDIAN_LANGUAGES, MEDIA_ROLES },
      error: null
    });
  } catch (err) {
    console.error('Edit Registration Render Error:', err);
    res.status(500).render('500');
  }
};

exports.handleRegistrationEdit = async (req, res) => {
  const { id } = req.params;
  const formData = req.body || {};

  try {
    const registration = await RegistrationModel.findById(id);
    if (!registration) return res.status(404).render('404');

    // Auto-map department to unit
    let assignedUnit = formData.unit_number;
    for (const [unit, depts] of Object.entries(DEPARTMENT_UNIT_MAP)) {
      if (depts.includes(formData.department)) {
        assignedUnit = unit;
        break;
      }
    }

    let languages = formData.languages_spoken || [];
    if (typeof languages === 'string') languages = [languages];

    let mediaRoles = formData.media_roles || [];
    if (typeof mediaRoles === 'string') mediaRoles = [mediaRoles];

    const updatedData = {
      applicant_name: formData.applicant_name ? formData.applicant_name.trim().toUpperCase() : registration.applicant_name,
      univ_reg_no: formData.univ_reg_no ? formData.univ_reg_no.trim().toUpperCase() : registration.univ_reg_no,
      email: formData.email ? formData.email.trim().toLowerCase() : registration.email,
      contact_number: formData.contact_number ? formData.contact_number.trim() : registration.contact_number,
      alt_contact_number: formData.alt_contact_number ? formData.alt_contact_number.trim() : null,
      department: formData.department || registration.department,
      course: formData.course || registration.course,
      year_of_study: formData.year_of_study || registration.year_of_study,
      unit_number: assignedUnit || registration.unit_number,
      gender: formData.gender || registration.gender,
      dob: formData.dob || registration.dob,
      age: parseInt(formData.age, 10) || registration.age,
      blood_group: formData.blood_group || registration.blood_group,
      aadhaar_number: formData.aadhaar_number ? formData.aadhaar_number.trim() : registration.aadhaar_number,
      native_state: formData.native_state || registration.native_state,
      present_address: formData.present_address ? formData.present_address.trim() : registration.present_address,
      permanent_address: formData.permanent_address ? formData.permanent_address.trim() : registration.permanent_address,
      languages_spoken: languages,
      is_previous_volunteer: formData.is_previous_volunteer || registration.is_previous_volunteer || 'No',
      interested_in_media: formData.interested_in_media || registration.interested_in_media || 'No',
      media_roles: formData.interested_in_media === 'Yes' ? mediaRoles : (formData.interested_in_media === 'No' ? [] : (registration.media_roles || [])),
      extra_curricular_skills: formData.extra_curricular_skills ? formData.extra_curricular_skills.trim() : null,
      interested_in_leadership: formData.interested_in_leadership || registration.interested_in_leadership || 'No'
    };

    const existingRegNo = await RegistrationModel.findByUnivRegNo(updatedData.univ_reg_no, id);
    if (existingRegNo) {
      return res.render('admin/registration-edit', {
        title: `Edit Registration - ${registration.applicant_name}`,
        admin: req.session.admin,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        registration: { ...registration, ...updatedData },
        constants: { UNITS, DEPARTMENTS, DEPARTMENT_UNIT_MAP, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, INDIAN_LANGUAGES, MEDIA_ROLES },
        error: 'A registration already exists with this Register / Application Number.'
      });
    }

    const existingEmail = await RegistrationModel.findByEmail(updatedData.email, id);
    if (existingEmail) {
      return res.render('admin/registration-edit', {
        title: `Edit Registration - ${registration.applicant_name}`,
        admin: req.session.admin,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        registration: { ...registration, ...updatedData },
        constants: { UNITS, DEPARTMENTS, DEPARTMENT_UNIT_MAP, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, INDIAN_LANGUAGES, MEDIA_ROLES },
        error: 'A registration already exists with this Email Address.'
      });
    }

    const existingAadhaar = await RegistrationModel.findByAadhaar(updatedData.aadhaar_number, id);
    if (existingAadhaar) {
      return res.render('admin/registration-edit', {
        title: `Edit Registration - ${registration.applicant_name}`,
        admin: req.session.admin,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        registration: { ...registration, ...updatedData },
        constants: { UNITS, DEPARTMENTS, DEPARTMENT_UNIT_MAP, COURSES, YEAR_OF_STUDY, BLOOD_GROUPS, NATIVE_STATES, INDIAN_LANGUAGES, MEDIA_ROLES },
        error: 'A registration already exists with this Aadhaar Number.'
      });
    }

    await RegistrationModel.update(id, updatedData);
    await logAudit('EDIT_REGISTRATION', req.session.admin ? req.session.admin.username : 'Admin', `Updated registration ID: ${registration.registration_id}`);

    res.redirect(`/admin/registrations/${id}`);
  } catch (err) {
    console.error('Update Registration Error:', err);
    res.status(500).render('500');
  }
};

exports.deleteRegistration = async (req, res) => {
  const { id } = req.params;
  try {
    const registration = await RegistrationModel.findById(id);
    if (!registration) return res.status(404).render('404');

    await RegistrationModel.hardDelete(id);
    await logAudit('DELETE_REGISTRATION', req.session.admin ? req.session.admin.username : 'Admin', `Hard deleted registration ID: ${registration.registration_id}`);

    res.redirect('/admin/registrations');
  } catch (err) {
    console.error('Delete Registration Error:', err);
    res.status(500).render('500');
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const registrations = await RegistrationModel.getAllForExport();
    await exportRegistrationsToExcel(registrations, res);
    await logAudit('EXPORT_EXCEL', req.session.admin ? req.session.admin.username : 'Admin', `Exported ${registrations.length} registrations to Excel`);
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).render('500');
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const registration = await RegistrationModel.findById(req.params.id);
    if (!registration) return res.status(404).render('404');

    generateRegistrationPDF(registration, res);
    await logAudit('DOWNLOAD_PDF', req.session.admin ? req.session.admin.username : 'Admin', `Downloaded PDF for registration ID: ${registration.registration_id}`);
  } catch (err) {
    console.error('PDF Download Error:', err);
    res.status(500).render('500');
  }
};

// --- DIRECT ADMIN CHANGE PASSWORD (INSIDE DASHBOARD) ---

exports.renderChangePassword = (req, res) => {
  res.render('admin/change-password', {
    title: 'Change Password - PU NSS Portal',
    admin: req.session.admin,
    csrfToken: req.csrfToken ? req.csrfToken() : '',
    error: null,
    success: null
  });
};

exports.handleChangePassword = async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body || {};
  const adminSession = req.session.admin;

  if (!current_password || !new_password || !confirm_password) {
    return res.render('admin/change-password', {
      title: 'Change Password - PU NSS Portal',
      admin: adminSession,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: 'Please fill in all fields (Current Password, New Password, Confirm Password).',
      success: null
    });
  }

  if (new_password.length < 6) {
    return res.render('admin/change-password', {
      title: 'Change Password - PU NSS Portal',
      admin: adminSession,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: 'New password must be at least 6 characters long.',
      success: null
    });
  }

  if (new_password !== confirm_password) {
    return res.render('admin/change-password', {
      title: 'Change Password - PU NSS Portal',
      admin: adminSession,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: 'New password and confirm password do not match.',
      success: null
    });
  }

  try {
    const adminRecord = await AdminModel.findById(adminSession.id) || await AdminModel.findByUsernameOrEmail(adminSession.username);
    if (!adminRecord) {
      return res.render('admin/change-password', {
        title: 'Change Password - PU NSS Portal',
        admin: adminSession,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        error: 'Admin account record not found.',
        success: null
      });
    }

    const hashToCompare = adminRecord.password_hash || adminRecord.password;
    const isMatch = await bcrypt.compare(current_password, hashToCompare);

    if (!isMatch) {
      return res.render('admin/change-password', {
        title: 'Change Password - PU NSS Portal',
        admin: adminSession,
        csrfToken: req.csrfToken ? req.csrfToken() : '',
        error: 'Current password is incorrect. Please try again.',
        success: null
      });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await AdminModel.updatePassword(adminRecord.id, newHash);

    try {
      await logAudit('PASSWORD_CHANGE_DIRECT', adminSession.username, 'Admin password changed directly from dashboard');
    } catch (e) {}

    res.render('admin/change-password', {
      title: 'Change Password - PU NSS Portal',
      admin: adminSession,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: null,
      success: 'Your password has been changed successfully!'
    });

  } catch (err) {
    console.error('Change Password Error:', err);
    res.render('admin/change-password', {
      title: 'Change Password - PU NSS Portal',
      admin: adminSession,
      csrfToken: req.csrfToken ? req.csrfToken() : '',
      error: 'Failed to update password. Please try again.',
      success: null
    });
  }
};
