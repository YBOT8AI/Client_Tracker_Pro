'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Search,
  Filter,
  Smartphone,
  Download
} from 'lucide-react';

interface WeChatPayment {
  id: string;
  transaction_id: string;
  out_trade_no: string | null;
  total_amount: number; // in fen
  payer_name: string | null;
  trade_type: string;
  bank_type: string | null;
  time_end: string;
  status: 'pending' | 'success' | 'closed' | 'revoked' | 'failed';
  reconciled: boolean;
  customer_name: string | null;
  customer_wechat: string | null;
  invoice_number: string | null;
}

export default function WeChatPaymentsPage() {
  const [payments, setPayments] = useState<WeChatPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadWeChatPayments();
  }, []);

  async function loadWeChatPayments() {
    try {
      const { data, error } = await supabase
        .from('wechat_pay_transactions')
        .select(`
          *,
          contacts (name, wechat_id),
          invoices (invoice_number)
        `)
        .order('time_end', { ascending: false });

      if (error) throw error;

      setPayments(data?.map(p => ({
        ...p,
        customer_name: (p.contacts as any)?.name || null,
        customer_wechat: (p.contacts as any)?.wechat_id || null,
        invoice_number: (p.invoices as any)?.invoice_number || null
      })) || []);
    } catch (error) {
      console.error('Error loading WeChat payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoMatch() {
    try {
      const { data, error } = await supabase.rpc('auto_match_wechat_payments');
      
      if (error) throw error;
      
      const matchedCount = data || 0;
      alert(`✅ Auto-matched ${matchedCount} WeChat payment(s) to invoices`);
      loadWeChatPayments();
    } catch (error: any) {
      console.error('Error auto-matching:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }

  function getStatusBadge(status: string, success?: boolean, reconciled?: boolean) {
    let badge;
    
    if (reconciled) {
      badge = { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: '已对账 Reconciled' };
    } else if (status === 'success' && success) {
      badge = { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: '支付成功 Success' };
    } else if (status === 'pending') {
      badge = { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: '待处理 Pending' };
    } else if (status === 'failed' || status === 'revoked') {
      badge = { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: '失败 Failed' };
    } else {
      badge = { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock, label: status };
    }
    
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  }

  function getTradeTypeBadge(tradeType: string) {
    const badges: Record<string, string> = {
      'JSAPI': '公众号/小程序',
      'NATIVE': '扫码支付',
      'APP': 'APP支付',
      'MWEB': 'H5页面',
      'MICROPAY': '付款码',
    };
    
    return badges[tradeType] || tradeType;
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.out_trade_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_wechat?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && p.status === 'success') ||
      (statusFilter === 'pending' && p.status === 'pending') ||
      (statusFilter === 'reconciled' && p.reconciled === true);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.length,
    successful: payments.filter(p => p.status === 'success').length,
    pending: payments.filter(p => p.status === 'pending').length,
    reconciled: payments.filter(p => p.reconciled === true).length,
    totalAmount: payments.reduce((sum, p) => sum + (p.total_amount / 100), 0), // Convert fen to yuan
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading WeChat Pay transactions...</div>
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
                💳 微信支付 WeChat Pay
              </h1>
              <p className="mt-2 text-gray-600">
                Mainland China payment reconciliation
              </p>
            </div>
            <nav className="flex gap-2">
              <a href="/" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Dashboard
              </a>
              <a href="/clients" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Clients
              </a>
              <a href="/analytics" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                📊 Analytics
              </a>
              <a href="/fps-payments" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                FPS HK
              </a>
              <a href="/wechat-payments" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                WeChat CN
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Transactions" value={stats.total} color="gray" />
          <StatCard label="Successful" value={stats.successful} color="blue" />
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Reconciled" value={stats.reconciled} color="green" />
          <StatCard label="Total Amount" value={`¥${stats.totalAmount.toLocaleString()}`} color="purple" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Manual Payment
          </button>
          <button
            onClick={handleAutoMatch}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            Auto-Match Invoices
          </button>
          <button
            onClick={() => alert('CSV import coming soon!')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Import from WeChat
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by transaction ID, order no, customer name or WeChat..."
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
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="reconciled">Reconciled</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              WeChat Pay Transactions ({filteredPayments.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.time_end).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-600">{payment.transaction_id}</div>
                      {payment.out_trade_no && (
                        <div className="text-xs text-gray-500">{payment.out_trade_no}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.customer_name || payment.payer_name || '-'}</div>
                      {payment.customer_wechat && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {payment.customer_wechat}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      ¥{(payment.total_amount / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getTradeTypeBadge(payment.trade_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.bank_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status, payment.status === 'success', payment.reconciled)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No WeChat Pay transactions found
            </div>
          )}
        </div>

        {/* Integration Guide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🔧 WeChat Pay Integration Setup
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Step 1:</strong> Apply for WeChat Pay Merchant at <a href="https://pay.weixin.qq.com" target="_blank" className="underline">pay.weixin.qq.com</a></p>
            <p><strong>Step 2:</strong> Get API credentials (AppID, MCHID, API Key)</p>
            <p><strong>Step 3:</strong> Configure webhook URL for payment notifications</p>
            <p><strong>Step 4:</strong> Use WeChat Pay API v3 for payment initiation and query</p>
            <p className="mt-2 text-blue-600"><strong>Note:</strong> Requires China business license and bank account</p>
          </div>
        </div>
      </main>

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal
          onClose={() => setShowAddModal(false)}
          onAdded={loadWeChatPayments}
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

function AddPaymentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [formData, setFormData] = useState({
    transaction_id: '',
    total_amount: '', // in yuan, will convert to fen
    payer_name: '',
    trade_type: 'NATIVE',
    time_end: new Date().toISOString(),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from('wechat_pay_transactions').insert({
        transaction_id: formData.transaction_id || `MANUAL-${Date.now()}`,
        total_amount: Math.round(parseFloat(formData.total_amount) * 100), // Convert yuan to fen
        payer_name: formData.payer_name,
        trade_type: formData.trade_type,
        time_end: formData.time_end,
        status: 'success',
        success: true,
        import_source: 'manual',
      });

      if (error) throw error;

      alert('✅ WeChat payment added successfully!');
      onAdded();
      onClose();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">➕ Add WeChat Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
            <input
              type="text"
              required
              value={formData.transaction_id}
              onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="From WeChat Pay dashboard"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (¥ CNY)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.total_amount}
              onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payer Name</label>
            <input
              type="text"
              value={formData.payer_name}
              onChange={(e) => setFormData({...formData, payer_name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
            <select
              value={formData.trade_type}
              onChange={(e) => setFormData({...formData, trade_type: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            >
              <option value="JSAPI">JSAPI (Mini Program)</option>
              <option value="NATIVE">NATIVE (QR Code)</option>
              <option value="APP">APP Payment</option>
              <option value="MWEB">MWEB (H5 Page)</option>
              <option value="MICROPAY">MICROPAY (Barcode)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Time</label>
            <input
              type="datetime-local"
              required
              value={formData.time_end}
              onChange={(e) => setFormData({...formData, time_end: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
