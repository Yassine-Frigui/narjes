-- ZenShe Spa Database Setup for Local Development
-- Run this script in your local MySQL server

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE zenshespa_database;

-- Grant privileges to root user (local development)
GRANT ALL PRIVILEGES ON zenshespa_database.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- Show database info
SELECT 'Database created successfully!' as status;
SELECT DATABASE() as current_database;
SHOW TABLES;
