-- Create Menu Categories for Latino Restaurant
-- 10 categories organized by dish type

DO $$
DECLARE
    company_uuid UUID;
    menu_uuid UUID;
    existing_count INTEGER;
BEGIN
    -- Get company and menu IDs
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    SELECT id INTO menu_uuid FROM menus LIMIT 1;
    
    -- Check if categories already exist for this menu
    SELECT COUNT(*) INTO existing_count 
    FROM menu_categories 
    WHERE menu_id = menu_uuid;
    
    IF existing_count = 0 THEN
        -- Create 10 menu categories
        INSERT INTO menu_categories (id, menu_id, company_id, name, display_order) VALUES
        (gen_random_uuid(), menu_uuid, company_uuid, 'Entradas y Aperitivos', 1),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Sopas y Caldos', 2),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Ensaladas', 3),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Ceviches y Mariscos', 4),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Carnes a la Parrilla', 5),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Platos Fuertes', 6),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Pollo', 7),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Pescados', 8),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Acompañamientos', 9),
        (gen_random_uuid(), menu_uuid, company_uuid, 'Postres', 10);
        
        RAISE NOTICE '10 menu categories created successfully';
    ELSE
        RAISE NOTICE 'Menu categories already exist (% categories found), skipping creation', existing_count;
    END IF;
END $$;