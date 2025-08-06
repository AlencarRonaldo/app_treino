@echo off
echo ========================================
echo TreinosApp - Sistema de Orquestracao
echo ========================================
echo.

echo [1/4] Verificando dependencias MCP...
if not exist node_modules\task-master-ai (
    echo Instalando Task Master AI...
    npm install task-master-ai --save-dev
)

echo [2/4] Verificando configuracao Context7...
if not exist .env (
    echo AVISO: Arquivo .env nao encontrado
    echo Configure suas chaves de API:
    echo - ANTHROPIC_API_KEY
    echo - CONTEXT7_API_KEY
    echo.
)

echo [3/4] Sincronizando Task Master...
npx task-master-ai list

echo [4/4] Iniciando Claude Code com orquestracao...
echo.
echo ========================================
echo Sistema pronto! Use os comandos:
echo.
echo /orchestrate priority_1  # Autenticacao
echo /orchestrate priority_2  # ExerciseDB 
echo /orchestrate all        # Completo
echo.
echo Flags automaticos ativados:
echo --c7 --seq --delegate --loop
echo ========================================
pause