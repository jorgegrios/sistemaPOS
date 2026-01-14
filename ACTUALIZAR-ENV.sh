#!/bin/bash

# Script para actualizar .env con la configuración correcta

cd /Users/juang/Documents/sistemaPOS/backend

# Verificar si .env existe
if [ ! -f .env ]; then
    echo "Creando archivo .env..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://juang@localhost:5432/pos_system

# Server Configuration
NODE_ENV=development
PORT=3000

# Security
JWT_SECRET=$(openssl rand -hex 32)

# CORS
CORS_ORIGIN=http://localhost:5173

# Printer Discovery
AUTO_DISCOVER_PRINTERS=true
PRINTER_DISCOVERY_INTERVAL=30
EOF
    echo "✅ Archivo .env creado"
else
    echo "Actualizando DATABASE_URL en .env..."
    
    # Backup
    cp .env .env.backup
    
    # Actualizar DATABASE_URL
    if grep -q "DATABASE_URL=" .env; then
        # Reemplazar línea existente
        sed -i.bak 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://juang@localhost:5432/pos_system|' .env
        rm -f .env.bak
        echo "✅ DATABASE_URL actualizado"
    else
        # Agregar si no existe
        echo "DATABASE_URL=postgresql://juang@localhost:5432/pos_system" >> .env
        echo "✅ DATABASE_URL agregado"
    fi
    
    echo "✅ Backup guardado en .env.backup"
fi

# Verificar conexión
echo ""
echo "🔍 Verificando conexión a la base de datos..."
if psql -U juang -d pos_system -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Conexión exitosa!"
else
    echo "⚠️  No se pudo conectar. Verifica que PostgreSQL esté corriendo."
fi

echo ""
echo "📝 Configuración actual:"
grep "DATABASE_URL" .env







