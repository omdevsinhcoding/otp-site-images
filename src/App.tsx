import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DatabaseProvider } from "@/hooks/useDatabase";
import { ToastProvider } from "@/components/ui/custom-toast";
import { SEOSettingsProvider } from "@/components/SEOSettingsProvider";
import { PageLoader } from "@/components/ui/PageLoader";
import Dashboard from "./pages/Dashboard";
import Recharge from "./pages/Recharge";
import AutoPayment from "./pages/AutoPayment";
import PromoCode from "./pages/PromoCode";
import ReferAndEarn from "./pages/ReferAndEarn";
import Support from "./pages/Support";
import Transactions from "./pages/Transactions";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GetNumber from "./pages/GetNumber";
import NumberHistory from "./pages/NumberHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AllUsersPage from "./pages/admin/AllUsersPage";
import BannedUsersPage from "./pages/admin/BannedUsersPage";
import AdminManagementPage from "./pages/admin/AdminManagementPage";
import AdminServices from "./pages/admin/AdminServices";
import AddServerPage from "./pages/admin/AddServerPage";
import AddServicePage from "./pages/admin/AddServicePage";
import DirectImportPage from "./pages/admin/DirectImportPage";
import FiveSimImportPage from "./pages/admin/FiveSimImportPage";
import SmsbowerImportPage from "./pages/admin/SmsbowerImportPage";
import ShowAllServersPage from "./pages/admin/ShowAllServersPage";
import ShowAllServicesPage from "./pages/admin/ShowAllServicesPage";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminDiscountSetup from "./pages/admin/AdminDiscountSetup";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminToastSettings from "./pages/admin/AdminToastSettings";
import AdminBharatPeSettings from "./pages/admin/AdminBharatPeSettings";
import AdminAutoPaymentSettings from "./pages/admin/AdminAutoPaymentSettings";
import AdminCryptoSettings from "./pages/admin/AdminCryptoSettings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSEO from "./pages/admin/AdminSEO";
import AdminSEOConfigure from "./pages/admin/AdminSEOConfigure";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastProvider>
        <DatabaseProvider>
          <AuthProvider>
            <SEOSettingsProvider>
              <BrowserRouter>
                <PageLoader minLoadTime={400}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/recharge" element={<Recharge />} />
                  <Route path="/auto-payment" element={<AutoPayment />} />
                  <Route path="/promo-code" element={<PromoCode />} />
                  <Route path="/refer" element={<ReferAndEarn />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/get-number" element={<GetNumber />} />
                  <Route path="/number-history" element={<NumberHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/ref/:code" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/users/all" element={<AllUsersPage />} />
                  <Route path="/admin/users/banned" element={<BannedUsersPage />} />
                  <Route path="/admin/admins" element={<AdminManagementPage />} />
                  <Route path="/admin/admins/*" element={<AdminManagementPage />} />
                  <Route path="/admin/services" element={<AdminServices />} />
                  <Route path="/admin/services/add-server" element={<AddServerPage />} />
                  <Route path="/admin/services/add-service" element={<AddServicePage />} />
                  <Route path="/admin/services/direct-import" element={<DirectImportPage />} />
              <Route path="/admin/services/direct-import/5sim" element={<FiveSimImportPage />} />
              <Route path="/admin/services/direct-import/smsbower" element={<SmsbowerImportPage />} />
              <Route path="/admin/services/direct-import/:provider" element={<DirectImportPage />} />
              <Route path="/admin/services/all-servers" element={<ShowAllServersPage />} />
              <Route path="/admin/services/all-services" element={<ShowAllServicesPage />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/settings/*" element={<AdminSettings />} />
                  <Route path="/admin/transactions" element={<AdminTransactions />} />
                  <Route path="/admin/transactions/*" element={<AdminTransactions />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/discount-setup" element={<AdminDiscountSetup />} />
                  <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
                  <Route path="/admin/toast-settings" element={<AdminToastSettings />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                  <Route path="/admin/bharatpe" element={<AdminBharatPeSettings />} />
                  <Route path="/admin/auto-payment" element={<AdminAutoPaymentSettings />} />
                  <Route path="/admin/crypto" element={<AdminCryptoSettings />} />
                  <Route path="/admin/payments/crypto" element={<AdminCryptoSettings />} />
                  <Route path="/admin/seo" element={<AdminSEO />} />
                  <Route path="/admin/seo/configure" element={<AdminSEOConfigure />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageLoader>
            </BrowserRouter>
          </SEOSettingsProvider>
        </AuthProvider>
      </DatabaseProvider>
    </ToastProvider>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;