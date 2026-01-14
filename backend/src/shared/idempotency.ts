/**
 * Idempotency Helpers
 * Ensures operations can be repeated without duplicating data
 * SSOT: All idempotent operations must use these helpers
 */

import { Pool } from 'pg';

/**
 * Get active order for a table (idempotent check)
 * Returns null if no active order exists
 * 
 * @param pool Database pool
 * @param tableId Table ID
 * @returns Active order ID or null
 */
export async function getActiveOrderForTable(
  pool: Pool,
  tableId: string
): Promise<string | null> {
  const result = await pool.query(
    `SELECT id FROM orders 
     WHERE table_id = $1 
     AND status IN ('draft', 'sent_to_kitchen', 'served')
     ORDER BY created_at DESC
     LIMIT 1`,
    [tableId]
  );
  
  return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * Check if order was already sent to kitchen (idempotent check)
 * 
 * @param pool Database pool
 * @param orderId Order ID
 * @returns true if already sent, false otherwise
 */
export async function isOrderSentToKitchen(
  pool: Pool,
  orderId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT status FROM orders WHERE id = $1`,
    [orderId]
  );
  
  if (result.rows.length === 0) return false;
  
  const status = result.rows[0].status;
  return status === 'sent_to_kitchen' || status === 'served' || status === 'closed';
}

/**
 * Check if order can be closed (all items served)
 * 
 * @param pool Database pool
 * @param orderId Order ID
 * @returns true if all items are served, false otherwise
 */
export async function canCloseOrder(
  pool: Pool,
  orderId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT COUNT(*) as total, 
            SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) as served
     FROM order_items 
     WHERE order_id = $1`,
    [orderId]
  );
  
  if (result.rows.length === 0) return false;
  
  const { total, served } = result.rows[0];
  return parseInt(total) > 0 && parseInt(total) === parseInt(served);
}

/**
 * Check if order has completed payment
 * 
 * @param pool Database pool
 * @param orderId Order ID
 * @returns true if payment is completed, false otherwise
 */
export async function hasCompletedPayment(
  pool: Pool,
  orderId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM payment_transactions 
     WHERE order_id = $1 
     AND status = 'completed'`,
    [orderId]
  );
  
  return parseInt(result.rows[0].count) > 0;
}






