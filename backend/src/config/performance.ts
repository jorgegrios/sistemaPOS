/**
 * Performance Optimization Configuration
 * Caching strategies, indexing recommendations, and performance tuning
 */

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Cache configuration
 */
export const cacheConfig = {
  // TTL in seconds
  defaultTTL: 3600, // 1 hour
  shortTTL: 300,    // 5 minutes
  longTTL: 86400,   // 24 hours
  
  // Cache keys
  keys: {
    orders: (id: string) => `order:${id}`,
    menu: (restaurantId: string, menuId: string) => `menu:${restaurantId}:${menuId}`,
    payments: (id: string) => `payment:${id}`,
    user: (id: string) => `user:${id}`
  }
};

/**
 * Cache helper functions
 */
export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  static async set(key: string, value: any, ttl: number = cacheConfig.defaultTTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('[Cache] Set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('[Cache] Delete error:', error);
    }
  }

  /**
   * Invalidate cache pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('[Cache] Invalidate pattern error:', error);
    }
  }
}

/**
 * Database indexing recommendations
 * These should be added via migrations
 */
export const recommendedIndexes = [
  // Payment transactions
  'CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status)',
  'CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(payment_provider, provider_transaction_id)',
  'CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(created_at DESC)',
  
  // Orders
  'CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)',
  'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
  'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)',
  'CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC)',
  
  // Refunds
  'CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON refunds(payment_transaction_id)',
  'CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status)',
  
  // Composite indexes for common queries
  'CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status) WHERE restaurant_id IS NOT NULL',
  'CREATE INDEX IF NOT EXISTS idx_payments_order_status ON payment_transactions(order_id, status)'
];

/**
 * Apply recommended indexes
 */
export async function applyIndexes(pool: any): Promise<void> {
  console.log('[Performance] Applying recommended indexes...');
  
  for (const indexSQL of recommendedIndexes) {
    try {
      await pool.query(indexSQL);
      console.log(`[Performance] Applied index: ${indexSQL.substring(0, 50)}...`);
    } catch (error: any) {
      // Index might already exist, that's okay
      if (!error.message.includes('already exists')) {
        console.error('[Performance] Index error:', error.message);
      }
    }
  }
  
  console.log('[Performance] Indexes applied');
}

/**
 * Query performance monitoring
 */
export function logSlowQuery(query: string, duration: number, threshold: number = 1000): void {
  if (duration > threshold) {
    console.warn(`[Slow Query] ${duration}ms: ${query.substring(0, 100)}...`);
  }
}







