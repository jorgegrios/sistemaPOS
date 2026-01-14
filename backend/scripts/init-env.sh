#!/bin/bash
# scripts/init-env.sh

set -e

echo "🔐 INICIALIZACIÓN SEGURA DE VARIABLES DE ENTORNO"

# Crear directorio para logs
mkdir -p logs

# Copiar template si no existe .env
if [ ! -f "backend/.env" ]; then
    echo "Creando .env desde template..."
    cp backend/.env.example backend/.env
    
    echo ""
    echo "⚠️  IMPORTANTE: Edita backend/.env con tus valores reales"
    echo "   Los valores en .env.example son solo placeholders"
    echo ""
fi

# Cargar valores por defecto
if [ -f ".env.defaults" ]; then
    echo "Cargando valores por defecto..."
    export $(grep -v '^#' .env.defaults | xargs)
fi

# Generar passwords si no existen en .env
if ! grep -q "DB_PASSWORD" backend/.env; then
    DB_PASS="pos_$(openssl rand -hex 8)"
    echo "Generando DB_PASSWORD..."
    echo "DB_PASSWORD=${DB_PASS}" >> backend/.env
    sed -i "s|postgresql://pos:pospass@postgres:5432/pos_dev|postgresql://pos_user:${DB_PASS}@postgres:5432/pos_dev|" backend/.env
fi

if ! grep -q "JWT_ACCESS_SECRET" backend/.env; then
    JWT_ACCESS="$(openssl rand -base64 32 | tr -d '\n')"
    JWT_REFRESH="$(openssl rand -base64 32 | tr -d '\n')"
    echo "Generando JWT secrets..."
    echo "JWT_ACCESS_SECRET=${JWT_ACCESS}" >> backend/.env
    echo "JWT_REFRESH_SECRET=${JWT_REFRESH}" >> backend/.env
fi

if ! grep -q "REDIS_PASSWORD" backend/.env; then
    REDIS_PASS="redis_$(openssl rand -hex 8)"
    echo "Generando REDIS_PASSWORD..."
    echo "REDIS_PASSWORD=${REDIS_PASS}" >> backend/.env
    sed -i "s|redis://redis:6379|redis://:${REDIS_PASS}@redis:6379/0|" backend/.env
fi

echo ""
echo "✅ Configuración completada"
echo "📁 Archivos creados/modificados:"
echo "   - backend/.env (con valores generados)"
echo "   - logs/ (directorio para logs)"
echo ""
echo "🚀 Para iniciar: docker-compose up -d"
echo ""