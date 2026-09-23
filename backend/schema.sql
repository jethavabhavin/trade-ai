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

-- -----------------------------------------------------------------------------
-- 5. Table structure for `market_symbols` (Dynamically Monitored Assets)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `market_symbols` (
    `symbol` VARCHAR(32) NOT NULL,
    `ticker` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `category` VARCHAR(32) NOT NULL DEFAULT 'EQUITY',
    `exchange` VARCHAR(32) NOT NULL DEFAULT 'NSE',
    `currency` VARCHAR(8) NOT NULL DEFAULT '₹',
    `description` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`symbol`),
    INDEX `idx_market_symbols_active` (`is_active`),
    INDEX `idx_market_symbols_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table structure for `predictions` (AI Forecasts & Stock Predictions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `predictions` (
    `id` VARCHAR(64) NOT NULL,
    `symbol` VARCHAR(32) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `current_price` DOUBLE NOT NULL,
    `target_price` DOUBLE NOT NULL,
    `stop_loss` DOUBLE NOT NULL,
    `expected_roi_pct` DOUBLE NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `confidence_score` DOUBLE NOT NULL,
    `risk_level` VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    `model_name` VARCHAR(128) NOT NULL DEFAULT 'TradeAI Multi-Horizon Neural Engine',
    `horizon` VARCHAR(16) NOT NULL DEFAULT '7D',
    `forecast_1d_json` LONGTEXT NULL,
    `forecast_7d_json` LONGTEXT NULL,
    `technical_catalysts_json` LONGTEXT NULL,
    `sentiment_score` DOUBLE NOT NULL DEFAULT 0.0,
    `rsi` DOUBLE NOT NULL DEFAULT 50.0,
    `macd_signal` VARCHAR(64) NOT NULL DEFAULT 'Neutral',
    `rationale` TEXT NULL,
    `predicted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_predictions_symbol` (`symbol`),
    INDEX `idx_predictions_action` (`action`),
    INDEX `idx_predictions_predicted_at` (`predicted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table structure for `trade_data` (Stored NSE/Exchange Quotes & Candles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trade_data` (
    `symbol` VARCHAR(32) NOT NULL,
    `ticker` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `category` VARCHAR(32) NOT NULL DEFAULT 'EQUITY',
    `exchange` VARCHAR(32) NOT NULL DEFAULT 'NSE',
    `currency` VARCHAR(8) NOT NULL DEFAULT '₹',
    `current_price` DOUBLE NOT NULL,
    `change_amount` DOUBLE NOT NULL DEFAULT 0.0,
    `change_pct` DOUBLE NOT NULL DEFAULT 0.0,
    `previous_close` DOUBLE NOT NULL DEFAULT 0.0,
    `today_open` DOUBLE NOT NULL DEFAULT 0.0,
    `day_high` DOUBLE NOT NULL DEFAULT 0.0,
    `day_low` DOUBLE NOT NULL DEFAULT 0.0,
    `week_high_52` DOUBLE NOT NULL DEFAULT 0.0,
    `week_low_52` DOUBLE NOT NULL DEFAULT 0.0,
    `volume_24h` VARCHAR(32) NOT NULL DEFAULT '100K',
    `market_cap` VARCHAR(32) NOT NULL DEFAULT '₹100B',
    `pe_ratio` DOUBLE NOT NULL DEFAULT 24.5,
    `description` TEXT NULL,
    `historical_data_json` LONGTEXT NULL,
    `sparkline_json` LONGTEXT NULL,
    `source` VARCHAR(32) NOT NULL DEFAULT 'NSE',
    `fetched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`symbol`),
    INDEX `idx_trade_data_fetched_at` (`fetched_at`),
    INDEX `idx_trade_data_exchange` (`exchange`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table structure for `wishlists` (User Watchlisted / Wishlisted Assets)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wishlists` (
    `id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `symbol` VARCHAR(32) NOT NULL,
    `name` VARCHAR(128) NULL,
    `category` VARCHAR(32) NOT NULL DEFAULT 'EQUITY',
    `target_buy_price` DOUBLE NULL DEFAULT NULL,
    `notes` TEXT NULL,
    `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_wishlist_user_symbol` (`user_id`, `symbol`),
    INDEX `idx_wishlist_user_id` (`user_id`),
    INDEX `idx_wishlist_symbol` (`symbol`),
    CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Demo Wishlists
INSERT INTO `wishlists` (`id`, `user_id`, `symbol`, `name`, `category`, `target_buy_price`, `notes`, `added_at`)
VALUES 
('wl_usr_demo_01_tatasil', 'usr_demo_01', 'TATASIL', 'Tata Steel Limited', 'EQUITY', 145.00, 'Core commodity holding. Watch for rally above 155.', CURRENT_TIMESTAMP),
('wl_usr_demo_01_nifty50', 'usr_demo_01', 'NIFTY50', 'NIFTY 50 Index', 'INDEX', NULL, 'Benchmark index tracker.', CURRENT_TIMESTAMP),
('wl_usr_demo_01_reliance', 'usr_demo_01', 'RELIANCE', 'Reliance Industries Ltd', 'EQUITY', 2850.00, 'Energy & retail momentum.', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;




