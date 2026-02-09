-- Update Company Session Timeout Configuration
-- This script helps configure session timeout for companies

-- View current session timeout settings
SELECT id, name, slug, session_timeout_minutes FROM companies;

-- Set default timeout for all companies (if NULL)
UPDATE companies
SET
    session_timeout_minutes = 20
WHERE
    session_timeout_minutes IS NULL;

-- Example: Set specific timeout for a company by slug
-- UPDATE companies
-- SET session_timeout_minutes = 30
-- WHERE slug = 'mi-restaurante';

-- Example: Set different timeouts by company type
-- Small restaurant (15 minutes)
-- UPDATE companies
-- SET session_timeout_minutes = 15
-- WHERE slug = 'small-restaurant';

-- Large restaurant (30 minutes)
-- UPDATE companies
-- SET session_timeout_minutes = 30
-- WHERE slug = 'large-restaurant';

-- Corporate office (60 minutes)
-- UPDATE companies
-- SET session_timeout_minutes = 60
-- WHERE slug = 'corporate-office';

-- Public kiosk (5 minutes for security)
-- UPDATE companies
-- SET session_timeout_minutes = 5
-- WHERE slug = 'public-kiosk';

-- Verify changes
SELECT id, name, slug, session_timeout_minutes FROM companies;