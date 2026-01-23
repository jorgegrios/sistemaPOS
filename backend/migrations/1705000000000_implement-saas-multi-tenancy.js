/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // 1. Create companies table
    pgm.createTable('companies', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        slug: {
            type: 'varchar(255)',
            notNull: true,
            unique: true,
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

    pgm.createIndex('companies', ['slug']);

    // 2. Add company_id to restaurants (branches)
    pgm.addColumn('restaurants', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    });

    pgm.createIndex('restaurants', ['company_id']);

    // 3. Add company_id to users and update unique constraint
    pgm.addColumn('users', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    });

    // Remove the global unique constraint on email
    pgm.dropConstraint('users', 'users_email_key');

    // Add composite unique constraint (email + company_id)
    pgm.addConstraint('users', 'users_email_company_idx', {
        unique: ['email', 'company_id']
    });

    pgm.createIndex('users', ['company_id']);

    // 4. Add company_id to core transaction tables for strict isolation
    const isolatedTables = [
        'orders',
        'payment_transactions',
        'refunds',
        'menus',
        'tables',
        'inventory_items',
        'purchase_orders',
        'cash_sessions'
    ];

    for (const table of isolatedTables) {
        pgm.addColumn(table, {
            company_id: {
                type: 'uuid',
                references: 'companies(id)',
                onDelete: 'CASCADE',
            }
        });
        pgm.createIndex(table, ['company_id']);
    }
};

exports.down = (pgm) => {
    const isolatedTables = [
        'cash_sessions',
        'purchase_orders',
        'inventory_items',
        'tables',
        'menus',
        'refunds',
        'payment_transactions',
        'orders'
    ];

    for (const table of isolatedTables) {
        pgm.dropIndex(table, ['company_id']);
        pgm.dropColumn(table, 'company_id');
    }

    pgm.dropConstraint('users', 'users_email_company_idx');
    pgm.addConstraint('users', 'users_email_key', { unique: ['email'] });
    pgm.dropColumn('users', 'company_id');

    pgm.dropColumn('restaurants', 'company_id');
    pgm.dropTable('companies');
};
