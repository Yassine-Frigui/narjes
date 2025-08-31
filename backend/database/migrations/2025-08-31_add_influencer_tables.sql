-- Migration: Add influencer tracking tables
-- This file creates two new tables:
-- 1) influencer_links: one row per generated influencer link (code, metadata, owner info)
-- 2) influencer_events: an append-only events table recording clicks and conversions
-- Note: This migration does NOT alter any existing tables. It is safe to run on top of the current schema.

CREATE TABLE IF NOT EXISTS `influencer_links` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_influencer_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table records clicks and conversions associated with influencer links.
-- We intentionally avoid strict foreign key constraints to keep this migration low-impact
-- and to avoid requiring modifications to existing tables or strict ordering.

CREATE TABLE IF NOT EXISTS `influencer_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `influencer_link_id` INT NOT NULL,
  `event_type` ENUM('click','conversion') NOT NULL,
  `reservation_id` INT DEFAULT NULL,
  `client_id` INT DEFAULT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(1024) DEFAULT NULL,
  `referrer` VARCHAR(1024) DEFAULT NULL,
  `metadata` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_influencer_link` (`influencer_link_id`),
  KEY `idx_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: You can populate an initial demo link (change code/name as desired):
-- INSERT INTO influencer_links (code, name, notes, created_by) VALUES ('demo-influencer-001', 'Demo Influencer', 'Created by migration', NULL);
