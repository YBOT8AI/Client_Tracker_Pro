/**
 * IRD Tax Invoice Generator - Hong Kong Compliance
 * 
 * Requirements per Inland Revenue Department:
 * - Sequential invoice numbering (legal requirement)
 * - Business Registration Number display
 * - Company name and address
 * - Tax invoice clear labeling
 * - 7-year data retention
 */

export interface IRDInvoiceConfig {
  companyName: string;
  companyNameZh?: string;
  brNumber: string; // Business Registration Number
  address: string;
  addressZh?: string;
  phone: string;
  email: string;
  logoUrl?: string;
  companyChopUrl?: string; // Company chop/stamp image
}

export interface IRDInvoiceLineItem {
  description: string;
  descriptionZh?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface IRDInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerNameZh?: string;
  customerAddress: string;
  customerAddressZh?: string;
  customerBRNumber?: string;
  lineItems: IRDInvoiceLineItem[];
  subtotal: number;
  taxRate: number; // Usually 0% for most HK services, but support it
  taxAmount: number;
  totalAmount: number;
  currency: 'HKD' | 'CNY';
  notes?: string;
  notesZh?: string;
  paymentTerms: string;
  paymentTermsZh?: string;
}

/**
 * Generate sequential invoice number per IRD requirements
 * Format: INV-YYYY-NNNNN (year + 5-digit sequence)
 */
export function generateSequentialInvoiceNumber(
  year: number,
  lastSequence: number
): string {
  const sequence = String(lastSequence + 1).padStart(5, '0');
  return `INV-${year}-${sequence}`;
}

/**
 * Validate HK Business Registration Number format
 * Format: 8 digits + dash + check digit (e.g., 12345678-000)
 * Or short format: 123456-789
 */
export function validateBRNumber(brNumber: string): boolean {
  // Remove spaces and normalize
  const normalized = brNumber.replace(/\s/g, '');
  
  // Full format: 8 digits + dash + 3 digit check
  const fullPattern = /^\d{8}-\d{3}$/;
  // Short format: 6-7 digits + dash + 3 digits
  const shortPattern = /^\d{6,7}-\d{3}$/;
  
  return fullPattern.test(normalized) || shortPattern.test(normalized);
}

/**
 * Format BR number for display
 */
export function formatBRNumber(brNumber: string): string {
  const normalized = brNumber.replace(/\s/g, '');
  
  if (/^\d{8}$/.test(normalized)) {
    return `${normalized.substring(0, 8)}-000`;
  }
  
  if (/^\d{6,7}$/.test(normalized)) {
    return normalized;
  }
  
  return brNumber;
}

/**
 * Generate IRD-compliant invoice HTML
 */
export function generateIRDInvoiceHTML(
  config: IRDInvoiceConfig,
  data: IRDInvoiceData
): string {
  const isTraditionalChinese = !!config.companyNameZh;
  
  return `<!DOCTYPE html>
<html lang="${isTraditionalChinese ? 'zh-HK' : 'en-HK'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1a1a1a;
    }
    .company-info h1 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .company-info-zh {
      font-size: 20px;
      color: #666;
      margin-bottom: 8px;
    }
    .company-details {
      font-size: 14px;
      color: #444;
    }
    .company-details p {
      margin: 4px 0;
    }
    .br-number {
      font-weight: bold;
      margin-top: 8px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .invoice-title-zh {
      font-size: 24px;
      color: #666;
      margin-bottom: 12px;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .invoice-dates {
      font-size: 14px;
      color: #666;
    }
    .invoice-dates p {
      margin: 4px 0;
    }
    .customer-section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .customer-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #1a1a1a;
    }
    .customer-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .customer-name-zh {
      font-size: 16px;
      color: #666;
      margin-bottom: 8px;
    }
    .customer-address {
      font-size: 14px;
      color: #444;
      margin: 4px 0;
    }
    .customer-br {
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #1a1a1a;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
    }
    .items-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-box {
      width: 300px;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
    }
    .total-row:last-child {
      border-bottom: none;
    }
    .total-row.grand-total {
      background: #1a1a1a;
      color: white;
      margin-top: 10px;
      padding: 12px;
      border-radius: 4px;
      font-size: 18px;
      font-weight: bold;
    }
    .notes-section {
      margin-bottom: 40px;
    }
    .notes-box {
      background: #fffbea;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      font-size: 14px;
    }
    .notes-box p {
      margin: 4px 0;
    }
    .payment-section {
      margin-bottom: 40px;
    }
    .payment-box {
      background: #f0f9ff;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #0284c7;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .chop-section {
      margin-top: 40px;
      text-align: right;
    }
    .chop-placeholder {
      display: inline-block;
      width: 150px;
      height: 150px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="invoice-header">
    <div class="company-info">
      <h1>${escapeHtml(config.companyName)}</h1>
      ${config.companyNameZh ? `<div class="company-info-zh">${escapeHtml(config.companyNameZh)}</div>` : ''}
      <div class="company-details">
        <p>${escapeHtml(config.address)}</p>
        ${config.addressZh ? `<p>${escapeHtml(config.addressZh)}</p>` : ''}
        <p>Tel: ${escapeHtml(config.phone)}</p>
        <p>Email: ${escapeHtml(config.email)}</p>
        <p class="br-number">B.R. No.: ${formatBRNumber(config.brNumber)}</p>
      </div>
    </div>
    
    <div class="invoice-meta">
      <div class="invoice-title">TAX INVOICE</div>
      ${isTraditionalChinese ? '<div class="invoice-title-zh">稅務發票</div>' : ''}
      <div class="invoice-number">${escapeHtml(data.invoiceNumber)}</div>
      <div class="invoice-dates">
        <p>Date: ${formatDate(data.invoiceDate)}</p>
        <p>Due Date: ${formatDate(data.dueDate)}</p>
      </div>
    </div>
  </div>

  <!-- Customer -->
  <div class="customer-section">
    <div class="section-title">Bill To</div>
    <div class="customer-box">
      <div class="customer-name">${escapeHtml(data.customerName)}</div>
      ${data.customerNameZh ? `<div class="customer-name-zh">${escapeHtml(data.customerNameZh)}</div>` : ''}
      <div class="customer-address">${escapeHtml(data.customerAddress).replace(/\n/g, '<br>')}</div>
      ${data.customerAddressZh ? `<div class="customer-address">${escapeHtml(data.customerAddressZh).replace(/\n/g, '<br>')}</div>` : ''}
      ${data.customerBRNumber ? `<div class="customer-br">B.R. No.: ${formatBRNumber(data.customerBRNumber)}</div>` : ''}
    </div>
  </div>

  <!-- Line Items -->
  <table class="items-table">
    <thead>
      <tr>
        <th width="50%">Description</th>
        <th width="10%" class="text-center">Qty</th>
        <th width="10%" class="text-center">Unit</th>
        <th width="15%" class="text-right">Unit Price</th>
        <th width="15%" class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.lineItems.map(item => `
        <tr>
          <td>
            ${escapeHtml(item.description)}
            ${item.descriptionZh ? `<br><small style="color:#666">${escapeHtml(item.descriptionZh)}</small>` : ''}
          </td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-center">${escapeHtml(item.unit)}</td>
          <td class="text-right">${formatCurrency(item.unitPrice, data.currency)}</td>
          <td class="text-right">${formatCurrency(item.amount, data.currency)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.subtotal, data.currency)}</span>
      </div>
      ${data.taxRate > 0 ? `
        <div class="total-row">
          <span>Tax (${data.taxRate}%):</span>
          <span>${formatCurrency(data.taxAmount, data.currency)}</span>
        </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>TOTAL:</span>
        <span>${formatCurrency(data.totalAmount, data.currency)}</span>
      </div>
    </div>
  </div>

  <!-- Notes -->
  ${(data.notes || data.notesZh) && (
    `<div class="notes-section">
      <div class="section-title">Notes</div>
      <div class="notes-box">
        ${data.notes ? `<p>${escapeHtml(data.notes)}</p>` : ''}
        ${data.notesZh ? `<p>${escapeHtml(data.notesZh)}</p>` : ''}
      </div>
    </div>`
  )}

  <!-- Payment Terms -->
  <div class="payment-section">
    <div class="section-title">Payment Terms</div>
    <div class="payment-box">
      <p><strong>English:</strong> ${escapeHtml(data.paymentTerms)}</p>
      ${data.paymentTermsZh ? `<p><strong>中文：</strong>${escapeHtml(data.paymentTermsZh)}</p>` : ''}
      <p style="margin-top: 12px;"><strong>Payment Methods:</strong></p>
      <p>• FPS (Faster Payment System)</p>
      <p>• Bank Transfer</p>
      <p>• Cheque</p>
    </div>
  </div>

  <!-- Company Chop -->
  ${config.companyChopUrl ? `
    <div class="chop-section">
      <img src="${config.companyChopUrl}" alt="Company Chop" style="width: 150px; height: 150px;" />
    </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <p>This is a computer-generated invoice. No signature required.</p>
    <p>© ${new Date().getFullYear()} ${escapeHtml(config.companyName)}. All rights reserved.</p>
    <p>Business Registration No.: ${formatBRNumber(config.brNumber)}</p>
  </div>
</body>
</html>`;
}

/**
 * Helper: Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for Node.js
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper: Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-HK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper: Format currency
 */
function formatCurrency(amount: number, currency: 'HKD' | 'CNY'): string {
  const symbol = currency === 'HKD' ? 'HK$' : '¥';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate PDF-ready invoice (returns HTML that can be printed to PDF)
 */
export function generatePrintableInvoice(
  config: IRDInvoiceConfig,
  data: IRDInvoiceData
): string {
  return generateIRDInvoiceHTML(config, data);
}

/**
 * Validate invoice data before generation
 */
export function validateInvoiceData(data: IRDInvoiceData): string[] {
  const errors: string[] = [];
  
  if (!data.invoiceNumber) errors.push('Invoice number is required');
  if (!data.invoiceDate) errors.push('Invoice date is required');
  if (!data.dueDate) errors.push('Due date is required');
  if (!data.customerName) errors.push('Customer name is required');
  if (!data.customerAddress) errors.push('Customer address is required');
  if (!data.lineItems || data.lineItems.length === 0) {
    errors.push('At least one line item is required');
  }
  if (data.subtotal < 0) errors.push('Subtotal cannot be negative');
  if (data.totalAmount < 0) errors.push('Total amount cannot be negative');
  
  // Validate line items
  data.lineItems?.forEach((item, index) => {
    if (!item.description) {
      errors.push(`Line item ${index + 1}: Description is required`);
    }
    if (item.quantity <= 0) {
      errors.push(`Line item ${index + 1}: Quantity must be positive`);
    }
    if (item.unitPrice < 0) {
      errors.push(`Line item ${index + 1}: Unit price cannot be negative`);
    }
  });
  
  return errors;
}
