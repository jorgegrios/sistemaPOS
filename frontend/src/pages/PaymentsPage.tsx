/**
 * Payments Page
 * Payment history and management
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { Payment } from '../services/payment-service';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, _setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement getPayments endpoint in backend
    // For now, show placeholder
    setLoading(false);
  }, [user?.restaurantId]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      succeeded: { bg: 'bg-green-100', text: 'text-green-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      failed: { bg: 'bg-red-100', text: 'text-red-700' },
      refunded: { bg: 'bg-blue-100', text: 'text-blue-700' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Payments</h1>
        <p className="text-gray-600">Payment history and management</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No payments found</p>
            <p className="text-gray-400 text-sm">Payments will appear here once orders are completed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Provider</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{payment.transactionId}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {payment.currency} {(payment.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.provider}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(payment.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
