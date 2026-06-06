@echo off
REM ============================================================
REM Script de Instalação - Projeto Cabinet
REM ============================================================
REM Este script instala automaticamente:
REM - Node.js
REM - Git
REM - Clona o repositório
REM - Instala dependências do projeto
REM ============================================================

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================
echo   INSTALADOR - PROJETO CABINET
echo   Sistema de Registre de Stérilisation
echo ============================================================
echo.

REM Verifica se o script está rodando como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Este script precisa ser executado como ADMINISTRADOR
    echo.
    echo Por favor, clique com botão direito no arquivo e selecione:
    echo "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [INFO] Script iniciado com permissões de administrador
echo.

REM ============================================================
REM 1. VERIFICAR E INSTALAR NODE.JS
REM ============================================================
echo.
echo ============================================================
echo [PASSO 1/4] Verificando NODE.JS...
echo ============================================================
echo.

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js já está instalado: !NODE_VERSION!
) else (
    echo [INSTALANDO] Node.js...
    echo.
    
    REM Download do instalador Node.js LTS
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi', '%temp%\node-installer.msi')}"
    
    if exist "%temp%\node-installer.msi" (
        echo [EXECUTANDO] Instalador Node.js...
        msiexec /i "%temp%\node-installer.msi" /quiet /norestart
        
        REM Aguarda a instalação completar
        timeout /t 30 /nobreak
        
        echo [OK] Node.js instalado com sucesso!
        
        REM Limpa o instalador
        del "%temp%\node-installer.msi"
    ) else (
        echo [ERRO] Falha ao baixar Node.js
        echo Acesse: https://nodejs.org/ e instale manualmente
        pause
        exit /b 1
    )
)

REM ============================================================
REM 2. VERIFICAR E INSTALAR GIT
REM ============================================================
echo.
echo ============================================================
echo [PASSO 2/4] Verificando GIT...
echo ============================================================
echo.

git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [OK] Git já está instalado: !GIT_VERSION!
) else (
    echo [INSTALANDO] Git...
    echo.
    
    REM Download do instalador Git
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe', '%temp%\git-installer.exe')}"
    
    if exist "%temp%\git-installer.exe" (
        echo [EXECUTANDO] Instalador Git...
        "%temp%\git-installer.exe" /VERYSILENT /NORESTART
        
        REM Aguarda a instalação completar
        timeout /t 20 /nobreak
        
        echo [OK] Git instalado com sucesso!
        
        REM Limpa o instalador
        del "%temp%\git-installer.exe"
    ) else (
        echo [ERRO] Falha ao baixar Git
        echo Acesse: https://git-scm.com/download/win e instale manualmente
        pause
        exit /b 1
    )
)

REM ============================================================
REM 3. CLONAR REPOSITÓRIO
REM ============================================================
echo.
echo ============================================================
echo [PASSO 3/4] Clonando Repositório...
echo ============================================================
echo.

set REPO_URL=https://github.com/PauloMarretto/cabinet.git
set CLONE_DIR=%USERPROFILE%\cabinet

if exist "%CLONE_DIR%" (
    echo [AVISO] Pasta "%CLONE_DIR%" já existe
    echo.
    set /p CONTINUE="Deseja remover e fazer clone novamente? (S/N): "
    
    if /i "!CONTINUE!"=="S" (
        echo [REMOVENDO] Pasta anterior...
        rmdir /s /q "%CLONE_DIR%"
    ) else (
        echo [OK] Usando pasta existente
        goto INSTALL_DEPS
    )
)

echo [CLONANDO] Repositório de %REPO_URL%...
echo.

cd /d "%USERPROFILE%"
git clone %REPO_URL% cabinet

if %errorlevel% equ 0 (
    echo.
    echo [OK] Repositório clonado com sucesso em: %CLONE_DIR%
) else (
    echo.
    echo [ERRO] Falha ao clonar repositório
    pause
    exit /b 1
)

:INSTALL_DEPS

REM ============================================================
REM 4. INSTALAR DEPENDÊNCIAS DO PROJETO
REM ============================================================
echo.
echo ============================================================
echo [PASSO 4/4] Instalando Dependências do Projeto...
echo ============================================================
echo.

cd /d "%CLONE_DIR%"

if not exist "package.json" (
    echo [ERRO] arquivo package.json não encontrado
    pause
    exit /b 1
)

echo [INSTALANDO] npm packages...
echo.

call npm install

if %errorlevel% equ 0 (
    echo.
    echo [OK] Dependências instaladas com sucesso!
) else (
    echo.
    echo [ERRO] Falha na instalação de dependências
    pause
    exit /b 1
)

REM ============================================================
REM 5. CRIAR ATALHO NA ÁREA DE TRABALHO
REM ============================================================
echo.
echo ============================================================
echo [CRIANDO] Atalho na Área de Trabalho...
echo ============================================================
echo.

set DESKTOP=%USERPROFILE%\Desktop
set SHORTCUT=%DESKTOP%\Iniciar Cabinet.lnk

powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/k cd /d %CLONE_DIR% && npm start'; $Shortcut.WorkingDirectory = '%CLONE_DIR%'; $Shortcut.Description = 'Inicia o Projeto Cabinet'; $Shortcut.IconLocation = '%CLONE_DIR%\public\img\logo.png'; $Shortcut.Save()}"

if %errorlevel% equ 0 (
    echo [OK] Atalho criado em: %DESKTOP%
) else (
    echo [AVISO] Não foi possível criar o atalho automaticamente
)

REM ============================================================
REM 6. CRIAR SCRIPT PARA INICIAR SERVIDOR
REM ============================================================
echo.
echo ============================================================
echo [CRIANDO] Script para Iniciar Servidor...
echo ============================================================
echo.

set START_SCRIPT=%CLONE_DIR%\iniciar.bat

(
    echo @echo off
    echo title Cabinet - Sistema de Registre de Stérilisation
    echo cls
    echo echo.
    echo echo ======================================================
    echo echo   CABINET - Sistema de Registre de Stérilisation
    echo echo ======================================================
    echo echo.
    echo echo [INFO] Iniciando servidor...
    echo echo.
    echo npm start
    echo pause
) > "%START_SCRIPT%"

echo [OK] Script criado: %START_SCRIPT%

REM ============================================================
REM RESUMO FINAL
REM ============================================================
echo.
echo ============================================================
echo   INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ============================================================
echo.
echo [RESUMO]
echo.
echo 1. Node.js............... OK
echo 2. Git................... OK
echo 3. Repositório........... %CLONE_DIR%
echo 4. Dependências.......... OK
echo.
echo ============================================================
echo   PRÓXIMOS PASSOS
echo ============================================================
echo.
echo OPÇÃO 1 - Executar agora:
echo   - Digite: npm start
echo   - Pressione Enter
echo.
echo OPÇÃO 2 - Usar o atalho da Área de Trabalho:
echo   - Clique duas vezes em "Iniciar Cabinet.lnk"
echo.
echo OPÇÃO 3 - Usar o script de inicialização:
echo   - Execute: %START_SCRIPT%
echo.
echo ============================================================
echo   ACESSAR APLICAÇÃO
echo ============================================================
echo.
echo Abra seu navegador e acesse:
echo   http://localhost:3000
echo.
echo ============================================================
echo.

pause
