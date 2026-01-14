/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create kitchen_tickets table for tracking printed tickets
  pgm.createTable('kitchen_tickets', {
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
    ticket_type: {
      type: 'varchar(20)',
      notNull: true,
      check: "ticket_type IN ('kitchen', 'bar')",
    },
    content: {
      type: 'jsonb',
      notNull: true,
    },
    status: {
      type: 'varchar(20)',
      default: 'printed',
      check: "status IN ('printed', 'completed', 'cancelled')",
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    completed_at: {
      type: 'timestamp',
    },
  });

  pgm.createIndex('kitchen_tickets', ['order_id']);
  pgm.createIndex('kitchen_tickets', ['ticket_type']);
  pgm.createIndex('kitchen_tickets', ['status']);
  pgm.createIndex('kitchen_tickets', ['created_at']);

  // Add metadata column to menu_categories if it doesn't exist
  // This allows categorizing items as kitchen vs bar
  pgm.addColumn('menu_categories', {
    metadata: {
      type: 'jsonb',
      default: pgm.func("'{}'::jsonb"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('kitchen_tickets', { ifExists: true });
  pgm.dropColumn('menu_categories', 'metadata', { ifExists: true });
};








