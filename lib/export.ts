/**
 * CSV Export Utilities for Client Tracker Pro
 * Generates downloadable CSV files for customers, invoices, and analytics
 */

interface Customer {
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_purchases: number;
  total_spent: number;
  last_purchase: string | null;
  membership_type?: string;
  store_credit?: number;
}

interface Invoice {
  invoice_id: string;
  customer_name: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
}

interface RevenueRecord {
  date: string;
  revenue: number;
  transactions: number;
}

/**
 * Convert array of objects to CSV format
 */
function convertToCSV<T extends Record<string, any>>(data: T[], columns: string[]): string {
  if (!data || data.length === 0) return '';

  // Header row
  const header = columns.join(',');

  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '""';
      }
      
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      
      // Handle dates
      if (value instanceof Date) {
        return `"${value.toISOString().split('T')[0]}"`;
      }
      
      // Handle numbers
      return value.toString();
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(customers: Customer[]) {
  const columns = [
    'client_id',
    'name',
    'email',
    'phone',
    'total_purchases',
    'total_spent',
    'last_purchase',
    'membership_type',
    'store_credit'
  ];

  const csv = convertToCSV(customers, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csv, `customers_export_${timestamp}.csv`);
}

/**
 * Export invoices to CSV
 */
export function exportInvoicesToCSV(invoices: Invoice[]) {
  const columns = [
    'invoice_id',
    'customer_name',
    'amount',
    'status',
    'issue_date',
    'due_date',
    'paid_date'
  ];

  const csv = convertToCSV(invoices, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csv, `invoices_export_${timestamp}.csv`);
}

/**
 * Export revenue data to CSV
 */
export function exportRevenueToCSV(revenueData: RevenueRecord[]) {
  const columns = ['date', 'revenue', 'transactions'];

  const csv = convertToCSV(revenueData, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csv, `revenue_report_${timestamp}.csv`);
}

/**
 * Export comprehensive analytics report
 */
export function exportAnalyticsReport(data: {
  summary: {
    total_customers: number;
    total_revenue: number;
    total_invoices: number;
    avg_order_value: number;
    repeat_rate: number;
  };
  topCustomers: Customer[];
  monthlyRevenue: RevenueRecord[];
}) {
  let csv = 'TechWealth CRM - Analytics Report\n';
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary section
  csv += '=== BUSINESS SUMMARY ===\n';
  csv += `Total Customers,${data.summary.total_customers}\n`;
  csv += `Total Revenue,${data.summary.total_revenue}\n`;
  csv += `Total Invoices,${data.summary.total_invoices}\n`;
  csv += `Average Order Value,${data.summary.avg_order_value}\n`;
  csv += `Repeat Purchase Rate,${data.summary.repeat_rate}%\n\n`;

  // Top customers section
  csv += '=== TOP CUSTOMERS ===\n';
  csv += 'Rank,Name,Total Spent,Purchases,Avg Order\n';
  data.topCustomers.forEach((customer, idx) => {
    csv += `${idx + 1},"${customer.name}",${customer.total_spent},${customer.total_purchases},${customer.total_spent / (customer.total_purchases || 1)}\n`;
  });

  csv += '\n';

  // Monthly revenue section
  csv += '=== MONTHLY REVENUE ===\n';
  csv += 'Date,Revenue,Transactions\n';
  data.monthlyRevenue.forEach(record => {
    csv += `${record.date},${record.revenue},${record.transactions}\n`;
  });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(csv, `analytics_report_${timestamp}.csv`, 'text/csv');
}
