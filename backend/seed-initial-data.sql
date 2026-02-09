-- Create Tables (dining tables)
INSERT INTO
    tables (
        company_id,
        name,
        table_number
    )
SELECT c.id, 'Mesa 1', '1'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 2', '2'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 3', '3'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 4', '4'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 5', '5'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 6', '6'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 7', '7'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Mesa 8', '8'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Barra 1', 'B1'
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Barra 2', 'B2'
FROM companies c
WHERE
    c.slug = 'default';

-- Create Kitchen Stations
INSERT INTO
    kitchen_stations (company_id, name, is_default)
SELECT c.id, 'Cocina Principal', true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Ensaladas y Fríos', false
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Bar', false
FROM companies c
WHERE
    c.slug = 'default';

-- Create some basic menu items
INSERT INTO
    menu_items (
        company_id,
        name,
        price,
        available
    )
SELECT c.id, 'Hamburguesa Clásica', 12.99, true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Pizza Margarita', 14.99, true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Ensalada César', 8.99, true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Pasta Carbonara', 13.99, true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Cerveza', 4.99, true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Refresco', 2.99, true
FROM companies c
WHERE
    c.slug = 'default'
UNION ALL
SELECT c.id, 'Café', 2.50, true
FROM companies c
WHERE
    c.slug = 'default';