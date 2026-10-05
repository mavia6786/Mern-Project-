import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShoeCartProvider } from './context/ShoeCartContext';
import { ClothingCartProvider } from './context/ClothingCartContext';

import MainLayout from './layouts/MainLayout';
import ShoesDashboardLayout from './layouts/ShoesDashboardLayout';
import ClothingDashboardLayout from './layouts/ClothingDashboardLayout';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import RegisterShopPage from './pages/RegisterShopPage';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/shoes/AdminDashboard';
import POS from './pages/shoes/POS';
import Products from './pages/shoes/Products';
import AddEditProduct from './pages/shoes/AddEditProduct';
import Inventory from './pages/shoes/Inventory';
import SalesHistory from './pages/shoes/SalesHistory';
import Reports from './pages/shoes/Reports';

import ClothingDashboard from './pages/clothes/ClothingDashboard';
import ClothingPOS from './pages/clothes/ClothingPOS';
import ClothingProducts from './pages/clothes/ClothingProducts';
import ClothingInventory from './pages/clothes/ClothingInventory';
import ClothingSalesHistory from './pages/clothes/ClothingSalesHistory';
import ClothingReports from './pages/clothes/ClothingReports';
import StaffManager from './pages/shared/StaffManager';
import SuppliersPage from './pages/shared/SuppliersPage';
import FinancePage from './pages/shared/FinancePage';

export default function App() {
  return (
    <AuthProvider>
      <ShoeCartProvider>
        <ClothingCartProvider>
          <Routes>
            {/* Pages using the default MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/register-shop" element={<RegisterShopPage />} />
            </Route>

            {/* Shoe store dashboard (DashboardLayout) */}
            <Route path="/dashboard" element={<ShoesDashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pos" element={<POS />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddEditProduct />} />
              <Route path="products/edit/:id" element={<AddEditProduct />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<SalesHistory />} />
              <Route path="reports" element={<Reports />} />
              <Route path="salesmen" element={<StaffManager vertical="shoes" />} />
              <Route path="suppliers" element={<SuppliersPage vertical="shoes" />} />
              <Route path="finance" element={<FinancePage vertical="shoes" />} />
            </Route>

            {/* Clothing store dashboard (ClothingDashboardLayout) */}
            <Route element={<ClothingDashboardLayout />}>
              <Route path="/dashboard/clothes" element={<ClothingDashboard />} />
              <Route path="/clothes/pos" element={<ClothingPOS />} />
              <Route path="/clothes/products" element={<ClothingProducts />} />
              <Route path="/clothes/inventory" element={<ClothingInventory />} />
              <Route path="/clothes/sales" element={<ClothingSalesHistory />} />
              <Route path="/clothes/reports" element={<ClothingReports />} />
              <Route path="/clothes/staff" element={<StaffManager vertical="clothes" />} />
              <Route path="/clothes/suppliers" element={<SuppliersPage vertical="clothes" />} />
              <Route path="/clothes/finance" element={<FinancePage vertical="clothes" />} />
            </Route>

            {/* Same as the original: /dashboard/salesmen and /dashboard/suppliers have no page → 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ClothingCartProvider>
      </ShoeCartProvider>
    </AuthProvider>
  );
}
