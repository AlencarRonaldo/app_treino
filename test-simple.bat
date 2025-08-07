@echo off
echo.
echo ================================
echo  Teste Simples - TreinosApp
echo ================================
echo.

echo Diretorio atual: %CD%
echo.

echo Testando Node.js...
node --version
echo Erro level Node: %errorlevel%
echo.

echo Testando npm...
npm --version  
echo Erro level npm: %errorlevel%
echo.

echo Navegando para mobile...
cd D:\treinosapp\treinosapp-mobile
echo Novo diretorio: %CD%
echo.

echo Listando arquivos...
dir
echo.

echo Fim do teste.
echo.
echo Pressione qualquer tecla para continuar...
pause >nul