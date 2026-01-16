/* eslint-disable camelcase */
/**
 * Migration: Offline-First Support
 * Adds deleted_at (Soft Deletes) and updated_at (Sync) to all core tables
 */

exports.up = (pgm) => {
    // Config for all tables needing offline sync support
    const tables = [
        'restaurants',
        'menus',
        'menu_categories',
        'menu_items',
        'modifiers',
        'product_modifiers',
        'tables',
        'users',
        'orders',
        'order_items',
        'order_item_modifiers',
        'payment_transactions',
        'refunds'
        // 'payment_terminals' - omitted as it's hardware state, usually realtime
    ];

    // 1. Create a function to auto-update updated_at if not exists
    pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

    tables.forEach(table => {
        // Add deleted_at for Soft Deletes
        pgm.addColumn(table, {
            deleted_at: {
                type: 'timestamp',
                default: null
            }
        }, { ifNotExists: true });

        // Add updated_at for Delta Sync (if not exists)
        // Most tables already have created_at, but we need updated_at for modification tracking
        pgm.addColumn(table, {
            updated_at: {
                type: 'timestamp',
                default: pgm.func('NOW()')
            }
        }, { ifNotExists: true });

        // Add index on updated_at for fast sync queries
        pgm.createIndex(table, ['updated_at'], { ifNotExists: true });

        // Add trigger for auto-updating updated_at
        pgm.createTrigger(table, 'update_updated_at_timestamp', {
            when: 'BEFORE',
            operation: 'UPDATE',
            level: 'ROW',
            function: 'update_updated_at_column',
            replace: true // Replaces if exists
        });
    });

    // Special case: Add last_synced_at to orders for audit
    pgm.addColumn('orders', {
        last_synced_at: {
            type: 'timestamp'
        }
    }, { ifNotExists: true });
};

exports.down = (pgm) => {
    const tables = [
        'restaurants',
        'menus',
        'menu_categories',
        'menu_items',
        'modifiers',
        'product_modifiers',
        'tables',
        'users',
        'orders',
        'order_items',
        'order_item_modifiers',
        'payment_transactions',
        'refunds'
    ];

    pgm.dropColumn('orders', 'last_synced_at', { ifExists: true });

    tables.forEach(table => {
        pgm.dropTrigger(table, 'update_updated_at_timestamp', { ifExists: true });
        pgm.dropIndex(table, ['updated_at'], { ifExists: true });
        pgm.dropColumn(table, 'updated_at', { ifExists: true });
        pgm.dropColumn(table, 'deleted_at', { ifExists: true });
    });

    pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE');
};
