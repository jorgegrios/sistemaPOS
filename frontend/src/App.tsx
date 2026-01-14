/**
 * Main App Component
 * App routing and layout management
 */

// React import not required with the new JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/auth-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { StripeProviderWrapper } from './components/StripeProviderWrapper';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { CreateOrderPage } from './pages/CreateOrderPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProcessPaymentPage } from './pages/ProcessPaymentPage';
import { InventoryPage } from './pages/InventoryPage';
import { InventoryItemPage } from './pages/InventoryItemPage';
import { AdjustStockPage } from './pages/AdjustStockPage';
import { StockAlertsPage } from './pages/StockAlertsPage';
import { CreateInventoryItemPage } from './pages/CreateInventoryItemPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierPage } from './pages/SupplierPage';
import { CreateSupplierPage } from './pages/CreateSupplierPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { PurchaseOrderPage } from './pages/PurchaseOrderPage';
import { CreatePurchaseOrderPage } from './pages/CreatePurchaseOrderPage';
import { UsersPage } from './pages/UsersPage';
import { UserPage } from './pages/UserPage';
import { CreateUserPage } from './pages/CreateUserPage';
import { ManageMenuPage } from './pages/ManageMenuPage';
import { TablesPage } from './pages/TablesPage';
import { TablePage } from './pages/TablePage';
import { CashierPage } from './pages/CashierPage';
import { KitchenPage } from './pages/KitchenPage';
import { ServedOrdersPage } from './pages/ServedOrdersPage';
import { BarPage } from './pages/BarPage';
import { BarServedOrdersPage } from './pages/BarServedOrdersPage';
import { MenuCostsPage } from './pages/MenuCostsPage';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <StripeProviderWrapper>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect based on role */}
            <Route 
              path="/" 
              element={
                <RoleBasedRedirect />
              } 
            />
            {/* Cashier View - Special layout */}
            <Route 
              path="/cashier" 
              element={
                <RoleProtectedRoute allowedRoles={['cashier', 'admin']}>
                  <CashierPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Kitchen View (KDS) - Special layout */}
            <Route 
              path="/kitchen" 
              element={
                <RoleProtectedRoute allowedRoles={['kitchen', 'admin']}>
                  <KitchenPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/kitchen/served" 
              element={
                <RoleProtectedRoute allowedRoles={['kitchen', 'admin']}>
                  <ServedOrdersPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Bar View - Special layout */}
            <Route 
              path="/bar" 
              element={
                <RoleProtectedRoute allowedRoles={['bartender', 'admin']}>
                  <BarPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/bar/served" 
              element={
                <RoleProtectedRoute allowedRoles={['bartender', 'admin']}>
                  <BarServedOrdersPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Orders - Available to all roles */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/new" element={<CreateOrderPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders/:id/pay" element={<ProcessPaymentPage />} />
            {/* Dashboard - Not for waiters */}
            <Route 
              path="/dashboard" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <DashboardPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Menu Management - Not for waiters */}
            <Route path="/menu" element={<Navigate to="/menu/manage" replace />} />
            <Route 
              path="/menu/manage" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <ManageMenuPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Menu Costs - Admin/Manager only */}
            <Route 
              path="/menu-costs" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <MenuCostsPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Payments - Not for waiters */}
            <Route 
              path="/payments" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <PaymentsPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Inventory Routes - Not for waiters */}
            <Route 
              path="/inventory" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <InventoryPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/inventory/new" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <CreateInventoryItemPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/inventory/:id" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <InventoryItemPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/inventory/:id/adjust" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <AdjustStockPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/inventory/alerts" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <StockAlertsPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Purchases Routes - Not for waiters */}
            <Route 
              path="/suppliers" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <SuppliersPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/suppliers/new" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <CreateSupplierPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/suppliers/:id" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <SupplierPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/purchases/orders" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <PurchaseOrdersPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/purchases/orders/new" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <CreatePurchaseOrderPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/purchases/orders/:id" 
              element={
                <RoleProtectedRoute blockedRoles={['waiter']}>
                  <PurchaseOrderPage />
                </RoleProtectedRoute>
              } 
            />
            {/* Tables Routes - Admin/Manager only */}
            <Route 
              path="/tables" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <TablesPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/tables/:id" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <TablePage />
                </RoleProtectedRoute>
              } 
            />
            {/* Users Routes - Admin/Manager only */}
            <Route 
              path="/users" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <UsersPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/users/new" 
              element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <CreateUserPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="/users/:id" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <UserPage />
                </RoleProtectedRoute>
              } 
            />
            {/* TODO: Add more routes */}
            {/* <Route path="/settings" element={<SettingsPage />} /> */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
        </StripeProviderWrapper>
      </AuthProvider>
    </Router>
  );
}

export default App;
