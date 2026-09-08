@echo off
cd /d "%~dp0"
echo Iniciando la app de Gestion de Prestamos...

if not exist "node_modules" (
    echo Instalando dependencias, esto puede tardar un momento...
    call npm install
)

start "Servidor - Gestion de Prestamos" cmd /c "npm run dev"

echo Esperando a que el servidor inicie...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo La app se abrio en tu navegador. No cierres la ventana del servidor mientras la uses.
pause
