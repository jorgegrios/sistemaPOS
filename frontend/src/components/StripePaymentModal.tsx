import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentModalProps {
    isOpen: boolean;
    amount: number;
    onClose: () => void;
    onSuccess: (paymentMethodId: string) => void;
    onError: (error: string) => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
    isOpen,
    amount,
    onClose,
    onSuccess,
    onError
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }

        setProcessing(true);

        try {
            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
                throw new Error('No se pudo encontrar el elemento de tarjeta');
            }

            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                console.error('[Stripe Error]', error);
                onError(error.message || 'Error en la tarjeta');
            } else {
                console.log('[PaymentMethod]', paymentMethod);
                onSuccess(paymentMethod.id);
            }
        } catch (error: any) {
            onError(error.message || 'Error procesando pago');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">💳 Pago con Tarjeta</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-lg font-bold text-blue-900">Total a Pagar</p>
                    <p className="text-3xl font-bold text-blue-600">${amount.toFixed(2)}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Stripe Card Element */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Detalles de la Tarjeta
                        </label>
                        <div className="p-4 border-2 border-gray-300 rounded-lg focus-within:border-blue-500 transition-colors bg-white">
                            <CardElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '18px',
                                            color: '#1f2937',
                                            '::placeholder': {
                                                color: '#9ca3af',
                                            },
                                        },
                                        invalid: {
                                            color: '#ef4444',
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-800 leading-relaxed font-medium">
                            💡 Para modo de prueba, usa la tarjeta: <br />
                            <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code> con cualquier fecha futura y CVC.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !stripe}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {processing ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
                        </button>
                    </div>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
                    <span className="text-blue-500 text-lg">🔒</span>
                    <p className="text-xs text-gray-500 font-medium">
                        Pago seguro procesado por Stripe
                    </p>
                </div>
            </div>
        </div>
    );
};

