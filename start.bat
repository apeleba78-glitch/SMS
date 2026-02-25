@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules" (
  echo 의존성 설치 중... (npm install)
  call npm install
)

echo.
echo ==========================================
echo   로컬 서버 시작
echo ==========================================
echo   주소: http://localhost:3000
echo   종료: Ctrl + C
echo ==========================================
echo.

call npm run dev
pause