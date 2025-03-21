@echo off
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo npm install failed. Exiting.
    exit /b %errorlevel%
)
copy /y "package_overrides\@distube-youtube-index.js" "node_modules\@distube\youtube\dist\index.js"
title HarmoniBot
echo Starting HarmoniBot...
call node index.js