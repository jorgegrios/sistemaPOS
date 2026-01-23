/**
 * Process Payment Page
 * Process payment for a specific order
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, Order, OrderItem } from '../services/order-service';
import { paymentService } from '../services/payment-service';
import { toast } from 'sonner';
import { StripeCardForm } from '../components/StripeCardForm';
import { CheckoutButton } from '../components/CheckoutButton';
import { QRPaymentModal } from '../components/QRPaymentModal';

export const ProcessPaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // -- HOOKS MUST BE AT THE TOP --
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'qr' | 'wallet'>('card');
  const [paymentToken, setPaymentToken] = useState<string>('');
  const [tip, setTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');

  // QR Modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  // Split check state
  const [splitMode, setSplitMode] = useState<'none' | 'seat'>('none');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

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

  // Derived state for split check
  const availableSeats = order?.items
    ? Array.from(new Set(order.items.map(item => item.seatNumber || 1))).sort((a, b) => a - b)
    : [];

  const getFilteredItems = (): OrderItem[] => {
    if (!order || !order.items) return [];
    if (splitMode === 'none') return order.items;
    if (selectedSeat === null) return [];
    return order.items.filter(item => (item.seatNumber || 1) === selectedSeat);
  };

  const getSubtotal = () => {
    const items = getFilteredItems();
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    if (!order) return 0;
    if (splitMode === 'none') return order.tax;
    const sub = getSubtotal();
    const ratio = order.subtotal > 0 ? sub / order.subtotal : 0;
    return order.tax * ratio;
  };

  const getDiscount = () => {
    if (!order) return 0;
    if (splitMode === 'none') return order.discount;
    const sub = getSubtotal();
    const ratio = order.subtotal > 0 ? sub / order.subtotal : 0;
    return order.discount * ratio;
  };

  const getComputedTotal = () => {
    if (!order) return 0;
    if (splitMode === 'none') return order.total;
    return getSubtotal() + getTax() - getDiscount();
  };

  const activeTotal = getComputedTotal();
  const totalWithTip = activeTotal + tip;

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

    if (paymentMethod === 'card' && !paymentToken) {
      setError('Payment token is required for card payments');
      return;
    }

    if (splitMode === 'seat' && selectedSeat === null) {
      setError('Please select a seat to pay for');
      return;
    }

    try {
      setError(null);

      const subtotal = getSubtotal();
      const tax = getTax();
      const discount = getDiscount();
      const amountToPay = getComputedTotal();

      const paymentData = {
        orderId: id,
        amount: amountToPay + tip,
        currency: 'USD',
        method: paymentMethod as any,
        subtotalAmount: subtotal - discount,
        taxAmount: tax,
        serviceCharge: 0,
        tipAmount: tip,
        paymentToken: paymentToken || undefined,
      };

      const response = await paymentService.processPayment(paymentData);

      if (paymentMethod === 'qr') {
        setPendingPaymentId(response.id);
        setShowQRModal(true);
        return;
      }

      if (response.status === 'completed') {
        toast.success('Pago procesado exitosamente!');

        if (response.print_data) {
          console.log('[Payment] Print Data Ready:', response.print_data);
        }

        const updatedOrder = await orderService.getOrder(id);
        setOrder(updatedOrder);

        setTimeout(() => {
          navigate(`/orders/${id}`);
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al procesar el pago';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    }
  };

  // -- CONDITIONAL RENDERING AFTER HOOKS --
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

          {/* Split Check Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Type</h2>

            {/* Split Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button
                className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${splitMode === 'none' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => {
                  setSplitMode('none');
                  setSelectedSeat(null);
                }}
              >
                Full Order
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all ${splitMode === 'seat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setSplitMode('seat')}
              >
                Split by Seat
              </button>
            </div>

            {/* Seat Selector */}
            {splitMode === 'seat' && (
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Select Seat to Pay:</p>
                <div className="flex flex-wrap gap-2">
                  {availableSeats.length > 0 ? (
                    availableSeats.map(seat => (
                      <button
                        key={seat}
                        onClick={() => setSelectedSeat(seat)}
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                          ${selectedSeat === seat
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                        `}
                      >
                        {seat}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No seat info available</p>
                  )}
                </div>
              </div>
            )}

            {/* Items for Selection (Preview) */}
            {splitMode === 'seat' && selectedSeat !== null && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-800 mb-2 uppercase tracking-wide">
                  Items for Seat {selectedSeat}
                </p>
                <ul className="space-y-1">
                  {getFilteredItems().map(item => (
                    <li key={item.id} className="text-sm text-indigo-900 flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                  {getFilteredItems().length === 0 && (
                    <li className="text-sm text-indigo-400 italic">No items for this seat</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {splitMode === 'none' ? 'Order Summary' : `Summary (Seat ${selectedSeat || '...'})`}
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              {getTax() > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${getTax().toFixed(2)}</span>
                </div>
              )}
              {getDiscount() > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-${getDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold text-gray-800">
                  <span>Total</span>
                  <span>${activeTotal.toFixed(2)}</span>
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
                  className={`p-4 sm:p-5 rounded-lg border-2 transition duration-200 active:scale-95 ${paymentMethod === method.value
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                >
                  <div className="text-3xl sm:text-2xl mb-2">{method.icon}</div>
                  <div className="font-semibold text-gray-800 text-sm sm:text-base">{method.label}</div>
                </button>
              ))}
            </div>

            {/* Stripe Card Form (fallback for development) */}
            {paymentMethod === 'card' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Información de Tarjeta
                </label>
                <StripeCardForm
                  amount={activeTotal}
                  currency="usd"
                  onPaymentMethodReady={(paymentMethodId) => {
                    setPaymentToken(paymentMethodId);
                    toast.success('Información de tarjeta validada');
                  }}
                  onError={(error) => {
                    setError(error);
                    setPaymentToken('');
                  }}
                />
              </div>
            )}

            {/* QR Code Note */}
            {paymentMethod === 'qr' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  📱 El código QR se generará para que el cliente lo escanee.
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
                  className={`p-4 sm:p-3 rounded-lg border-2 transition duration-200 active:scale-95 ${tip > 0 && Math.abs((tip / activeTotal) * 100 - percentage) < 0.01
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                >
                  <div className="font-semibold text-gray-800 text-base sm:text-sm">{percentage}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${((activeTotal * percentage) / 100).toFixed(2)}
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
                <span>${activeTotal.toFixed(2)}</span>
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
            <CheckoutButton
              amount={totalWithTip}
              onCheckout={handleProcessPayment}
              disabled={paymentMethod === 'card' && !paymentToken}
            />
            <p className="text-xs text-gray-500 text-center mt-3">
              Al procesar este pago, confirmas el monto y el método de pago seleccionado.
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

      {showQRModal && pendingPaymentId && (
        <QRPaymentModal
          paymentId={pendingPaymentId}
          onSuccess={(payment) => {
            setShowQRModal(false);
            toast.success('Pago QR verificado!');
            navigate(`/orders/${id}`);
          }}
          onCancel={() => {
            setShowQRModal(false);
          }}
        />
      )}
    </div>
  );
};
