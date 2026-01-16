/* eslint-disable camelcase */
/**
 * Migration: Split Checks Support
 * Adds seat_number and split_group_id to order_items
 */

exports.up = (pgm) => {
    // 1. Add seat_number to order_items
    pgm.addColumn('order_items', {
        seat_number: {
            type: 'integer',
            default: 1,
            notNull: true
        },
        // Optional: For complex merges/splits where items share a "bill" distinct from seat
        split_group_id: {
            type: 'uuid',
            default: null
        }
    }, { ifNotExists: true });

    // Index for quick retrieval of items for a specific seat (e.g., "Print Bill for Seat 1")
    pgm.createIndex('order_items', ['order_id', 'seat_number'], { ifNotExists: true });
};

exports.down = (pgm) => {
    pgm.dropIndex('order_items', ['order_id', 'seat_number'], { ifExists: true });
    pgm.dropColumn('order_items', 'split_group_id', { ifExists: true });
    pgm.dropColumn('order_items', 'seat_number', { ifExists: true });
};
