-- ============================================================================
-- Pondicherry University NSS Volunteer Registration Portal Database Schema
-- Database: nss_portal
-- Engine: InnoDB | MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `nss_portal` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `nss_portal`;

-- ----------------------------------------------------------------------------
-- Table 1: admins
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL DEFAULT 'PU NSS Super Administrator',
  `email` VARCHAR(150) NOT NULL,
  `role` VARCHAR(30) NOT NULL DEFAULT 'superadmin',
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_username` (`username`),
  UNIQUE KEY `uk_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin Credential Seed: Username: admin | Password: Admin@NSS2026
INSERT INTO `admins` (`username`, `password_hash`, `full_name`, `email`, `role`) VALUES
('admin', '$2b$10$3zR1qE1vC3X9s/Bq9vXN7.fQJ2w7G6P8Y4kR1v8L0M9P3X2Y1Z0Wq', 'PU NSS Super Administrator', 'nsspondiuni2409@gmail.com', 'superadmin')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- ----------------------------------------------------------------------------
-- Table 2: registrations
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `registration_id` VARCHAR(50) NOT NULL,
  
  -- Academic Details
  `unit_number` VARCHAR(20) NOT NULL,
  `department` VARCHAR(150) NOT NULL,
  `course` VARCHAR(100) NOT NULL,
  `year_of_study` VARCHAR(30) NOT NULL,
  
  -- Personal Details
  `applicant_name` VARCHAR(150) NOT NULL,
  `univ_reg_no` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `contact_number` VARCHAR(15) NOT NULL,
  `alt_contact_number` VARCHAR(15) DEFAULT NULL,
  `gender` VARCHAR(30) NOT NULL,
  `dob` DATE NOT NULL,
  `age` INT UNSIGNED NOT NULL,
  `blood_group` VARCHAR(30) NOT NULL,
  `aadhaar_number` VARCHAR(20) NOT NULL,
  
  -- Address Details
  `native_state` VARCHAR(100) NOT NULL,
  `present_address` TEXT NOT NULL,
  `permanent_address` TEXT NOT NULL,
  `is_same_address` TINYINT(1) NOT NULL DEFAULT 0,
  
  -- Languages & Volunteer Skills
  `languages_spoken` TEXT NOT NULL,
  `is_previous_volunteer` VARCHAR(10) NOT NULL,
  `certificate_path` VARCHAR(255) DEFAULT NULL,
  `interested_in_media` VARCHAR(10) NOT NULL DEFAULT 'No',
  `media_roles` TEXT DEFAULT NULL,
  `extra_curricular_skills` TEXT DEFAULT NULL,
  `interested_in_leadership` VARCHAR(10) NOT NULL DEFAULT 'No',
  
  -- Declaration & Timestamps
  `declaration_accepted` TINYINT(1) NOT NULL DEFAULT 1,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_registration_id` (`registration_id`),
  UNIQUE KEY `uk_univ_reg_no` (`univ_reg_no`),
  UNIQUE KEY `uk_aadhaar_number` (`aadhaar_number`),
  UNIQUE KEY `uk_email` (`email`),
  INDEX `idx_unit_number` (`unit_number`),
  INDEX `idx_department` (`department`),
  INDEX `idx_course` (`course`),
  INDEX `idx_year_of_study` (`year_of_study`),
  INDEX `idx_applicant_name` (`applicant_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table 3: audit_logs
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(50) NOT NULL,
  `performed_by` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;