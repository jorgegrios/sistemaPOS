-- Reset Schema
DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    session_timeout_minutes INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Restaurants (Required for Users)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Users (Required for Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    restaurant_id UUID REFERENCES restaurants (id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'waiter',
    active BOOLEAN DEFAULT true,
    phone VARCHAR(20),
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tables
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255),
    table_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0,
    base_price NUMERIC(10, 2),
    available BOOLEAN DEFAULT true,
    category_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    table_id UUID REFERENCES tables (id),
    waiter_id UUID, -- No FK constraint to simplify testing with random UUIDs if needed
    order_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    subtotal NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) DEFAULT 0,
    tip NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_to_kitchen_at TIMESTAMP,
    paid_at TIMESTAMP
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id UUID REFERENCES orders (id),
    company_id UUID REFERENCES companies (id),
    product_id UUID REFERENCES menu_items (id),
    menu_item_id UUID,
    name VARCHAR(255),
    price NUMERIC(10, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    seat_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP
);

-- 8. Kitchen Stations
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    printer_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Product Components
CREATE TABLE IF NOT EXISTS product_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID REFERENCES menu_items (id),
    station_id UUID REFERENCES kitchen_stations (id),
    component_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Kitchen Tasks
CREATE TABLE IF NOT EXISTS kitchen_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_item_id UUID REFERENCES order_items (id),
    station_id UUID REFERENCES kitchen_stations (id),
    component_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- SEED DATA
DO $$
DECLARE
    v_company_id UUID;
    v_restaurant_id UUID;
    v_user_id UUID;
BEGIN
    -- Create Company
    INSERT INTO companies (name, slug) VALUES ('Test Company', 'default') RETURNING id INTO v_company_id;
    
    -- Create Restaurant
    INSERT INTO restaurants (company_id, name, email) VALUES (v_company_id, 'Test Restaurant', 'contact@test.com') RETURNING id INTO v_restaurant_id;

    -- Create Admin User
    -- Use hash: $2b$10$JftzsNvK1mNI9OmOi/l8a.68AtzS90bh58uVKBYRaQIrlcUVLByse
    INSERT INTO users (company_id, restaurant_id, email, password_hash, name, role)
    VALUES (
        v_company_id, 
        v_restaurant_id, 
        'admin@test.com', 
        '$2b$10$JftzsNvK1mNI9OmOi/l8a.68AtzS90bh58uVKBYRaQIrlcUVLByse', 
        'Admin User', 
        'admin'
    );
    
    RAISE NOTICE 'Seeded Company ID: %, Restaurant ID: %, User: admin@test.com', v_company_id, v_restaurant_id;
END $$;