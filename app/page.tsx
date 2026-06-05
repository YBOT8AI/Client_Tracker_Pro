'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, ShoppingCart, Bell, TrendingUp } from 'lucide-react';

interface ClientStats {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_purchases: number;
  total_spent: number;
  avg_order_value: number;
  last_purchase: string | null;
  days_since_last_purchase: number | null;
}

interface Reminder {
  id: string;
  client_id: string;
  reminder_date: string;
  reason: string;
  status: string;
  client_name: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ClientStats[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Fetch client stats
      const { data: statsData, error: statsError } = await supabase
        .from('client_stats')
        .select('*')
        .order('total_spent', { ascending: false });

      // Fetch pending reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select(`
          *,
          clients (name)
        `)
        .eq('status', 'pending')
        .eq('reminder_date', new Date().toISOString().split('T')[0])
        .limit(10);

      if (statsError) throw statsError;
      if (remindersError) throw remindersError;

      setStats(statsData || []);
      setReminders(remindersData?.map(r => ({
        ...r,
        client_name: (r.clients as any)?.name || 'Unknown'
      })) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = stats.reduce((sum, s) => sum + s.total_spent, 0);
  const totalClients = stats.length;
  const activeReminders = reminders.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Client Tracker Pro
          </h1>
          <p className="mt-2 text-gray-600">
            Track purchases, referrals, and follow-ups
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-8 h-8" />}
            label="Total Clients"
            value={totalClients}
            color="blue"
          />
          <StatCard
            icon={<ShoppingCart className="w-8 h-8" />}
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            label="Avg Order Value"
            value={totalClients > 0 ? `$${(totalRevenue / stats.reduce((sum, s) => sum + s.total_purchases, 0) || 0).toFixed(2)}` : '$0'}
            color="purple"
          />
          <StatCard
            icon={<Bell className="w-8 h-8" />}
            label="Follow-ups Due"
            value={activeReminders}
            color="yellow"
          />
        </div>

        {/* Reminders Section */}
        {activeReminders > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                🔔 Follow-ups Due Today
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{reminder.client_name}</p>
                      <p className="text-sm text-gray-600">{reminder.reason}</p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Clients Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              📊 Top Clients by Revenue
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Purchases</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.slice(0, 10).map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {client.client_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {client.total_purchases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      ${client.total_spent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${client.avg_order_value.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {client.last_purchase 
                        ? `${new Date(client.last_purchase).toLocaleDateString()} (${client.days_since_last_purchase}d ago)`
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  color: 'blue' | 'green' | 'purple' | 'yellow' 
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
