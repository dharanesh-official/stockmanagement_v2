ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS salesman_id UUID REFERENCES users(id);

-- Optional: Update existing shops to have a default salesman (e.g. the first admin) or leave null
-- UPDATE shops SET salesman_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1) WHERE salesman_id IS NULL;
