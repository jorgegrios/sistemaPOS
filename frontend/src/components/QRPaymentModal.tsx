import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { paymentService, Payment } from '../services/payment-service';
import { toast } from 'sonner';

interface QRPaymentModalProps {
    paymentId: string;
    onSuccess: (payment: Payment) => void;
    onCancel: () => void;
}

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
    paymentId,
    onSuccess,
    onCancel
}) => {
    const [qrData, setQrData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                setLoading(true);
                // This endpoint was added to the backend in the previous step
                const data = await fetch(`/api/v1/payments/${paymentId}/qr`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }).then(res => res.json());

                setQrData(data);
            } catch (error) {
                console.error('[QRPaymentModal] Error fetching QR:', error);
                toast.error('Error al generar código QR');
            } finally {
                setLoading(false);
            }
        };

        fetchQR();
    }, [paymentId]);

    // Polling for payment status
    useEffect(() => {
        if (!polling) return;

        const interval = setInterval(async () => {
            try {
                const payment = await paymentService.getPayment(paymentId);
                if (payment.status === 'completed') {
                    setPolling(false);
                    onSuccess(payment);
                }
            } catch (error) {
                console.error('[QRPaymentModal] Polling error:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [paymentId, polling, onSuccess]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
                <div className="bg-indigo-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Pago con Código QR</h2>
                    <p className="text-indigo-100 text-sm mt-1">Escanee con su aplicación bancaria</p>
                </div>

                <div className="p-8 flex flex-col items-center">
                    {loading ? (
                        <div className="flex flex-col items-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-gray-500 font-medium">Generando código seguro...</p>
                        </div>
                    ) : qrData ? (
                        <>
                            <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-gray-100 mb-6">
                                <QRCode
                                    value={qrData.qrData}
                                    size={200}
                                    level="H"
                                />
                            </div>

                            <div className="text-center mb-8">
                                <p className="text-lg font-semibold text-gray-800 uppercase flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Esperando confirmación...
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Proveedor: <span className="font-bold text-indigo-600 capitalize">{qrData.provider}</span>
                                </p>
                            </div>

                            {qrData.type === 'url' && (
                                <a
                                    href={qrData.qrData}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 text-sm underline mb-6 hover:text-indigo-800 transition-colors"
                                >
                                    ¿No puede escanear? Haga clic aquí
                                </a>
                            )}
                        </>
                    ) : (
                        <div className="text-red-500 text-center py-12">
                            <p className="font-bold">Error al cargar datos de pago</p>
                            <button
                                onClick={onCancel}
                                className="mt-4 text-gray-600 underline"
                            >
                                Volver y reintentar
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onCancel}
                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all active:scale-95"
                    >
                        Cancelar Pago
                    </button>
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                        SAAS POS SECURE QR GATEWAY • MULTI-TENANT ISOLATION ACTIVE
                    </p>
                </div>
            </div>
        </div>
    );
};
