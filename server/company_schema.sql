CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) DEFAULT 'Inventory Pro',
    company_address TEXT DEFAULT '123 Business St, City, Country'
);

INSERT INTO company_settings (id, company_name, company_address)
VALUES (1, 'Inventory Pro', '123 Business St, City, Country')
ON CONFLICT (id) DO NOTHING;
