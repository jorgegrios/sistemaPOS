#!/bin/bash

# Script de inicio rápido para sistemaPOS
# Uso: ./iniciar.sh

set -e

echo "🚀 Iniciando sistemaPOS..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️  Se recomienda Node.js 20 o superior${NC}"
fi

echo -e "${GREEN}✅ Node.js encontrado: $(node -v)${NC}"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL no encontrado. Asegúrate de tenerlo instalado.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL encontrado${NC}"
fi

# Verificar si existe .env en backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  No se encontró backend/.env${NC}"
    echo "Creando archivo .env de ejemplo..."
    cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_system

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=$(openssl rand -hex 32)

# CORS
CORS_ORIGIN=http://localhost:5173

# Printer Discovery
AUTO_DISCOVER_PRINTERS=true
EOF
    echo -e "${GREEN}✅ Archivo backend/.env creado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edita backend/.env con tus credenciales reales${NC}"
fi

# Verificar si existe .env en frontend
if [ ! -f "frontend/.env" ]; then
    echo "Creando archivo frontend/.env..."
    echo "VITE_API_URL=http://localhost:3000" > frontend/.env
    echo -e "${GREEN}✅ Archivo frontend/.env creado${NC}"
fi

# Instalar dependencias si no existen
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "📦 Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo ""
    echo "📦 Instalando dependencias del frontend..."
    cd frontend && npm install && cd ..
fi

# Verificar base de datos
echo ""
echo "🔍 Verificando base de datos..."
if psql -lqt | cut -d \| -f 1 | grep -qw pos_system; then
    echo -e "${GREEN}✅ Base de datos 'pos_system' existe${NC}"
else
    echo -e "${YELLOW}⚠️  Base de datos 'pos_system' no existe${NC}"
    echo "Creando base de datos..."
    createdb pos_system 2>/dev/null || echo -e "${RED}❌ Error al crear base de datos. Créala manualmente: createdb pos_system${NC}"
fi

# Ejecutar migraciones
echo ""
echo "🔄 Ejecutando migraciones..."
cd backend
npm run migrate:up 2>/dev/null || echo -e "${YELLOW}⚠️  Error al ejecutar migraciones. Ejecuta manualmente: npm run migrate:up${NC}"
cd ..

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo "Para iniciar la aplicación:"
echo ""
echo "  Terminal 1 - Backend:"
echo "    cd backend && npm run dev"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd frontend && npm run dev"
echo ""
echo "Luego abre: http://localhost:5173"
echo ""








