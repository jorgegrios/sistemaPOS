/**
 * Kitchen Print Service
 * Handles printing of kitchen tickets and bar tickets when orders are created
 */

import { Pool } from 'pg';
import { Server as SocketIOServer } from 'socket.io';
import printerService from './printerService';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface KitchenTicket {
  orderId: string;
  orderNumber: string;
  tableId: string;
  items: KitchenTicketItem[];
  createdAt: Date;
  notes?: string;
}

export interface KitchenTicketItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  category?: string;
}

export type TicketType = 'kitchen' | 'bar';

class KitchenPrintService {
  private io?: SocketIOServer;

  /**
   * Initialize Socket.io instance for real-time notifications
   */
  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Print tickets for an order (kitchen and/or bar)
   */
  async printOrderTickets(orderId: string): Promise<void> {
    try {
      // Get order details
      const orderResult = await pool.query(
        `SELECT o.*, t.name as table_name
         FROM orders o
         LEFT JOIN tables t ON o.table_id = t.id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Get order items with category information
      const itemsResult = await pool.query(
        `SELECT oi.*, mi.category_id, mc.name as category_name, mc.metadata as category_metadata
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         LEFT JOIN menu_categories mc ON mi.category_id = mc.id
         WHERE oi.order_id = $1
         ORDER BY mc.display_order, oi.created_at`,
        [orderId]
      );

      const items = itemsResult.rows;

      // Separate items by type (kitchen vs bar)
      const kitchenItems: KitchenTicketItem[] = [];
      const barItems: KitchenTicketItem[] = [];

      for (const item of items) {
        const ticketItem: KitchenTicketItem = {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          notes: item.notes || null,
          category: item.category_name || 'Other'
        };

        // Determine if item goes to kitchen or bar based on category metadata
        // Default: if category metadata has 'type: bar', it goes to bar, otherwise kitchen
        const categoryMetadata = item.category_metadata || {};
        const itemType = categoryMetadata.type || categoryMetadata.location || 'kitchen';

        if (itemType === 'bar' || itemType === 'drinks') {
          barItems.push(ticketItem);
        } else {
          kitchenItems.push(ticketItem);
        }
      }

      // Print kitchen ticket if there are kitchen items
      if (kitchenItems.length > 0) {
        await this.printKitchenTicket({
          orderId: order.id,
          orderNumber: order.order_number,
          tableId: order.table_id || order.table_name || 'N/A',
          items: kitchenItems,
          createdAt: new Date(order.created_at),
          notes: order.notes || null
        });
      }

      // Print bar ticket if there are bar items
      if (barItems.length > 0) {
        await this.printBarTicket({
          orderId: order.id,
          orderNumber: order.order_number,
          tableId: order.table_id || order.table_name || 'N/A',
          items: barItems,
          createdAt: new Date(order.created_at),
          notes: order.notes || null
        });
      }

      // Emit Socket.io event for KDS (Kitchen Display System)
      if (this.io) {
        this.io.emit('new_order', {
          orderId: order.id,
          orderNumber: order.order_number,
          tableId: order.table_id,
          kitchenItems: kitchenItems.length,
          barItems: barItems.length,
          timestamp: new Date()
        });

        // Emit to specific rooms
        if (kitchenItems.length > 0) {
          this.io.to('kitchen').emit('kitchen_order', {
            orderId: order.id,
            orderNumber: order.order_number,
            tableId: order.table_id,
            items: kitchenItems
          });
        }

        if (barItems.length > 0) {
          this.io.to('bar').emit('bar_order', {
            orderId: order.id,
            orderNumber: order.order_number,
            tableId: order.table_id,
            items: barItems
          });
        }
      }
    } catch (error) {
      console.error('[Kitchen Print] Error printing tickets:', error);
      throw error;
    }
  }

  /**
   * Print kitchen ticket
   */
  private async printKitchenTicket(ticket: KitchenTicket): Promise<void> {
    const ticketContent = this.formatKitchenTicket(ticket);
    
    // Log ticket to console
    console.log('\n=== KITCHEN TICKET ===');
    console.log(ticketContent);
    console.log('======================\n');

    // Try to print to physical printer
    try {
      const printed = await printerService.printFormattedTicket('kitchen', {
        orderNumber: ticket.orderNumber,
        tableId: ticket.tableId,
        items: ticket.items,
        createdAt: ticket.createdAt,
        notes: ticket.notes
      });

      if (!printed) {
        console.warn('[Kitchen Print] Physical printer not available, ticket logged only');
      }
    } catch (error: any) {
      console.error('[Kitchen Print] Error printing to physical printer:', error.message);
      // Continue even if physical print fails
    }
    
    // Store the ticket in database for tracking
    await this.storeTicket('kitchen', ticket);
  }

  /**
   * Print bar ticket
   */
  private async printBarTicket(ticket: KitchenTicket): Promise<void> {
    const ticketContent = this.formatBarTicket(ticket);
    
    // Log ticket to console
    console.log('\n=== BAR TICKET ===');
    console.log(ticketContent);
    console.log('==================\n');

    // Try to print to physical printer
    try {
      const printed = await printerService.printFormattedTicket('bar', {
        orderNumber: ticket.orderNumber,
        tableId: ticket.tableId,
        items: ticket.items,
        createdAt: ticket.createdAt,
        notes: ticket.notes
      });

      if (!printed) {
        console.warn('[Kitchen Print] Physical printer not available, ticket logged only');
      }
    } catch (error: any) {
      console.error('[Kitchen Print] Error printing to physical printer:', error.message);
      // Continue even if physical print fails
    }

    await this.storeTicket('bar', ticket);
  }

  /**
   * Format kitchen ticket content
   */
  private formatKitchenTicket(ticket: KitchenTicket): string {
    const lines: string[] = [];
    
    lines.push('╔═══════════════════════════════╗');
    lines.push('║      COCINA / KITCHEN         ║');
    lines.push('╠═══════════════════════════════╣');
    lines.push(`Orden: ${ticket.orderNumber}`);
    lines.push(`Mesa: ${ticket.tableId}`);
    lines.push(`Hora: ${ticket.createdAt.toLocaleTimeString('es-ES')}`);
    lines.push('───────────────────────────────');
    
    // Group items by category
    const itemsByCategory = new Map<string, KitchenTicketItem[]>();
    for (const item of ticket.items) {
      const category = item.category || 'Other';
      if (!itemsByCategory.has(category)) {
        itemsByCategory.set(category, []);
      }
      itemsByCategory.get(category)!.push(item);
    }

    for (const [category, items] of itemsByCategory) {
      lines.push(`\n[${category.toUpperCase()}]`);
      for (const item of items) {
        lines.push(`${item.quantity}x ${item.name}`);
        if (item.notes) {
          lines.push(`   Nota: ${item.notes}`);
        }
      }
    }

    if (ticket.notes) {
      lines.push('\n───────────────────────────────');
      lines.push(`NOTA GENERAL: ${ticket.notes}`);
    }

    lines.push('───────────────────────────────');
    lines.push(`Ticket generado: ${new Date().toLocaleString('es-ES')}`);
    lines.push('╚═══════════════════════════════╝');

    return lines.join('\n');
  }

  /**
   * Format bar ticket content
   */
  private formatBarTicket(ticket: KitchenTicket): string {
    const lines: string[] = [];
    
    lines.push('╔═══════════════════════════════╗');
    lines.push('║         BAR / BEBIDAS          ║');
    lines.push('╠═══════════════════════════════╣');
    lines.push(`Orden: ${ticket.orderNumber}`);
    lines.push(`Mesa: ${ticket.tableId}`);
    lines.push(`Hora: ${ticket.createdAt.toLocaleTimeString('es-ES')}`);
    lines.push('───────────────────────────────');
    
    for (const item of ticket.items) {
      lines.push(`${item.quantity}x ${item.name}`);
      if (item.notes) {
        lines.push(`   Nota: ${item.notes}`);
      }
    }

    if (ticket.notes) {
      lines.push('\n───────────────────────────────');
      lines.push(`NOTA GENERAL: ${ticket.notes}`);
    }

    lines.push('───────────────────────────────');
    lines.push(`Ticket generado: ${new Date().toLocaleString('es-ES')}`);
    lines.push('╚═══════════════════════════════╝');

    return lines.join('\n');
  }

  /**
   * Store ticket in database for tracking
   */
  private async storeTicket(type: TicketType, ticket: KitchenTicket): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO kitchen_tickets (order_id, ticket_type, content, status, created_at)
         VALUES ($1, $2, $3, 'printed', NOW())`,
        [ticket.orderId, type, JSON.stringify(ticket)]
      );
    } catch (error) {
      // Table might not exist yet, that's okay for now
      console.warn('[Kitchen Print] Could not store ticket in database:', error);
    }
  }

  /**
   * Mark ticket as completed
   */
  async markTicketCompleted(orderId: string, type: TicketType): Promise<void> {
    try {
      await pool.query(
        `UPDATE kitchen_tickets 
         SET status = 'completed', completed_at = NOW()
         WHERE order_id = $1 AND ticket_type = $2`,
        [orderId, type]
      );

      // Emit completion event
      if (this.io) {
        this.io.emit('ticket_completed', {
          orderId,
          type,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.warn('[Kitchen Print] Could not mark ticket as completed:', error);
    }
  }
}

export default new KitchenPrintService();

