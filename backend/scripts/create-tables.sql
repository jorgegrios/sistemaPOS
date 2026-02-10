-- Create 50 tables distributed across different areas
-- Areas: Main Dining, Terrace, Bar Area, VIP Room, Patio

DO $$
DECLARE
    company_uuid UUID;
    restaurant_uuid UUID;
BEGIN
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
    
    -- Main Dining Area (Tables M1-M20)
    INSERT INTO tables (id, company_id, restaurant_id, table_number, name) VALUES
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M1', 'Mesa M1'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M2', 'Mesa M2'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M3', 'Mesa M3'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M4', 'Mesa M4'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M5', 'Mesa M5'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M6', 'Mesa M6'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M7', 'Mesa M7'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M8', 'Mesa M8'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M9', 'Mesa M9'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M10', 'Mesa M10'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M11', 'Mesa M11'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M12', 'Mesa M12'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M13', 'Mesa M13'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M14', 'Mesa M14'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M15', 'Mesa M15'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M16', 'Mesa M16'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M17', 'Mesa M17'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M18', 'Mesa M18'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M19', 'Mesa M19'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'M20', 'Mesa M20');
    
    -- Terrace (Tables T1-T12)
    INSERT INTO tables (id, company_id, restaurant_id, table_number, name) VALUES
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T1', 'Terraza T1'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T2', 'Terraza T2'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T3', 'Terraza T3'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T4', 'Terraza T4'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T5', 'Terraza T5'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T6', 'Terraza T6'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T7', 'Terraza T7'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T8', 'Terraza T8'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T9', 'Terraza T9'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T10', 'Terraza T10'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T11', 'Terraza T11'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'T12', 'Terraza T12');
    
    -- Bar Area (Tables B1-B8)
    INSERT INTO tables (id, company_id, restaurant_id, table_number, name) VALUES
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B1', 'Bar B1'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B2', 'Bar B2'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B3', 'Bar B3'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B4', 'Bar B4'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B5', 'Bar B5'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B6', 'Bar B6'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B7', 'Bar B7'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'B8', 'Bar B8');
    
    -- VIP Room (Tables V1-V5)
    INSERT INTO tables (id, company_id, restaurant_id, table_number, name) VALUES
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'V1', 'VIP V1'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'V2', 'VIP V2'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'V3', 'VIP V3'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'V4', 'VIP V4'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'V5', 'VIP V5');
    
    -- Patio (Tables P1-P5)
    INSERT INTO tables (id, company_id, restaurant_id, table_number, name) VALUES
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'P1', 'Patio P1'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'P2', 'Patio P2'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'P3', 'Patio P3'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'P4', 'Patio P4'),
    (gen_random_uuid(), company_uuid, restaurant_uuid, 'P5', 'Patio P5');
    
    RAISE NOTICE '50 tables created successfully across 5 areas';
END $$;