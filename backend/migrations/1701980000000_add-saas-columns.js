/* eslint-disable camelcase */
/**
 * Migration: SaaS Multi-tenancy Support
 * Adds restaurant_id to critical tables to enable tenant isolation
 */

exports.up = (pgm) => {
  // 1. Add restaurant_id to orders
  // Using nullable first to avoid locking if table is large, but for migration simplicity we'll assume new/dev env
  // Ideally this would be: 1. Add nullable, 2. Backfill, 3. Make not null
  // We will add it as nullable first, then users can backfill if needed, we won't force not null on existing data without a default
  
  pgm.addColumn('orders', {
    restaurant_id: {
      type: 'uuid',
      references: 'restaurants(id)',
      onDelete: 'CASCADE', // If restaurant is deleted, delete its orders
    }
  }, { ifNotExists: true });

  // Index for quick filtering by restaurant
  pgm.createIndex('orders', ['restaurant_id'], { ifNotExists: true });

  // 2. Add restaurant_id to payment_transactions
  pgm.addColumn('payment_transactions', {
    restaurant_id: {
      type: 'uuid',
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    }
  }, { ifNotExists: true });

  pgm.createIndex('payment_transactions', ['restaurant_id'], { ifNotExists: true });

  // 3. Add restaurant_id to refunds
  pgm.addColumn('refunds', {
    restaurant_id: {
      type: 'uuid',
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    }
  }, { ifNotExists: true });

  pgm.createIndex('refunds', ['restaurant_id'], { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropIndex('refunds', ['restaurant_id'], { ifExists: true });
  pgm.dropColumn('refunds', 'restaurant_id', { ifExists: true });

  pgm.dropIndex('payment_transactions', ['restaurant_id'], { ifExists: true });
  pgm.dropColumn('payment_transactions', 'restaurant_id', { ifExists: true });

  pgm.dropIndex('orders', ['restaurant_id'], { ifExists: true });
  pgm.dropColumn('orders', 'restaurant_id', { ifExists: true });
};
