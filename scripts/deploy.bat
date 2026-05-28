@echo off
REM Kharon Deployment Script (Windows)
REM Purpose: Automated deployment process for Kharon website
REM Dependencies: npm, git
REM Structural Role: Deployment automation

echo 🚀 Starting Kharon deployment process...

REM Verify current branch
for /f %%i in ('git branch --show-current') do set BRANCH=%%i
echo 📋 Current branch: %BRANCH%

REM Check for uncommitted changes
git status --porcelain
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error checking git status
    exit /b 1
)

REM Actually check if there are changes
set HAS_CHANGES=false
for /f %%i in ('git status --porcelain ^| findstr "."') do set HAS_CHANGES=true

if "%HAS_CHANGES%"=="true" (
    echo ❌ Uncommitted changes detected. Please commit or stash changes before deploying.
    exit /b 1
)

echo ✅ Repository is clean

REM Run build to verify everything works
echo 🏗️  Running build process...
call npm run build

REM Verify build succeeded
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed. Aborting deployment.
    exit /b 1
)

echo ✅ Build completed successfully

REM Run type checking
echo 🔍 Running type checks...
npx astro check

if %ERRORLEVEL% EQU 0 (
    echo ✅ Type checking passed
) else (
    echo ⚠️  Type checking revealed issues, but continuing with deployment
)

echo 🌐 Deployment ready. Push to main branch to trigger Cloudflare Pages deployment.

echo ✅ Deployment preparation completed successfully!
echo 📋 Next steps:
echo    1. Commit any pending changes
echo    2. Push to main branch to trigger Cloudflare Pages deployment
echo    3. Monitor deployment status in Cloudflare Dashboard