'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface FPSPayment {
  id: string;
  fps_reference_id: string;
  amount: number;
  currency: string;
  payer_name: string;
  payer_account: string | null;
  payer_bank: string | null;
  transaction_date: string;
  remark: string | null;
  status: 'pending' | 'matched' | 'reconciled' | 'failed';
  customer_name: string | null;
  invoice_number: string | null;
}

export default function FPSPaymentsPage() {
  const [payments, setPayments] = useState<FPSPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadFPSPayments();
  }, []);

  async function loadFPSPayments() {
    try {
      const { data, error } = await supabase
        .from('fps_payments')
        .select(`
          *,
          contacts (name),
          invoices (invoice_number)
        `)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      setPayments(data?.map(p => ({
        ...p,
        customer_name: (p.contacts as any)?.name || null,
        invoice_number: (p.invoices as any)?.invoice_number || null
      })) || []);
    } catch (error) {
      console.error('Error loading FPS payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoMatch() {
    try {
      // Call the auto-match function
      const { data, error } = await supabase.rpc('auto_match_fps_payments');
      
      if (error) throw error;
      
      const matchedCount = data || 0;
      alert(`✅ Auto-matched ${matchedCount} payment(s) to invoices`);
      loadFPSPayments();
    } catch (error: any) {
      console.error('Error auto-matching:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      matched: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Matched' },
      reconciled: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Reconciled' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Failed' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.fps_reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    matched: payments.filter(p => p.status === 'matched').length,
    reconciled: payments.filter(p => p.status === 'reconciled').length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading FPS payments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💳 FPS Payment Tracking
              </h1>
              <p className="mt-2 text-gray-600">
                Hong Kong Faster Payment System reconciliation
              </p>
            </div>
            <nav className="flex gap-2">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/clients"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clients
              </a>
              <a
                href="/purchases"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Purchases
              </a>
              <a
                href="/analytics"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                📊 Analytics
              </a>
              <a
                href="/fps-payments"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                FPS Payments
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Payments" value={stats.total} color="gray" />
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Matched" value={stats.matched} color="blue" />
          <StatCard label="Reconciled" value={stats.reconciled} color="green" />
          <StatCard label="Total Amount" value={`HK$${stats.totalAmount.toLocaleString()}`} color="purple" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Manual Payment
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV from Bank
          </button>
          <button
            onClick={handleAutoMatch}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Auto-Match Invoices
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by reference, payer name, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="matched">Matched</option>
            <option value="reconciled">Reconciled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              FPS Transactions ({filteredPayments.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.transaction_date).toLocaleDateString('en-HK')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {payment.fps_reference_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.payer_name}</div>
                      {payment.payer_account && (
                        <div className="text-xs text-gray-500">{payment.payer_account}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      HK${payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.payer_bank || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customer_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No FPS payments found. Add manually or import from your bank app.
            </div>
          )}
        </div>
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImported={loadFPSPayments}
        />
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal
          onClose={() => setShowAddModal(false)}
          onAdded={loadFPSPayments}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-50 text-gray-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color].split(' ')[1]}`}>{value}</p>
    </div>
  );
}

// Placeholder modals - to be implemented
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">📥 Import FPS CSV</h3>
        <p className="text-gray-600 mb-4">
          Upload CSV export from your banking app (HSBC, Hang Seng, BOC, etc.)
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert('CSV import coming soon!');
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPaymentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    fps_reference_id: '',
    amount: '',
    payer_name: '',
    payer_bank: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('fps_payments').insert({
        fps_reference_id: formData.fps_reference_id || `MANUAL-${Date.now()}`,
        amount: parseFloat(formData.amount),
        payer_name: formData.payer_name,
        payer_bank: formData.payer_bank || 'Manual Entry',
        transaction_date: formData.transaction_date,
        status: 'pending',
        import_source: 'manual',
      });

      if (error) throw error;

      alert('✅ Payment added successfully!');
      onAdded();
      onClose();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">➕ Add FPS Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">FPS Reference ID</label>
            <input
              type="text"
              required
              value={formData.fps_reference_id}
              onChange={(e) => setFormData({...formData, fps_reference_id: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="From bank app/statement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (HKD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payer Name</label>
            <input
              type="text"
              required
              value={formData.payer_name}
              onChange={(e) => setFormData({...formData, payer_name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="As shown in bank app"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank</label>
            <select
              value={formData.payer_bank}
              onChange={(e) => setFormData({...formData, payer_bank: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            >
              <option value="">Select bank</option>
              <option value="HSBC">HSBC</option>
              <option value="Hang Seng">Hang Seng</option>
              <option value="BOC">Bank of China</option>
              <option value="Standard Chartered">Standard Chartered</option>
              <option value="Citi">Citi</option>
              <option value="DBS">DBS</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
            <input
              type="date"
              required
              value={formData.transaction_date}
              onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
