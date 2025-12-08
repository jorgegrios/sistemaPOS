# Frontend PWA - Sistema POS

Modern React-based Progressive Web App (PWA) for the Sistema POS system.

## Features

✅ **Responsive Design** - Works on all devices (desktop, tablet, mobile)  
✅ **Progressive Web App** - Installable, works offline  
✅ **JWT Authentication** - Secure login with token management  
✅ **Order Management** - Create, view, and manage orders  
✅ **Menu Browser** - Browse restaurant menus  
✅ **Payment Integration** - Support for multiple payment providers  
✅ **Real-time Updates** - Socket.io integration for live updates  
✅ **Touch-Friendly UI** - Optimized for touch interactions  

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Fetch API** - HTTP client
- **Service Workers** - Offline support

## Quick Start

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Server runs at http://localhost:5173
```

### Build for Production

```bash
npm run build

# Outputs to dist/
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── AppLayout.tsx      # Main app layout with sidebar
│   │   └── ProtectedRoute.tsx # Route protection wrapper
│   ├── contexts/              # React context providers
│   │   └── auth-context.tsx   # Authentication state
│   ├── pages/                 # Page components (routes)
│   │   ├── LoginPage.tsx      # Login page
│   │   ├── DashboardPage.tsx  # Dashboard/home
│   │   ├── OrdersPage.tsx     # Orders list
│   │   ├── CreateOrderPage.tsx# Create new order
│   │   ├── MenuPage.tsx       # Menu browser
│   │   └── PaymentsPage.tsx   # Payment history
│   ├── services/              # API services
│   │   ├── api-client.ts      # Base HTTP client with JWT
│   │   ├── auth-service.ts    # Authentication API
│   │   ├── order-service.ts   # Order API
│   │   ├── menu-service.ts    # Menu API
│   │   └── payment-service.ts # Payment API
│   ├── App.tsx                # Main app component
│   └── main.tsx               # React DOM render
├── public/
│   ├── manifest.json          # PWA manifest
│   └── service-worker.js      # Service worker
├── index.html                 # HTML entry point
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── tailwind.config.js         # Tailwind config
├── postcss.config.js          # PostCSS config
└── package.json               # Dependencies
```

## API Integration

The frontend communicates with the backend at `http://localhost:3000/api/v1`.

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Sistema POS
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
```

## Authentication

### Login with Test Credentials

The app includes test credentials for development:

- **Waiter:** waiter@testrestaurant.com / password_waiter
- **Cashier:** cashier@testrestaurant.com / password_cashier
- **Manager:** manager@testrestaurant.com / password_manager
- **Admin:** admin@testrestaurant.com / password_admin

### JWT Token Flow

1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent in Authorization header for protected requests
5. Token automatically cleared on logout or 401 response

## Pages

### LoginPage
- Email/password form
- Test credentials display
- Error handling
- Redirect to dashboard on success

### DashboardPage
- Statistics (pending orders, completed, revenue)
- Quick action buttons
- Recent orders list
- View all orders link

### OrdersPage
- List all orders with pagination
- Filter by status (pending, completed, cancelled)
- Create new order button
- View order details

### CreateOrderPage
- Table selection (T1-T8)
- Menu item browsing
- Shopping cart with quantity control
- Order summary with totals
- Create order with all items

### MenuPage
- Browse menu items
- Filter by menu (if multiple menus)
- Admin controls (edit/delete items)
- Item pricing and availability

### PaymentsPage
- Payment history
- Status tracking (pending, succeeded, failed, refunded)
- Transaction details
- Provider information

## Components

### AppLayout
Main layout wrapper with:
- Sidebar navigation (responsive)
- Top navigation bar
- Mobile menu toggle
- User info and logout

### ProtectedRoute
Wrapper ensuring user is authenticated:
- Redirects to login if not authenticated
- Shows loading spinner while checking auth

## Services

### ApiClient
Base HTTP client:
- Fetch-based API calls
- JWT token management
- Error handling
- Request/response intercepting

### AuthService
Authentication operations:
- `login(credentials)` - User login
- `register(data)` - User registration (admin-only)
- `verifyToken()` - Check token validity
- `logout()` - Clear session
- `isAuthenticated()` - Check auth status

### OrderService
Order management:
- `createOrder(data)` - Create new order
- `getOrders(filters)` - List orders with filters
- `getOrder(id)` - Get order details
- `updateOrder(id, data)` - Update order
- `cancelOrder(id)` - Cancel order
- `addItemToOrder(id, item)` - Add item to existing order
- `completeOrder(id)` - Mark as completed
- `addTip(id, amount)` - Add tip
- `applyDiscount(id, amount)` - Apply discount

### MenuService
Menu management:
- `getMenus(restaurantId)` - List restaurant menus
- `getMenuDetail(restaurantId, menuId)` - Get menu with items
- `createMenuItem(data)` - Create menu item (admin)
- `updateMenuItem(id, data)` - Update menu item (admin)
- `deleteMenuItem(id)` - Delete menu item (admin)
- `getAvailableItems(restaurantId, menuId)` - Get available items only

### PaymentService
Payment processing:
- `processPayment(data)` - Process payment
- `getPayment(id)` - Get payment details
- `refundPayment(id, data)` - Refund payment
- `processStripePayment(...)` - Stripe integration
- `processSquarePayment(...)` - Square integration
- `processMercadoPagoPayment(...)` - Mercado Pago integration
- `processPayPalPayment(...)` - PayPal integration

## PWA Features

### Manifest
- App name and short name
- Icons (maskable for modern browsers)
- App shortcuts for quick actions
- Theme colors

### Service Worker
- Network-first caching strategy
- Offline fallback
- Cache management
- Auto-updates

### Meta Tags
- Apple mobile web app support
- Status bar styling
- Theme color
- Viewport optimization

## Styling

Uses **Tailwind CSS** utility classes:
- Responsive breakpoints: sm, md, lg, xl
- Color palette integrated with theme
- Custom components (buttons, cards, forms)
- Dark mode ready

## Browser Support

- Chrome 88+
- Firefox 87+
- Safari 14.1+
- Edge 88+

## Development Workflow

### Run Backend
```bash
cd ../backend
npm run dev
```

### Run Frontend (parallel terminal)
```bash
cd frontend
npm run dev
```

### Access App
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs

## Building for Production

```bash
# Build optimized bundle
npm run build

# Outputs to dist/ directory with:
# - Minified JavaScript
# - Optimized CSS
# - Asset hashing for cache busting

# Deploy dist/ to web server
```

## Performance Optimization

- Code splitting by route
- Image optimization
- Bundle analysis: `npm run build -- --analyze`
- Lazy loading components
- PWA caching strategy

## Troubleshooting

### "API is not reachable"
- Ensure backend is running: `npm run dev` from backend/
- Check VITE_API_URL in .env matches backend URL
- Check CORS settings in backend

### "Can't login"
- Verify test credentials are correct
- Check backend is seeded: `npm run seed`
- Check token is being saved in localStorage

### "Offline mode not working"
- Service Worker must be served over HTTPS or localhost
- Check browser DevTools > Application > Service Workers
- Clear cache if updating: DevTools > Application > Cache Storage

### "Menu not loading"
- Ensure backend has menu data (run seed script)
- Check restaurant ID matches in API response
- Verify API token is valid

## Next Steps

- [ ] Add order detail page with payment
- [ ] Add real-time order updates with Socket.io
- [ ] Implement Stripe payment form
- [ ] Add restaurant settings page
- [ ] Add order history filters
- [ ] Implement receipt printing
- [ ] Add item customization
- [ ] Add note-taking for orders
- [ ] Analytics dashboard
- [ ] Multi-language support

## Contributing

Follow these guidelines:
1. Create feature branch: `git checkout -b feature/name`
2. Make changes with TypeScript
3. Test on multiple devices
4. Commit with clear messages
5. Push and create pull request

## License

MIT

---

**Backend API:** http://localhost:3000/api/v1  
**Frontend App:** http://localhost:5173  
**Swagger Docs:** http://localhost:3000/api/docs  
