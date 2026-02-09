
/* eslint-disable camelcase */

exports.up = (pgm) => {
    // 1. Create kitchen_stations table
    pgm.createTable('kitchen_stations', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        company_id: {
            type: 'uuid',
            notNull: true,
            references: 'companies(id)',
            onDelete: 'CASCADE',
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        printer_config: {
            type: 'jsonb',
            default: '{}',
        },
        is_default: {
            type: 'boolean',
            default: false
        },
        created_at: {
            type: 'timestamp',
            default: pgm.func('NOW()'),
        },
    });

    pgm.createIndex('kitchen_stations', ['company_id']);

    // 2. Create product_components table (splits a product into parts for different stations)
    pgm.createTable('product_components', {
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
        station_id: {
            type: 'uuid',
            notNull: true,
            references: 'kitchen_stations(id)',
            onDelete: 'CASCADE',
        },
        name: {
            type: 'varchar(255)', // e.g., "Carne", "Ensalada", "Postre"
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            default: pgm.func('NOW()'),
        },
    });

    pgm.createIndex('product_components', ['product_id']);
    pgm.createIndex('product_components', ['station_id']);

    // 3. Create kitchen_tasks table (actual work items in the kitchen)
    pgm.createTable('kitchen_tasks', {
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
        station_id: {
            type: 'uuid',
            notNull: true,
            references: 'kitchen_stations(id)',
            onDelete: 'CASCADE',
        },
        component_name: {
            type: 'varchar(255)',
            notNull: true,
        },
        status: {
            type: 'varchar(20)',
            default: 'pending',
            check: "status IN ('pending', 'sent', 'prepared', 'served', 'cancelled')",
        },
        created_at: {
            type: 'timestamp',
            default: pgm.func('NOW()'),
        },
        completed_at: {
            type: 'timestamp',
        },
    });

    pgm.createIndex('kitchen_tasks', ['order_item_id']);
    pgm.createIndex('kitchen_tasks', ['station_id']);
    pgm.createIndex('kitchen_tasks', ['status']);
};

exports.down = (pgm) => {
    pgm.dropTable('kitchen_tasks', { ifExists: true });
    pgm.dropTable('product_components', { ifExists: true });
    pgm.dropTable('kitchen_stations', { ifExists: true });
};
