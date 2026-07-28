-- ============================================================================
-- Pondicherry University NSS Registration Portal Database Schema
-- Database: nss_portal
-- Engine: InnoDB | MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `nss_portal` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `nss_portal`;

-- ----------------------------------------------------------------------------
-- Table 1: admins
-- Stores administrative credentials and roles.
-- Default Superadmin Credential:
--   Username: admin
--   Password: AdminPassword@123 (hashed via bcrypt)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `role` ENUM('superadmin', 'admin') NOT NULL DEFAULT 'admin',
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_username` (`username`),
  UNIQUE KEY `uk_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`username`, `password`, `full_name`, `email`, `role`) VALUES
('admin', '$2b$10$3zR1qE1vC3X9s/Bq9vXN7.fQJ2w7G6P8Y4kR1v8L0M9P3X2Y1Z0Wq', 'PU NSS Super Administrator', 'nssadmin@pondiuni.edu.in', 'superadmin');

-- ----------------------------------------------------------------------------
-- Table 2: registrations
-- Primary table holding all NSS student registration details.
-- Constraints enforce uniqueness on Registration/Application Number & Aadhaar.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `registration_id` VARCHAR(30) NOT NULL,
  
  -- Academic Details
  `unit_number` VARCHAR(10) NOT NULL,
  `department` VARCHAR(150) NOT NULL,
  `course` VARCHAR(50) NOT NULL,
  `year_of_study` ENUM('First Year', 'Second Year', 'Third Year') NOT NULL,
  
  -- Personal Details
  `applicant_name` VARCHAR(100) NOT NULL,
  `univ_reg_no` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `contact_number` VARCHAR(10) NOT NULL,
  `alt_contact_number` VARCHAR(10) DEFAULT NULL,
  `gender` ENUM('Male', 'Female', 'Transgender', 'Prefer not to say') NOT NULL,
  `dob` DATE NOT NULL,
  `age` INT UNSIGNED NOT NULL,
  `blood_group` VARCHAR(25) NOT NULL,
  `aadhaar_number` CHAR(12) NOT NULL,
  
  -- Address Details
  `native_state` VARCHAR(100) NOT NULL,
  `present_address` TEXT NOT NULL,
  `permanent_address` TEXT NOT NULL,
  `is_same_address` TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Languages Spoken (Stored as JSON array)
  `languages_spoken` JSON NOT NULL,
  
  -- NSS Volunteer Details
  `is_previous_volunteer` ENUM('Yes', 'No') NOT NULL,
  `certificate_path` VARCHAR(255) DEFAULT NULL,
  
  -- Media Team Selection
  `interested_in_media` ENUM('Yes', 'No') NOT NULL,
  `media_roles` JSON DEFAULT NULL,
  
  -- Declaration & Timestamps
  `declaration_accepted` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_registration_id` (`registration_id`),
  UNIQUE KEY `uk_univ_reg_no` (`univ_reg_no`),
  UNIQUE KEY `uk_aadhaar_number` (`aadhaar_number`),
  INDEX `idx_unit_number` (`unit_number`),
  INDEX `idx_department` (`department`),
  INDEX `idx_course` (`course`),
  INDEX `idx_year_of_study` (`year_of_study`),
  INDEX `idx_applicant_name` (`applicant_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;