# 🔧 Configuración de Base de Datos - macOS

## Problema: "role postgres does not exist"

En macOS, PostgreSQL generalmente usa tu nombre de usuario del sistema como usuario por defecto, no "postgres".

## Solución

### 1. Identificar tu Usuario de PostgreSQL

```bash
whoami
# Resultado: juang (en tu caso)
```

### 2. Actualizar `backend/.env`

Edita `backend/.env` y cambia la línea `DATABASE_URL`:

**❌ Incorrecto:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/pos_system
```

**✅ Correcto (sin contraseña):**
```bash
DATABASE_URL=postgresql://juang@localhost:5432/pos_system
```

**✅ Correcto (con contraseña si la configuraste):**
```bash
DATABASE_URL=postgresql://juang:tu_password@localhost:5432/pos_system
```

### 3. Verificar Conexión

```bash
# Probar conexión
psql -U juang -d pos_system -c "SELECT 1;"
```

### 4. Ejecutar Migraciones

```bash
cd backend
npm run migrate:up
```

---

## Crear Usuario "postgres" (Opcional)

Si prefieres usar "postgres" como usuario:

```bash
# Conectar como superusuario
psql -U juang -d postgres

# Crear rol postgres
CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'tu_password';

# Salir
\q
```

Luego actualiza `DATABASE_URL`:
```bash
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/pos_system
```

---

## Verificar Estado Actual

```bash
# Ver bases de datos
psql -U juang -l

# Verificar que pos_system existe
psql -U juang -d pos_system -c "\dt"
```

---

## Tu Configuración Actual

- **Usuario PostgreSQL**: `juang`
- **Base de datos**: `pos_system` (ya existe ✅)
- **Puerto**: `5432` (default)

**URL de conexión correcta:**
```
postgresql://juang@localhost:5432/pos_system
```







