-- =============================================================================
-- TradeAI MySQL Database Schema & Initial Seed
-- For Fresh Installation
-- =============================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `tradeai_db` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE `tradeai_db`;

-- -----------------------------------------------------------------------------
-- 2. Table structure for `users`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `email` VARCHAR(128) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(128) NOT NULL,
    `role` VARCHAR(32) NOT NULL DEFAULT 'user',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `avatar_url` VARCHAR(512) NULL DEFAULT NULL,
    `risk_tolerance` VARCHAR(32) NOT NULL DEFAULT 'MODERATE',
    `morning_alert_time` VARCHAR(16) NOT NULL DEFAULT '08:30 AM',
    `enable_push_notifications` TINYINT(1) NOT NULL DEFAULT 1,
    `watchlist_json` LONGTEXT NULL,
    `portfolio_balance` DOUBLE NOT NULL DEFAULT 100000.00,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_login_at` DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_username` (`username`),
    UNIQUE KEY `uq_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table structure for `audit_logs`
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `user_id` VARCHAR(36) NULL DEFAULT NULL,
    `username` VARCHAR(64) NULL DEFAULT NULL,
    `action` VARCHAR(64) NOT NULL,
    `details` VARCHAR(512) NULL DEFAULT NULL,
    `ip_address` VARCHAR(64) NULL DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_audit_user_id` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Seed Default Admin & Trader Accounts
-- -----------------------------------------------------------------------------
-- Default Admin: admin@tradeai.app / AdminPassword@123
-- Default Trader: trader@tradeai.app / TraderPassword@123

INSERT INTO `users` (
    `id`, `username`, `email`, `password_hash`, `full_name`, 
    `role`, `is_active`, `avatar_url`, `risk_tolerance`, 
    `morning_alert_time`, `enable_push_notifications`, `watchlist_json`, 
    `portfolio_balance`, `created_at`, `last_login_at`
) VALUES 
(
    'usr_admin_01', 
    'admin_super', 
    'admin@tradeai.app', 
    '$2b$12$FmU0jGhlKH5HGAEeMT2llebI5RN9nlwmy.Ejvj9HG7su2wpSZvvoO', 
    'Chief Market Admin', 
    'admin', 
    1, 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 
    'AGGRESSIVE', 
    '08:30 AM', 
    1, 
    '["TATASIL", "NIFTY50", "RELIANCE", "AAPL", "GOLDBEES"]', 
    250000.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
),
(
    'usr_demo_01', 
    'trader_pro', 
    'trader@tradeai.app', 
    '$2b$12$aTcbEajYNGsrIOc9bk7jheKWzGsQrJklfU3YNwrc0SE9KkVMiKr0S', 
    'Alex Vance', 
    'user', 
    1, 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 
    'MODERATE', 
    '08:30 AM', 
    1, 
    '["TATASIL", "NIFTY50", "RELIANCE"]', 
    100000.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE 
    `role` = VALUES(`role`),
    `password_hash` = VALUES(`password_hash`),
    `is_active` = VALUES(`is_active`);

-- Record Initial System Initialization Audit Log
INSERT INTO `audit_logs` (`user_id`, `username`, `action`, `details`, `ip_address`, `created_at`)
VALUES 
('usr_admin_01', 'admin_super', 'SYSTEM_INIT', 'Database schema created and default Administrator account seeded', '127.0.0.1', CURRENT_TIMESTAMP);
