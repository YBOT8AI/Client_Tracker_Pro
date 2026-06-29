-- Hong Kong Localization Schema
-- Phase 3A: FPS Payments, BR Numbers, Bilingual Support

-- ========================================
-- 1. Enhanced Companies Table (HK Fields)
-- ========================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_zh_hk VARCHAR(255); -- Traditional Chinese name
ALTER TABLE companies ADD COLUMN IF NOT EXISTS br_number VARCHAR(20); -- Business Registration Number (HK)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS incorporation_date DATE; -- Date of Incorporation
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type VARCHAR(50); -- limited, unlimited, sole_proprietorship
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_id_hk VARCHAR(50); -- Tax ID (IRD reference)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en-HK'; -- en-HK, zh-HK
ALTER TABLE companies ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'HKD'; -- HKD, CNY
ALTER TABLE companies ADD COLUMN IF NOT EXISTS relationship_strength INTEGER DEFAULT 1 CHECK (relationship_strength BETWEEN 1 AND 5); -- Guanxi score 1-5
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_gift_date DATE; -- Last gift given
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_meeting_date DATE; -- Last meeting date
ALTER TABLE companies ADD COLUMN IF NOT EXISTS key_decision_maker VARCHAR(255); -- Key contact person

-- Index for BR number lookups
CREATE INDEX IF NOT EXISTS idx_companies_br_number ON companies(br_number);

-- ========================================
-- 2. Enhanced Contacts Table (HK Fields)
-- ========================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name_chinese_traditional VARCHAR(255); -- 中文名 (繁體)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20); -- +852 format
ALTER TABLE companies ADD COLUMN IF NOT EXISTS wechat_id VARCHAR(100); -- WeChat ID
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_title_zh VARCHAR(100); -- 職位 (e.g., 總經理)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS guanxi_level INTEGER DEFAULT 1 CHECK (guanxi_level BETWEEN 1 AND 5); -- Relationship strength
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_interaction_date DATE; -- Last contact date
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_followup_date DATE; -- Next follow-up date
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday_lunar BOOLEAN DEFAULT false; -- Prefer lunar calendar birthday
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gift_preferences TEXT; -- Gift preferences/notes

-- Index for WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON contacts(whatsapp_number);

-- ========================================
-- 3. FPS Payments Table (Hong Kong)
-- ========================================

CREATE TABLE IF NOT EXISTS fps_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- FPS Transaction Details
  fps_reference_id VARCHAR(100) UNIQUE NOT NULL, -- Bank reference number
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'HKD' CHECK (currency IN ('HKD', 'CNY')),
  
  -- Payer Information
  payer_name VARCHAR(255) NOT NULL,
  payer_account VARCHAR(50), -- Masked account number (***1234)
  payer_bank VARCHAR(100), -- HSBC, Hang Seng, BOC, etc.
  
  -- Transaction Details
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_time TIME, -- Some banks separate time
  remark TEXT, -- Payment remark/note from payer
  
  -- Reconciliation Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'reconciled', 'failed')),
  matched_at TIMESTAMP WITH TIME ZONE, -- When matched to invoice
  matched_by UUID REFERENCES users(id), -- User who reconciled
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Import tracking (for CSV imports from banking apps)
  import_source VARCHAR(50), -- 'manual', 'csv_import', 'api'
  import_batch_id VARCHAR(100) -- For batch imports
);

-- Indexes for FPS payments
CREATE INDEX IF NOT EXISTS idx_fps_payments_reference ON fps_payments(fps_reference_id);
CREATE INDEX IF NOT EXISTS idx_fps_payments_customer ON fps_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_fps_payments_invoice ON fps_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fps_payments_status ON fps_payments(status);
CREATE INDEX IF NOT EXISTS idx_fps_payments_date ON fps_payments(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fps_payments_currency ON fps_payments(currency);

-- ========================================
-- 4. View: FPS Payment Summary by Customer
-- ========================================

CREATE OR REPLACE VIEW fps_customer_summary AS
SELECT 
  c.id as customer_id,
  c.name,
  c.whatsapp_number,
  COUNT(fp.id) as total_fps_payments,
  COALESCE(SUM(fp.amount), 0) as total_fps_amount,
  COALESCE(AVG(fp.amount), 0) as avg_fps_amount,
  MIN(fp.transaction_date) as first_fps_payment,
  MAX(fp.transaction_date) as last_fps_payment,
  COUNT(CASE WHEN fp.status = 'reconciled' THEN 1 END) as reconciled_count,
  COUNT(CASE WHEN fp.status = 'pending' THEN 1 END) as pending_count
FROM contacts c
LEFT JOIN fps_payments fp ON c.id = fp.customer_id
GROUP BY c.id, c.name, c.whatsapp_number;

-- ========================================
-- 5. View: Daily FPS Payment Summary
-- ========================================

CREATE OR REPLACE VIEW fps_daily_summary AS
SELECT 
  DATE(transaction_date) as payment_date,
  currency,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(CASE WHEN status = 'reconciled' THEN 1 END) as reconciled_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM fps_payments
GROUP BY DATE(transaction_date), currency
ORDER BY payment_date DESC;

-- ========================================
-- 6. Function: Auto-match FPS to Invoices
-- ========================================

CREATE OR REPLACE FUNCTION auto_match_fps_payments()
RETURNS INTEGER AS $$
DECLARE
  matched_count INTEGER := 0;
  fps_record RECORD;
  matching_invoice RECORD;
BEGIN
  -- Loop through pending FPS payments
  FOR fps_record IN 
    SELECT * FROM fps_payments 
    WHERE status = 'pending'
    ORDER BY transaction_date DESC
  LOOP
    -- Try to find matching invoice by amount and customer
    SELECT * INTO matching_invoice
    FROM invoices
    WHERE customer_id = fps_record.customer_id
      AND status IN ('sent', 'overdue')
      AND ABS(total_amount - fps_record.amount) < 0.01 -- Exact match
      AND issue_date <= fps_record.transaction_date
    ORDER BY issue_date DESC
    LIMIT 1;
    
    -- If found, update both records
    IF FOUND THEN
      -- Update invoice status
      UPDATE invoices 
      SET status = 'paid', 
          paid_at = fps_record.transaction_date,
          payment_method = 'FPS',
          updated_at = NOW()
      WHERE id = matching_invoice.id;
      
      -- Update FPS payment
      UPDATE fps_payments
      SET status = 'matched',
          invoice_id = matching_invoice.id,
          matched_at = NOW(),
          updated_at = NOW()
      WHERE id = fps_record.id;
      
      matched_count := matched_count + 1;
    END IF;
  END LOOP;
  
  RETURN matched_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Function: Generate FPS Reference ID
-- ========================================

CREATE OR REPLACE FUNCTION generate_fps_reference()
RETURNS TEXT AS $$
DECLARE
  bank_code TEXT := 'FPS';
  timestamp TEXT;
  random_suffix TEXT;
BEGIN
  timestamp := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN bank_code || timestamp || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. Comments for Documentation
-- ========================================

COMMENT ON TABLE fps_payments IS 'Hong Kong FPS (Faster Payment System) payment transactions';
COMMENT ON COLUMN fps_payments.fps_reference_id IS 'Unique reference from banking system';
COMMENT ON COLUMN fps_payments.payer_account IS 'Masked account number for privacy (***1234)';
COMMENT ON COLUMN fps_payments.status IS 'pending=unmatched, matched=linked to invoice, reconciled=verified';
COMMENT ON COLUMN fps_payments.import_source IS 'Source: manual entry, CSV import from bank app, or API';

COMMENT ON COLUMN contacts.whatsapp_number IS 'HK WhatsApp format: +852 XXXX XXXX';
COMMENT ON COLUMN contacts.guanxi_level IS 'Relationship strength: 1=cold, 5=very close';
COMMENT ON COLUMN contacts.birthday_lunar IS 'True if customer prefers lunar calendar birthday greetings';

COMMENT ON COLUMN companies.br_number IS 'HK Business Registration Number (8 digits + dash + check digit)';
COMMENT ON COLUMN companies.relationship_strength IS 'Guanxi score for business relationship: 1-5';

-- ========================================
-- 9. Sample Data (for testing)
-- ========================================

-- Sample FPS payments (will be added after table creation)
-- INSERT INTO fps_payments (...) VALUES (...);

-- ========================================
-- End of HK Localization Schema
-- ========================================
