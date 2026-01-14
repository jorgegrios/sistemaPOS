/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create labor_positions table (cargos de trabajo)
  pgm.createTable('labor_positions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    monthly_salary: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    hours_per_month: {
      type: 'numeric(10,2)',
      default: 160, // 40 hours/week * 4 weeks
    },
    cost_per_minute: {
      type: 'numeric(10,4)',
      // Calculated: monthly_salary / (hours_per_month * 60)
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('labor_positions', ['restaurant_id']);

  // Create menu_item_labor table (tiempo de preparación por plato)
  pgm.createTable('menu_item_labor', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    labor_position_id: {
      type: 'uuid',
      notNull: true,
      references: 'labor_positions(id)',
      onDelete: 'CASCADE',
    },
    preparation_time_minutes: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('menu_item_labor', ['menu_item_id']);
  pgm.createIndex('menu_item_labor', ['labor_position_id']);

  // Create overhead_costs table (costos indirectos)
  pgm.createTable('overhead_costs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    monthly_amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    category: {
      type: 'varchar(100)',
      // e.g., 'rent', 'utilities', 'internet', 'software', 'cleaning'
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('overhead_costs', ['restaurant_id']);

  // Create overhead_allocation_methods table (métodos de prorrateo)
  pgm.createTable('overhead_allocation_methods', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    method_type: {
      type: 'varchar(50)',
      notNull: true,
      // 'fixed_percentage', 'per_plate', 'production_hours'
    },
    fixed_percentage: {
      type: 'numeric(5,2)',
      // For fixed_percentage method
    },
    per_plate_amount: {
      type: 'numeric(10,2)',
      // For per_plate method
    },
    production_hours_per_month: {
      type: 'numeric(10,2)',
      // For production_hours method
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('overhead_allocation_methods', ['restaurant_id']);

  // Create packaging_costs table (costos de empaques)
  pgm.createTable('packaging_costs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    cost_per_unit: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    unit: {
      type: 'varchar(50)',
      default: 'unidad',
    },
    active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('packaging_costs', ['restaurant_id']);

  // Create menu_item_packaging table (empaques por plato)
  pgm.createTable('menu_item_packaging', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    packaging_cost_id: {
      type: 'uuid',
      notNull: true,
      references: 'packaging_costs(id)',
      onDelete: 'CASCADE',
    },
    quantity: {
      type: 'numeric(10,2)',
      default: 1,
    },
    channel: {
      type: 'varchar(50)',
      // 'dine_in', 'delivery', 'takeout', 'all'
      default: 'all',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('menu_item_packaging', ['menu_item_id']);
  pgm.createIndex('menu_item_packaging', ['packaging_cost_id']);

  // Create restaurant_cost_config table (configuración de food cost)
  pgm.createTable('restaurant_cost_config', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    restaurant_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'restaurants(id)',
      onDelete: 'CASCADE',
    },
    target_food_cost_percentage: {
      type: 'numeric(5,2)',
      default: 30.00,
      // Food cost objetivo (ej: 30%)
    },
    currency: {
      type: 'varchar(10)',
      default: 'USD',
    },
    tax_percentage: {
      type: 'numeric(5,2)',
      default: 0.00,
    },
    price_rounding_method: {
      type: 'varchar(50)',
      default: 'nearest',
      // 'nearest', 'up', 'down', 'none'
    },
    include_labor_in_cost: {
      type: 'boolean',
      default: true,
    },
    include_overhead_in_cost: {
      type: 'boolean',
      default: true,
    },
    include_packaging_in_cost: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('restaurant_cost_config', ['restaurant_id']);

  // Create cost_history table (historial de cambios de costos)
  pgm.createTable('cost_history', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    ingredient_cost: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    labor_cost: {
      type: 'numeric(10,2)',
      default: 0,
    },
    overhead_cost: {
      type: 'numeric(10,2)',
      default: 0,
    },
    packaging_cost: {
      type: 'numeric(10,2)',
      default: 0,
    },
    total_cost: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    selling_price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    food_cost_percentage: {
      type: 'numeric(5,2)',
      notNull: true,
    },
    profit_margin: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    recorded_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('cost_history', ['menu_item_id']);
  pgm.createIndex('cost_history', ['recorded_at']);

  // Create function to calculate labor cost per minute
  pgm.sql(`
    CREATE OR REPLACE FUNCTION calculate_labor_cost_per_minute(monthly_salary numeric, hours_per_month numeric)
    RETURNS numeric AS $$
    BEGIN
      IF hours_per_month = 0 OR hours_per_month IS NULL THEN
        RETURN 0;
      END IF;
      RETURN (monthly_salary / (hours_per_month * 60));
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger function for updating cost_per_minute
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_update_labor_cost_per_minute()
    RETURNS trigger AS $$
    BEGIN
      NEW.cost_per_minute := calculate_labor_cost_per_minute(NEW.monthly_salary, NEW.hours_per_month);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger to auto-calculate cost_per_minute
  pgm.sql(`
    CREATE TRIGGER update_labor_cost_per_minute
      BEFORE INSERT OR UPDATE ON labor_positions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_update_labor_cost_per_minute();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS update_labor_cost_per_minute ON labor_positions;');
  pgm.sql('DROP FUNCTION IF EXISTS trigger_update_labor_cost_per_minute();');
  pgm.sql('DROP FUNCTION IF EXISTS calculate_labor_cost_per_minute(numeric, numeric);');
  pgm.dropTable('cost_history', { ifExists: true });
  pgm.dropTable('restaurant_cost_config', { ifExists: true });
  pgm.dropTable('menu_item_packaging', { ifExists: true });
  pgm.dropTable('packaging_costs', { ifExists: true });
  pgm.dropTable('overhead_allocation_methods', { ifExists: true });
  pgm.dropTable('overhead_costs', { ifExists: true });
  pgm.dropTable('menu_item_labor', { ifExists: true });
  pgm.dropTable('labor_positions', { ifExists: true });
};

