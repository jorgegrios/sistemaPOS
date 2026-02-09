/**
 * Payment Provider Interface
 * Defines the contract for any payment provider (Stripe, Clover, etc.)
 */
export interface PaymentProvider {
    /**
     * Process a card payment using a token
     * @param amount Total amount to charge
     * @param token Payment method token from frontend
     * @param metadata Optional metadata (orderId, companyId, etc.)
     */
    processPayment(
        amount: number,
        token: string,
        metadata?: Record<string, any>
    ): Promise<{
        success: boolean;
        transactionId?: string;
        errorCode?: string;
        errorMessage?: string;
        maskedCard?: string;
    }>;
}

import Stripe from 'stripe';

/**
 * Stripe Payment Provider
 */
class StripeProvider implements PaymentProvider {
    private stripe: Stripe;

    constructor(apiKey: string) {
        this.stripe = new Stripe(apiKey, {
            apiVersion: '2022-11-15',
        });
    }

    async processPayment(
        amount: number,
        token: string,
        metadata?: Record<string, any>
    ): Promise<any> {
        try {
            console.log(`[StripeProvider] Processing payment of $${amount} with token ${token.substring(0, 10)}...`);

            // Create payment intent
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                payment_method: token,
                confirm: true,
                metadata: metadata || {},
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never'
                }
            });

            console.log(`[StripeProvider] Payment intent created: ${paymentIntent.id}, status: ${paymentIntent.status}`);

            if (paymentIntent.status === 'succeeded') {
                // Retrieve charges to get card details
                let maskedCard: string | undefined;
                if (paymentIntent.latest_charge) {
                    const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge as string);
                    const last4 = charge.payment_method_details?.card?.last4;
                    maskedCard = last4 ? `************${last4}` : undefined;
                }

                return {
                    success: true,
                    transactionId: paymentIntent.id,
                    maskedCard
                };
            }

            return {
                success: false,
                errorCode: paymentIntent.status,
                errorMessage: 'Payment not completed'
            };
        } catch (error: any) {
            console.error('[StripeProvider] Payment error:', error.message);
            return {
                success: false,
                errorCode: error.code || 'unknown_error',
                errorMessage: error.message || 'Payment processing failed'
            };
        }
    }
}


/**
 * QR Payment Provider Interface
 */
export interface QRProvider {
    /**
     * Generate a QR payload (URL or text) for a payment
     */
    generateQR(
        amount: number,
        metadata: Record<string, any>
    ): Promise<{
        qrData: string;
        type: 'url' | 'text' | 'image';
        provider: string;
    }>;
}

/**
 * Mock Provider for development/testing
 */
class MockProvider implements PaymentProvider {
    async processPayment(amount: number, token: string): Promise<any> {
        console.log(`[MockProvider] Processing payment of ${amount} with token ${token}`);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (token === 'tok_decline') {
            return {
                success: false,
                errorCode: 'card_declined',
                errorMessage: 'The card was declined.'
            };
        }

        return {
            success: true,
            transactionId: `mock_tx_${Date.now()}`,
            maskedCard: '************4242'
        };
    }
}

/**
 * Zelle QR Provider (Mock)
 */
class ZelleQRProvider implements QRProvider {
    constructor(private emailOrPhone: string) { }

    async generateQR(amount: number, metadata: Record<string, any>): Promise<any> {
        // Generate a simple Zelle-like deep link or instructions
        const qrData = `zelle://pay?recipient=${encodeURIComponent(this.emailOrPhone)}&amount=${amount}&memo=Order%20${metadata.orderNumber}`;

        return {
            qrData,
            type: 'url',
            provider: 'zelle'
        };
    }
}

/**
 * Generic QR Provider (Mock)
 */
class GenericQRProvider implements QRProvider {
    constructor(private paymentUrl: string) { }

    async generateQR(amount: number, metadata: Record<string, any>): Promise<any> {
        const qrData = `${this.paymentUrl}?amount=${amount}&ref=${metadata.orderId}`;

        return {
            qrData,
            type: 'url',
            provider: 'generic'
        };
    }
}

/**
 * Payment Provider Factory
 * Dynamically instantiates the correct provider based on tenant settings
 */
export class PaymentProviderFactory {
    static getProvider(settings: any): PaymentProvider {
        const providerType = settings?.type || 'mock';

        switch (providerType) {
            case 'stripe':
                const stripeKey = process.env.STRIPE_SECRET_KEY;
                if (!stripeKey) {
                    console.warn('[PaymentProviderFactory] Stripe key not found in environment, using mock provider');
                    return new MockProvider();
                }
                console.log('[PaymentProviderFactory] Using Stripe Provider');
                return new StripeProvider(stripeKey);

            case 'clover':
                console.log('[PaymentProviderFactory] Using Clover Provider');
                return new MockProvider();

            default:
                console.log('[PaymentProviderFactory] Using Default Mock Provider');
                return new MockProvider();
        }
    }

    static getQRProvider(settings: any): QRProvider {
        const qrType = settings?.qrType || 'generic';

        switch (qrType) {
            case 'zelle':
                return new ZelleQRProvider(settings.zelleRecipient || 'pos@example.com');

            case 'pix':
                return new GenericQRProvider('https://pay.pix.com/mock');

            default:
                return new GenericQRProvider(settings.paymentUrl || 'https://pay.restaurant.com/checkout');
        }
    }
}
