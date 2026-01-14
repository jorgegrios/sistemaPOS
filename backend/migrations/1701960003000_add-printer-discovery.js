/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create printer_configs table for auto-configured printers
  pgm.createTable('printer_configs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    type: {
      type: 'varchar(20)',
      notNull: true,
      unique: true,
    },
    interface: {
      type: 'varchar(255)',
      notNull: true,
    },
    ip: {
      type: 'varchar(45)',
      notNull: true,
    },
    port: {
      type: 'integer',
      notNull: true,
    },
    printer_type: {
      type: 'varchar(50)',
    },
    name: {
      type: 'varchar(255)',
    },
    status: {
      type: 'varchar(20)',
      default: 'active',
    },
    auto_discovered: {
      type: 'boolean',
      default: true,
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

  pgm.createIndex('printer_configs', ['type']);
  pgm.createIndex('printer_configs', ['status']);

  // Create discovered_printers table for tracking all discovered printers
  pgm.createTable('discovered_printers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    ip: {
      type: 'varchar(45)',
      notNull: true,
    },
    port: {
      type: 'integer',
      notNull: true,
    },
    type: {
      type: 'varchar(20)',
    },
    printer_type: {
      type: 'varchar(50)',
    },
    name: {
      type: 'varchar(255)',
    },
    interface: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    status: {
      type: 'varchar(20)',
      default: 'online',
    },
    last_seen: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
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

  pgm.createIndex('discovered_printers', ['interface']);
  pgm.createIndex('discovered_printers', ['status']);
  pgm.createIndex('discovered_printers', ['last_seen']);
};

exports.down = (pgm) => {
  pgm.dropTable('discovered_printers', { ifExists: true });
  pgm.dropTable('printer_configs', { ifExists: true });
};








