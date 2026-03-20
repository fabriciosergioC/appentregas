@echo off
echo =========================================
echo Build para Netlify
echo =========================================
echo.

echo 1. Limpando build anterior...
if exist .next rmdir /s /q .next
if exist package-lock.json del package-lock.json

echo 2. Instalando dependencias...
call npm install

echo 3. Rodando build...
call npm run build

echo.
echo =========================================
echo Build concluido!
echo =========================================
echo.
echo Agora faca o deploy no Netlify:
echo 1. Acesse https://app.netlify.com
echo 2. Arraste a pasta .next para o Netlify Drop
echo    OU
echo 3. Conecte com GitHub para deploy automatico
echo.
