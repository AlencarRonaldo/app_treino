@echo off
title TreinosApp - Reset Database

echo.
echo ================================
echo  TreinosApp - Reset Database
echo ================================
echo.

echo ⚠️  ATENÇÃO: Esta operação irá:
echo    - Deletar TODOS os dados do database
echo    - Recriar as tabelas
echo    - Popular com dados iniciais
echo.

set /p confirm="Tem certeza que deseja continuar? (s/N): "
if /i not "%confirm%"=="s" (
    echo ❌ Operação cancelada pelo usuário
    pause
    exit /b 0
)

REM Navegar para o diretório do backend
cd /d "%~dp0treinosapp-backend"

REM Verificar se o diretório existe
if not exist "package.json" (
    echo ❌ Arquivo package.json não encontrado!
    echo Certifique-se de estar no diretório correto.
    pause
    exit /b 1
)

echo.
echo 🗑️ Removendo database atual...
if exist "dev.db" del "dev.db"
if exist "prisma\dev.db" del "prisma\dev.db"
if exist "dev_new.db" del "dev_new.db"

echo 📊 Recriando database...
npx prisma db push --force-reset
if %errorlevel% neq 0 (
    echo ❌ Erro ao recriar database!
    pause
    exit /b 1
)

echo 🌱 Populando com dados iniciais...
node seed.js
if %errorlevel% neq 0 (
    echo ❌ Erro ao popular database!
    pause
    exit /b 1
)

echo.
echo ✅ Database resetado com sucesso!
echo.
echo 📊 Dados criados:
echo    - 3 usuários de exemplo
echo    - 12 exercícios brasileiros
echo    - 3 treinos templates
echo    - 4 registros de progresso
echo.
echo 👤 Usuários de teste:
echo    - Personal: joao.personal@treinosapp.com (senha: 123456)
echo    - Aluno: maria.aluna@treinosapp.com (senha: 123456)
echo    - Aluno: carlos.estudante@treinosapp.com (senha: 123456)
echo.

pause