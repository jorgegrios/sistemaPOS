/**
 * Cashier Domain Types
 */
import { Payment } from '../payments/types';

export type CashSessionStatus = 'open' | 'closed';
export type CashMovementType = 'in' | 'out';

export interface CashSession {
    id: string;
    restaurantId: string;
    userId: string;
    openedAt: string;
    closedAt?: string;
    openingBalance: number;
    expectedBalance: number;
    actualBalance?: number;
    status: CashSessionStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CashMovement {
    id: string;
    sessionId: string;
    type: CashMovementType;
    amount: number;
    description: string;
    createdAt: string;
}

export interface OpenSessionRequest {
    restaurantId: string;
    userId: string;
    openingBalance: number;
}

export interface CloseSessionRequest {
    sessionId: string;
    actualBalance: number;
}

export interface CreateMovementRequest {
    sessionId: string;
    type: CashMovementType;
    amount: number;
    description: string;
}

export interface CashRegisterSummary extends CashSession {
    totalCashPayments: number;
    totalCardPayments: number;
    totalOtherPayments: number;
    totalInMovements: number;
    totalOutMovements: number;
    payments: Payment[];
    movements: CashMovement[];
}
