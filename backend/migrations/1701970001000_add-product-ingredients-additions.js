/* eslint-disable camelcase */

/**
 * Migration: Add product ingredients and additions support
 * 
 * Adds support for:
 * - Storing included ingredients in menu_items.metadata
 * - Storing available additions in menu_items.metadata
 * - Using order_item_modifiers to track excluded ingredients and added extras
 */

exports.up = (pgm) => {
  // Agregar columna metadata a menu_items si no existe (ya debería existir, pero por si acaso)
  pgm.addColumn('menu_items', {
    metadata: {
      type: 'jsonb',
      default: pgm.func("'{}'::jsonb"),
    },
  }, { ifNotExists: true });

  // Agregar columna para almacenar customizaciones en order_items
  // Esto almacenará JSON con ingredientes excluidos y adiciones agregadas
  pgm.addColumn('order_items', {
    customizations: {
      type: 'jsonb',
      default: pgm.func("'{}'::jsonb"),
    },
  }, { ifNotExists: true });

  // Agregar tipo a order_item_modifiers para distinguir entre:
  // - 'excluded_ingredient' (ingrediente excluido, price_delta = 0)
  // - 'addition' (adición agregada, price_delta > 0)
  pgm.addColumn('order_item_modifiers', {
    modifier_type: {
      type: 'varchar(50)',
      default: 'addition',
    },
  }, { ifNotExists: true });

  // Crear índice para búsquedas por tipo
  pgm.createIndex('order_item_modifiers', ['modifier_type'], { ifNotExists: true });
};

exports.down = (pgm) => {
  // Revertir cambios
  pgm.dropIndex('order_item_modifiers', ['modifier_type'], { ifExists: true });
  pgm.dropColumn('order_item_modifiers', 'modifier_type', { ifExists: true });
  pgm.dropColumn('order_items', 'customizations', { ifExists: true });
  // No eliminamos metadata de menu_items porque puede tener otros datos
};




