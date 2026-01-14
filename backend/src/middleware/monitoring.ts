/**
 * Monitoring and Error Tracking Middleware
 * Supports Sentry and DataDog integration
 */

import { Request, Response, NextFunction } from 'express';

// Sentry integration (optional)
let Sentry: any = null;
try {
  Sentry = require('@sentry/node');
} catch (e) {
  console.log('[Monitoring] Sentry not installed. Install with: npm install @sentry/node');
}

// DataDog integration (optional)
let tracer: any = null;
try {
  const datadog = require('dd-trace');
  tracer = datadog.init({
    service: 'sistema-pos-backend',
    env: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  });
} catch (e) {
  console.log('[Monitoring] DataDog not installed. Install with: npm install dd-trace');
}

/**
 * Initialize Sentry error tracking
 */
export function initSentry() {
  if (!Sentry) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    beforeSend(event: any) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
        }
      }
      return event;
    }
  });

  console.log('[Monitoring] Sentry initialized');
}

/**
 * Initialize DataDog APM
 */
export function initDataDog() {
  if (!tracer) return;
  console.log('[Monitoring] DataDog APM initialized');
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log to Sentry
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        endpoint: req.path,
        method: req.method
      },
      extra: {
        body: req.body,
        query: req.query,
        params: req.params
      }
    });
  }

  // Log to console
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  next(err);
}

/**
 * Request tracking middleware
 */
export function requestTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  // Track request in DataDog
  if (tracer) {
    const span = tracer.scope().active();
    if (span) {
      span.setTag('http.method', req.method);
      span.setTag('http.url', req.path);
    }
  }

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[Slow Request] ${req.method} ${req.path} took ${duration}ms`);
    }

    // Track metrics in DataDog
    if (tracer) {
      const span = tracer.scope().active();
      if (span) {
        span.setTag('http.status_code', res.statusCode);
        span.setTag('http.response_time', duration);
      }
    }
  });

  next();
}

/**
 * Performance monitoring decorator
 */
export function trackPerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Track in DataDog
        if (tracer) {
          const span = tracer.scope().active();
          if (span) {
            span.setTag('operation.name', `${name}.${propertyKey}`);
            span.setTag('operation.duration', duration);
          }
        }

        return result;
      } catch (error) {
        // Track errors
        if (Sentry) {
          Sentry.captureException(error, {
            tags: {
              operation: `${name}.${propertyKey}`
            }
          });
        }
        throw error;
      }
    };

    return descriptor;
  };
}

