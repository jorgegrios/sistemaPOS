/**
 * Shared Types
 * Common types used across all domains
 */

export type OrderStatus = 'draft' | 'sent_to_kitchen' | 'served' | 'closed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'sent' | 'prepared' | 'served' | 'cancelled';
export type TableStatus = 'available' | 'occupied' | 'paid' | 'dirty' | 'reserved';
export type PaymentMethod = 'cash' | 'card' | 'split' | 'qr' | 'wallet';
export type PaymentStatus = 'pending' | 'completed';
export type UserRole = 'waiter' | 'cashier' | 'admin' | 'kitchen';






