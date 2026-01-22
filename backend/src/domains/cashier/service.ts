/**
 * Cashier Domain Service
 * SSOT for all cash control operations
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
    CashSession,
    CashMovement,
    OpenSessionRequest,
    CloseSessionRequest,
    CreateMovementRequest,
    CashRegisterSummary
} from './types';

export class CashierDomainService {
    constructor(private pool: Pool) { }

    /**
     * Open a new cash session
     * RULE: Only one open session per restaurant
     */
    async openSession(request: OpenSessionRequest): Promise<CashSession> {
        // Check if there is already an open session
        const existing = await this.getCurrentSession(request.restaurantId);
        if (existing) {
            throw new Error('Already has an active cash session');
        }

        const sessionId = uuidv4();
        const result = await this.pool.query(
            `INSERT INTO cash_sessions (
        id, restaurant_id, user_id, opening_balance, expected_balance, status
       )
       VALUES ($1, $2, $3, $4, $4, 'open')
       RETURNING id, restaurant_id, user_id, opened_at, opening_balance, expected_balance, status, created_at, updated_at`,
            [sessionId, request.restaurantId, request.userId, request.openingBalance]
        );

        return this.mapRowToSession(result.rows[0]);
    }

    /**
     * Get current open session for a restaurant
     */
    async getCurrentSession(restaurantId: string): Promise<CashSession | null> {
        const result = await this.pool.query(
            `SELECT id, restaurant_id, user_id, opened_at, opening_balance, expected_balance, status, created_at, updated_at
       FROM cash_sessions
       WHERE restaurant_id = $1 AND status = 'open'
       LIMIT 1`,
            [restaurantId]
        );

        if (result.rows.length === 0) return null;
        return this.mapRowToSession(result.rows[0]);
    }

    /**
     * Close a cash session
     */
    async closeSession(request: CloseSessionRequest): Promise<CashSession> {
        const result = await this.pool.query(
            `UPDATE cash_sessions
       SET status = 'closed', closed_at = NOW(), actual_balance = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'open'
       RETURNING id, restaurant_id, user_id, opened_at, closed_at, opening_balance, expected_balance, actual_balance, status, created_at, updated_at`,
            [request.actualBalance, request.sessionId]
        );

        if (result.rows.length === 0) {
            throw new Error('Session not found or already closed');
        }

        return this.mapRowToSession(result.rows[0]);
    }

    /**
     * Add a manual cash movement
     */
    async addMovement(request: CreateMovementRequest): Promise<CashMovement> {
        const movementId = uuidv4();

        // Start transaction to update both movement and session expected balance
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(
                `INSERT INTO cash_movements (id, session_id, type, amount, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, session_id, type, amount, description, created_at`,
                [movementId, request.sessionId, request.type, request.amount, request.description]
            );

            const delta = request.type === 'in' ? request.amount : -request.amount;

            await client.query(
                `UPDATE cash_sessions 
         SET expected_balance = expected_balance + $1, updated_at = NOW()
         WHERE id = $2`,
                [delta, request.sessionId]
            );

            await client.query('COMMIT');
            return this.mapRowToMovement(result.rows[0]);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Update expected balance from a payment
     * Called by payment service or via event
     */
    async recordPayment(sessionId: string, method: string, amount: number): Promise<void> {
        if (method !== 'cash') return; // Only cash affects drawer balance

        await this.pool.query(
            `UPDATE cash_sessions 
       SET expected_balance = expected_balance + $1, updated_at = NOW()
       WHERE id = $2 AND status = 'open'`,
            [amount, sessionId]
        );
    }

    private mapRowToSession(row: any): CashSession {
        return {
            id: row.id,
            restaurantId: row.restaurant_id,
            userId: row.user_id,
            openedAt: row.opened_at.toISOString(),
            closedAt: row.closed_at ? row.closed_at.toISOString() : undefined,
            openingBalance: parseFloat(row.opening_balance),
            expectedBalance: parseFloat(row.expected_balance),
            actualBalance: row.actual_balance ? parseFloat(row.actual_balance) : undefined,
            status: row.status,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        };
    }

    private mapRowToMovement(row: any): CashMovement {
        return {
            id: row.id,
            sessionId: row.session_id,
            type: row.type,
            amount: parseFloat(row.amount),
            description: row.description,
            createdAt: row.created_at.toISOString(),
        };
    }
}
