/**
 * Stripe Provider Wrapper
 * Loads Stripe configuration and provides Stripe Elements context
 */

import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { paymentService } from '../services/payment-service';

interface StripeProviderWrapperProps {
  children: React.ReactNode;
}

let stripePromise: Promise<Stripe | null> | null = null;

export const StripeProviderWrapper: React.FC<StripeProviderWrapperProps> = ({ children }) => {
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStripeConfig = async () => {
      try {
        const config = await paymentService.getStripeConfig();
        if (config.enabled && config.publishableKey) {
          setStripeKey(config.publishableKey);
          // Initialize Stripe only once
          if (!stripePromise) {
            stripePromise = loadStripe(config.publishableKey);
          }
        }
        // If Stripe is not enabled, silently continue without Stripe
        // This is expected behavior when Stripe is not configured
      } catch (error) {
        // Only log if it's an unexpected error (not 200 with enabled: false)
        if (error instanceof Error && !error.message.includes('not configured')) {
          console.warn('Error loading Stripe config:', error);
        }
        // Silently continue - Stripe is optional
      } finally {
        setLoading(false);
      }
    };

    loadStripeConfig();
  }, []);

  // If Stripe is not configured, render children without Stripe Elements
  if (loading) {
    return <>{children}</>;
  }

  if (!stripeKey || !stripePromise) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: 'en' }}>
      {children}
    </Elements>
  );
};



