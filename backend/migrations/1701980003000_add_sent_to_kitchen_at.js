/**
 * Add sent_to_kitchen_at to orders table
 */

exports.up = (pgm) => {
    pgm.addColumn('orders', {
        sent_to_kitchen_at: { type: 'timestamp' }
    });
};

exports.down = (pgm) => {
    pgm.dropColumn('orders', 'sent_to_kitchen_at');
};
