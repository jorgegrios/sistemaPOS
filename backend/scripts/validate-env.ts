#!/usr/bin/env ts-node
/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set
 */

import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file
dotenv.config();

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

const requiredVars: EnvVar[] = [
  // Server Configuration
  {
    name: 'PORT',
    required: true,
    description: 'Server port',
    validator: (v) => !isNaN(parseInt(v)) && parseInt(v) > 0 && parseInt(v) < 65536,
  },
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Node environment (development/production)',
    validator: (v) => ['development', 'production', 'test'].includes(v),
  },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validator: (v) => v.startsWith('postgresql://'),
  },

  // Redis
  {
    name: 'REDIS_URL',
    required: true,
    description: 'Redis connection string',
    validator: (v) => v.startsWith('redis://'),
  },

  // Authentication
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'JWT secret key',
    validator: (v) => v.length >= 32 && v !== 'your-secret-key-change-in-production',
  },

  // Payment Providers (at least one should be configured)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key',
    validator: (v) => v.startsWith('sk_'),
  },
  {
    name: 'SQUARE_ACCESS_TOKEN',
    required: false,
    description: 'Square access token',
  },
  {
    name: 'MERCADOPAGO_ACCESS_TOKEN',
    required: false,
    description: 'Mercado Pago access token',
  },
];

const optionalVars: EnvVar[] = [
  {
    name: 'WEBHOOK_SECRET_STRIPE',
    required: false,
    description: 'Stripe webhook secret',
  },
  {
    name: 'WEBHOOK_SECRET_SQUARE',
    required: false,
    description: 'Square webhook secret',
  },
  {
    name: 'WEBHOOK_SECRET_MERCADOPAGO',
    required: false,
    description: 'Mercado Pago webhook secret',
  },
  {
    name: 'PAYPAL_CLIENT_ID',
    required: false,
    description: 'PayPal client ID',
  },
  {
    name: 'PAYPAL_CLIENT_SECRET',
    required: false,
    description: 'PayPal client secret',
  },
];

function validateEnv(): { success: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredVars) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(`❌ ${envVar.name}: REQUIRED but not set - ${envVar.description}`);
      }
    } else {
      // Validate format if validator exists
      if (envVar.validator && !envVar.validator(value)) {
        errors.push(`❌ ${envVar.name}: Invalid format - ${envVar.description}`);
      } else {
        console.log(`✅ ${envVar.name}: OK`);
      }

      // Check for default/placeholder values
      if (envVar.name === 'JWT_SECRET' && value === 'your-secret-key-change-in-production') {
        warnings.push(`⚠️  ${envVar.name}: Using default value - CHANGE IN PRODUCTION`);
      }
    }
  }

  // Check that at least one payment provider is configured
  const hasStripe = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_key_here';
  const hasSquare = !!process.env.SQUARE_ACCESS_TOKEN;
  const hasMercadoPago = !!process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!hasStripe && !hasSquare && !hasMercadoPago) {
    warnings.push('⚠️  No payment provider configured - At least one is recommended');
  } else {
    console.log(`✅ Payment providers: ${hasStripe ? 'Stripe ' : ''}${hasSquare ? 'Square ' : ''}${hasMercadoPago ? 'MercadoPago' : ''}`);
  }

  // Check optional variables
  for (const envVar of optionalVars) {
    const value = process.env[envVar.name];
    if (!value) {
      console.log(`ℹ️  ${envVar.name}: Not set (optional) - ${envVar.description}`);
    } else {
      console.log(`✅ ${envVar.name}: OK`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

// Main execution
console.log('🔍 Validating environment variables...\n');

const result = validateEnv();

console.log('\n' + '='.repeat(60));

if (result.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  result.warnings.forEach((warning) => console.log(warning));
}

if (result.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  result.errors.forEach((error) => console.log(error));
  console.log('\n❌ Validation FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set correctly!');
  if (result.warnings.length > 0) {
    console.log('⚠️  Please review warnings above');
  }
  process.exit(0);
}








