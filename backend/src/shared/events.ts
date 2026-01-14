/**
 * Event System for Domain Communication
 * Allows domains to communicate without direct dependencies
 * SSOT: Events are the only way domains communicate
 */

import { EventEmitter } from 'events';
import { PaymentMethod } from './types';

export const domainEvents = new EventEmitter();

// Event Types
export enum DomainEventType {
  // Orders
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  ORDER_ITEMS_ADDED = 'order:items:added',
  ORDER_SENT_TO_KITCHEN = 'order:sent_to_kitchen',
  ORDER_SERVED = 'order:served',
  ORDER_CLOSED = 'order:closed',
  ORDER_CANCELLED = 'order:cancelled',
  
  // Kitchen
  ORDER_ITEM_PREPARED = 'order_item:prepared',
  ALL_ITEMS_PREPARED = 'order:all_items_prepared',
  
  // Tables
  TABLE_OCCUPIED = 'table:occupied',
  TABLE_FREED = 'table:freed',
  TABLE_RESERVED = 'table:reserved',
  
  // Payments
  PAYMENT_COMPLETED = 'payment:completed',
  PAYMENT_FAILED = 'payment:failed',
}

// Event Payload Types
export interface OrderCreatedEvent {
  orderId: string;
  tableId: string;
  waiterId: string;
}

export interface OrderSentToKitchenEvent {
  orderId: string;
  items: Array<{ id: string; productId: string; quantity: number }>;
}

export interface OrderItemPreparedEvent {
  orderId: string;
  orderItemId: string;
}

export interface PaymentCompletedEvent {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export type DomainEventPayload = 
  | OrderCreatedEvent
  | OrderSentToKitchenEvent
  | OrderItemPreparedEvent
  | PaymentCompletedEvent;

// Helper to emit events
export function emitEvent(type: DomainEventType, payload: DomainEventPayload): void {
  domainEvents.emit(type, payload);
}

// Helper to listen to events
export function onEvent(type: DomainEventType, handler: (payload: DomainEventPayload) => void): void {
  domainEvents.on(type, handler);
}

