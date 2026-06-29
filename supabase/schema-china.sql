-- China Market Localization Schema
-- Phase 4: WeChat Pay, Fapiao, Simplified Chinese, China Compliance

-- ========================================
-- 1. Enhanced Companies Table (China Fields)
-- ========================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_zh_cn VARCHAR(255); -- Simplified Chinese name
ALTER TABLE companies ADD COLUMN IF NOT EXISTS usci_code VARCHAR(18); -- 统一社会信用代码 (Unified Social Credit Code)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(255); -- 法定代表人
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_id_cn VARCHAR(50); -- 纳税人识别号
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registered_capital DECIMAL(15, 2); -- 注册资本
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registered_currency VARCHAR(3) DEFAULT 'CNY'; -- CNY only for mainland
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type_cn VARCHAR(50); -- 有限责任公司，股份有限公司，etc.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_cn VARCHAR(100); -- 行业分类
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_authority VARCHAR(255); -- 登记机关
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_scope TEXT; -- 经营范围

-- Index for USCI code lookups
CREATE INDEX IF NOT EXISTS idx_companies_usci_code ON companies(usci_code);

-- ========================================
-- 2. Enhanced Contacts Table (China Fields)
-- ========================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name_zh_cn VARCHAR(255); -- 中文名 (简体)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name_pinyin VARCHAR(255); -- 拼音姓名
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS china_id VARCHAR(18); -- 中国大陆身份证
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(100); -- 微信号
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(128); -- WeChat OpenID (for API)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS alipay_user_id VARCHAR(100); -- Alipay User ID
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_cn VARCHAR(20); -- +86 format
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS province_cn VARCHAR(50); -- 省份
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city_cn VARCHAR(50); -- 城市
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS district_cn VARCHAR(50); -- 区/县
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_cn TEXT; -- 详细地址 (中文)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_title_zh_cn VARCHAR(100); -- 职位 (简体)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS department_cn VARCHAR(100); -- 部门
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday_lunar BOOLEAN DEFAULT false; -- 农历生日
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zodiac_sign VARCHAR(20); -- 生肖 (Rat, Ox, Tiger, etc.)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hometown_cn VARCHAR(100); -- 籍贯

-- Indexes for China-specific lookups
CREATE INDEX IF NOT EXISTS idx_contacts_wechat ON contacts(wechat_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_cn ON contacts(phone_cn);
CREATE INDEX IF NOT EXISTS idx_contacts_china_id ON contacts(china_id);

-- ========================================
-- 3. WeChat Pay Transactions Table
-- ========================================

CREATE TABLE IF NOT EXISTS wechat_pay_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- WeChat Pay Transaction Details
  transaction_id VARCHAR(128) UNIQUE NOT NULL, -- 微信支付订单号
  out_trade_no VARCHAR(64), -- 商户订单号 (our order number)
  
  -- Amount Details
  total_amount INTEGER NOT NULL, -- Total in fen (分), e.g., 10000 = ¥100.00
  payer_total INTEGER, -- User paid amount (after discounts)
  discount_amount INTEGER DEFAULT 0, -- Discount/coupon amount
  currency VARCHAR(3) DEFAULT 'CNY',
  
  -- Payer Information
  payer_openid VARCHAR(128), -- Payer's WeChat OpenID
  payer_name VARCHAR(255), -- Real name (if available)
  
  -- Transaction Type
  trade_type VARCHAR(20) CHECK (trade_type IN ('JSAPI', 'NATIVE', 'APP', 'MWEB', 'MICROPAY')),
  bank_type VARCHAR(50), -- 付款银行
  bank_name VARCHAR(100), -- Bank name
  
  -- Timestamps
  time_start TIMESTAMP WITH TIME ZONE NOT NULL, -- Transaction start
  time_end TIMESTAMP WITH TIME ZONE, -- Transaction completion
  time_paid TIMESTAMP WITH TIME ZONE, -- Payment time
  
  -- Status
  success BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'closed', 'revoked', 'failed')),
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID REFERENCES users(id),
  
  -- Technical Details
  device_info VARCHAR(50), -- Device type
  scene_info TEXT, -- Scene information (JSON)
  
  -- Error Handling
  err_code VARCHAR(50), -- Error code if failed
  err_code_des TEXT, -- Error description
  
  -- Metadata
  remark TEXT, -- Payment remark/note
  attach TEXT, -- Custom attachment data (JSON)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Import tracking
  import_source VARCHAR(50) DEFAULT 'api', -- 'api', 'csv_import', 'manual'
  import_batch_id VARCHAR(100)
);

-- Indexes for WeChat Pay transactions
CREATE INDEX IF NOT EXISTS idx_wechat_transaction_id ON wechat_pay_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_wechat_out_trade_no ON wechat_pay_transactions(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_wechat_customer ON wechat_pay_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wechat_invoice ON wechat_pay_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_wechat_status ON wechat_pay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wechat_time ON wechat_pay_transactions(time_end);
CREATE INDEX IF NOT EXISTS idx_wechat_openid ON wechat_pay_transactions(payer_openid);

-- ========================================
-- 4. Alipay Transactions Table
-- ========================================

CREATE TABLE IF NOT EXISTS alipay_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Alipay Transaction Details
  trade_no VARCHAR(128) UNIQUE NOT NULL, -- 支付宝交易号
  out_trade_no VARCHAR(64), -- 商户订单号
  
  -- Amount Details
  total_amount DECIMAL(10, 2) NOT NULL,
  buyer_logon_id VARCHAR(100), -- Buyer's Alipay login ID (masked)
  buyer_user_id VARCHAR(128), -- Buyer's Alipay user ID
  
  -- Transaction Details
  subject VARCHAR(255), -- Order title
  body TEXT, -- Order description
  trade_status VARCHAR(50) DEFAULT 'WAIT_BUYER_PAY',
  
  -- Payment Method
  fund_bill_list TEXT, -- Funding details (JSON)
  point_amount DECIMAL(10, 2), -- Points used
  
  -- Timestamps
  send_pay_date DATE, -- Payment date
  invoice_amount DECIMAL(10, 2), -- Invoice amount
  
  -- Reconciliation
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  import_source VARCHAR(50) DEFAULT 'api'
);

-- Indexes for Alipay
CREATE INDEX IF NOT EXISTS idx_alipay_trade_no ON alipay_transactions(trade_no);
CREATE INDEX IF NOT EXISTS idx_alipay_out_trade_no ON alipay_transactions(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_alipay_customer ON alipay_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_alipay_status ON alipay_transactions(trade_status);

-- ========================================
-- 5. Fapiao (发票) Table - China Tax Invoices
-- ========================================

CREATE TABLE IF NOT EXISTS fapiao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Fapiao Identification
  fapiao_code VARCHAR(10) NOT NULL, -- 发票代码 (10 digits)
  fapiao_number VARCHAR(8) NOT NULL, -- 发票号码 (8 digits)
  
  -- Fapiao Type
  fapiao_type VARCHAR(20) NOT NULL CHECK (fapiao_type IN ('special', 'general', 'electronic')),
  -- special = 增值税专用发票 (VAT special, deductible)
  -- general = 增值税普通发票 (VAT general, not deductible)
  -- electronic = 增值税电子普通发票 (E-invoice)
  
  -- Buyer Information (购买方)
  buyer_name VARCHAR(255) NOT NULL, -- 购买方名称
  buyer_tax_id VARCHAR(50) NOT NULL, -- 纳税人识别号
  buyer_address_phone TEXT, -- 地址、电话
  buyer_bank_account TEXT, -- 开户行及账号
  
  -- Seller Information (销售方)
  seller_name VARCHAR(255) NOT NULL, -- 销售方名称
  seller_tax_id VARCHAR(50) NOT NULL, -- 销售方纳税人识别号
  seller_address_phone TEXT, -- 销售方地址、电话
  seller_bank_account TEXT, -- 销售方开户行及账号
  
  -- Amount Details
  amount_excluding_tax DECIMAL(10, 2) NOT NULL, -- 不含税金额
  tax_rate DECIMAL(5, 2) NOT NULL, -- 税率 (1%, 3%, 6%, 9%, 13%)
  tax_amount DECIMAL(10, 2) NOT NULL, -- 税额
  total_amount DECIMAL(10, 2) NOT NULL, -- 价税合计 (total with tax)
  
  -- Line Items (stored as JSON for flexibility)
  line_items JSONB, -- [{name, spec, unit, qty, unit_price, amount, tax_rate, tax_amount}]
  
  -- Issue Details
  issue_date DATE NOT NULL, -- 开票日期
  checker VARCHAR(50), -- 复核人
  drawer VARCHAR(50), -- 开票人
  payee VARCHAR(50), -- 收款人
  
  -- Status
  status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'delivered', 'reversed', 'red_letter')),
  -- red_letter = 红字发票 (credit note/cancellation)
  
  -- QR Code & Verification
  qr_code_data TEXT, -- QR code data for verification
  verification_url TEXT, -- State Taxation Administration verification URL
  
  -- Reversal/Cancellation (红冲)
  reversed_fapiao_code VARCHAR(10), -- Original fapiao code if reversed
  reversed_fapiao_number VARCHAR(8), -- Original fapiao number if reversed
  reversal_reason TEXT, -- Reason for reversal
  
  -- Delivery
  delivery_method VARCHAR(20) DEFAULT 'paper', -- paper, email, wechat
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_to VARCHAR(255), -- Email or WeChat ID
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Compliance
  uploaded_to_tax_system BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE
);

-- Composite unique index for fapiao code + number
CREATE UNIQUE INDEX IF NOT EXISTS idx_fapiao_code_number ON fapiao(fapiao_code, fapiao_number);
CREATE INDEX IF NOT EXISTS idx_fapiao_invoice ON fapiao(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fapiao_customer ON fapiao(customer_id);
CREATE INDEX IF NOT EXISTS idx_fapiao_buyer_tax_id ON fapiao(buyer_tax_id);
CREATE INDEX IF NOT EXISTS idx_fapiao_status ON fapiao(status);
CREATE INDEX IF NOT EXISTS idx_fapiao_issue_date ON fapiao(issue_date);

-- ========================================
-- 6. View: WeChat Pay Summary by Customer
-- ========================================

CREATE OR REPLACE VIEW wechat_customer_summary AS
SELECT 
  c.id as customer_id,
  c.name,
  c.name_zh_cn,
  c.wechat_id,
  COUNT(wt.id) as total_wechat_payments,
  COALESCE(SUM(wt.total_amount), 0) / 100.0 as total_wechat_amount_cny, -- Convert fen to yuan
  COALESCE(AVG(wt.total_amount), 0) / 100.0 as avg_wechat_amount_cny,
  MIN(wt.time_end) as first_wechat_payment,
  MAX(wt.time_end) as last_wechat_payment,
  COUNT(CASE WHEN wt.status = 'success' THEN 1 END) as successful_count,
  COUNT(CASE WHEN wt.reconciled THEN 1 END) as reconciled_count
FROM contacts c
LEFT JOIN wechat_pay_transactions wt ON c.id = wt.customer_id
GROUP BY c.id, c.name, c.name_zh_cn, c.wechat_id;

-- ========================================
-- 7. View: Fapiao Summary
-- ========================================

CREATE OR REPLACE VIEW fapiao_summary AS
SELECT 
  fapiao_type,
  status,
  COUNT(*) as count,
  SUM(amount_excluding_tax) as total_excluding_tax,
  SUM(tax_amount) as total_tax,
  SUM(total_amount) as total_amount
FROM fapiao
GROUP BY fapiao_type, status;

-- ========================================
-- 8. Function: Validate Chinese National ID
-- ========================================

CREATE OR REPLACE FUNCTION validate_china_id(id_number VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  valid_pattern TEXT := '^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$';
  check_codes INT[] := ARRAY[7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  check_chars TEXT[] := ARRAY['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  sum INT := 0;
  check_digit TEXT;
  i INT;
BEGIN
  -- Check format
  IF id_number !~ valid_pattern THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate checksum
  FOR i IN 1..17 LOOP
    sum := sum + (SUBSTRING(id_number FROM i FOR 1)::INT * check_codes[i]);
  END LOOP;
  
  check_digit := check_chars[(sum % 11) + 1];
  
  -- Compare check digit (case-insensitive for X)
  RETURN UPPER(SUBSTRING(id_number FROM 18 FOR 1)) = UPPER(check_digit);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 9. Function: Validate China Phone Number
-- ========================================

CREATE OR REPLACE FUNCTION validate_china_phone(phone VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  -- Mainland China mobile: 11 digits, starts with 1, second digit 3-9
  mobile_pattern TEXT := '^(\+?86)?1[3-9]\d{9}$';
  -- Landline patterns (varies by city)
  landline_pattern TEXT := '^(\+?86)?(0\d{2,3})\d{7,8}$';
BEGIN
  RETURN phone ~ mobile_pattern OR phone ~ landline_pattern;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 10. Function: Auto-match WeChat Pay to Invoices
-- ========================================

CREATE OR REPLACE FUNCTION auto_match_wechat_payments()
RETURNS INTEGER AS $$
DECLARE
  matched_count INTEGER := 0;
  wx_record RECORD;
  matching_invoice RECORD;
BEGIN
  FOR wx_record IN 
    SELECT * FROM wechat_pay_transactions 
    WHERE status = 'pending' AND success = true
    ORDER BY time_end DESC
  LOOP
    -- Try to find matching invoice by amount and customer
    SELECT * INTO matching_invoice
    FROM invoices
    WHERE customer_id = wx_record.customer_id
      AND status IN ('sent', 'overdue')
      AND ABS(total_amount - (wx_record.total_amount::DECIMAL / 100.0)) < 0.01
      AND issue_date <= wx_record.time_end::date
    ORDER BY issue_date DESC
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE invoices 
      SET status = 'paid', 
          paid_at = wx_record.time_end,
          payment_method = 'WeChat Pay',
          updated_at = NOW()
      WHERE id = matching_invoice.id;
      
      UPDATE wechat_pay_transactions
      SET status = 'matched',
          invoice_id = matching_invoice.id,
          reconciled = true,
          reconciled_at = NOW(),
          updated_at = NOW()
      WHERE id = wx_record.id;
      
      matched_count := matched_count + 1;
    END IF;
  END LOOP;
  
  RETURN matched_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 11. Comments for Documentation
-- ========================================

COMMENT ON TABLE wechat_pay_transactions IS 'WeChat Pay (微信支付) transaction records for mainland China';
COMMENT ON COLUMN wechat_pay_transactions.total_amount IS 'Amount in fen (分). Divide by 100 for yuan.';
COMMENT ON COLUMN wechat_pay_transactions.trade_type IS 'JSAPI=Mini Program, NATIVE=QR Code, APP=Mobile App, MWEB=H5, MICROPAY=Barcode';
COMMENT ON COLUMN wechat_pay_transactions.payer_openid IS 'WeChat OpenID - unique identifier for user within our appid';

COMMENT ON TABLE fapiao IS '中国税务发票 - Official tax invoices issued through State Taxation Administration system';
COMMENT ON COLUMN fapiao.fapiao_type IS 'special=专票 (VAT deductible), general=普票 (non-deductible), electronic=电子发票';
COMMENT ON COLUMN fapiao.tax_rate IS 'Common rates: 1% (small scale), 3%, 6% (services), 9% (transport), 13% (goods)';
COMMENT ON COLUMN fapiao.status IS 'red_letter=红字发票 (credit note for returns/cancellations)';

COMMENT ON COLUMN contacts.china_id IS '中华人民共和国居民身份证号码 - 18 digits (last can be X)';
COMMENT ON COLUMN contacts.usci_code IS '统一社会信用代码 - 18-digit unified social credit code for companies';
COMMENT ON COLUMN contacts.birthday_lunar IS 'True if customer prefers birthday greetings by lunar calendar (农历)';

-- ========================================
-- End of China Localization Schema
-- ========================================
