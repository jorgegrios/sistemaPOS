-- Enable Stripe for a specific company
-- Replace 'your-company-id' with the actual company ID

UPDATE companies 
SET payment_settings = jsonb_set(
    COALESCE(payment_settings, '{}'::jsonb),
    '{type}',
    '"stripe"'
)
WHERE id = 'your-company-id';

-- Verify the change
SELECT id, name, payment_settings
FROM companies
WHERE
    id = 'your-company-id';

-- To enable Stripe for ALL companies (use with caution)
-- UPDATE companies
-- SET payment_settings = jsonb_set(
--     COALESCE(payment_settings, '{}'::jsonb),
--     '{type}',
--     '"stripe"'
-- );