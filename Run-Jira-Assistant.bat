@echo off
title Jira Assistant Desktop
cd /d "%~dp0"
echo Starting Jira Assistant Desktop...
node "node_modules\electron\cli.js" .
if errorlevel 1 (
  echo.
  echo An error occurred while launching Jira Assistant.
  pause
)
