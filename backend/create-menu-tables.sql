-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    restaurant_id UUID REFERENCES restaurants (id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    menu_id UUID REFERENCES menus (id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update menu_items to have proper foreign keys
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES menu_categories (id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menus_restaurant ON menus (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_menus_company ON menus (company_id);

CREATE INDEX IF NOT EXISTS idx_menu_categories_menu ON menu_categories (menu_id);

CREATE INDEX IF NOT EXISTS idx_menu_categories_company ON menu_categories (company_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category_id);

-- Seed default menu structure
DO $$ DECLARE v_company_id UUID;

v_restaurant_id UUID;

v_menu_id UUID;

v_category_id UUID;

BEGIN
-- Get company and restaurant
SELECT id INTO v_company_id
FROM companies
WHERE
    slug = 'default'
LIMIT 1;

SELECT id INTO v_restaurant_id
FROM restaurants
WHERE
    company_id = v_company_id
LIMIT 1;

-- Create default menu
INSERT INTO
    menus (
        company_id,
        restaurant_id,
        name,
        description,
        active
    )
VALUES (
        v_company_id,
        v_restaurant_id,
        'Menú Principal',
        'Menú general del restaurante',
        true
    ) RETURNING id INTO v_menu_id;

-- Create default category
INSERT INTO
    menu_categories (
        company_id,
        menu_id,
        name,
        display_order
    )
VALUES (
        v_company_id,
        v_menu_id,
        'General',
        0
    ) RETURNING id INTO v_category_id;

-- Update existing menu_items to belong to this category
UPDATE menu_items
SET
    category_id = v_category_id
WHERE
    company_id = v_company_id
    AND category_id IS NULL;

RAISE NOTICE 'Menu structure created: Menu ID %, Category ID %',
v_menu_id,
v_category_id;

END $$;