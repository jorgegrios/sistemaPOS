// Minimal stripe provider wrapper (sandbox)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export async function processCardPayment(amount: number, currency: string, paymentMethodId: string) {
  // Create payment intent
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    payment_method: paymentMethodId,
    confirm: true,
    capture_method: 'automatic'
  });
  return intent;
}
