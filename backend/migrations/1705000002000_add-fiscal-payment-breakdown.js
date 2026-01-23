exports.up = (pgm) => {
    // Add fiscal breakdown to payment_transactions
    pgm.addColumns('payment_transactions', {
        subtotal_amount: { type: 'numeric(12,2)', default: 0 },
        tax_amount: { type: 'numeric(12,2)', default: 0 },
        service_charge: { type: 'numeric(12,2)', default: 0 },
        tip_amount: { type: 'numeric(12,2)', default: 0 },
        masked_card: { type: 'varchar(20)' }, // For FACTA compliance (last 4 digits)
        provider_transaction_id: { type: 'varchar(255)' },
        provider_error_code: { type: 'varchar(100)' }
    }, { ifNotExists: true });

    // Add multi-tenant payment settings to companies
    pgm.addColumns('companies', {
        payment_settings: { type: 'jsonb', default: '{}' }
    }, { ifNotExists: true });

    // Important: Add index for performance in multi-tenant queries
    pgm.createIndex('payment_transactions', 'provider_transaction_id', { ifNotExists: true });
};

exports.down = (pgm) => {
    pgm.dropColumns('payment_transactions', [
        'subtotal_amount',
        'tax_amount',
        'service_charge',
        'tip_amount',
        'masked_card',
        'provider_transaction_id',
        'provider_error_code'
    ], { ifExists: true });
    pgm.dropColumns('companies', ['payment_settings'], { ifExists: true });
};
