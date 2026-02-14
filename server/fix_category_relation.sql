-- Migration to fix Category Relation
-- 1. Add category_id column
ALTER TABLE stock ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- 2. (Optional) Try to map existing string categories to IDs if they match
UPDATE stock s
SET category_id = c.id
FROM categories c
WHERE s.category = c.name;

-- 3. In a real production app, we might drop the 'category' VARCHAR column now,
-- but for safety let's just use category_id moving forward.
