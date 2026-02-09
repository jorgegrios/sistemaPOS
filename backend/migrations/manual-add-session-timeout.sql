-- Manual Migration: Add session_timeout_minutes to companies table
-- Execute this SQL directly in your PostgreSQL database

-- Add the column
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER NOT NULL DEFAULT 20;

-- Add comment
COMMENT ON COLUMN companies.session_timeout_minutes IS 'Session timeout in minutes for inactivity auto-logout';

-- Verify the column was added
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'companies'
    AND column_name = 'session_timeout_minutes';

-- View current companies with new field
SELECT id, name, slug, session_timeout_minutes FROM companies;