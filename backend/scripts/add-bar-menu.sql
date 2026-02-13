-- Script to add Bar Menu Categories and Items
-- Adds 30 drinks across 6 categories
-- Linked to Bar Station: 79c72531-cdfc-446a-bffb-020004ecee972

DO $$
DECLARE
    company_uuid UUID;
    menu_uuid UUID;
    bar_station_uuid UUID := '79c72531-cdfc-446a-bffb-020004ecee972';
    
    -- Categories UUIDs
    cat_beers UUID := gen_random_uuid();
    cat_wines UUID := gen_random_uuid();
    cat_cocktails_classic UUID := gen_random_uuid();
    cat_cocktails_house UUID := gen_random_uuid();
    cat_non_alcoholic UUID := gen_random_uuid();
    cat_spirits UUID := gen_random_uuid();
    
    -- Temp variable to hold inserted IDs if needed, though we'll use INSERT-SELECT strategy
BEGIN
    -- Get company ID
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    
    -- Get Main Menu ID
    SELECT id INTO menu_uuid FROM menus WHERE name = 'Menú Principal' LIMIT 1;
    
    IF menu_uuid IS NULL THEN
        RAISE EXCEPTION 'Main menu not found';
    END IF;

    -- 1. Insert Bar Categories
    INSERT INTO menu_categories (id, menu_id, name, display_order, is_active) VALUES
    (cat_cocktails_classic, menu_uuid, 'Cocteles Clásicos', 12, true),
    (cat_cocktails_house, menu_uuid, 'Cocteles de la Casa', 13, true),
    (cat_beers, menu_uuid, 'Cervezas', 14, true),
    (cat_wines, menu_uuid, 'Vinos', 15, true),
    (cat_spirits, menu_uuid, 'Licores y Destilados', 16, true),
    (cat_non_alcoholic, menu_uuid, 'Bebidas sin Alcohol', 17, true);

    -- 2. Insert Products (Menu Items)

    -- BEERS (5)
    INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) VALUES
    (gen_random_uuid(), company_uuid, cat_beers, 'Corona Extra', 6.00, 6.00, true, true),
    (gen_random_uuid(), company_uuid, cat_beers, 'Modelo Especial', 7.00, 7.00, true, true),
    (gen_random_uuid(), company_uuid, cat_beers, 'Presidente', 6.50, 6.50, true, true),
    (gen_random_uuid(), company_uuid, cat_beers, 'Stella Artois', 8.00, 8.00, true, true),
    (gen_random_uuid(), company_uuid, cat_beers, 'IPA Artesanal Local', 9.00, 9.00, true, true);

    -- WINES (4)
    INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) VALUES
    (gen_random_uuid(), company_uuid, cat_wines, 'Malbec Reserva (Copa)', 12.00, 12.00, true, true),
    (gen_random_uuid(), company_uuid, cat_wines, 'Cabernet Sauvignon (Copa)', 11.00, 11.00, true, true),
    (gen_random_uuid(), company_uuid, cat_wines, 'Chardonnay (Copa)', 10.00, 10.00, true, true),
    (gen_random_uuid(), company_uuid, cat_wines, 'Sauvignon Blanc (Copa)', 11.00, 11.00, true, true);

    -- COCKTAILS CLASSIC (8)
    INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) VALUES
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Margarita Clásica', 14.00, 14.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Mojito Cubano', 13.00, 13.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Piña Colada', 14.00, 14.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Caipirinha', 13.00, 13.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Pisco Sour', 15.00, 15.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Cuba Libre', 12.00, 12.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Old Fashioned', 16.00, 16.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_classic, 'Dry Martini', 15.00, 15.00, true, true);
    
    -- COCKTAILS HOUSE (2)
    INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) VALUES
    (gen_random_uuid(), company_uuid, cat_cocktails_house, 'Sangría de la Casa', 11.00, 11.00, true, true),
    (gen_random_uuid(), company_uuid, cat_cocktails_house, 'Michelada Especial', 9.00, 9.00, true, true);

    -- NON ALCOHOLIC (5)
    INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) VALUES
    (gen_random_uuid(), company_uuid, cat_non_alcoholic, 'Coca Cola / Diet Coke', 3.50, 3.50, true, true),
    (gen_random_uuid(), company_uuid, cat_non_alcoholic, 'Sprite', 3.50, 3.50, true, true),
    (gen_random_uuid(), company_uuid, cat_non_alcoholic, 'Agua Mineral con Gas', 4.00, 4.00, true, true),
    (gen_random_uuid(), company_uuid, cat_non_alcoholic, 'Jugo de Naranja Natural', 6.00, 6.00, true, true),
    (gen_random_uuid(), company_uuid, cat_non_alcoholic, 'Limonada Fresca', 5.00, 5.00, true, true);

    -- SPIRITS (6)
    INSERT INTO menu_items (id, company_id, category_id, name, price, base_price, available, active) VALUES
    (gen_random_uuid(), company_uuid, cat_spirits, 'Tequila Don Julio Blanco', 16.00, 16.00, true, true),
    (gen_random_uuid(), company_uuid, cat_spirits, 'Ron Zacapa 23', 18.00, 18.00, true, true),
    (gen_random_uuid(), company_uuid, cat_spirits, 'Aguardiente Antioqueño', 10.00, 10.00, true, true),
    (gen_random_uuid(), company_uuid, cat_spirits, 'Whisky Johnnie Walker Black', 14.00, 14.00, true, true),
    (gen_random_uuid(), company_uuid, cat_spirits, 'Vodka Grey Goose', 15.00, 15.00, true, true),
    (gen_random_uuid(), company_uuid, cat_spirits, 'Gin Tanqueray', 13.00, 13.00, true, true);

    -- 3. Link all these new products to the Bar Station
    -- We select items that belong to the categories we just created
    INSERT INTO product_components (id, product_id, station_id, component_name)
    SELECT 
        gen_random_uuid(),
        mi.id,
        bar_station_uuid,
        'Bebida' -- Generic component name
    FROM menu_items mi
    WHERE mi.category_id IN (cat_beers, cat_wines, cat_cocktails_classic, cat_cocktails_house, cat_non_alcoholic, cat_spirits);

    RAISE NOTICE 'Bar menu added successfully: 6 Categories, 30 Items, linked to Bar Station';
END $$;