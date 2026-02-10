-- Create Kitchen Stations for Latino Restaurant
-- 4 stations: Cocina Principal, Parrilla y Carnes, Ensaladas y Fríos, Postres

DO $$
DECLARE
    company_uuid UUID;
    existing_count INTEGER;
BEGIN
    -- Get company ID
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    
    -- Check if stations already exist
    SELECT COUNT(*) INTO existing_count FROM kitchen_stations WHERE company_id = company_uuid;
    
    IF existing_count = 0 THEN
        -- Create 4 kitchen stations
        INSERT INTO kitchen_stations (id, company_id, name, is_default) VALUES
        (gen_random_uuid(), company_uuid, 'Cocina Principal', true),
        (gen_random_uuid(), company_uuid, 'Parrilla y Carnes', false),
        (gen_random_uuid(), company_uuid, 'Ensaladas y Fríos', false),
        (gen_random_uuid(), company_uuid, 'Postres', false);
        
        RAISE NOTICE '4 kitchen stations created successfully';
    ELSE
        RAISE NOTICE 'Kitchen stations already exist (% stations found), skipping creation', existing_count;
    END IF;
END $$;