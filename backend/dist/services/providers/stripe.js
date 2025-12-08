"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCardPayment = processCardPayment;
// Minimal stripe provider wrapper (sandbox)
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
async function processCardPayment(amount, currency, paymentMethodId) {
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
