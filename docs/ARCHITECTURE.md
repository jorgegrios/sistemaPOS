sistemaPOS — Arquitectura (resumen)

Componentes:
- Frontend (PWA): React + TypeScript, Tailwind, PWA service worker, touch-first UI.
- Backend: Node.js 20 + Express, Socket.io for realtime, PostgreSQL for persistent data, Redis for cache/queues, RabbitMQ for async tasks.
- Payments: Provider adapters (Stripe, Square, Mercado Pago) with tokenization and webhooks.
- KDS: Kitchen Display System connected via WebSockets / RabbitMQ.
- Printing: Integrations with thermal printers (ESC/POS) via network/USB adapters.

Flujo de pagos (diagrama de texto):
Client (POS) -> Backend /payments/process -> Provider Adapter -> Payment Gateway -> Bank
                                            <- Webhook (provider) -> Backend updates order
                                            -> KDS + Print + Notification

Seguridad y cumplimiento resumido: PCI DSS level 1, tokenization, webhooks HMAC verification, TLS 1.3.
