/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create suppliers table
  pgm.createTable('suppliers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    contact_name: {
      type: 'varchar(255)',
    },
    email: {
      type: 'varchar(255)',
    },
    phone: {
      type: 'varchar(20)',
    },
    address: {
      type: 'text',
    },
    tax_id: {
      type: 'varchar(50)',
    },
    payment_terms: {
      type: 'varchar(100)',
    },
    active: {
      type: 'boolean',
      default: true,
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('suppliers', ['restaurant_id']);
  pgm.createIndex('suppliers', ['active']);

  // Create inventory_items table (products/ingredients)
  pgm.createTable('inventory_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    sku: {
      type: 'varchar(100)',
      unique: true,
    },
    category: {
      type: 'varchar(100)',
    },
    unit: {
      type: 'varchar(50)',
      notNull: true,
      default: 'unit',
    }, // unit, kg, liter, box, etc.
    current_stock: {
      type: 'numeric(10,2)',
      notNull: true,
      default: 0,
    },
    min_stock: {
      type: 'numeric(10,2)',
      default: 0,
    },
    max_stock: {
      type: 'numeric(10,2)',
    },
    reorder_point: {
      type: 'numeric(10,2)',
    },
    cost_per_unit: {
      type: 'numeric(10,2)',
      default: 0,
    },
    supplier_id: {
      type: 'uuid',
      references: 'suppliers(id)',
    },
    location: {
      type: 'varchar(255)',
    }, // warehouse, kitchen, bar, etc.
    active: {
      type: 'boolean',
      default: true,
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('inventory_items', ['restaurant_id']);
  pgm.createIndex('inventory_items', ['sku']);
  pgm.createIndex('inventory_items', ['category']);
  pgm.createIndex('inventory_items', ['supplier_id']);
  pgm.createIndex('inventory_items', ['active']);

  // Create inventory_movements table (stock adjustments)
  pgm.createTable('inventory_movements', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    inventory_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'inventory_items(id)',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
    }, // purchase, sale, adjustment, transfer, waste, return
    quantity: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    unit_cost: {
      type: 'numeric(10,2)',
    },
    reference_type: {
      type: 'varchar(50)',
    }, // purchase_order, order, adjustment, etc.
    reference_id: {
      type: 'uuid',
    },
    user_id: {
      type: 'uuid',
      references: 'users(id)',
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('inventory_movements', ['inventory_item_id']);
  pgm.createIndex('inventory_movements', ['type']);
  pgm.createIndex('inventory_movements', ['reference_type', 'reference_id']);
  pgm.createIndex('inventory_movements', ['created_at']);

  // Create purchase_orders table
  pgm.createTable('purchase_orders', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    order_number: {
      type: 'varchar(50)',
      unique: true,
      notNull: true,
    },
    supplier_id: {
      type: 'uuid',
      notNull: true,
      references: 'suppliers(id)',
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'draft',
    }, // draft, sent, confirmed, received, cancelled
    subtotal: {
      type: 'numeric(10,2)',
      default: 0,
    },
    tax: {
      type: 'numeric(10,2)',
      default: 0,
    },
    total: {
      type: 'numeric(10,2)',
      default: 0,
    },
    expected_delivery_date: {
      type: 'date',
    },
    received_at: {
      type: 'timestamp',
    },
    created_by: {
      type: 'uuid',
      references: 'users(id)',
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('purchase_orders', ['restaurant_id']);
  pgm.createIndex('purchase_orders', ['supplier_id']);
  pgm.createIndex('purchase_orders', ['status']);
  pgm.createIndex('purchase_orders', ['order_number']);

  // Create purchase_order_items table
  pgm.createTable('purchase_order_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    purchase_order_id: {
      type: 'uuid',
      notNull: true,
      references: 'purchase_orders(id)',
      onDelete: 'CASCADE',
    },
    inventory_item_id: {
      type: 'uuid',
      references: 'inventory_items(id)',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    quantity: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    unit: {
      type: 'varchar(50)',
      notNull: true,
    },
    unit_cost: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    received_quantity: {
      type: 'numeric(10,2)',
      default: 0,
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('purchase_order_items', ['purchase_order_id']);
  pgm.createIndex('purchase_order_items', ['inventory_item_id']);

  // Link menu_items to inventory_items (recipe/ingredients)
  pgm.createTable('menu_item_ingredients', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    inventory_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'inventory_items(id)',
      onDelete: 'CASCADE',
    },
    quantity: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    unit: {
      type: 'varchar(50)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('menu_item_ingredients', ['menu_item_id']);
  pgm.createIndex('menu_item_ingredients', ['inventory_item_id']);

  // Add user management improvements
  pgm.addColumn('users', {
    phone: {
      type: 'varchar(20)',
    },
    avatar_url: {
      type: 'text',
    },
    permissions: {
      type: 'jsonb',
      default: pgm.func("'{}'::jsonb"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('menu_item_ingredients', { ifExists: true });
  pgm.dropTable('purchase_order_items', { ifExists: true });
  pgm.dropTable('purchase_orders', { ifExists: true });
  pgm.dropTable('inventory_movements', { ifExists: true });
  pgm.dropTable('inventory_items', { ifExists: true });
  pgm.dropTable('suppliers', { ifExists: true });
  pgm.dropColumn('users', 'phone', { ifExists: true });
  pgm.dropColumn('users', 'avatar_url', { ifExists: true });
  pgm.dropColumn('users', 'permissions', { ifExists: true });
};








