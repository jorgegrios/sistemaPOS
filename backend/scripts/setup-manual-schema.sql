-- Reset Schema (DANGEROUS but necessary for dev iteration here)
DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO public;
-- or pos_admin

-- Enable pgcrypto for UUIDs
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

-- 2. Tables
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255),
    table_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0,
    base_price NUMERIC(10, 2), -- Alias or specific field
    available BOOLEAN DEFAULT true,
    category_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    table_id UUID REFERENCES tables (id),
    waiter_id UUID,
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

-- 5. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id UUID REFERENCES orders (id),
    company_id UUID REFERENCES companies (id),
    product_id UUID REFERENCES menu_items (id),
    menu_item_id UUID, -- distinct or alias?
    name VARCHAR(255), -- Product name snapshot
    price NUMERIC(10, 2) DEFAULT 0, -- price snapshot
    quantity INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    seat_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP
);

-- 6. Kitchen Stations
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES companies (id),
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    printer_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Product Components
CREATE TABLE IF NOT EXISTS product_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID REFERENCES menu_items (id),
    station_id UUID REFERENCES kitchen_stations (id),
    component_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Kitchen Tasks
CREATE TABLE IF NOT EXISTS kitchen_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_item_id UUID REFERENCES order_items (id),
    station_id UUID REFERENCES kitchen_stations (id),
    component_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);