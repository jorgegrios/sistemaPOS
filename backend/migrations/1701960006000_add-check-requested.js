/**
 * Migration: Add check_requested_at to orders table
 * This field tracks when a waiter requests the check (bill) for a table
 */

exports.up = (pgm) => {
  pgm.addColumn('orders', {
    check_requested_at: {
      type: 'timestamp',
      notNull: false,
    },
  });

  pgm.createIndex('orders', ['check_requested_at'], {
    where: 'check_requested_at IS NOT NULL',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('orders', ['check_requested_at'], {
    ifExists: true,
  });
  pgm.dropColumn('orders', 'check_requested_at');
};






