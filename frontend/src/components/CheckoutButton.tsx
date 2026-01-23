import React, { useState } from 'react';

/**
 * CheckoutButton Component
 * Manages the final financial transaction trigger following ALDELO/FACTA specs.
 * States: Idle, Processing, Success, Declined
 */

export type CheckoutStatus = 'idle' | 'processing' | 'success' | 'declined';

interface CheckoutButtonProps {
    amount: number;
    onCheckout: () => Promise<void>;
    disabled?: boolean;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
    amount,
    onCheckout,
    disabled = false
}) => {
    const [status, setStatus] = useState<CheckoutStatus>('idle');

    const handlePress = async () => {
        try {
            setStatus('processing');
            await onCheckout();
            setStatus('success');
        } catch (error) {
            console.error('[CheckoutButton] Transaction failed:', error);
            setStatus('declined');
            // Reset to idle after some time to allow retry
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const getButtonContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Transaction...
                    </span>
                );
            case 'success':
                return (
                    <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">✅</span> Payment Successful
                    </span>
                );
            case 'declined':
                return (
                    <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">❌</span> Payment Declined
                    </span>
                );
            default:
                return (
                    <span className="flex items-center justify-center gap-2">
                        💳 Process Payment ${amount.toFixed(2)}
                    </span>
                );
        }
    };

    const statusColors = {
        idle: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
        processing: 'bg-blue-600 cursor-not-allowed',
        success: 'bg-emerald-500 cursor-default',
        declined: 'bg-red-600 cursor-default'
    };

    return (
        <div className="w-full">
            <button
                onClick={handlePress}
                disabled={disabled || status !== 'idle'}
                className={`w-full text-white px-6 py-5 rounded-lg font-semibold text-lg sm:text-xl transition-all duration-200 transform active:scale-95 shadow-lg ${statusColors[status]} disabled:opacity-50`}
            >
                {getButtonContent()}
            </button>

            {status === 'declined' && (
                <p className="text-red-500 text-center text-sm mt-2 font-medium">
                    Pago rechazado. Por favor use otra tarjeta o consulte con su banco.
                </p>
            )}

            <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-tighter">
                PCI-DSS Compliant • Secure Tokenization Active
            </p>
        </div>
    );
};
