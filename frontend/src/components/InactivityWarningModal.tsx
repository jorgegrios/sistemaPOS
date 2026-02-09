/**
 * Inactivity Warning Modal
 * Shows countdown warning before automatic logout
 */

import React, { useEffect, useState } from 'react';

interface InactivityWarningModalProps {
    isOpen: boolean;
    secondsRemaining: number;
    onStayLoggedIn: () => void;
    onLogout: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
    isOpen,
    secondsRemaining,
    onStayLoggedIn,
    onLogout
}) => {
    const [countdown, setCountdown] = useState(secondsRemaining);

    useEffect(() => {
        if (!isOpen) return;

        setCountdown(secondsRemaining);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, secondsRemaining]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-pulse">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏰</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Sesión por Expirar
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Tu sesión se cerrará automáticamente en{' '}
                        <span className="font-bold text-red-600 text-xl">{countdown}</span>{' '}
                        segundos por inactividad.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onStayLoggedIn}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition active:scale-95"
                        >
                            Continuar Sesión
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition active:scale-95"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
