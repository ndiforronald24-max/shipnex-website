@echo off
cd /d "C:\Users\Falone Mo\Desktop\shipnex-website"
echo === FRONTEND STARTED %date% %time% === > frontend_run.log
npm run dev >> frontend_run.log 2>&1
echo === FRONTEND EXITED %errorlevel% %date% %time% === >> frontend_run.log
