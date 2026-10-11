USE labourflow_db;

-- Run this whole file once in MySQL Workbench (lightning bolt).
-- The lf_* tables are the MySQL-compatible storage used by the current UI.
-- Existing original tables are preserved.

CREATE TABLE IF NOT EXISTS lf_sites (
 site_id INT AUTO_INCREMENT PRIMARY KEY,
 site_name VARCHAR(150) NOT NULL,
 location VARCHAR(255) NULL,
 start_date DATE NULL,
 status ENUM('ACTIVE','COMPLETED','ON_HOLD') NOT NULL DEFAULT 'ACTIVE'
);
CREATE TABLE IF NOT EXISTS lf_trades (
 trade_id INT AUTO_INCREMENT PRIMARY KEY,
 trade_name VARCHAR(100) NOT NULL UNIQUE,
 color_code VARCHAR(50) NULL,
 skill_level VARCHAR(50) NULL,
 description TEXT NULL
);
CREATE TABLE IF NOT EXISTS lf_labours (
 labour_id INT AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(100) NOT NULL,
 phone VARCHAR(20) NULL,
 trade_id INT NULL,
 current_site_id INT NULL,
 daily_wage DECIMAL(10,2) NOT NULL DEFAULT 0,
 status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
 is_active TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS lf_supervisors (
 supervisor_id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NULL,
 site_id INT NULL,
 phone VARCHAR(20) NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS lf_hajiri_codes (
 hajiri_code VARCHAR(20) PRIMARY KEY,
 hours_worked DECIMAL(5,2) NOT NULL,
 hajiri_units DECIMAL(5,2) NOT NULL,
 description VARCHAR(120) NOT NULL
);
CREATE TABLE IF NOT EXISTS lf_trade_rate_master (
 trade_rate_id INT AUTO_INCREMENT PRIMARY KEY,
 trade_id INT NOT NULL,
 base_daily_rate DECIMAL(10,2) NOT NULL,
 effective_from DATE NOT NULL,
 effective_to DATE NULL
);
CREATE TABLE IF NOT EXISTS lf_labour_rate_master (
 rate_id INT AUTO_INCREMENT PRIMARY KEY,
 labour_id INT NOT NULL,
 base_daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
 hr_allowance DECIMAL(10,2) NOT NULL DEFAULT 0,
 conv_allowance DECIMAL(10,2) NOT NULL DEFAULT 0,
 effective_daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
 effective_from DATE NOT NULL,
 effective_to DATE NULL
);
CREATE TABLE IF NOT EXISTS lf_attendance_cards (
 card_id INT AUTO_INCREMENT PRIMARY KEY,
 labour_id INT NOT NULL,
 site_id INT NOT NULL,
 supervisor_id INT NOT NULL,
 card_number VARCHAR(50) NOT NULL UNIQUE,
 month_year CHAR(7) NOT NULL,
 issued_date DATE NOT NULL,
 UNIQUE KEY uq_lf_card_worker_month (labour_id, month_year)
);
CREATE TABLE IF NOT EXISTS lf_daily_hajiri_logs (
 log_id INT AUTO_INCREMENT PRIMARY KEY,
 card_id INT NOT NULL,
 site_id INT NOT NULL,
 supervisor_id INT NOT NULL,
 log_date DATE NOT NULL,
 hajiri_code VARCHAR(20) NOT NULL,
 applied_daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
 entry_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_lf_hajiri_card_date (card_id, log_date),
 INDEX idx_lf_hajiri_date (log_date)
);
CREATE TABLE IF NOT EXISTS lf_advance_ledger (
 advance_id INT AUTO_INCREMENT PRIMARY KEY,
 labour_id INT NOT NULL,
 supervisor_id INT NULL,
 date_given DATE NOT NULL,
 advance_amount DECIMAL(10,2) NOT NULL,
 confirmation_ref VARCHAR(255) NULL,
 settlement_status ENUM('OPEN','DEDUCTED') NOT NULL DEFAULT 'OPEN',
 deducted_in_month CHAR(7) NULL
);
CREATE TABLE IF NOT EXISTS lf_extra_work_logs (
 extra_work_id INT AUTO_INCREMENT PRIMARY KEY,
 labour_id INT NOT NULL,
 site_id INT NOT NULL,
 work_date DATE NOT NULL,
 job_description VARCHAR(500) NULL,
 hours DECIMAL(5,2) NOT NULL DEFAULT 0,
 requested_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
 approved_amount DECIMAL(10,2) NULL,
 approved_by INT NULL,
 status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING'
);
CREATE TABLE IF NOT EXISTS lf_monthly_payroll_summary (
 payroll_id INT AUTO_INCREMENT PRIMARY KEY,
 labour_id INT NOT NULL,
 month_year CHAR(7) NOT NULL,
 total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
 total_units DECIMAL(8,2) NOT NULL DEFAULT 0,
 day_wages DECIMAL(10,2) NOT NULL DEFAULT 0,
 extra_work_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
 advance_deducted DECIMAL(10,2) NOT NULL DEFAULT 0,
 other_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
 allowances DECIMAL(10,2) NOT NULL DEFAULT 0,
 gross_wages DECIMAL(10,2) NOT NULL DEFAULT 0,
 net_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
 status ENUM('DRAFT','PENDING','APPROVED','PAID') NOT NULL DEFAULT 'DRAFT',
 generated_on DATETIME NULL,
 UNIQUE KEY uq_lf_payroll_labour_month (labour_id,month_year)
);
CREATE TABLE IF NOT EXISTS lf_system_audit_logs (
 audit_id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NULL,
 changed_by_name VARCHAR(100) NULL,
 action_type VARCHAR(30) NOT NULL,
 table_name VARCHAR(100) NOT NULL,
 record_id VARCHAR(100) NULL,
 old_values JSON NULL,
 new_values JSON NULL,
 changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Run this line only if DESCRIBE users does not show is_active.
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
