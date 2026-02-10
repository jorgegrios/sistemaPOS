-- Create Menu Items (Products) for Latino Restaurant
-- 50+ dishes with realistic NYC prices

DO $$
DECLARE
    company_uuid UUID;
    
    -- Category IDs
    cat_entradas UUID;
    cat_sopas UUID;
    cat_ensaladas UUID;
    cat_ceviches UUID;
    cat_carnes UUID;
    cat_platos UUID;
    cat_pollo UUID;
    cat_pescados UUID;
    cat_acomp UUID;
    cat_postres UUID;
    
    existing_count INTEGER;
BEGIN
    -- Get company ID
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO cat_entradas FROM menu_categories WHERE name = 'Entradas y Aperitivos' LIMIT 1;
    SELECT id INTO cat_sopas FROM menu_categories WHERE name = 'Sopas y Caldos' LIMIT 1;
    SELECT id INTO cat_ensaladas FROM menu_categories WHERE name = 'Ensaladas' LIMIT 1;
    SELECT id INTO cat_ceviches FROM menu_categories WHERE name = 'Ceviches y Mariscos' LIMIT 1;
    SELECT id INTO cat_carnes FROM menu_categories WHERE name = 'Carnes a la Parrilla' LIMIT 1;
    SELECT id INTO cat_platos FROM menu_categories WHERE name = 'Platos Fuertes' LIMIT 1;
    SELECT id INTO cat_pollo FROM menu_categories WHERE name = 'Pollo' LIMIT 1;
    SELECT id INTO cat_pescados FROM menu_categories WHERE name = 'Pescados' LIMIT 1;
    SELECT id INTO cat_acomp FROM menu_categories WHERE name = 'Acompañamientos' LIMIT 1;
    SELECT id INTO cat_postres FROM menu_categories WHERE name = 'Postres' LIMIT 1;
    
    -- Check if menu items already exist
    SELECT COUNT(*) INTO existing_count FROM menu_items WHERE company_id = company_uuid;
    
    IF existing_count > 0 THEN
        RAISE NOTICE 'Menu items already exist (% items found), skipping creation', existing_count;
        RETURN;
    END IF;
    
    -- ENTRADAS Y APERITIVOS (8 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Empanadas de Carne (3 unidades)', 9.99, 9.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Empanadas de Pollo (3 unidades)', 9.99, 9.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Empanadas de Queso (3 unidades)', 8.99, 8.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Tostones con Guacamole', 10.99, 10.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Arepas Rellenas', 11.99, 11.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Yuca Frita', 7.99, 7.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Chicharrón de Cerdo', 12.99, 12.99, true, cat_entradas),
    (gen_random_uuid(), company_uuid, 'Patacones con Hogao', 9.99, 9.99, true, cat_entradas);
    
    -- SOPAS Y CALDOS (5 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Sancocho de Gallina', 14.99, 14.99, true, cat_sopas),
    (gen_random_uuid(), company_uuid, 'Mondongo', 13.99, 13.99, true, cat_sopas),
    (gen_random_uuid(), company_uuid, 'Caldo de Costilla', 12.99, 12.99, true, cat_sopas),
    (gen_random_uuid(), company_uuid, 'Sopa de Mariscos', 16.99, 16.99, true, cat_sopas),
    (gen_random_uuid(), company_uuid, 'Ajiaco Colombiano', 14.99, 14.99, true, cat_sopas);
    
    -- ENSALADAS (5 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Ensalada Mixta', 8.99, 8.99, true, cat_ensaladas),
    (gen_random_uuid(), company_uuid, 'Ensalada de Aguacate', 10.99, 10.99, true, cat_ensaladas),
    (gen_random_uuid(), company_uuid, 'Ensalada César', 11.99, 11.99, true, cat_ensaladas),
    (gen_random_uuid(), company_uuid, 'Ensalada de Palmito', 12.99, 12.99, true, cat_ensaladas),
    (gen_random_uuid(), company_uuid, 'Ensalada Rusa', 9.99, 9.99, true, cat_ensaladas);
    
    -- CEVICHES Y MARISCOS (5 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Ceviche Peruano', 16.99, 16.99, true, cat_ceviches),
    (gen_random_uuid(), company_uuid, 'Ceviche Mixto', 18.99, 18.99, true, cat_ceviches),
    (gen_random_uuid(), company_uuid, 'Ceviche de Camarón', 17.99, 17.99, true, cat_ceviches),
    (gen_random_uuid(), company_uuid, 'Camarones al Ajillo', 19.99, 19.99, true, cat_ceviches),
    (gen_random_uuid(), company_uuid, 'Arroz con Mariscos', 21.99, 21.99, true, cat_ceviches);
    
    -- CARNES A LA PARRILLA (8 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Churrasco', 24.99, 24.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Picaña', 26.99, 26.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Costillas BBQ', 22.99, 22.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Lomo de Res', 25.99, 25.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Entraña', 27.99, 27.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Chuleta de Cerdo', 18.99, 18.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Parrillada Mixta (para 2)', 49.99, 49.99, true, cat_carnes),
    (gen_random_uuid(), company_uuid, 'Carne Asada', 23.99, 23.99, true, cat_carnes);
    
    -- PLATOS FUERTES (10 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Bandeja Paisa', 22.99, 22.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Lomo Saltado', 19.99, 19.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Ropa Vieja', 18.99, 18.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Bistec Encebollado', 17.99, 17.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Arroz con Pollo', 16.99, 16.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Pabellón Criollo', 18.99, 18.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Lechón Asado', 21.99, 21.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Pernil de Cerdo', 19.99, 19.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Chuleta Valluna', 20.99, 20.99, true, cat_platos),
    (gen_random_uuid(), company_uuid, 'Sobrebarriga', 19.99, 19.99, true, cat_platos);
    
    -- POLLO (6 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Pollo a la Brasa (1/4)', 9.99, 9.99, true, cat_pollo),
    (gen_random_uuid(), company_uuid, 'Pollo a la Brasa (1/2)', 15.99, 15.99, true, cat_pollo),
    (gen_random_uuid(), company_uuid, 'Pollo a la Brasa (Entero)', 24.99, 24.99, true, cat_pollo),
    (gen_random_uuid(), company_uuid, 'Pollo Guisado', 14.99, 14.99, true, cat_pollo),
    (gen_random_uuid(), company_uuid, 'Pollo Frito', 13.99, 13.99, true, cat_pollo),
    (gen_random_uuid(), company_uuid, 'Milanesa de Pollo', 15.99, 15.99, true, cat_pollo),
    (gen_random_uuid(), company_uuid, 'Pechuga a la Plancha', 16.99, 16.99, true, cat_pollo);
    
    -- PESCADOS (4 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Pescado Frito (Mojarra)', 18.99, 18.99, true, cat_pescados),
    (gen_random_uuid(), company_uuid, 'Pescado al Ajillo', 19.99, 19.99, true, cat_pescados),
    (gen_random_uuid(), company_uuid, 'Pescado Sudado', 20.99, 20.99, true, cat_pescados),
    (gen_random_uuid(), company_uuid, 'Filete de Tilapia', 17.99, 17.99, true, cat_pescados);
    
    -- ACOMPAÑAMIENTOS (6 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Arroz Blanco', 3.99, 3.99, true, cat_acomp),
    (gen_random_uuid(), company_uuid, 'Frijoles', 4.99, 4.99, true, cat_acomp),
    (gen_random_uuid(), company_uuid, 'Maduros', 4.99, 4.99, true, cat_acomp),
    (gen_random_uuid(), company_uuid, 'Yuca Cocida', 4.99, 4.99, true, cat_acomp),
    (gen_random_uuid(), company_uuid, 'Papas Fritas', 4.99, 4.99, true, cat_acomp),
    (gen_random_uuid(), company_uuid, 'Aguacate', 3.99, 3.99, true, cat_acomp);
    
    -- POSTRES (6 items)
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id) VALUES
    (gen_random_uuid(), company_uuid, 'Tres Leches', 7.99, 7.99, true, cat_postres),
    (gen_random_uuid(), company_uuid, 'Flan de Caramelo', 6.99, 6.99, true, cat_postres),
    (gen_random_uuid(), company_uuid, 'Arroz con Leche', 5.99, 5.99, true, cat_postres),
    (gen_random_uuid(), company_uuid, 'Natilla', 6.99, 6.99, true, cat_postres),
    (gen_random_uuid(), company_uuid, 'Cheesecake de Guayaba', 8.99, 8.99, true, cat_postres),
    (gen_random_uuid(), company_uuid, 'Helado (2 bolas)', 5.99, 5.99, true, cat_postres);
    
    RAISE NOTICE '57 menu items created successfully across 10 categories';
END $$;