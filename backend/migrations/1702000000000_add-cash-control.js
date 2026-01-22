/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // 1. Create cash_sessions table
    pgm.createTable('cash_sessions', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        restaurant_id: {
            type: 'uuid',
            notNull: true,
        },
        user_id: {
            type: 'uuid',
            notNull: true,
        },
        opened_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('NOW()'),
        },
        closed_at: {
            type: 'timestamp',
        },
        opening_balance: {
            type: 'numeric(10,2)',
            notNull: true,
            default: 0,
        },
        expected_balance: {
            type: 'numeric(10,2)',
            notNull: true,
            default: 0,
        },
        actual_balance: {
            type: 'numeric(10,2)',
        },
        status: {
            type: 'varchar(20)',
            notNull: true,
            default: 'open',
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

    pgm.createIndex('cash_sessions', ['restaurant_id', 'status']);
    pgm.createIndex('cash_sessions', ['opened_at']);

    // 2. Create cash_movements table
    pgm.createTable('cash_movements', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        session_id: {
            type: 'uuid',
            notNull: true,
            references: 'cash_sessions(id)',
            onDelete: 'CASCADE',
        },
        type: {
            type: 'varchar(10)', // 'in' (income/ingreso), 'out' (expense/egreso)
            notNull: true,
        },
        amount: {
            type: 'numeric(10,2)',
            notNull: true,
        },
        description: {
            type: 'text',
        },
        created_at: {
            type: 'timestamp',
            default: pgm.func('NOW()'),
        },
    });

    pgm.createIndex('cash_movements', ['session_id']);

    // 3. Add session_id to payment_transactions for better tracking
    pgm.addColumn('payment_transactions', {
        session_id: {
            type: 'uuid',
            references: 'cash_sessions(id)',
        },
    });
};

exports.down = (pgm) => {
    pgm.dropColumn('payment_transactions', 'session_id');
    pgm.dropTable('cash_movements');
    pgm.dropTable('cash_sessions');
};
