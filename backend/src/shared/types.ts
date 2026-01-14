/**
 * Shared Types
 * Common types used across all domains
 */

export type OrderStatus = 'draft' | 'sent_to_kitchen' | 'served' | 'closed' | 'cancelled';
export type OrderItemStatus = 'pending' | 'sent' | 'prepared' | 'served';
export type TableStatus = 'free' | 'occupied' | 'reserved';
export type PaymentMethod = 'cash' | 'card' | 'split';
export type PaymentStatus = 'pending' | 'completed';
export type UserRole = 'waiter' | 'cashier' | 'admin' | 'kitchen';





