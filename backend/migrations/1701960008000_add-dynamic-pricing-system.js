/* eslint-disable camelcase */

exports.up = (pgm) => {
  // Create sales_history table (historial de ventas por plato)
  pgm.createTable('sales_history', {
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
    order_id: {
      type: 'uuid',
      references: 'orders(id)',
      onDelete: 'SET NULL',
    },
    quantity: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    unit_price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    total_amount: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    channel: {
      type: 'varchar(50)',
      // 'dine_in', 'delivery', 'takeout', 'app'
    },
    day_of_week: {
      type: 'integer',
      // 0 = Sunday, 1 = Monday, etc.
    },
    hour: {
      type: 'integer',
      // 0-23
    },
    sold_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('sales_history', ['menu_item_id']);
  pgm.createIndex('sales_history', ['sold_at']);
  pgm.createIndex('sales_history', ['menu_item_id', 'sold_at']);

  // Create price_recommendations table (recomendaciones de precios de IA)
  pgm.createTable('price_recommendations', {
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
    current_price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    recommended_price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    min_price: {
      type: 'numeric(10,2)',
    },
    max_price: {
      type: 'numeric(10,2)',
    },
    projected_margin: {
      type: 'numeric(5,2)',
      // Percentage
    },
    projected_food_cost: {
      type: 'numeric(5,2)',
      // Percentage
    },
    expected_sales_impact: {
      type: 'numeric(5,2)',
      // Percentage change in sales volume
    },
    confidence_level: {
      type: 'numeric(5,2)',
      // 0-100
    },
    model_version: {
      type: 'varchar(50)',
      // Version of the AI model used
    },
    reasoning: {
      type: 'text',
      // Explanation of why this price was recommended
    },
    status: {
      type: 'varchar(50)',
      default: 'pending',
      // 'pending', 'approved', 'rejected', 'applied'
    },
    applied_at: {
      type: 'timestamp',
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

  pgm.createIndex('price_recommendations', ['menu_item_id']);
  pgm.createIndex('price_recommendations', ['status']);
  pgm.createIndex('price_recommendations', ['created_at']);

  // Create price_elasticity table (elasticidad de precios por plato)
  pgm.createTable('price_elasticity', {
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
    elasticity_coefficient: {
      type: 'numeric(10,4)',
      // Price elasticity of demand
    },
    price_sensitivity: {
      type: 'varchar(50)',
      // 'elastic', 'inelastic', 'unitary'
    },
    base_volume: {
      type: 'integer',
      // Average sales volume at base price
    },
    base_price: {
      type: 'numeric(10,2)',
      // Reference price
    },
    calculated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('price_elasticity', ['menu_item_id']);

  // Create pricing_scenarios table (simulaciones de escenarios de precio)
  pgm.createTable('pricing_scenarios', {
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
    scenario_name: {
      type: 'varchar(255)',
      // e.g., 'Low Price', 'High Price', 'Optimal'
    },
    test_price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    projected_volume: {
      type: 'integer',
      // Expected sales volume
    },
    projected_revenue: {
      type: 'numeric(10,2)',
      // Expected total revenue
    },
    projected_margin: {
      type: 'numeric(10,2)',
      // Expected profit margin
    },
    projected_food_cost: {
      type: 'numeric(5,2)',
      // Expected food cost percentage
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('pricing_scenarios', ['menu_item_id']);

  // Create pricing_feedback table (feedback para aprendizaje continuo)
  pgm.createTable('pricing_feedback', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    price_recommendation_id: {
      type: 'uuid',
      references: 'price_recommendations(id)',
      onDelete: 'SET NULL',
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    applied_price: {
      type: 'numeric(10,2)',
      notNull: true,
    },
    actual_sales_volume: {
      type: 'integer',
      // Actual sales after price change
    },
    expected_sales_volume: {
      type: 'integer',
      // Expected sales from model
    },
    accuracy_score: {
      type: 'numeric(5,2)',
      // How accurate was the prediction (0-100)
    },
    feedback_type: {
      type: 'varchar(50)',
      // 'positive', 'negative', 'neutral'
    },
    notes: {
      type: 'text',
    },
    recorded_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('pricing_feedback', ['menu_item_id']);
  pgm.createIndex('pricing_feedback', ['price_recommendation_id']);

  // Create menu_item_pricing_config table (configuración de pricing por plato)
  pgm.createTable('menu_item_pricing_config', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    menu_item_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'menu_items(id)',
      onDelete: 'CASCADE',
    },
    category_type: {
      type: 'varchar(50)',
      // 'star', 'anchor', 'complement'
      // star = plato estrella, anchor = ancla, complement = complemento
    },
    min_margin_percentage: {
      type: 'numeric(5,2)',
      // Margen mínimo aceptable
    },
    target_food_cost: {
      type: 'numeric(5,2)',
      // Food cost objetivo específico para este plato
    },
    price_floor: {
      type: 'numeric(10,2)',
      // Precio mínimo permitido
    },
    price_ceiling: {
      type: 'numeric(10,2)',
      // Precio máximo permitido
    },
    psychological_price_points: {
      type: 'jsonb',
      // Array de precios psicológicos (ej: [19.90, 29.90, 39.90])
    },
    enable_dynamic_pricing: {
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

  pgm.createIndex('menu_item_pricing_config', ['menu_item_id']);

  // Create pricing_model_metrics table (métricas del modelo de IA)
  pgm.createTable('pricing_model_metrics', {
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
    model_version: {
      type: 'varchar(50)',
      notNull: true,
    },
    accuracy_score: {
      type: 'numeric(5,2)',
      // Overall model accuracy
    },
    avg_prediction_error: {
      type: 'numeric(5,2)',
      // Average prediction error percentage
    },
    total_recommendations: {
      type: 'integer',
      default: 0,
    },
    successful_recommendations: {
      type: 'integer',
      default: 0,
    },
    last_trained_at: {
      type: 'timestamp',
    },
    training_data_size: {
      type: 'integer',
      // Number of records used for training
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

  pgm.createIndex('pricing_model_metrics', ['restaurant_id']);
  pgm.createIndex('pricing_model_metrics', ['model_version']);

  // Add column to order_items to track channel
  pgm.addColumn('order_items', {
    channel: {
      type: 'varchar(50)',
      // 'dine_in', 'delivery', 'takeout', 'app'
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('order_items', 'channel', { ifExists: true });
  pgm.dropTable('pricing_model_metrics', { ifExists: true });
  pgm.dropTable('menu_item_pricing_config', { ifExists: true });
  pgm.dropTable('pricing_feedback', { ifExists: true });
  pgm.dropTable('pricing_scenarios', { ifExists: true });
  pgm.dropTable('price_elasticity', { ifExists: true });
  pgm.dropTable('price_recommendations', { ifExists: true });
  pgm.dropTable('sales_history', { ifExists: true });
};






