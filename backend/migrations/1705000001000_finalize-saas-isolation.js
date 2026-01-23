/* eslint-disable camelcase */

exports.up = (pgm) => {
    // 1. Add company_id to menu_categories
    pgm.addColumn('menu_categories', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    }, { ifNotExists: true });
    pgm.createIndex('menu_categories', ['company_id'], { ifNotExists: true });

    // 2. Add company_id to menu_items
    pgm.addColumn('menu_items', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    }, { ifNotExists: true });
    pgm.createIndex('menu_items', ['company_id'], { ifNotExists: true });

    // 3. Add company_id to modifiers
    pgm.addColumn('modifiers', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    }, { ifNotExists: true });
    pgm.createIndex('modifiers', ['company_id'], { ifNotExists: true });

    // 5. Add company_id to product_modifiers
    pgm.addColumn('product_modifiers', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    }, { ifNotExists: true });
    pgm.createIndex('product_modifiers', ['company_id'], { ifNotExists: true });

    // 6. Add company_id to order_items
    pgm.addColumn('order_items', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    }, { ifNotExists: true });
    pgm.createIndex('order_items', ['company_id'], { ifNotExists: true });

    // 7. Add company_id to inventory_movements
    pgm.addColumn('inventory_movements', {
        company_id: {
            type: 'uuid',
            references: 'companies(id)',
            onDelete: 'CASCADE',
        }
    }, { ifNotExists: true });
    pgm.createIndex('inventory_movements', ['company_id'], { ifNotExists: true });
};

exports.down = (pgm) => {
    const tables = [
        'inventory_movements',
        'order_items',
        'product_modifiers',
        'modifiers',
        'menu_items',
        'menu_categories'
    ];

    for (const table of tables) {
        pgm.dropIndex(table, ['company_id'], { ifExists: true });
        pgm.dropColumn(table, 'company_id', { ifExists: true });
    }
};
