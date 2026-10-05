import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { RouterProvider, useRouter } from "@/lib/router";
import { ToastProvider } from "@/components/ui/Toast";
import { FullScreenLoader } from "@/components/ui/Feedback";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { trackEvent } from "@/lib/analytics";

// Main App Pages
import { AuthPage } from "@/pages/AuthPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { AppLayout } from "@/components/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { FlatsPage } from "@/pages/FlatsPage";
import { TenantsPage } from "@/pages/TenantsPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { RemindersPage } from "@/pages/RemindersPage";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { VisitorsPage } from "@/pages/VisitorsPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TenantPortalPage } from "@/pages/TenantPortalPage";

// Advanced Operating Modules
import { OwnersPage } from "@/pages/OwnersPage";
import { DigitalTwinPage } from "@/pages/DigitalTwinPage";
import { UtilitiesPage } from "@/pages/UtilitiesPage";
import { ParkingPage } from "@/pages/ParkingPage";
import { DomesticStaffPage } from "@/pages/DomesticStaffPage";
import { ConditionPassportPage } from "@/pages/ConditionPassportPage";
import { ProcurementPage } from "@/pages/ProcurementPage";
import { AgmPage } from "@/pages/AgmPage";
import { CompliancePage } from "@/pages/CompliancePage";
import { DataTrustPage } from "@/pages/DataTrustPage";

// New Role-Based & System Pages
import { WalletPage } from "@/pages/WalletPage";
import { AdminPage } from "@/pages/AdminPage";
import { BuildingRegisterPage } from "@/pages/BuildingRegisterPage";

// Legal, Governance & Error Pages
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { TermsPage } from "@/pages/TermsPage";
import { RefundPolicyPage } from "@/pages/RefundPolicyPage";
import { CookiePolicyPage } from "@/pages/CookiePolicyPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function Routes() {
  const { path } = useRouter();

  useEffect(() => {
    trackEvent("navigation", "page_view", path);
  }, [path]);

  switch (path) {
    case "/":
      return <DashboardPage />;
    case "/wallet":
      return <WalletPage />;
    case "/admin":
      return <AdminPage />;
    case "/register-building":
      return <BuildingRegisterPage />;
    case "/flats":
      return <FlatsPage />;
    case "/owners":
      return <OwnersPage />;
    case "/tenants":
      return <TenantsPage />;
    case "/invoices":
      return <InvoicesPage />;
    case "/payments":
      return <PaymentsPage />;
    case "/expenses":
      return <ExpensesPage />;
    case "/assets":
      return <DigitalTwinPage />;
    case "/utilities":
      return <UtilitiesPage />;
    case "/parking":
      return <ParkingPage />;
    case "/staff":
      return <DomesticStaffPage />;
    case "/passports":
      return <ConditionPassportPage />;
    case "/procurement":
      return <ProcurementPage />;
    case "/agm":
      return <AgmPage />;
    case "/compliance":
      return <CompliancePage />;
    case "/datatrust":
      return <DataTrustPage />;
    case "/reminders":
      return <RemindersPage />;
    case "/maintenance":
      return <MaintenancePage />;
    case "/visitors":
      return <VisitorsPage />;
    case "/documents":
      return <DocumentsPage />;
    case "/reports":
      return <ReportsPage />;
    case "/settings":
      return <SettingsPage />;
    case "/privacy":
      return <PrivacyPolicyPage />;
    case "/terms":
      return <TermsPage />;
    case "/refund":
      return <RefundPolicyPage />;
    case "/cookies":
      return <CookiePolicyPage />;
    default:
      return <NotFoundPage />;
  }
}

function Gate() {
  const { path } = useRouter();
  const { user, society, role, loading } = useAuth();

  // Public-accessible routes that don't require an active society session
  if (path === "/portal") return <TenantPortalPage />;
  if (path === "/privacy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TermsPage />;
  if (path === "/refund") return <RefundPolicyPage />;
  if (path === "/cookies") return <CookiePolicyPage />;

  if (loading) return <FullScreenLoader />;
  if (!user) return <AuthPage />;

  // Building owners without a society: direct them to register their building with proof
  if (!society && role === 'building_owner') {
    return (
      <AppLayout>
        <BuildingRegisterPage />
      </AppLayout>
    );
  }

  // Fallback for missing society when role is not yet determined
  if (!society && !role) {
    return <OnboardingPage />;
  }

  return (
    <AppLayout>
      <Routes />
    </AppLayout>
  );
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <ToastProvider>
          <Gate />
          <CookieConsentBanner />
        </ToastProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
