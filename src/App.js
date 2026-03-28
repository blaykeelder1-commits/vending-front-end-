import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './shared/toast';
import VendorLayout from './shared/VendorLayout';
import ProtectedRoute from './shared/ProtectedRoute';
import { theme } from './shared/theme';
import './App.css';

// ============================================
// LAZY-LOADED PAGES (code splitting)
// ============================================

// Public pages (loaded on demand — no auth required)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ForVendors = React.lazy(() => import('./pages/ForVendors'));
const ProfitCalculator = React.lazy(() => import('./pages/ProfitCalculator'));
const BlogList = React.lazy(() => import('./pages/BlogList'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const ComparisonPage = React.lazy(() => import('./pages/ComparisonPage'));
const SharedReport = React.lazy(() => import('./pages/SharedReport'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));

// Auth pages
const VendorLoginModule = React.lazy(() => import('./pages/VendorLogin'));
const GoogleAuthCallback = React.lazy(() => import('./pages/GoogleAuthCallback'));

// Vendor pages (only loaded for authenticated vendors)
const VendorPagesModule = React.lazy(() => import('./pages/VendorPages'));
const MoreVendorPagesModule = React.lazy(() => import('./pages/MoreVendorPages'));

// Customer pages (loaded on QR scan)
const CustomerPagesModule = React.lazy(() => import('./pages/CustomerPages'));

// Discount system
const DiscountManager = React.lazy(() => import('./pages/DiscountManager'));
const DiscountCustomerPage = React.lazy(() => import('./pages/DiscountCustomer'));

// ============================================
// WRAPPER COMPONENTS (for named exports from lazy modules)
// ============================================

// Auth wrappers
const VendorLogin = React.lazy(() => import('./pages/VendorLogin').then(m => ({ default: m.VendorLogin || m.default })));
const ForgotPassword = React.lazy(() => import('./pages/VendorLogin').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = React.lazy(() => import('./pages/VendorLogin').then(m => ({ default: m.ResetPassword })));
const EmailVerification = React.lazy(() => import('./pages/VendorLogin').then(m => ({ default: m.EmailVerification })));

// Vendor page wrappers
const VendorDashboard = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.VendorDashboard })));
const MachineDetails = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.MachineDetails })));
const PollResults = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.PollResults })));
const PollSummary = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.PollSummary })));
const AnalyticsDashboard = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.AnalyticsDashboard })));
const TopProducts = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.TopProducts })));
const RoutePlan = React.lazy(() => import('./pages/VendorPages').then(m => ({ default: m.RoutePlan })));

// More vendor pages
const Suggestions = React.lazy(() => import('./pages/MoreVendorPages').then(m => ({ default: m.Suggestions })));
const InventoryManagement = React.lazy(() => import('./pages/MoreVendorPages').then(m => ({ default: m.InventoryManagement })));
const ExpiringProducts = React.lazy(() => import('./pages/MoreVendorPages').then(m => ({ default: m.ExpiringProducts })));

// Customer wrappers
const CustomerMachine = React.lazy(() => import('./pages/CustomerPages').then(m => ({ default: m.CustomerMachine })));

// ============================================
// LOADING FALLBACK
// ============================================

const PageLoader = () => (
  <div style={{
    minHeight: '100vh', backgroundColor: theme.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{
        width: '48px', height: '48px',
        border: `3px solid ${theme.border}`,
        borderTopColor: theme.primary,
        borderRadius: '50%',
        margin: '0 auto 16px',
      }} />
      <p style={{ color: theme.textSecondary }}>Loading...</p>
    </div>
  </div>
);

// ============================================
// APP
// ============================================

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ===== PUBLIC PAGES (SEO-optimized, fast-loading) ===== */}
                <Route path="/" element={<HomePage />} />
                <Route path="/for-vendors" element={<ForVendors />} />
                <Route path="/vending-machine-profit-calculator" element={<ProfitCalculator />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                {/* Direct SEO route for top keyword */}
                <Route path="/how-to-start-a-vending-machine-business" element={<Navigate to="/blog/how-to-start-a-vending-machine-business" replace />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/vs/:competitor" element={<ComparisonPage />} />
                <Route path="/report/:token" element={<SharedReport />} />

                {/* ===== AUTH PAGES ===== */}
                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                <Route path="/vendor/login" element={<VendorLogin />} />
                <Route path="/vendor/verify-email" element={<EmailVerification />} />
                <Route path="/vendor/forgot-password" element={<ForgotPassword />} />
                <Route path="/vendor/reset-password" element={<ResetPassword />} />

                {/* ===== VENDOR PROTECTED ROUTES ===== */}
                <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorLayout><VendorDashboard /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/machines/:id" element={<ProtectedRoute><VendorLayout><MachineDetails /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/polls/:pollId/results" element={<ProtectedRoute><VendorLayout><PollResults /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/poll-summary" element={<ProtectedRoute><VendorLayout><PollSummary /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/top-products" element={<ProtectedRoute><VendorLayout><TopProducts /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/analytics" element={<ProtectedRoute><VendorLayout><AnalyticsDashboard /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/route-plan" element={<ProtectedRoute><VendorLayout><RoutePlan /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/suggestions" element={<ProtectedRoute><VendorLayout><Suggestions /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/expiring" element={<ProtectedRoute><VendorLayout><ExpiringProducts /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/inventory" element={<ProtectedRoute><VendorLayout><InventoryManagement /></VendorLayout></ProtectedRoute>} />
                <Route path="/vendor/discounts" element={<ProtectedRoute><VendorLayout><DiscountManager /></VendorLayout></ProtectedRoute>} />

                {/* ===== CUSTOMER ROUTES (QR scan flow) ===== */}
                <Route path="/customer/machine/:qr_token" element={<CustomerMachine />} />
                <Route path="/customer/discounts/:machineId" element={<DiscountCustomerPage />} />

                {/* ===== REFERRAL REDIRECT ===== */}
                <Route path="/ref/:code" element={<ReferralRedirect />} />

                {/* ===== CATCH-ALL ===== */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

// Simple referral redirect component
function ReferralRedirect() {
  const params = React.useMemo(() => {
    const path = window.location.pathname;
    const code = path.split('/ref/')[1];
    return code;
  }, []);

  React.useEffect(() => {
    if (params) {
      sessionStorage.setItem('referralCode', params);
    }
  }, [params]);

  return <Navigate to="/vendor/login" replace />;
}

export default App;
