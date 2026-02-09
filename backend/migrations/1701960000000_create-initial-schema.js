/* eslint-disable camelcase */

exports.shapeValue = (value) => {
  return value;
};

exports.up = (pgm) => {
  // Enable pgcrypto extension
  // pgm.createExtension('pgcrypto', { ifNotExists: true });

  // Create payment_transactions table
  pgm.createTable('payment_transactions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    order_id: {
      type: 'uuid',
      notNull: true,
    },
    payment_method: {
      type: 'varchar(50)',
      notNull: true,
    },
    payment_provider: {
      type: 'varchar(50)',
    },
    amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    currency: {
      type: 'varchar(3)',
      default: 'USD',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
    },
    provider_transaction_id: {
      type: 'varchar(255)',
    },
    provider_response: {
      type: 'jsonb',
    },
    card_last4: {
      type: 'varchar(4)',
    },
    card_brand: {
      type: 'varchar(20)',
    },
    card_token: {
      type: 'varchar(255)',
    },
    terminal_id: {
      type: 'varchar(100)',
    },
    qr_code: {
      type: 'text',
    },
    qr_expires_at: {
      type: 'timestamp',
    },
    wallet_type: {
      type: 'varchar(50)',
    },
    ip_address: {
      type: 'inet',
    },
    user_agent: {
      type: 'text',
    },
    location: {
      type: 'point',
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

  // Indexes for payment_transactions
  pgm.createIndex('payment_transactions', ['order_id']);
  pgm.createIndex('payment_transactions', ['status']);
  pgm.createIndex('payment_transactions', ['payment_provider', 'provider_transaction_id']);
  pgm.createIndex('payment_transactions', [{ name: 'created_at', direction: 'DESC' }]);

  // Create orders table
  pgm.createTable('orders', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    order_number: {
      type: 'varchar(20)',
      unique: true,
      notNull: true,
    },
    table_id: {
      type: 'uuid',
    },
    waiter_id: {
      type: 'uuid',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    subtotal: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    tax: {
      type: 'numeric(10,2)',
      default: 0,
    },
    tip: {
      type: 'numeric(10,2)',
      default: 0,
    },
    discount: {
      type: 'numeric(10,2)',
      default: 0,
    },
    total: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    payment_status: {
      type: 'varchar(20)',
      default: 'pending',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    paid_at: {
      type: 'timestamp',
    },
  });

  pgm.createIndex('orders', ['order_number']);

  // Create payment_terminals table
  pgm.createTable('payment_terminals', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    terminal_id: {
      type: 'varchar(100)',
      unique: true,
      notNull: true,
    },
    provider: {
      type: 'varchar(50)',
      notNull: true,
    },
    device_type: {
      type: 'varchar(100)',
    },
    location_id: {
      type: 'uuid',
    },
    status: {
      type: 'varchar(20)',
      default: 'active',
    },
    last_seen_at: {
      type: 'timestamp',
    },
    metadata: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  // Create refunds table
  pgm.createTable('refunds', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    payment_transaction_id: {
      type: 'uuid',
      notNull: true,
      references: 'payment_transactions(id)',
    },
    amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    reason: {
      type: 'varchar(255)',
    },
    status: {
      type: 'varchar(20)',
      default: 'pending',
    },
    provider_refund_id: {
      type: 'varchar(255)',
    },
    provider_response: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    processed_at: {
      type: 'timestamp',
    },
  });

  pgm.createIndex('refunds', ['payment_transaction_id']);
  pgm.createIndex('refunds', ['status']);
};

exports.down = (pgm) => {
  pgm.dropTable('refunds', { ifExists: true });
  pgm.dropTable('payment_terminals', { ifExists: true });
  pgm.dropTable('orders', { ifExists: true });
  pgm.dropTable('payment_transactions', { ifExists: true });
  pgm.dropExtension('pgcrypto', { ifExists: true });
};
