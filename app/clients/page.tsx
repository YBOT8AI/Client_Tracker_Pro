'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportCustomersToCSV } from '@/lib/export';
import { UserPlus, Search, Download } from 'lucide-react';

export default function ClientsPage() {
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    email: '',
    phone: '',
    referred_by: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let referredById = null;
      if (formData.referred_by) {
        const { data: referrer } = await supabase
          .from('clients')
          .select('id')
          .eq('client_id', formData.referred_by)
          .single();
        referredById = referrer?.id || null;
      }

      const { error } = await supabase.from('clients').insert({
        client_id: formData.client_id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        referred_by: referredById
      });

      if (error) throw error;

      setMessage('✅ Client added successfully!');
      setFormData({ client_id: '', name: '', email: '', phone: '', referred_by: '' });
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportAllClients() {
    try {
      const { data: allClients, error } = await supabase
        .from('client_stats')
        .select('*');

      if (error) throw error;
      if (!allClients || allClients.length === 0) {
        alert('No client data to export');
        return;
      }

      exportCustomersToCSV(allClients);
    } catch (error: any) {
      console.error('Error exporting clients:', error);
      alert(`Failed to export clients: ${error.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">👥 Client Management</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportAllClients}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
              <nav className="flex gap-2">
                <a href="/" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Dashboard
                </a>
                <a href="/clients" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  Clients
                </a>
                <a href="/purchases" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Purchases
                </a>
                <a href="/analytics" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  📊 Analytics
                </a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client ID *</label>
            <input
              type="text"
              required
              value={formData.client_id}
              onChange={(e) => setFormData({...formData, client_id: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="e.g., CLI-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="+852 XXXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Referred By (Client ID)</label>
            <input
              type="text"
              value={formData.referred_by}
              onChange={(e) => setFormData({...formData, referred_by: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              placeholder="Referrer's Client ID (optional)"
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
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add Client'}
          </button>
        </form>
      </main>
    </div>
  );
}
