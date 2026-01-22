/* eslint-disable camelcase */

exports.up = (pgm) => {
    // Update order_items_status_check to include 'cancelled'
    pgm.sql(`
    ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS order_items_status_check;
  `);

    pgm.sql(`
    ALTER TABLE order_items 
    ADD CONSTRAINT order_items_status_check 
    CHECK (status IN ('pending', 'sent', 'prepared', 'served', 'cancelled'));
  `);
};

exports.down = (pgm) => {
    // Revert to original statuses
    pgm.sql(`
    ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS order_items_status_check;
  `);

    pgm.sql(`
    ALTER TABLE order_items 
    ADD CONSTRAINT order_items_status_check 
    CHECK (status IN ('pending', 'sent', 'prepared', 'served'));
  `);
};
