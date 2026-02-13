-- Migration: Add description to menu_items to support ingredient parsing
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;

-- Update some items with descriptions to test "Remove Ingredients"
UPDATE menu_items
SET
    description = 'Sopa tradicional con pollo desmenuzado, papa criolla, papa sabanera, papa pastusa, mazorca. Acompañado de alcaparras y crema de leche.'
WHERE
    name ILIKE '%Ajiaco%';

UPDATE menu_items
SET
    description = 'Mezcla de lechugas frescas, tomate cherry, cebolla roja, pepino cohombro y vinagreta de la casa.'
WHERE
    name ILIKE '%Ensalada%'
    OR name ILIKE '%Mixta%';

UPDATE menu_items
SET
    description = 'Sopa de mondongo con carne de cerdo, chorizo, papa y verduras. Acompañado de arroz y aguacate.'
WHERE
    name ILIKE '%Mondongo%';

UPDATE menu_items
SET
    description = 'Carne de res a la parrilla, acompañada de papa francesa y ensalada.'
WHERE
    name ILIKE '%Churrasco%';