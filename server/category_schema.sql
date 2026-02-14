CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Add category column to stock if it doesn't exist
ALTER TABLE stock ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Seed some default categories
INSERT INTO categories (name) VALUES ('Electronics'), ('Clothing'), ('Groceries') ON CONFLICT DO NOTHING;
