-- Enable Row Level Security (RLS) for all tables to resolve Supabase Security Advisor warnings.
-- Note: These commands enable RLS, but do not restrict access for the 'postgres' superuser 
-- which is typically used by the Node.js backend direct connection.

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 2. Create 'Full Access' policies for 'authenticated' users (Common for Supabase setup)
-- This ensures that your frontend/backend roles can still interact with the data.
-- Replace 'authenticated' with specific roles if your security model requires it.

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'users', 'customers', 'stock', 'categories', 'transactions', 
        'transaction_items', 'stock_history', 'shops', 
        'company_settings', 'suppliers', 'purchases', 'areas',
        'notifications', 'pricing', 'transfers', 'returns', 'activity_log'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Create policy if it doesn't exist
        EXECUTE format('
            DO $inner$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = %L AND policyname = %L
                ) THEN
                    CREATE POLICY "Enable all for authenticated users" ON %I 
                    FOR ALL TO authenticated USING (true) WITH CHECK (true);
                END IF;
            END $inner$', t, 'Enable all for authenticated users', t);
    END LOOP;
END $$;
