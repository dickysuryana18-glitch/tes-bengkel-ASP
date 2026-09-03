import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardView } from "./components/DashboardView";
import { WorkshopBoard } from "./components/WorkshopBoard";
import { CustomerTrackingPortal } from "./components/CustomerTrackingPortal";
import { InventoryModule } from "./components/InventoryModule";
import { ServiceAdvisorEstimasi } from "./components/ServiceAdvisorEstimasi";
import { QCInspectionFlow } from "./components/QCInspectionFlow";
import { InvoicePaymentFlow } from "./components/InvoicePaymentFlow";
import { ClaimManagementFlow } from "./components/ClaimManagementFlow";
import { PurchasingFlow } from "./components/PurchasingFlow";
import { MechanicPayrollModule } from "./components/MechanicPayrollModule";
import { RoleManagementModule } from "./components/RoleManagementModule";
import { AuditTrailModule } from "./components/AuditTrailModule";
import { DashboardSettings } from "./components/DashboardSettings";
import { MobileTechnicianModule } from "./components/MobileTechnicianModule";
import { UnitMonitoringModule } from "./components/UnitMonitoringModule";
import { WorkshopFloorLayoutEditor } from "./components/WorkshopFloorLayoutEditor";
import { ClientEstimatePreview } from "./components/ClientEstimatePreview";
import { BookingManagementModule } from "./components/BookingManagementModule";

function MainApp() {
  const { user, isAuthenticated, logout, hasAccess, defaultTab } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Automatically reset to defaultTab if current activeTab is not allowed for the user's role
  useEffect(() => {
    if (user && defaultTab) {
      if (!hasAccess(activeTab)) {
        setActiveTab(defaultTab);
      }
    }
  }, [user, defaultTab, activeTab, hasAccess]);

  // When user is not authenticated, show modern Bengkel Pro Login
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Customer role has dedicated portal experience
  if (user.role === 'Customer') {
    return (
      <CustomerTrackingPortal 
        trackingId={user.workOrderId || 'TRK-2026-8891'} 
        onLogout={logout} 
      />
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'booking' && (
        <BookingManagementModule 
          onNavigateToEstimasi={() => setActiveTab('estimasi')} 
        />
      )}
      {activeTab === 'monitoring' && <UnitMonitoringModule />}
      {activeTab === 'workshop' && <WorkshopBoard />}
      {activeTab === 'floor_layout' && <WorkshopFloorLayoutEditor />}
      {activeTab === 'inventory' && <InventoryModule />}
      {activeTab === 'estimasi' && <ServiceAdvisorEstimasi />}
      {activeTab === 'qc' && <QCInspectionFlow />}
      {activeTab === 'invoice' && <InvoicePaymentFlow />}
      {activeTab === 'claims' && <ClaimManagementFlow />}
      {activeTab === 'purchasing' && <PurchasingFlow />}
      {activeTab === 'payroll' && <MechanicPayrollModule />}
      {activeTab === 'rbac' && <RoleManagementModule />}
      {activeTab === 'audit' && <AuditTrailModule />}
      {activeTab === 'settings' && <DashboardSettings />}
      {activeTab === 'mobile-tech' && <MobileTechnicianModule />}
    </DashboardLayout>
  );
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingId = urlParams.get('track');
  const estimateId = urlParams.get('estimate') || urlParams.get('estimate_preview');

  if (trackingId) {
    return <CustomerTrackingPortal trackingId={trackingId} />;
  }

  if (estimateId) {
    return (
      <ClientEstimatePreview 
        onBackToErp={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('estimate');
          url.searchParams.delete('estimate_preview');
          window.history.pushState({}, '', url.pathname);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <MainApp />
      <Toaster richColors position="top-right" theme="dark" />
    </AuthProvider>
  );
}
