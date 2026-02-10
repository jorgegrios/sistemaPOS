-- Create Product Components for Multi-Kitchen Dishes
-- Assigns dishes to kitchen stations (some dishes require multiple stations)

DO $$
DECLARE
    company_uuid UUID;
    
    -- Kitchen Station IDs
    station_cocina UUID;
    station_parrilla UUID;
    station_ensaladas UUID;
    station_postres UUID;
    
    -- Product IDs (selected dishes that need multi-kitchen preparation)
    prod_bandeja UUID;
    prod_churrasco UUID;
    prod_picana UUID;
    prod_lomo_res UUID;
    prod_entrana UUID;
    prod_parrillada UUID;
    prod_carne_asada UUID;
    prod_lomo_saltado UUID;
    prod_bistec UUID;
    prod_lechon UUID;
    prod_chuleta_valluna UUID;
    
    existing_count INTEGER;
BEGIN
    -- Get company ID
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    
    -- Get kitchen station IDs
    SELECT id INTO station_cocina FROM kitchen_stations WHERE name = 'Cocina Principal' LIMIT 1;
    SELECT id INTO station_parrilla FROM kitchen_stations WHERE name = 'Parrilla y Carnes' LIMIT 1;
    SELECT id INTO station_ensaladas FROM kitchen_stations WHERE name = 'Ensaladas y Fríos' LIMIT 1;
    SELECT id INTO station_postres FROM kitchen_stations WHERE name = 'Postres' LIMIT 1;
    
    -- Check if product components already exist
    SELECT COUNT(*) INTO existing_count FROM product_components;
    
    IF existing_count > 0 THEN
        RAISE NOTICE 'Product components already exist (% components found), skipping creation', existing_count;
        RETURN;
    END IF;
    
    -- Get product IDs for multi-kitchen dishes
    SELECT id INTO prod_bandeja FROM menu_items WHERE name = 'Bandeja Paisa' LIMIT 1;
    SELECT id INTO prod_churrasco FROM menu_items WHERE name = 'Churrasco' LIMIT 1;
    SELECT id INTO prod_picana FROM menu_items WHERE name = 'Picaña' LIMIT 1;
    SELECT id INTO prod_lomo_res FROM menu_items WHERE name = 'Lomo de Res' LIMIT 1;
    SELECT id INTO prod_entrana FROM menu_items WHERE name = 'Entraña' LIMIT 1;
    SELECT id INTO prod_parrillada FROM menu_items WHERE name LIKE 'Parrillada Mixta%' LIMIT 1;
    SELECT id INTO prod_carne_asada FROM menu_items WHERE name = 'Carne Asada' LIMIT 1;
    SELECT id INTO prod_lomo_saltado FROM menu_items WHERE name = 'Lomo Saltado' LIMIT 1;
    SELECT id INTO prod_bistec FROM menu_items WHERE name = 'Bistec Encebollado' LIMIT 1;
    SELECT id INTO prod_lechon FROM menu_items WHERE name = 'Lechón Asado' LIMIT 1;
    SELECT id INTO prod_chuleta_valluna FROM menu_items WHERE name = 'Chuleta Valluna' LIMIT 1;
    
    -- BANDEJA PAISA: Cocina Principal (frijoles, arroz, huevo) + Parrilla (carne, chicharrón) + Ensaladas (aguacate)
    IF prod_bandeja IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_bandeja, station_cocina, 'Frijoles, Arroz y Huevo'),
        (gen_random_uuid(), prod_bandeja, station_parrilla, 'Carne Molida y Chicharrón'),
        (gen_random_uuid(), prod_bandeja, station_ensaladas, 'Aguacate y Tomate');
    END IF;
    
    -- CHURRASCO: Parrilla (carne) + Cocina (arroz, papas)
    IF prod_churrasco IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_churrasco, station_parrilla, 'Churrasco a la Parrilla'),
        (gen_random_uuid(), prod_churrasco, station_cocina, 'Arroz y Papas Fritas');
    END IF;
    
    -- PICAÑA: Parrilla (carne) + Cocina (acompañamientos)
    IF prod_picana IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_picana, station_parrilla, 'Picaña a la Parrilla'),
        (gen_random_uuid(), prod_picana, station_cocina, 'Arroz y Yuca');
    END IF;
    
    -- LOMO DE RES: Parrilla (carne) + Cocina (guarnición)
    IF prod_lomo_res IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_lomo_res, station_parrilla, 'Lomo a la Parrilla'),
        (gen_random_uuid(), prod_lomo_res, station_cocina, 'Arroz y Papas');
    END IF;
    
    -- ENTRAÑA: Parrilla (carne) + Cocina (acompañamientos)
    IF prod_entrana IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_entrana, station_parrilla, 'Entraña a la Parrilla'),
        (gen_random_uuid(), prod_entrana, station_cocina, 'Arroz y Chimichurri');
    END IF;
    
    -- PARRILLADA MIXTA: Parrilla (carnes) + Cocina (acompañamientos) + Ensaladas (guarnición)
    IF prod_parrillada IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_parrillada, station_parrilla, 'Carnes Mixtas'),
        (gen_random_uuid(), prod_parrillada, station_cocina, 'Arroz, Papas y Yuca'),
        (gen_random_uuid(), prod_parrillada, station_ensaladas, 'Ensalada y Chimichurri');
    END IF;
    
    -- CARNE ASADA: Parrilla (carne) + Cocina (acompañamientos)
    IF prod_carne_asada IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_carne_asada, station_parrilla, 'Carne Asada'),
        (gen_random_uuid(), prod_carne_asada, station_cocina, 'Arroz y Frijoles');
    END IF;
    
    -- LOMO SALTADO: Cocina (salteado) + Ensaladas (vegetales frescos)
    IF prod_lomo_saltado IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_lomo_saltado, station_cocina, 'Lomo Salteado con Papas'),
        (gen_random_uuid(), prod_lomo_saltado, station_ensaladas, 'Tomate y Cebolla Fresca');
    END IF;
    
    -- BISTEC ENCEBOLLADO: Parrilla (carne) + Cocina (cebolla y acompañamientos)
    IF prod_bistec IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_bistec, station_parrilla, 'Bistec a la Plancha'),
        (gen_random_uuid(), prod_bistec, station_cocina, 'Cebolla Caramelizada y Arroz');
    END IF;
    
    -- LECHÓN ASADO: Parrilla (lechón) + Cocina (acompañamientos)
    IF prod_lechon IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_lechon, station_parrilla, 'Lechón Asado'),
        (gen_random_uuid(), prod_lechon, station_cocina, 'Arroz y Yuca');
    END IF;
    
    -- CHULETA VALLUNA: Parrilla (chuleta) + Cocina (acompañamientos)
    IF prod_chuleta_valluna IS NOT NULL THEN
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES
        (gen_random_uuid(), prod_chuleta_valluna, station_parrilla, 'Chuleta de Cerdo'),
        (gen_random_uuid(), prod_chuleta_valluna, station_cocina, 'Arroz, Papas y Hogao');
    END IF;
    
    RAISE NOTICE 'Product components created successfully for multi-kitchen dishes';
END $$;