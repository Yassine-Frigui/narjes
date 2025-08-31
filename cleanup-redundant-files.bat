@echo off
echo ===============================================
echo  CLEANING UP REDUNDANT FILES
echo ===============================================
echo This script will delete redundant/duplicate files from your project.
echo Database files are excluded from cleanup.
echo.

REM Backup/test/debug files in backend
echo [1/6] Cleaning backend test and debug files...
if exist "backend\test_db.js" del "backend\test_db.js"
if exist "backend\test-db.js" del "backend\test-db.js"
if exist "backend\test-remote-db.js" del "backend\test-remote-db.js"
if exist "backend\test-telegram.js" del "backend\test-telegram.js"
if exist "backend\debug-revenue.js" del "backend\debug-revenue.js"
if exist "backend\debug-update.js" del "backend\debug-update.js"
if exist "backend\fixed_endpoint.js" del "backend\fixed_endpoint.js"
if exist "backend\output.txt" del "backend\output.txt"
if exist "backend\0" del "backend\0"
if exist "backend\'${startDateStr}'" del "backend\'${startDateStr}'"
if exist "backend\.env.example" del "backend\.env.example"

REM Duplicate image files in frontend root (they exist in public/images/)
echo [2/6] Cleaning duplicate frontend images...
if exist "frontend\chez_waad_beauty.jpg" del "frontend\chez_waad_beauty.jpg"
if exist "frontend\hydrafacial.jpg" del "frontend\hydrafacial.jpg"
if exist "frontend\lashes.jpg" del "frontend\lashes.jpg"
if exist "frontend\nails_.jpg" del "frontend\nails_.jpg"
if exist "frontend\nails_example.jpg" del "frontend\nails_example.jpg"
if exist "frontend\nails_example2.jpg" del "frontend\nails_example2.jpg"
if exist "frontend\nailstech.jpg" del "frontend\nailstech.jpg"
if exist "frontend\pedicure.jpg" del "frontend\pedicure.jpg"
if exist "frontend\zenshe_logo.png" del "frontend\zenshe_logo.png"
if exist "frontend\HomePage.jsx" del "frontend\HomePage.jsx"

REM Backup/old admin statistics files
echo [3/6] Cleaning old admin statistics files...
if exist "frontend\src\pages\admin\AdminStatistics_backup.jsx" del "frontend\src\pages\admin\AdminStatistics_backup.jsx"
if exist "frontend\src\pages\admin\AdminStatistics_old.jsx" del "frontend\src\pages\admin\AdminStatistics_old.jsx"
if exist "frontend\src\pages\admin\AdminStatistics_new.jsx" del "frontend\src\pages\admin\AdminStatistics_new.jsx"
if exist "frontend\src\pages\admin\AdminStatisticsNew.jsx" del "frontend\src\pages\admin\AdminStatisticsNew.jsx"

REM Backup statistics routes in backend
echo [4/6] Cleaning backend backup routes...
if exist "backend\src\routes\statistics_backup.js" del "backend\src\routes\statistics_backup.js"
if exist "backend\src\routes\statistics_new.js" del "backend\src\routes\statistics_new.js"
if exist "backend\src\routes\admin_backup.js" del "backend\src\routes\admin_backup.js"
if exist "backend\src\routes\admin_clean.js" del "backend\src\routes\admin_clean.js"

REM Unused Arabic translation file (removed from frontend during cleanup)
echo [5/6] Cleaning unused translation files...
if exist "frontend\src\locales\ar\translation.json" del "frontend\src\locales\ar\translation.json"
if exist "frontend\src\locales\ar" rmdir "frontend\src\locales\ar"

REM Other redundant files
echo [6/6] Cleaning miscellaneous redundant files...
if exist ".github\nah.md" del ".github\nah.md"
if exist "struct.txt" del "struct.txt"
if exist "ssh_key.txt" del "ssh_key.txt"

echo.
echo ===============================================
echo  CLEANUP COMPLETED
echo ===============================================
echo Removed redundant files:
echo - Backend test/debug/temp files
echo - Duplicate frontend images (kept in public/images/)
echo - Old backup admin statistics components
echo - Backup backend routes
echo - Unused Arabic translation files
echo - Miscellaneous redundant files
echo.
echo Database files were preserved.
echo Your project is now cleaner!
pause
