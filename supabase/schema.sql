-- Client Tracker Pro Database Schema
-- Supabase PostgreSQL

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  referred_by UUID REFERENCES clients(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  items TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-up reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_referral ON clients(referred_by);
CREATE INDEX IF NOT EXISTS idx_purchases_client ON purchases(client_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_reminders_client ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- View: Client purchase statistics
CREATE OR REPLACE VIEW client_stats AS
SELECT 
  c.id,
  c.client_id,
  c.name,
  c.email,
  c.phone,
  c.referred_by,
  COUNT(p.id) as total_purchases,
  COALESCE(SUM(p.amount), 0) as total_spent,
  COALESCE(AVG(p.amount), 0) as avg_order_value,
  MIN(p.purchase_date) as first_purchase,
  MAX(p.purchase_date) as last_purchase,
  CASE 
    WHEN MAX(p.purchase_date) IS NULL THEN NULL
    ELSE CURRENT_DATE - MAX(p.purchase_date)::date
  END as days_since_last_purchase
FROM clients c
LEFT JOIN purchases p ON c.id = p.client_id
GROUP BY c.id, c.client_id, c.name, c.email, c.phone, c.referred_by;

-- Function: Auto-generate follow-up reminders based on purchase frequency
CREATE OR REPLACE FUNCTION generate_followup_reminders()
RETURNS VOID AS $$
BEGIN
  -- Insert reminders for clients who haven't purchased in 30+ days
  INSERT INTO reminders (client_id, reminder_date, reason, status)
  SELECT 
    id,
    NOW() + INTERVAL '1 day' as reminder_date,
    'No purchase in 30+ days - follow up to encourage re-engagement' as reason,
    'pending' as status
  FROM client_stats
  WHERE days_since_last_purchase >= 30
  AND id NOT IN (
    SELECT client_id FROM reminders 
    WHERE status = 'pending' 
    AND reminder_date > NOW()
  );
END;
$$ LANGUAGE plpgsql;
