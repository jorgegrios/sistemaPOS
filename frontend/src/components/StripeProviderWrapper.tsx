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
      } catch (error) {
        console.warn('Stripe is not configured:', error);
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


