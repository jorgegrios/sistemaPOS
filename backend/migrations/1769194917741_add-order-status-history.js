/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.createTable('order_status_history', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        order_id: {
            type: 'uuid',
            notNull: true,
            references: '"orders"',
            onDelete: 'CASCADE',
        },
        old_status: {
            type: 'varchar(50)',
            notNull: false, // Null for initial creation
        },
        new_status: {
            type: 'varchar(50)',
            notNull: true,
        },
        user_id: {
            type: 'uuid',
            notNull: false, // Might be system triggered in some cases
            references: '"users"',
        },
        company_id: {
            type: 'uuid',
            notNull: true,
            references: '"companies"',
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('CURRENT_TIMESTAMP'),
        },
    });

    pgm.createIndex('order_status_history', ['order_id']);
    pgm.createIndex('order_status_history', ['company_id']);
};

exports.down = (pgm) => {
    pgm.dropTable('order_status_history');
};
