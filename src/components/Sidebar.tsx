import React from 'react';
import {
  LayoutDashboard, Building2, DoorOpen, Users, UserCheck, FileSignature,
  ArrowLeftRight, DollarSign, PiggyBank, Zap, Landmark, BookOpen,
  Scale, PieChart, Calendar, FileSpreadsheet, ShieldAlert, Settings,
  Code2, ChevronRight, LogOut, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { User } from '../types/erp';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  isOpenMobile,
  onCloseMobile
}) => {
  const allowedTabs = currentUser.Assigned_Tabs || [];

  const isTabAllowed = (tabKey: string) => {
    if (currentUser.Role === 'Admin') return true;
    return allowedTabs.includes(tabKey);
  };

  const navGroups = [
    {
      label: 'Core Overview',
      items: [
        { id: 'Dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'CollectionsBoard', label: 'Collections & Vacancy', icon: Landmark }
      ]
    },
    {
      label: 'Property & Leasing',
      items: [
        { id: 'Properties', label: 'Properties & Assets', icon: Building2 },
        { id: 'Units', label: 'Units & Inventory', icon: DoorOpen },
        { id: 'Landlords', label: 'Landlords Directory', icon: UserCheck },
        { id: 'LandlordPayments', label: 'Landlord Rent Payouts', icon: DollarSign, badge: 'v3.1' },
        { id: 'Tenants', label: 'Tenants & ID Vault', icon: Users, badge: 'ID Proof' },
        { id: 'Bookings', label: 'Applicant Bookings', icon: Calendar },
        { id: 'Leases', label: 'Lease Agreements', icon: FileSignature },
        { id: 'MoveIn', label: 'Move-In & Check-In', icon: ArrowLeftRight },
        { id: 'MoveOut', label: 'Move-Out & Refunds', icon: ArrowLeftRight }
      ]
    },
    {
      label: 'Financial Operations',
      items: [
        { id: 'Rent', label: 'Rent Billing & Arrears', icon: DollarSign, badge: 'Auto-Run' },
        { id: 'Deposits', label: 'Deposits & Security', icon: PiggyBank },
        { id: 'Utilities', label: 'Utility Splits & Hydro', icon: Zap },
        { id: 'Collections', label: 'Collections Ledger', icon: Landmark }
      ]
    },
    {
      label: 'Accounting & Ledger',
      items: [
        { id: 'Accounting', label: 'General Ledger & TB', icon: Scale, badge: 'Balanced' },
        { id: 'Reports', label: 'Excel & CSV Reports', icon: FileSpreadsheet, badge: 'Export' }
      ]
    },
    {
      label: 'System & Deployment',
      items: [
        { id: 'Administration', label: 'User Roles & Access', icon: ShieldAlert },
        { id: 'AppsScriptHub', label: 'Apps Script Code.gs', icon: Code2, badge: 'v3.1 Export' }
      ]
    }
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-sm">Dream Dwell</span>
              <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.2 rounded tracking-wider uppercase">ERP</span>
            </div>
            <p className="text-[11px] text-indigo-400 font-medium">Property & Lease Management</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => isTabAllowed(item.id));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 px-3 mb-1.5">
                {group.label}
              </p>
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40 font-bold'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {currentUser.Full_Name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.Full_Name.split(' ')[0]}</p>
              <span className="inline-block text-[10px] font-semibold text-emerald-400">
                {currentUser.Role}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Switch User / Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-full shrink-0 border-r border-slate-800 z-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
