@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website"
echo === FRONTEND BUILD STARTED %date% %time% === > frontend_build.log
npm run build >> frontend_build.log 2>&1
echo === EXITCODE=%errorlevel% %date% %time% === >> frontend_build.log
