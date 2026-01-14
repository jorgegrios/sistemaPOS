/**
 * Receipt Service
 * Generates customer receipts/tickets when check is requested
 */

import { Pool } from 'pg';
import printerService from './printerService';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface CustomerReceipt {
  orderId: string;
  orderNumber: string;
  tableId: string;
  tableNumber?: string;
  waiterId?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  createdAt: Date;
  checkRequestedAt: Date;
  restaurantName?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

class ReceiptService {
  /**
   * Generate customer receipt for an order
   */
  async generateReceipt(orderId: string): Promise<CustomerReceipt> {
    try {
      // Get order details with table and restaurant info
      const orderResult = await pool.query(
        `SELECT 
          o.*,
          t.table_number,
          r.name as restaurant_name
         FROM orders o
         LEFT JOIN tables t ON o.table_id = t.id
         LEFT JOIN restaurants r ON t.restaurant_id = r.id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Get order items
      const itemsResult = await pool.query(
        `SELECT name, price, quantity, notes
         FROM order_items
         WHERE order_id = $1
         ORDER BY created_at ASC`,
        [orderId]
      );

      const items: ReceiptItem[] = itemsResult.rows.map((row) => ({
        name: row.name,
        quantity: parseInt(row.quantity),
        price: parseFloat(row.price),
        total: parseFloat(row.price) * parseInt(row.quantity),
        notes: row.notes || undefined,
      }));

      const receipt: CustomerReceipt = {
        orderId: order.id,
        orderNumber: order.order_number,
        tableId: order.table_id,
        tableNumber: order.table_number || undefined,
        waiterId: order.waiter_id || undefined,
        items,
        subtotal: parseFloat(order.subtotal),
        tax: parseFloat(order.tax),
        discount: parseFloat(order.discount || 0),
        tip: parseFloat(order.tip || 0),
        total: parseFloat(order.total),
        createdAt: new Date(order.created_at),
        checkRequestedAt: new Date(order.check_requested_at || order.created_at),
        restaurantName: order.restaurant_name || undefined,
      };

      return receipt;
    } catch (error: any) {
      console.error('[Receipt Service] Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Print customer receipt
   */
  async printReceipt(orderId: string): Promise<void> {
    try {
      const receipt = await this.generateReceipt(orderId);
      const receiptContent = this.formatReceipt(receipt);

      // Log receipt to console
      console.log('\n=== CUSTOMER RECEIPT ===');
      console.log(receiptContent);
      console.log('========================\n');

      // Try to print to customer receipt printer (if configured)
      // For now, we'll use a generic 'receipt' type
      try {
        // Note: You may need to configure a receipt printer in printerService
        // For now, we'll just log it
        console.log('[Receipt Service] Receipt ready for printing');
      } catch (error: any) {
        console.error('[Receipt Service] Error printing receipt:', error.message);
        // Continue even if physical print fails
      }

      // Store receipt in database for tracking
      await this.storeReceipt(receipt);
    } catch (error: any) {
      console.error('[Receipt Service] Error printing receipt:', error);
      throw error;
    }
  }

  /**
   * Format receipt content for printing/display
   */
  private formatReceipt(receipt: CustomerReceipt): string {
    const lines: string[] = [];

    // Header
    lines.push('╔═══════════════════════════════════╗');
    if (receipt.restaurantName) {
      lines.push(`║   ${receipt.restaurantName.padEnd(35).substring(0, 35)} ║`);
    } else {
      lines.push('║          RECIBO / RECEIPT          ║');
    }
    lines.push('╠═══════════════════════════════════╣');
    lines.push(`Orden: ${receipt.orderNumber}`);
    if (receipt.tableNumber) {
      lines.push(`Mesa: ${receipt.tableNumber}`);
    }
    lines.push(`Fecha: ${receipt.checkRequestedAt.toLocaleString('es-ES')}`);
    lines.push('─────────────────────────────────────');
    lines.push('');

    // Items
    lines.push('ITEMS:');
    for (const item of receipt.items) {
      const itemLine = `${item.quantity}x ${item.name}`.padEnd(30);
      const priceLine = `$${item.total.toFixed(2)}`.padStart(10);
      lines.push(`${itemLine} ${priceLine}`);
      if (item.notes) {
        lines.push(`   Nota: ${item.notes}`);
      }
    }

    lines.push('─────────────────────────────────────');

    // Totals
    lines.push(`Subtotal:                    $${receipt.subtotal.toFixed(2)}`);
    if (receipt.discount > 0) {
      lines.push(`Descuento:                   $${receipt.discount.toFixed(2)}`);
    }
    lines.push(`Impuesto:                    $${receipt.tax.toFixed(2)}`);
    if (receipt.tip > 0) {
      lines.push(`Propina:                     $${receipt.tip.toFixed(2)}`);
    }
    lines.push('─────────────────────────────────────');
    lines.push(`TOTAL:                       $${receipt.total.toFixed(2)}`);
    lines.push('─────────────────────────────────────');
    lines.push('');
    lines.push('¡Gracias por su visita!');
    lines.push(`Recibo generado: ${new Date().toLocaleString('es-ES')}`);
    lines.push('╚═══════════════════════════════════╝');

    return lines.join('\n');
  }

  /**
   * Get receipt as HTML for display/download
   */
  async getReceiptHTML(orderId: string): Promise<string> {
    const receipt = await this.generateReceipt(orderId);

    const itemsHTML = receipt.items
      .map(
        (item) => `
      <tr>
        <td>${item.quantity}x ${item.name}</td>
        <td style="text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="text-align: right;">$${item.total.toFixed(2)}</td>
      </tr>
      ${item.notes ? `<tr><td colspan="3" style="font-size: 0.9em; color: #666;">Nota: ${item.notes}</td></tr>` : ''}
    `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recibo - ${receipt.orderNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .info {
          margin-bottom: 20px;
        }
        .info p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table th {
          text-align: left;
          border-bottom: 1px solid #ddd;
          padding: 8px 0;
        }
        table td {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .totals {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 20px;
        }
        .totals div {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .total {
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${receipt.restaurantName || 'RECIBO'}</h1>
      </div>
      <div class="info">
        <p><strong>Orden:</strong> ${receipt.orderNumber}</p>
        ${receipt.tableNumber ? `<p><strong>Mesa:</strong> ${receipt.tableNumber}</p>` : ''}
        <p><strong>Fecha:</strong> ${receipt.checkRequestedAt.toLocaleString('es-ES')}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Precio</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      <div class="totals">
        <div>
          <span>Subtotal:</span>
          <span>$${receipt.subtotal.toFixed(2)}</span>
        </div>
        ${receipt.discount > 0 ? `<div><span>Descuento:</span><span>-$${receipt.discount.toFixed(2)}</span></div>` : ''}
        <div>
          <span>Impuesto:</span>
          <span>$${receipt.tax.toFixed(2)}</span>
        </div>
        ${receipt.tip > 0 ? `<div><span>Propina:</span><span>$${receipt.tip.toFixed(2)}</span></div>` : ''}
        <div class="total">
          <span>TOTAL:</span>
          <span>$${receipt.total.toFixed(2)}</span>
        </div>
      </div>
      <div class="footer">
        <p>¡Gracias por su visita!</p>
        <p>Recibo generado: ${new Date().toLocaleString('es-ES')}</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Store receipt in database for tracking
   */
  private async storeReceipt(receipt: CustomerReceipt): Promise<void> {
    try {
      // Create receipts table if it doesn't exist (or use existing one)
      await pool.query(
        `CREATE TABLE IF NOT EXISTS customer_receipts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id),
          receipt_content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )`
      );

      const receiptContent = this.formatReceipt(receipt);

      await pool.query(
        `INSERT INTO customer_receipts (order_id, receipt_content, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [receipt.orderId, receiptContent]
      );
    } catch (error: any) {
      // Table creation might fail if not allowed, that's okay
      console.warn('[Receipt Service] Could not store receipt in database:', error.message);
    }
  }
}

export default new ReceiptService();







