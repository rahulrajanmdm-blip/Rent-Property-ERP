import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CollectionsVacancyBoard } from './components/CollectionsVacancyBoard';
import { LandlordPaymentsView } from './components/LandlordPaymentsView';
import { TenantsView } from './components/TenantsView';
import { LeasesView } from './components/LeasesView';
import { RentManagementView } from './components/RentManagementView';
import { UtilitiesView } from './components/UtilitiesView';
import { MoveOutView } from './components/MoveOutView';
import { AccountingView } from './components/AccountingView';
import { ReportsView } from './components/ReportsView';
import { PropertiesView } from './components/PropertiesView';
import { UnitsView } from './components/UnitsView';
import { LandlordsView } from './components/LandlordsView';
import { BookingsView } from './components/BookingsView';
import { MoveInView } from './components/MoveInView';
import { DepositsView } from './components/DepositsView';
import { CollectionsView } from './components/CollectionsView';
import { AdministrationView } from './components/AdministrationView';
import { AppScriptExportView } from './components/AppScriptExportView';
import { LoginModal } from './components/LoginModal';
import { BankPaymentAllocationModal } from './components/BankPaymentAllocationModal';
import { storage } from './services/storage';
import { firestoreSync } from './services/firestoreSync';
import { User, RegionalProvince, REGIONAL_PROVINCE_TAX } from './types/erp';
import { CheckCircle2, AlertCircle, Info, X, Building, ShieldCheck, Scale, FileText } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getAuthenticatedSession());
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [adminSubTab, setAdminSubTab] = useState<'USERS' | 'PERMISSIONS' | 'AUDIT' | 'STORAGE' | 'EMAIL_CONFIG' | 'QUOTA_MONITOR'>('USERS');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isGlobalAllocationOpen, setIsGlobalAllocationOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    firestoreSync.init();
  }, []);

  const handleOpenCloudQuota = () => {
    setAdminSubTab('QUOTA_MONITOR');
    setActiveTab('Administration');
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = () => {
    if (currentUser) {
      storage.logout(currentUser.Email);
    }
    setCurrentUser(null);
    setShowLoginModal(false);
    addToast('You have been securely signed out. 2FA verification required to sign in.', 'info');
  };

  const handleQuickAction = (action: string) => {
    if (action === 'NEW_LEASE') {
      setActiveTab('Leases');
      addToast('Navigated to Leases — click "+ New Lease Agreement" to draft a lease.', 'info');
    } else if (action === 'GENERATE_RENT') {
      setActiveTab('Rent');
      addToast('Navigated to Rent Ledger — click "⚡ Run Monthly Rent Roll" to generate receivables.', 'info');
    } else if (action === 'NEW_TENANT') {
      setActiveTab('Tenants');
      addToast('Navigated to Tenants & ID Proof Vault.', 'info');
    } else if (action === 'ALLOCATE_BANK_PAYMENT') {
      setIsGlobalAllocationOpen(true);
    } else {
      setActiveTab('Dashboard');
    }
  };

  // If user is not authenticated with 2FA, render the Mandatory 2FA Login Gateway
  if (!currentUser) {
    return (
      <>
        <LoginModal
          isOpen={true}
          isMandatoryPage={true}
          currentUser={null}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          onToast={addToast}
        />
        {/* Toast Notification Container for Login */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                  : toast.type === 'error'
                  ? 'bg-rose-900 text-rose-50 border-rose-700'
                  : 'bg-indigo-900 text-indigo-50 border-indigo-700'
              }`}
            >
              <div className="flex items-start gap-2">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white shrink-0 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'CloudQuotas') {
            setAdminSubTab('QUOTA_MONITOR');
            setActiveTab('Administration');
          } else {
            setActiveTab(tab);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpenMobile={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentTab={activeTab}
          onOpenMobileNav={() => setSidebarOpen(true)}
          currentUser={currentUser}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            storage.setAuthenticatedSession(user);
            addToast(`Switched active profile to ${user.Full_Name} (${user.Role})`, 'info');
          }}
          onOpenTaxGuide={() => setShowTaxGuide(true)}
          onQuickAction={handleQuickAction}
          onOpenLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onOpenCloudQuota={handleOpenCloudQuota}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {activeTab === 'Dashboard' && (
            <Dashboard
              onNavigateTab={setActiveTab}
              onQuickAction={handleQuickAction}
            />
          )}

          {(activeTab === 'Board' || activeTab === 'CollectionsBoard') && (
            <CollectionsVacancyBoard onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'Properties' && (
            <PropertiesView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Units' && (
            <UnitsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Landlords' && (
            <LandlordsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'LandlordPayments' && (
            <LandlordPaymentsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Tenants' && (
            <TenantsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Bookings' && (
            <BookingsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Leases' && (
            <LeasesView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'MoveIn' && (
            <MoveInView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'MoveOut' && (
            <MoveOutView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Rent' && (
            <RentManagementView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Deposits' && (
            <DepositsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Utilities' && (
            <UtilitiesView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Collections' && (
            <CollectionsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Accounting' && (
            <AccountingView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Reports' && (
            <ReportsView currentUser={currentUser} onToast={addToast} />
          )}

          {activeTab === 'Administration' && (
            <AdministrationView
              currentUser={currentUser}
              onToast={addToast}
              initialSubTab={adminSubTab}
              onSwitchUser={(user) => {
                setCurrentUser(user);
                addToast(`Switched user profile to ${user.Full_Name} (${user.Role})`, 'info');
              }}
            />
          )}

          {(activeTab === 'AppsScript' || activeTab === 'AppsScriptHub') && (
            <AppScriptExportView currentUser={currentUser} onToast={addToast} />
          )}
        </main>
      </div>

      {/* Regional Tenancy & Tax Guide Modal */}
      {showTaxGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Regional Tax & Tenancy Guide</h3>
                  <p className="text-xs text-slate-500">Statutory rules for rent, security deposits, and sales taxes</p>
                </div>
              </div>
              <button
                onClick={() => setShowTaxGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(REGIONAL_PROVINCE_TAX) as RegionalProvince[]).map(prov => {
                const info = REGIONAL_PROVINCE_TAX[prov];
                return (
                  <div key={prov} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{info.name} ({info.province})</span>
                      <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {info.taxType}: {(info.totalTaxRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p className="flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><b>Deposit Law:</b> {info.depositRule}</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span><b>Rent Increases:</b> {info.rentIncreaseGuideline}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                <b>Note:</b> Standard residential leases are generally exempt from sales tax. Commercial leases, short-term bookings, utility recoveries, and property management fees are taxable under the respective regional rates above.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTaxGuide(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Bank Payment Allocation Modal */}
      {isGlobalAllocationOpen && currentUser && (
        <BankPaymentAllocationModal
          isOpen={isGlobalAllocationOpen}
          onClose={() => setIsGlobalAllocationOpen(false)}
          onSuccess={() => {
            setIsGlobalAllocationOpen(false);
            addToast('Payment successfully recorded and allocated across selected pendings!', 'success');
          }}
          onToast={addToast}
          currentUser={currentUser}
        />
      )}

      {/* Login & 2FA Modal */}
      <LoginModal
        isOpen={showLoginModal}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setShowLoginModal(false);
        }}
        onClose={() => setShowLoginModal(false)}
        onToast={addToast}
      />

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-indigo-900 text-indigo-50 border-indigo-700'
            }`}
          >
            <div className="flex items-start gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
