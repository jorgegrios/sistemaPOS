@echo off
echo Iniciando entorno local...

echo 1. Levantando Base de Datos y Redis (Docker)...
docker-compose up -d postgres redis



echo 2. Iniciando Backend (Servidor API)...
echo Espere a que la base de datos este lista antes de que el backend conecte.
echo Esperando 10 segundos para inicializacion de BD...
timeout /t 10
start "Sistema POS - Backend" cmd /k "cd backend && if not exist node_modules call npm install && npm run migrate:up && npm run dev"

echo 3. Iniciando Frontend (Interfaz Web)...
start "Sistema POS - Frontend" cmd /k "cd frontend && if not exist node_modules call npm install && npm run dev"

echo.
echo Todo iniciado!
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:5173
echo.
pause
