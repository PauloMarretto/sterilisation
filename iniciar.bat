@echo off
REM ============================================================
REM Script de Inicialização - Projeto Cabinet
REM ============================================================
REM Use este script para iniciar o servidor

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================
echo   CABINET - SERVIDOR INICIANDO...
echo   Sistema de Registre de Stérilisation
echo ============================================================
echo.

REM Verifica se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não está instalado ou não está no PATH
    echo.
    echo Execute o script install.bat primeiro
    echo.
    pause
    exit /b 1
)

REM Verifica se estamos no diretório correto
if not exist "package.json" (
    echo [ERRO] arquivo package.json não encontrado
    echo.
    echo Certifique-se de estar no diretório raiz do projeto
    echo.
    pause
    exit /b 1
)

REM Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo [AVISO] Dependências não estão instaladas
    echo.
    echo Instalando npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha na instalação das dependências
        pause
        exit /b 1
    )
)

REM Inicia o servidor
echo [OK] Iniciando servidor Node.js...
echo.
echo Acesse a aplicação em: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
echo ============================================================
echo.

npm start

pause
