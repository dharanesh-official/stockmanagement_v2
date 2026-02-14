-- Add permissions column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Update the role check constraint to include 'employee' and 'manager' if possible.
-- Since altering constraint is database specific and might be tricky if data exists that violates it, 
-- we will drop the constraint if it exists and recreate it with expanded roles.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'salesman', 'manager', 'employee'));

-- Default permissions for existing users
UPDATE users SET permissions = '{"stock": {"view": true, "create": true, "edit": true, "delete": true}, "sales": {"view": true, "create": true, "edit": true, "delete": true}, "customers": {"view": true, "create": true, "edit": true, "delete": true}, "employees": {"view": true, "create": true, "edit": true, "delete": true}, "finance": {"view": true, "create": true, "edit": true, "delete": true}, "settings": {"view": true, "create": true, "edit": true, "delete": true}}' WHERE role = 'admin';

UPDATE users SET permissions = '{"stock": {"view": true, "create": false, "edit": false, "delete": false}, "sales": {"view": true, "create": true, "edit": false, "delete": false}, "customers": {"view": true, "create": true, "edit": false, "delete": false}, "employees": {"view": false, "create": false, "edit": false, "delete": false}, "finance": {"view": false, "create": false, "edit": false, "delete": false}, "settings": {"view": false, "create": false, "edit": false, "delete": false}}' WHERE role = 'salesman';
