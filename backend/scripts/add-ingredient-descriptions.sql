-- Add ingredient descriptions to menu items for customization
-- This allows waiters to remove ingredients from dishes

-- Pastas
UPDATE menu_items
SET
    description = 'Pasta con salsa carbonara, tocino, huevo, queso parmesano, crema de leche'
WHERE
    name = 'Pasta Carbonara';

UPDATE menu_items
SET
    description = 'Pasta con salsa boloñesa, carne molida, tomate, cebolla, ajo, albahaca'
WHERE
    name = 'Pasta Boloñesa';

UPDATE menu_items
SET
    description = 'Pasta con camarones, ajo, aceite de oliva, perejil, vino blanco, limón'
WHERE
    name = 'Pasta con Camarones';

UPDATE menu_items
SET
    description = 'Pasta con pollo, champiñones, crema de leche, ajo, queso parmesano'
WHERE
    name = 'Pasta Alfredo con Pollo';

-- Carnes
UPDATE menu_items
SET
    description = 'Carne de res, papas fritas, arroz, ensalada, chimichurri'
WHERE
    name = 'Churrasco';

UPDATE menu_items
SET
    description = 'Carne de res, cebolla caramelizada, papas, arroz, ensalada'
WHERE
    name = 'Bistec Encebollado';

UPDATE menu_items
SET
    description = 'Carne de res, tomate, cebolla, papas fritas, arroz, huevo frito'
WHERE
    name = 'Bistec a Caballo';

UPDATE menu_items
SET
    description = 'Carne de res, salsa de pimienta, papas, vegetales, arroz'
WHERE
    name = 'Lomo de Res en Salsa';

-- Pollo
UPDATE menu_items
SET
    description = 'Pollo asado, papas fritas, ensalada, arroz, salsa BBQ'
WHERE
    name = 'Pollo Asado';

UPDATE menu_items
SET
    description = 'Pollo apanado, papas fritas, arroz, ensalada, limón'
WHERE
    name = 'Pollo Apanado';

UPDATE menu_items
SET
    description = 'Pollo, champiñones, crema de leche, ajo, arroz, papas'
WHERE
    name = 'Pollo en Salsa de Champiñones';

UPDATE menu_items
SET
    description = 'Pollo a la plancha, vegetales salteados, arroz, ensalada'
WHERE
    name = 'Pechuga a la Plancha';

-- Pescados
UPDATE menu_items
SET
    description = 'Filete de pescado, ajo, limón, arroz, ensalada, patacones'
WHERE
    name = 'Pescado al Ajillo';

UPDATE menu_items
SET
    description = 'Filete de pescado apanado, arroz, ensalada, papas fritas, tártara'
WHERE
    name = 'Pescado Apanado';

UPDATE menu_items
SET
    description = 'Trucha, ajo, mantequilla, almendras, arroz, vegetales'
WHERE
    name = 'Trucha a la Almendra';

UPDATE menu_items
SET
    description = 'Salmón, salsa de maracuyá, arroz, vegetales, ensalada'
WHERE
    name = 'Salmón en Salsa de Maracuyá';

-- Hamburguesas
UPDATE menu_items
SET
    description = 'Carne de res, lechuga, tomate, cebolla, queso, papas fritas, salsa especial'
WHERE
    name = 'Hamburguesa Clásica';

UPDATE menu_items
SET
    description = 'Carne de res, queso cheddar, tocino, cebolla caramelizada, lechuga, tomate, papas fritas'
WHERE
    name = 'Hamburguesa Especial';

UPDATE menu_items
SET
    description = 'Carne de res, queso doble, tocino, lechuga, tomate, cebolla, pepinillos, papas fritas'
WHERE
    name = 'Hamburguesa Doble';

UPDATE menu_items
SET
    description = 'Carne de res, queso azul, cebolla caramelizada, rúcula, tomate, papas fritas'
WHERE
    name = 'Hamburguesa Gourmet';

-- Sopas
UPDATE menu_items
SET
    description = 'Pollo, papa, yuca, mazorca, guascas, alcaparras, crema de leche, aguacate'
WHERE
    name = 'Ajiaco';

UPDATE menu_items
SET
    description = 'Carne, pollo, cerdo, papa, yuca, plátano, mazorca, arroz, aguacate'
WHERE
    name = 'Sancocho';

UPDATE menu_items
SET
    description = 'Mondongo, papa, yuca, zanahoria, cilantro, cebolla, ajo'
WHERE
    name = 'Mondongo';

UPDATE menu_items
SET
    description = 'Costilla de res, papa, yuca, zanahoria, cilantro, cebolla'
WHERE
    name = 'Caldo de Costilla';

-- Bandeja Paisa
UPDATE menu_items
SET
    description = 'Carne molida, chicharrón, chorizo, huevo frito, frijoles, arroz, plátano maduro, aguacate, arepa'
WHERE
    name = 'Bandeja Paisa';

-- Cazuelas
UPDATE menu_items
SET
    description = 'Camarones, arroz, vegetales, salsa de mariscos, ajo, cebolla'
WHERE
    name = 'Cazuela de Mariscos';

UPDATE menu_items
SET
    description = 'Pollo, papa, yuca, zanahoria, arroz, cilantro, cebolla'
WHERE
    name = 'Cazuela de Pollo';

-- Arroces
UPDATE menu_items
SET
    description = 'Arroz, pollo, vegetales, arveja, zanahoria, pimentón, cilantro'
WHERE
    name = 'Arroz con Pollo';

UPDATE menu_items
SET
    description = 'Arroz, camarones, calamar, pescado, mejillones, vegetales, azafrán'
WHERE
    name = 'Arroz con Mariscos';

UPDATE menu_items
SET
    description = 'Arroz, carne de res, pollo, chorizo, vegetales, huevo, plátano'
WHERE
    name = 'Arroz Mixto';

-- Tacos
UPDATE menu_items
SET
    description = 'Tortilla, carne de res, cebolla, cilantro, limón, salsa picante'
WHERE
    name = 'Tacos de Carne';

UPDATE menu_items
SET
    description = 'Tortilla, pollo, lechuga, tomate, queso, crema, guacamole'
WHERE
    name = 'Tacos de Pollo';

UPDATE menu_items
SET
    description = 'Tortilla, pescado, repollo, pico de gallo, crema, limón'
WHERE
    name = 'Tacos de Pescado';

-- Wraps
UPDATE menu_items
SET
    description = 'Tortilla, pollo, lechuga, tomate, queso, aderezo césar, papas'
WHERE
    name = 'Wrap de Pollo';

UPDATE menu_items
SET
    description = 'Tortilla, carne, lechuga, tomate, cebolla, queso, salsa BBQ, papas'
WHERE
    name = 'Wrap de Carne';

UPDATE menu_items
SET
    description = 'Tortilla, vegetales asados, queso, aguacate, hummus, papas'
WHERE
    name = 'Wrap Vegetariano';

-- Desayunos
UPDATE menu_items
SET
    description = 'Huevos revueltos, arepa, queso, mantequilla, chocolate caliente'
WHERE
    name = 'Desayuno Típico';

UPDATE menu_items
SET
    description = 'Huevos, tocino, salchicha, pan tostado, jugo de naranja, café'
WHERE
    name = 'Desayuno Americano';

UPDATE menu_items
SET
    description = 'Huevos, frijoles, aguacate, queso, arepa, chocolate'
WHERE
    name = 'Calentado';

-- Postres
UPDATE menu_items
SET
    description = 'Tres leches, vainilla, canela, crema batida, cereza'
WHERE
    name = 'Tres Leches';

UPDATE menu_items
SET
    description = 'Flan de caramelo, huevo, leche condensada, vainilla'
WHERE
    name = 'Flan de Caramelo';

UPDATE menu_items
SET
    description = 'Brownie de chocolate, helado de vainilla, salsa de chocolate, nueces'
WHERE
    name = 'Brownie con Helado';

UPDATE menu_items
SET
    description = 'Cheesecake, fresas frescas, salsa de fresas, crema batida'
WHERE
    name = 'Cheesecake de Fresa';

UPDATE menu_items
SET
    description = 'Tiramisú, café, mascarpone, cacao, galletas, licor'
WHERE
    name = 'Tiramisú';

COMMIT;