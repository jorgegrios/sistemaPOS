-- Script to add Bar Menu Categories and Items
-- Adds 30 drinks across 6 categories
-- dynamically links to Bar Station
-- IDEMPOTENT: Uses ON CONFLICT to handle unique constraints

DO $$
DECLARE
    company_uuid UUID;
    menu_uuid UUID;
    bar_station_uuid UUID;
    
    -- Category IDs
    cat_beers UUID;
    cat_wines UUID;
    cat_cocktails_classic UUID;
    cat_cocktails_house UUID;
    cat_non_alcoholic UUID;
    cat_spirits UUID;
    
    -- Item ID variable
    new_item_id UUID;
BEGIN
    -- Get company ID
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    
    -- Get Main Menu ID
    SELECT id INTO menu_uuid FROM menus WHERE name LIKE 'Men%Principal' LIMIT 1;
    
    IF menu_uuid IS NULL THEN
        RAISE EXCEPTION 'Main menu not found';
    END IF;

    -- Get Bar Station ID Dynamically
    SELECT id INTO bar_station_uuid FROM kitchen_stations WHERE name LIKE '%Bar%' LIMIT 1;

    IF bar_station_uuid IS NULL THEN
        RAISE EXCEPTION 'Bar station not found';
    END IF;

    ---------------------------------------------------------------------------
    -- 1. Insert Categories (Idempotent via ON CONFLICT)
    ---------------------------------------------------------------------------
    
    -- COCTELES CLASICOS
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) 
    VALUES (gen_random_uuid(), menu_uuid, 'Cocteles Clásicos', 12, true)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cat_cocktails_classic FROM menu_categories WHERE name = 'Cocteles Clásicos';

    -- COCTELES DE LA CASA
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) 
    VALUES (gen_random_uuid(), menu_uuid, 'Cocteles de la Casa', 13, true)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cat_cocktails_house FROM menu_categories WHERE name = 'Cocteles de la Casa';

    -- CERVEZAS
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) 
    VALUES (gen_random_uuid(), menu_uuid, 'Cervezas', 14, true)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cat_beers FROM menu_categories WHERE name = 'Cervezas';

    -- VINOS
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) 
    VALUES (gen_random_uuid(), menu_uuid, 'Vinos', 15, true)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cat_wines FROM menu_categories WHERE name = 'Vinos';

    -- LICORES Y DESTILADOS
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) 
    VALUES (gen_random_uuid(), menu_uuid, 'Licores y Destilados', 16, true)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cat_spirits FROM menu_categories WHERE name = 'Licores y Destilados';

    -- BEBIDAS SIN ALCOHOL
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) 
    VALUES (gen_random_uuid(), menu_uuid, 'Bebidas sin Alcohol', 17, true)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cat_non_alcoholic FROM menu_categories WHERE name = 'Bebidas sin Alcohol';

    ---------------------------------------------------------------------------
    -- 2. Insert Products (Menu Items) - Idempotent
    ---------------------------------------------------------------------------
    
    -- BEERS (5)
    -- Item: Corona Extra
    PERFORM 1 FROM menu_items WHERE category_id = cat_beers AND name = 'Corona Extra';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_beers, 'Corona Extra', 6.00, 6.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Item: Modelo Especial
    PERFORM 1 FROM menu_items WHERE category_id = cat_beers AND name = 'Modelo Especial';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_beers, 'Modelo Especial', 7.00, 7.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Item: Presidente
    PERFORM 1 FROM menu_items WHERE category_id = cat_beers AND name = 'Presidente';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_beers, 'Presidente', 6.50, 6.50, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Item: Stella Artois
    PERFORM 1 FROM menu_items WHERE category_id = cat_beers AND name = 'Stella Artois';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_beers, 'Stella Artois', 8.00, 8.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;
    
    -- Item: IPA Artesanal Local
    PERFORM 1 FROM menu_items WHERE category_id = cat_beers AND name = 'IPA Artesanal Local';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_beers, 'IPA Artesanal Local', 9.00, 9.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;


    -- WINES (4)
    -- Malbec
    PERFORM 1 FROM menu_items WHERE category_id = cat_wines AND name = 'Malbec Reserva (Copa)';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_wines, 'Malbec Reserva (Copa)', 12.00, 12.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Cabernet
    PERFORM 1 FROM menu_items WHERE category_id = cat_wines AND name = 'Cabernet Sauvignon (Copa)';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_wines, 'Cabernet Sauvignon (Copa)', 11.00, 11.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Chardonnay
    PERFORM 1 FROM menu_items WHERE category_id = cat_wines AND name = 'Chardonnay (Copa)';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_wines, 'Chardonnay (Copa)', 10.00, 10.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Sauvignon Blanc
    PERFORM 1 FROM menu_items WHERE category_id = cat_wines AND name = 'Sauvignon Blanc (Copa)';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_wines, 'Sauvignon Blanc (Copa)', 11.00, 11.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;


    -- COCKTAILS CLASSIC (8)
    -- Margarita
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Margarita Clásica';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Margarita Clásica', 14.00, 14.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Mojito
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Mojito Cubano';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Mojito Cubano', 13.00, 13.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Piña Colada
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Piña Colada';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Piña Colada', 14.00, 14.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Caipirinha
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Caipirinha';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Caipirinha', 13.00, 13.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Pisco Sour
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Pisco Sour';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Pisco Sour', 15.00, 15.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Cuba Libre
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Cuba Libre';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Cuba Libre', 12.00, 12.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Old Fashioned
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Old Fashioned';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Old Fashioned', 16.00, 16.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Dry Martini
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_classic AND name = 'Dry Martini';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_classic, 'Dry Martini', 15.00, 15.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;


    -- COCKTAILS HOUSE (2)
    -- Sangria
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_house AND name = 'Sangría de la Casa';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_house, 'Sangría de la Casa', 11.00, 11.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Michelada
    PERFORM 1 FROM menu_items WHERE category_id = cat_cocktails_house AND name = 'Michelada Especial';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_cocktails_house, 'Michelada Especial', 9.00, 9.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;


    -- NON ALCOHOLIC (5)
    -- Coca Cola
    PERFORM 1 FROM menu_items WHERE category_id = cat_non_alcoholic AND name = 'Coca Cola / Diet Coke';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_non_alcoholic, 'Coca Cola / Diet Coke', 3.50, 3.50, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Sprite
    PERFORM 1 FROM menu_items WHERE category_id = cat_non_alcoholic AND name = 'Sprite';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_non_alcoholic, 'Sprite', 3.50, 3.50, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Agua Mineral
    PERFORM 1 FROM menu_items WHERE category_id = cat_non_alcoholic AND name = 'Agua Mineral con Gas';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_non_alcoholic, 'Agua Mineral con Gas', 4.00, 4.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Jugo
    PERFORM 1 FROM menu_items WHERE category_id = cat_non_alcoholic AND name = 'Jugo de Naranja Natural';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_non_alcoholic, 'Jugo de Naranja Natural', 6.00, 6.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Limonada
    PERFORM 1 FROM menu_items WHERE category_id = cat_non_alcoholic AND name = 'Limonada Fresca';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_non_alcoholic, 'Limonada Fresca', 5.00, 5.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;


    -- SPIRITS (6)
    -- Tequila
    PERFORM 1 FROM menu_items WHERE category_id = cat_spirits AND name = 'Tequila Don Julio Blanco';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_spirits, 'Tequila Don Julio Blanco', 16.00, 16.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Ron
    PERFORM 1 FROM menu_items WHERE category_id = cat_spirits AND name = 'Ron Zacapa 23';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_spirits, 'Ron Zacapa 23', 18.00, 18.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Aguardiente
    PERFORM 1 FROM menu_items WHERE category_id = cat_spirits AND name = 'Aguardiente Antioqueño';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_spirits, 'Aguardiente Antioqueño', 10.00, 10.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Whisky
    PERFORM 1 FROM menu_items WHERE category_id = cat_spirits AND name = 'Whisky Johnnie Walker Black';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_spirits, 'Whisky Johnnie Walker Black', 14.00, 14.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Vodka
    PERFORM 1 FROM menu_items WHERE category_id = cat_spirits AND name = 'Vodka Grey Goose';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_spirits, 'Vodka Grey Goose', 15.00, 15.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    -- Gin
    PERFORM 1 FROM menu_items WHERE category_id = cat_spirits AND name = 'Gin Tanqueray';
    IF NOT FOUND THEN
        new_item_id := gen_random_uuid();
        INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) 
        VALUES (new_item_id, company_uuid, cat_spirits, 'Gin Tanqueray', 13.00, 13.00, true, true);
        INSERT INTO product_components (id, product_id, station_id, component_name) VALUES (gen_random_uuid(), new_item_id, bar_station_uuid, 'Bebida');
    END IF;

    RAISE NOTICE 'Bar menu added successfully: 6 Categories, 30 Items, linked to Bar Station';
END $$;