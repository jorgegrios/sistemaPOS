/**
 * Process Payment Page
 * Process payment for a specific order
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, Order } from '../services/order-service';
import { paymentService, PaymentProvider } from '../services/payment-service';
import { toast } from 'sonner';
import { StripeCardForm } from '../components/StripeCardForm';

export const ProcessPaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'qr' | 'wallet'>('card');
  const [provider, setProvider] = useState<PaymentProvider>('stripe');
  const [paymentToken, setPaymentToken] = useState<string>('');
  const [tip, setTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderData = await orderService.getOrder(id);
        setOrder(orderData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load order';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleTipChange = (value: string) => {
    setCustomTip(value);
    const tipAmount = parseFloat(value) || 0;
    setTip(tipAmount);
  };

  const handleQuickTip = (percentage: number) => {
    if (!order) return;
    const tipAmount = (order.total * percentage) / 100;
    setTip(tipAmount);
    setCustomTip(tipAmount.toFixed(2));
  };

  const handleProcessPayment = async () => {
    if (!order || !id) return;

    // Validate payment method
    if (paymentMethod === 'card' && !paymentToken) {
      setError('Payment token is required for card payments');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Generate idempotency key
      const idempotencyKey = `${id}-${Date.now()}`;

      // Prepare payment data
      const paymentData = {
        orderId: id,
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'USD',
        method: paymentMethod,
        provider: provider,
        paymentMethodId: paymentToken || `cash-${idempotencyKey}`,
        idempotencyKey,
        tip: Math.round(tip * 100), // Convert to cents
        metadata: {
          orderNumber: order.orderNumber,
          tip: tip,
          paymentMethod: paymentMethod
        }
      };

      // Process payment
      const response = await paymentService.processPayment(paymentData);

      if (response.status === 'succeeded') {
        toast.success('Payment processed successfully!');
        // Reload order to get updated payment status
        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);
        // Navigate back to order detail after 2 seconds
        setTimeout(() => {
          navigate(`/orders/${id}`);
        }, 2000);
      } else {
        setError(`Payment ${response.status}. Please try again.`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 text-lg font-semibold mb-2">Error</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const totalWithTip = order.total + tip;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate(`/orders/${id}`)}
          className="text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium mb-4 flex items-center gap-2 btn-touch self-start"
        >
          ← Back to Order
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Process Payment</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Order {order.orderNumber}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold text-gray-800">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
              {[
                { value: 'card', label: '💳 Card', icon: '💳' },
                { value: 'cash', label: '💵 Cash', icon: '💵' },
                { value: 'qr', label: '📱 QR Code', icon: '📱' },
                { value: 'wallet', label: '👛 Wallet', icon: '👛' }
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`p-4 sm:p-5 rounded-lg border-2 transition duration-200 active:scale-95 ${
                    paymentMethod === method.value
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl sm:text-2xl mb-2">{method.icon}</div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">{method.label}</div>
                </button>
              ))}
            </div>

            {/* Provider Selection (for card payments) */}
            {paymentMethod === 'card' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as PaymentProvider)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stripe">Stripe</option>
                  <option value="square">Square</option>
                  <option value="mercado_pago">Mercado Pago</option>
                </select>
              </div>
            )}

            {/* Stripe Card Form (for Stripe card payments) */}
            {paymentMethod === 'card' && provider === 'stripe' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Card Information
                </label>
                <StripeCardForm
                  amount={order.total}
                  currency="usd"
                  onPaymentMethodReady={(paymentMethodId) => {
                    setPaymentToken(paymentMethodId);
                    toast.success('Card information validated');
                  }}
                  onError={(error) => {
                    setError(error);
                    setPaymentToken('');
                  }}
                />
              </div>
            )}

            {/* Payment Token Input (for non-Stripe card payments or fallback) */}
            {paymentMethod === 'card' && provider !== 'stripe' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Token / Card ID
                </label>
                <input
                  type="text"
                  value={paymentToken}
                  onChange={(e) => setPaymentToken(e.target.value)}
                  placeholder="Payment token or card ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter payment token from your payment provider
                </p>
              </div>
            )}

            {/* Cash Payment Note */}
            {paymentMethod === 'cash' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  💵 Cash payment will be recorded but not processed through a payment gateway.
                </p>
              </div>
            )}

            {/* QR Code Note */}
            {paymentMethod === 'qr' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  📱 QR code payment will generate a QR for the customer to scan.
                </p>
              </div>
            )}
          </div>

          {/* Tip Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tip (Optional)</h2>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              {[0, 10, 15, 20].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleQuickTip(percentage)}
                  className={`p-4 sm:p-3 rounded-lg border-2 transition duration-200 active:scale-95 ${
                    tip > 0 && Math.abs((tip / order.total) * 100 - percentage) < 0.01
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800 text-base sm:text-sm">{percentage}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${((order.total * percentage) / 100).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Tip Amount
              </label>
              <input
                type="number"
                value={customTip}
                onChange={(e) => handleTipChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Summary & Actions */}
        <div className="space-y-6">
          {/* Total Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Order Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tip</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between text-2xl font-bold text-gray-800">
                  <span>Total</span>
                  <span>${totalWithTip.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Process Payment Button */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <button
              onClick={handleProcessPayment}
              disabled={processing || (paymentMethod === 'card' && !paymentToken)}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-5 rounded-lg font-semibold text-lg sm:text-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 btn-touch-lg"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  💳 Process Payment ${totalWithTip.toFixed(2)}
                </span>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              By processing this payment, you confirm the amount and payment method.
            </p>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-semibold mb-2">ℹ️ Payment Information</p>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Payment will be processed immediately</li>
              <li>• Order status will update automatically</li>
              <li>• Receipt will be available after payment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

