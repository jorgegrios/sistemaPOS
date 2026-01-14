/**
 * Cash Register Summary Modal
 * Shows daily cash register summary with totals by payment method
 */

import React, { useEffect, useState } from 'react';
import { cashierService, CashRegisterSummary } from '../services/cashier-service';
import { toast } from 'sonner';

interface CashRegisterSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashRegisterSummaryModal: React.FC<CashRegisterSummaryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await cashierService.getCashRegisterSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading cash register summary:', error);
      toast.error('Error al cargar el cuadre de caja');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">💰 Cuadre de Caja</h2>
            <p className="text-green-100 text-sm">
              {summary?.date ? new Date(summary.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Resumen del día'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition btn-touch"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Totals Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl border-2 border-green-300">
                  <p className="text-green-600 text-sm font-semibold mb-1">Efectivo</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${summary.totalCash.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {summary.totalsByMethod.cash?.count || 0} transacciones
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-4 rounded-xl border-2 border-blue-300">
                  <p className="text-blue-600 text-sm font-semibold mb-1">Tarjeta</p>
                  <p className="text-2xl font-bold text-blue-800">
                    ${summary.totalCard.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {summary.totalsByMethod.card?.count || 0} transacciones
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-xl border-2 border-purple-300">
                  <p className="text-purple-600 text-sm font-semibold mb-1">Otros</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ${summary.totalOther.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {Object.values(summary.totalsByMethod)
                      .filter((_, idx) => idx > 1)
                      .reduce((sum, method) => sum + method.count, 0)} transacciones
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-100 to-violet-100 p-4 rounded-xl border-2 border-indigo-300">
                  <p className="text-indigo-600 text-sm font-semibold mb-1">Total</p>
                  <p className="text-2xl font-bold text-indigo-800">
                    ${summary.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {summary.totalTransactions} transacciones
                  </p>
                </div>
              </div>

              {/* Cash Drawer Info */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-800 font-semibold mb-1">💰 Base de Caja</p>
                    <p className="text-xl font-bold text-amber-900">
                      ${summary.cashBase.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-800 font-semibold mb-1">Efectivo Esperado</p>
                    <p className="text-xl font-bold text-amber-900">
                      ${summary.expectedCash.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Desglose por Método de Pago</h3>
                <div className="space-y-2">
                  {Object.entries(summary.totalsByMethod).map(([method, data]) => (
                    <div
                      key={method}
                      className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {method === 'cash' ? '💵' : method === 'card' ? '💳' : '📱'}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800 capitalize">
                            {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method}
                          </p>
                          <p className="text-xs text-gray-500">{data.count} transacciones</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        ${data.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Payments */}
              {summary.payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Transacciones Recientes</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {summary.payments.slice(0, 20).map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {payment.orderNumber ? `Orden ${payment.orderNumber}` : 'Pago General'}
                            {payment.tableNumber && ` - Mesa ${payment.tableNumber}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-gray-800">
                            ${payment.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {payment.paymentMethod === 'cash' ? 'Efectivo' : payment.paymentMethod === 'card' ? 'Tarjeta' : payment.paymentMethod}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold btn-touch transition active:scale-95"
          >
            Cerrar
          </button>
          <button
            onClick={loadSummary}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold btn-touch transition active:scale-95"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

