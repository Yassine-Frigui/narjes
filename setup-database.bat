@echo off
echo =======================================
echo    MySQL Database Setup for ZenShe Spa
echo =======================================
echo.

echo This script will help you create the database.
echo Make sure MySQL is running on port 4306
echo.
echo =======================================
echo Manual Database Setup:
echo =======================================
echo.
echo 1. Open MySQL Command Line or MySQL Workbench
echo 2. Connect to your MySQL server on port 4306
echo 3. Run this command:
echo.
echo    CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo.
echo 4. Verify database was created:
echo.
echo    SHOW DATABASES;
echo.
echo =======================================
echo Alternative - Using Command Line:
echo =======================================
echo.
echo mysql -u root -P 4306 -e "CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo.
echo =======================================

pause

echo.
echo Attempting to create database via command line...
mysql -u root -P 4306 -e "CREATE DATABASE IF NOT EXISTS zenshespa_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database created successfully!
    echo.
    echo Verifying database exists...
    mysql -u root -P 4306 -e "SHOW DATABASES LIKE 'zenshespa_database';"
) else (
    echo ❌ Failed to create database automatically.
    echo Please create it manually using the instructions above.
)

echo.
echo =======================================
pause
