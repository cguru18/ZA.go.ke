import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './layouts/Layout';
import Skeleton from './components/Skeleton';
import AdminRouteGuard from './components/AdminRouteGuard';

// Regular imports for critical path
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Lazy imports for non-critical/heavy paths
const Profile = lazy(() => import('./pages/Profile'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const LiveMap = lazy(() => import('./pages/LiveMap'));
const SellProduct = lazy(() => import('./pages/SellProduct'));

const PageLoader = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-12 w-1/3" />
    <Skeleton className="h-[400px] w-full" />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<Signup />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="admin" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
                  <Route path="admin-login" element={<AdminLogin />} />
                  <Route path="map" element={<AdminRouteGuard><LiveMap /></AdminRouteGuard>} />

                  <Route path="sell" element={<SellProduct />} />
                  <Route path="search" element={<div className="p-8 text-white">Search Coming Soon</div>} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
