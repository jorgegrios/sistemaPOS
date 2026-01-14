/* eslint-disable camelcase */
/**
 * Migración: Reestructuración a especificación ALDELO
 * Alinea el modelo de datos exactamente con las especificaciones del prompt
 * REGLAS INQUEBRANTABLES: Idempotencia Total, SSOT
 */

exports.up = (pgm) => {
  // ============================================
  // 1. ACTUALIZAR TABLA ORDERS - Estados requeridos
  // ============================================
  
  // Estados requeridos: draft, sent_to_kitchen, served, closed, cancelled
  // Actualizar estados existentes
  pgm.sql(`
    UPDATE orders 
    SET status = CASE 
      WHEN status = 'pending' AND payment_status = 'pending' THEN 'draft'
      WHEN status = 'pending' AND payment_status = 'paid' THEN 'closed'
      WHEN status = 'completed' THEN 'closed'
      WHEN status = 'cancelled' THEN 'cancelled'
      ELSE status
    END
    WHERE status IN ('pending', 'completed', 'cancelled');
  `);
  
  // Cambiar el default
  pgm.alterColumn('orders', 'status', {
    type: 'varchar(20)',
    default: 'draft',
    notNull: true
  });

  // ============================================
  // 2. ACTUALIZAR TABLA ORDER_ITEMS - Agregar campos requeridos
  // ============================================
  
  // Agregar product_id (además de menu_item_id para compatibilidad)
  pgm.addColumn('order_items', {
    product_id: {
      type: 'uuid',
      references: 'menu_items(id)'
    },
    status: {
      type: 'varchar(20)',
      default: 'pending'
    }
  }, { ifNotExists: true });
  
  // Copiar menu_item_id a product_id
  pgm.sql(`
    UPDATE order_items 
    SET product_id = menu_item_id 
    WHERE product_id IS NULL;
  `);
  
  // Inicializar status basado en order status
  pgm.sql(`
    UPDATE order_items oi
    SET status = CASE 
      WHEN o.status = 'sent_to_kitchen' THEN 'sent'
      WHEN o.status = 'served' THEN 'served'
      WHEN o.status = 'closed' THEN 'served'
      ELSE 'pending'
    END
    FROM orders o
    WHERE oi.order_id = o.id;
  `);
  
  // Agregar índices para status (necesario para KDS)
  pgm.createIndex('order_items', ['status'], { ifNotExists: true });
  pgm.createIndex('order_items', ['order_id', 'status'], { ifNotExists: true });

  // ============================================
  // 3. ACTUALIZAR TABLA PRODUCTS (menu_items) - Agregar base_price
  // ============================================
  
  // Agregar base_price (adicional a price para compatibilidad)
  pgm.addColumn('menu_items', {
    base_price: {
      type: 'numeric(10,2)'
    }
  }, { ifNotExists: true });
  
  // Inicializar base_price desde price
  pgm.sql(`
    UPDATE menu_items 
    SET base_price = price 
    WHERE base_price IS NULL;
  `);
  
  // Asegurar que base_price no sea null
  pgm.alterColumn('menu_items', 'base_price', {
    notNull: true
  });

  // ============================================
  // 4. CREAR TABLA MODIFIERS (nueva)
  // ============================================
  
  pgm.createTable('modifiers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    price_delta: {
      type: 'numeric(10,2)',
      notNull: true,
      default: 0,
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  }, { ifNotExists: true });
  
  // Tabla de relación: product_modifiers (many-to-many)
  pgm.createTable('product_modifiers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    modifier_id: {
      type: 'uuid',
      notNull: true,
      references: 'modifiers(id)',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  }, { ifNotExists: true });
  
  pgm.createIndex('product_modifiers', ['product_id'], { ifNotExists: true });
  pgm.createIndex('product_modifiers', ['modifier_id'], { ifNotExists: true });
  
  // Tabla: order_item_modifiers (modificadores aplicados a un order_item)
  pgm.createTable('order_item_modifiers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    order_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'order_items(id)',
      onDelete: 'CASCADE',
    },
    modifier_id: {
      type: 'uuid',
      notNull: true,
      references: 'modifiers(id)',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    price_delta: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  }, { ifNotExists: true });
  
  pgm.createIndex('order_item_modifiers', ['order_item_id'], { ifNotExists: true });

  // ============================================
  // 5. ACTUALIZAR TABLA TABLES - Estados y nombre
  // ============================================
  
  // Agregar columna 'name'
  pgm.addColumn('tables', {
    name: {
      type: 'varchar(255)'
    }
  }, { ifNotExists: true });
  
  // Inicializar name desde table_number
  pgm.sql(`
    UPDATE tables 
    SET name = table_number 
    WHERE name IS NULL;
  `);
  
  // Cambiar status de 'available' a 'free'
  pgm.sql(`
    UPDATE tables 
    SET status = CASE 
      WHEN status = 'available' THEN 'free'
      WHEN status IN ('active', 'in_use') THEN 'occupied'
      ELSE status
    END;
  `);

  // ============================================
  // 8. CONSTRAINTS Y VALIDACIONES
  // ============================================
  
  // Constraint para order_items.status
  pgm.sql(`
    ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS order_items_status_check;
  `);
  
  pgm.sql(`
    ALTER TABLE order_items 
    ADD CONSTRAINT order_items_status_check 
    CHECK (status IN ('pending', 'sent', 'prepared', 'served'));
  `);
  
  // Constraint para orders.status
  pgm.sql(`
    ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS orders_status_check;
  `);
  
  pgm.sql(`
    ALTER TABLE orders 
    ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('draft', 'sent_to_kitchen', 'served', 'closed', 'cancelled'));
  `);
  
  // Constraint para tables.status
  pgm.sql(`
    ALTER TABLE tables 
    DROP CONSTRAINT IF EXISTS tables_status_check;
  `);
  
  pgm.sql(`
    ALTER TABLE tables 
    ADD CONSTRAINT tables_status_check 
    CHECK (status IN ('free', 'occupied', 'reserved'));
  `);

  // ============================================
  // 9. ÍNDICES PARA RENDIMIENTO Y FLUJOS
  // ============================================
  
  // Índice para búsqueda de órdenes activas por mesa (idempotencia: una mesa = una orden activa)
  // Nota: Índices parciales con WHERE no están directamente soportados, usamos índice normal
  pgm.createIndex('orders', ['table_id', 'status'], { 
    ifNotExists: true
  });
  
  // Índice para KDS: order_items con status 'sent'
  pgm.createIndex('order_items', ['status', 'created_at'], {
    ifNotExists: true
  });
};

exports.down = (pgm) => {
  // Revertir cambios (idempotente - puede ejecutarse múltiples veces)
  
  // Eliminar índices
  pgm.dropIndex('order_items', ['status', 'created_at'], { ifExists: true });
  pgm.dropIndex('orders', ['table_id', 'status'], { ifExists: true });
  pgm.dropIndex('order_items', ['order_id', 'status'], { ifExists: true });
  pgm.dropIndex('order_items', ['status'], { ifExists: true });
  pgm.dropIndex('order_item_modifiers', ['order_item_id'], { ifExists: true });
  pgm.dropIndex('product_modifiers', ['modifier_id'], { ifExists: true });
  pgm.dropIndex('product_modifiers', ['product_id'], { ifExists: true });
  
  // Eliminar constraints
  pgm.sql(`
    ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS order_items_status_check;
  `);
  
  pgm.sql(`
    ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS orders_status_check;
  `);
  
  pgm.sql(`
    ALTER TABLE tables 
    DROP CONSTRAINT IF EXISTS tables_status_check;
  `);
  
  // Eliminar tablas nuevas
  pgm.dropTable('order_item_modifiers', { ifExists: true, cascade: true });
  pgm.dropTable('product_modifiers', { ifExists: true, cascade: true });
  pgm.dropTable('modifiers', { ifExists: true, cascade: true });
  
  // Eliminar columnas agregadas
  pgm.dropColumn('order_items', 'status', { ifExists: true });
  pgm.dropColumn('order_items', 'product_id', { ifExists: true });
  pgm.dropColumn('menu_items', 'base_price', { ifExists: true });
  pgm.dropColumn('tables', 'name', { ifExists: true });
  
  // Revertir status defaults
  pgm.alterColumn('orders', 'status', {
    default: 'pending'
  });
};
