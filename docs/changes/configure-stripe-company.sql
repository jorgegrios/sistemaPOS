-- Configure Company to Use Stripe Payment Provider
-- Execute this SQL to enable Stripe for your company

-- Enable Stripe for default company
UPDATE companies 
SET payment_settings = jsonb_set(
    COALESCE(payment_settings, '{}'::jsonb),
    '{type}',
    '"stripe"'
)
WHERE slug = 'default';

-- Verify the change
SELECT id, name, slug, payment_settings
FROM companies
WHERE
    slug = 'default';

-- Expected result:
-- payment_settings should contain: {"type": "stripe"}