@echo off
title TreinosApp - APP COMPLETO
color 0E

echo.
echo ==========================================
echo       TreinosApp - APLICATIVO COMPLETO
echo         Backend + Mobile Frontend  
echo ==========================================
echo.

echo [1/2] Iniciando BACKEND (API)...
echo.

REM Parar processos Node.js anteriores
echo Parando processos anteriores...
powershell "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1

REM Aguardar um momento
timeout /t 2 /nobreak >nul

REM Abrir backend em nova janela
start "TreinosApp Backend" cmd /k "cd /d D:\treinosapp\treinosapp-backend && npm run dev"

echo ✅ Backend iniciando em nova janela...
echo 🌐 API: http://localhost:3001
echo.

REM Aguardar um pouco para o backend iniciar
echo Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

echo [2/2] Iniciando MOBILE (Frontend)...
echo.

REM Navegar para pasta mobile
cd /d "D:\treinosapp\treinosapp-mobile"

echo ✅ Mobile iniciando nesta janela...
echo 📱 App: http://localhost:8081
echo.
echo COMO USAR:
echo - Backend: http://localhost:3001 (rodando em outra janela)
echo - Frontend: http://localhost:8081 (nesta janela)
echo - Para testar no celular: instale "Expo Go"
echo - Para parar TUDO: feche ambas as janelas
echo.

REM Iniciar mobile nesta janela
npx expo start

echo.
echo Mobile fechado. Backend pode ainda estar rodando.
echo Para parar backend: feche a outra janela do cmd.
pause