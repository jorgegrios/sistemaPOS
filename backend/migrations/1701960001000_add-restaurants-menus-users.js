/* eslint-disable camelcase */

exports.shapeValue = (value) => {
  return value;
};

exports.up = (pgm) => {
  // Create restaurants table
  pgm.createTable('restaurants', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    address: {
      type: 'text',
    },
    phone: {
      type: 'varchar(20)',
    },
    email: {
      type: 'varchar(255)',
    },
    timezone: {
      type: 'varchar(50)',
      default: 'America/Los_Angeles',
    },
    logo_url: {
      type: 'text',
    },
    config: {
      type: 'jsonb',
      default: pgm.func("'{}'::jsonb"),
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  // Create menus table
  pgm.createTable('menus', {
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
    description: {
      type: 'text',
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('menus', ['restaurant_id']);

  // Create menu_categories table
  pgm.createTable('menu_categories', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    menu_id: {
      type: 'uuid',
      notNull: true,
      references: 'menus(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    display_order: {
      type: 'integer',
      default: 0,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('menu_categories', ['menu_id']);

  // Create menu_items table
  pgm.createTable('menu_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    category_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_categories(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    image_url: {
      type: 'text',
    },
    available: {
      type: 'boolean',
      default: true,
    },
    display_order: {
      type: 'integer',
      default: 0,
    },
    metadata: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('menu_items', ['category_id']);

  // Create order_items table (line items in orders)
  pgm.createTable('order_items', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    order_id: {
      type: 'uuid',
      notNull: true,
      references: 'orders(id)',
      onDelete: 'CASCADE',
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    quantity: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('order_items', ['order_id']);

  // Create tables table (dining tables)
  pgm.createTable('tables', {
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
    table_number: {
      type: 'varchar(20)',
      notNull: true,
    },
    capacity: {
      type: 'integer',
      default: 4,
    },
    status: {
      type: 'varchar(20)',
      default: 'available',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('tables', ['restaurant_id']);

  // Create users table
  pgm.createTable('users', {
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
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      default: 'waiter',
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    last_login: {
      type: 'timestamp',
    },
  });

  pgm.createIndex('users', ['restaurant_id']);
  pgm.createIndex('users', ['email']);
};

exports.down = (pgm) => {
  pgm.dropTable('users', { ifExists: true });
  pgm.dropTable('tables', { ifExists: true });
  pgm.dropTable('order_items', { ifExists: true });
  pgm.dropTable('menu_items', { ifExists: true });
  pgm.dropTable('menu_categories', { ifExists: true });
  pgm.dropTable('menus', { ifExists: true });
  pgm.dropTable('restaurants', { ifExists: true });
};
