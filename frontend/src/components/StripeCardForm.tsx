/**
 * Stripe Card Form Component
 * Uses Stripe Elements to securely collect card information
 */

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';

interface StripeCardFormProps {
  onPaymentMethodReady: (paymentMethodId: string) => void;
  onError?: (error: string) => void;
  amount?: number;
  currency?: string;
}

export const StripeCardForm: React.FC<StripeCardFormProps> = ({
  onPaymentMethodReady,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      const errorMsg = 'Stripe is not initialized';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment method from card element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          type: 'card',
        },
      });

      if (pmError) {
        throw pmError;
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Notify parent component
      onPaymentMethodReady(paymentMethod.id);
      toast.success('Card information validated successfully');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process card information';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-yellow-800 font-medium mb-2">Pago con tarjeta no disponible</p>
        <p className="text-yellow-700 text-sm">
          Este restaurante no tiene configurada una pasarela de pagos.
          Por favor use otro método de pago.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                email: '',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Validating Card...
          </span>
        ) : (
          'Validate Card Information'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your card information is securely processed by Stripe. We never store your card details.
      </p>
    </form>
  );
};

