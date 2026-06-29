'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart } from 'lucide-react';

interface Client {
  id: string;
  client_id: string;
  name: string;
}

export default function PurchasesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    store_name: '',
    amount: '',
    items: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, client_id, name')
      .order('name');
    setClients(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const client = clients.find(c => c.client_id === formData.client_id);
      if (!client) throw new Error('Client not found');

      const { error } = await supabase.from('purchases').insert({
        client_id: client.id,
        store_name: formData.store_name,
        amount: parseFloat(formData.amount),
        items: formData.items || null,
        purchase_date: formData.purchase_date
      });

      if (error) throw error;

      setMessage('✅ Purchase recorded successfully!');
      setFormData({
        client_id: '',
        store_name: '',
        amount: '',
        items: '',
        purchase_date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">🛍️ Purchase Tracking</h1>
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
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Purchases
              </a>
              <a
                href="/analytics"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                📊 Analytics
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client ID *</label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({...formData, client_id: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            >
              <option value="">Select client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.client_id}>
                  {client.client_id} - {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Store Name *</label>
            <input
              type="text"
              required
              value={formData.store_name}
              onChange={(e) => setFormData({...formData, store_name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="e.g., Central Store, Tsim Sha Tsui Branch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (HKD) *</label>
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
            <label className="block text-sm font-medium text-gray-700">Items/Services</label>
            <textarea
              value={formData.items}
              onChange={(e) => setFormData({...formData, items: e.target.value})}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="List of items or services purchased"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Date *</label>
            <input
              type="date"
              required
              value={formData.purchase_date}
              onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-md ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            {loading ? 'Recording...' : 'Record Purchase'}
          </button>
        </form>
      </main>
    </div>
  );
}
