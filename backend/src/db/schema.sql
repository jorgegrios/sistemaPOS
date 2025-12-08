-- Core tables (payments, orders, terminals, payment_methods)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    provider_transaction_id VARCHAR(255),
    provider_response JSONB,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_token VARCHAR(255),
    terminal_id VARCHAR(100),
    qr_code TEXT,
    qr_expires_at TIMESTAMP,
    wallet_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    location POINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(payment_provider, provider_transaction_id);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(created_at DESC);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    table_id UUID,
    waiter_id UUID,
    status VARCHAR(20) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) DEFAULT 0,
    tip NUMERIC(10,2) DEFAULT 0,
    discount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);

CREATE INDEX idx_orders_number ON orders(order_number);

-- Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    amount NUMERIC(10,2) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    provider_refund_id VARCHAR(255),
    provider_response JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_refunds_transaction ON refunds(payment_transaction_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- Terminals
CREATE TABLE payment_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    device_type VARCHAR(100),
    location_id UUID,
    status VARCHAR(20) DEFAULT 'active',
    last_seen_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
