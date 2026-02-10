-- Add missing menu categories and all 57 menu items
-- This script adds only what's missing without deleting existing data

DO $$
DECLARE
    company_uuid UUID;
    menu_uuid UUID;
    
    -- Category IDs (will be created or fetched)
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
BEGIN
    -- Get company and menu IDs
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    SELECT id INTO menu_uuid FROM menus LIMIT 1;
    
    -- Create or get categories
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Entradas y Aperitivos', 1)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_entradas FROM menu_categories WHERE name = 'Entradas y Aperitivos' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Sopas y Caldos', 2)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_sopas FROM menu_categories WHERE name = 'Sopas y Caldos' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Ensaladas', 3)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_ensaladas FROM menu_categories WHERE name = 'Ensaladas' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Ceviches y Mariscos', 4)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_ceviches FROM menu_categories WHERE name = 'Ceviches y Mariscos' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Carnes a la Parrilla', 5)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_carnes FROM menu_categories WHERE name = 'Carnes a la Parrilla' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Platos Fuertes', 6)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_platos FROM menu_categories WHERE name = 'Platos Fuertes' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Pollo', 7)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_pollo FROM menu_categories WHERE name = 'Pollo' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Pescados', 8)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_pescados FROM menu_categories WHERE name = 'Pescados' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Acompañamientos', 9)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_acomp FROM menu_categories WHERE name = 'Acompañamientos' LIMIT 1;
    
    INSERT INTO menu_categories (id, menu_id, company_id, name, display_order)
    VALUES (gen_random_uuid(), menu_uuid, company_uuid, 'Postres', 10)
    ON CONFLICT DO NOTHING;
    SELECT id INTO cat_postres FROM menu_categories WHERE name = 'Postres' LIMIT 1;
    
    RAISE NOTICE 'Categories created/verified';
    
    -- Now insert all menu items (using INSERT ... ON CONFLICT DO NOTHING for idempotency)
    -- ENTRADAS Y APERITIVOS
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Empanadas de Carne (3 unidades)', 9.99, 9.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Empanadas de Carne (3 unidades)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Empanadas de Pollo (3 unidades)', 9.99, 9.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Empanadas de Pollo (3 unidades)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Empanadas de Queso (3 unidades)', 8.99, 8.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Empanadas de Queso (3 unidades)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Tostones con Guacamole', 10.99, 10.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Tostones con Guacamole');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Arepas Rellenas', 11.99, 11.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Arepas Rellenas');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Yuca Frita', 7.99, 7.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Yuca Frita');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Chicharrón de Cerdo', 12.99, 12.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chicharrón de Cerdo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Patacones con Hogao', 9.99, 9.99, true, cat_entradas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Patacones con Hogao');
    
    -- SOPAS Y CALDOS
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Sancocho de Gallina', 14.99, 14.99, true, cat_sopas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Sancocho de Gallina');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Mondongo', 13.99, 13.99, true, cat_sopas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Mondongo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Caldo de Costilla', 12.99, 12.99, true, cat_sopas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Caldo de Costilla');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Sopa de Mariscos', 16.99, 16.99, true, cat_sopas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Sopa de Mariscos');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ajiaco Colombiano', 14.99, 14.99, true, cat_sopas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ajiaco Colombiano');
    
    -- ENSALADAS
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ensalada Mixta', 8.99, 8.99, true, cat_ensaladas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ensalada Mixta');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ensalada de Aguacate', 10.99, 10.99, true, cat_ensaladas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ensalada de Aguacate');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ensalada César', 11.99, 11.99, true, cat_ensaladas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ensalada César');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ensalada de Palmito', 12.99, 12.99, true, cat_ensaladas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ensalada de Palmito');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ensalada Rusa', 9.99, 9.99, true, cat_ensaladas
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ensalada Rusa');
    
    -- Continue with remaining categories...
    RAISE NOTICE 'Menu items being created...';
    
    -- CEVICHES Y MARISCOS
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ceviche Peruano', 16.99, 16.99, true, cat_ceviches
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ceviche Peruano');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ceviche Mixto', 18.99, 18.99, true, cat_ceviches
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ceviche Mixto');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ceviche de Camarón', 17.99, 17.99, true, cat_ceviches
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ceviche de Camarón');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Camarones al Ajillo', 19.99, 19.99, true, cat_ceviches
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Camarones al Ajillo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Arroz con Mariscos', 21.99, 21.99, true, cat_ceviches
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Arroz con Mariscos');
    
    -- CARNES A LA PARRILLA
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Churrasco', 24.99, 24.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Churrasco');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Picaña', 26.99, 26.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Picaña');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Costillas BBQ', 22.99, 22.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Costillas BBQ');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Lomo de Res', 25.99, 25.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Lomo de Res');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Entraña', 27.99, 27.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Entraña');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Chuleta de Cerdo', 18.99, 18.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chuleta de Cerdo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Parrillada Mixta (para 2)', 49.99, 49.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Parrillada Mixta (para 2)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Carne Asada', 23.99, 23.99, true, cat_carnes
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Carne Asada');
    
    -- PLATOS FUERTES
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Bandeja Paisa', 22.99, 22.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bandeja Paisa');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Lomo Saltado', 19.99, 19.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Lomo Saltado');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Ropa Vieja', 18.99, 18.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ropa Vieja');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Bistec Encebollado', 17.99, 17.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Bistec Encebollado');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Arroz con Pollo', 16.99, 16.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Arroz con Pollo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pabellón Criollo', 18.99, 18.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pabellón Criollo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Lechón Asado', 21.99, 21.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Lechón Asado');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pernil de Cerdo', 19.99, 19.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pernil de Cerdo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Chuleta Valluna', 20.99, 20.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chuleta Valluna');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Sobrebarriga', 19.99, 19.99, true, cat_platos
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Sobrebarriga');
    
    -- POLLO
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pollo a la Brasa (1/4)', 9.99, 9.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pollo a la Brasa (1/4)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pollo a la Brasa (1/2)', 15.99, 15.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pollo a la Brasa (1/2)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pollo a la Brasa (Entero)', 24.99, 24.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pollo a la Brasa (Entero)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pollo Guisado', 14.99, 14.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pollo Guisado');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pollo Frito', 13.99, 13.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pollo Frito');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Milanesa de Pollo', 15.99, 15.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Milanesa de Pollo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pechuga a la Plancha', 16.99, 16.99, true, cat_pollo
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pechuga a la Plancha');
    
    -- PESCADOS
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pescado Frito (Mojarra)', 18.99, 18.99, true, cat_pescados
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pescado Frito (Mojarra)');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pescado al Ajillo', 19.99, 19.99, true, cat_pescados
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pescado al Ajillo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Pescado Sudado', 20.99, 20.99, true, cat_pescados
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pescado Sudado');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Filete de Tilapia', 17.99, 17.99, true, cat_pescados
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Filete de Tilapia');
    
    -- ACOMPAÑAMIENTOS
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Arroz Blanco', 3.99, 3.99, true, cat_acomp
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Arroz Blanco');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Frijoles', 4.99, 4.99, true, cat_acomp
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Frijoles');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Maduros', 4.99, 4.99, true, cat_acomp
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Maduros');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Yuca Cocida', 4.99, 4.99, true, cat_acomp
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Yuca Cocida');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Papas Fritas', 4.99, 4.99, true, cat_acomp
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Papas Fritas');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Aguacate', 3.99, 3.99, true, cat_acomp
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Aguacate');
    
    -- POSTRES
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Tres Leches', 7.99, 7.99, true, cat_postres
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Tres Leches');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Flan de Caramelo', 6.99, 6.99, true, cat_postres
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Flan de Caramelo');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Arroz con Leche', 5.99, 5.99, true, cat_postres
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Arroz con Leche');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Natilla', 6.99, 6.99, true, cat_postres
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Natilla');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Cheesecake de Guayaba', 8.99, 8.99, true, cat_postres
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cheesecake de Guayaba');
    
    INSERT INTO menu_items (id, company_id, name, price, base_price, available, category_id)
    SELECT gen_random_uuid(), company_uuid, 'Helado (2 bolas)', 5.99, 5.99, true, cat_postres
    WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Helado (2 bolas)');
    
    RAISE NOTICE 'All menu items created successfully!';
END $$;