/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create restaurant_config table for storing configuration like cash register base
  pgm.createTable('restaurant_config', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
    },
    key: {
      type: 'varchar(100)',
      notNull: true,
    },
    value: {
      type: 'text',
      notNull: true,
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

  pgm.createIndex('restaurant_config', ['restaurant_id', 'key'], { unique: true });
};

exports.down = (pgm) => {
  pgm.dropTable('restaurant_config', { ifExists: true });
};







