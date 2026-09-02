import React, { useState } from 'react';
import {
  Menu, Shield, DollarSign, Plus, Sparkles, HelpCircle,
  FileSpreadsheet, ArrowUpRight, CheckCircle2, Building, RefreshCw,
  LogOut, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { User, RegionalProvince, REGIONAL_PROVINCE_TAX } from '../types/erp';
import { storage } from '../services/storage';
import { CloudSyncBadge } from './CloudSyncBadge';

interface NavbarProps {
  currentTab: string;
  onOpenMobileNav: () => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenTaxGuide: () => void;
  onQuickAction: (action: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenCloudQuota?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileNav,
  currentUser,
  onSwitchUser,
  onOpenTaxGuide,
  onQuickAction,
  onOpenLogin,
  onLogout,
  onOpenCloudQuota
}) => {
  const users = storage.getUsers();
  const [selectedProvince, setSelectedProvince] = useState<RegionalProvince>('ON');

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    Dashboard: { title: 'Executive Overview', subtitle: 'Portfolio performance, cash flows & key lease vitals' },
    CollectionsBoard: { title: 'Collections & Vacancy Board', subtitle: 'Property collection efficiency & unit occupancy tracking' },
    Properties: { title: 'Properties & Portfolios', subtitle: 'Real estate assets and building portfolios' },
    Units: { title: 'Units & Inventory', subtitle: 'Individual residential suites, target rents & live occupancy' },
    Landlords: { title: 'Landlord Directory', subtitle: 'Property owners, banking info & payout preferences' },
    LandlordPayments: { title: 'Landlord Rent Payouts', subtitle: 'Disbursements after management fee & utility deductions' },
    Tenants: { title: 'Tenants & ID Proof Vault', subtitle: 'Resident directory, contact records & verified tenant IDs' },
    Bookings: { title: 'Applicant Bookings', subtitle: 'Prospective tenant pipeline & application deposits' },
    Leases: { title: 'Lease Agreements', subtitle: 'First & Last month rent, security deposits & tenancy agreements' },
    MoveIn: { title: 'Move-In Inspection', subtitle: 'Key handover checklists & utility meter baseline readings' },
    MoveOut: { title: 'Move-Out & Deposit Refunds', subtitle: 'Damage assessments, final reconciliations & refund payouts' },
    Rent: { title: 'Rent Ledger & Billing', subtitle: 'Automated idempotent billing runs & payment allocation' },
    Deposits: { title: 'Deposits & Security', subtitle: 'Last Month Rent (LMR) & key deposit balance tracking' },
    Utilities: { title: 'Utility Master & Splits', subtitle: 'Proportional allocation of Hydro, Water & Gas across units' },
    Collections: { title: 'Collections Ledger', subtitle: 'Complete log of cash receipts, EFTs & excess balance tracking' },
    Accounting: { title: 'General Ledger & Trial Balance', subtitle: 'Double-entry accounting with auto-balancing verification' },
    Reports: { title: 'Operational Reports', subtitle: 'Download pending rent, arrears, move-outs & deposit spreadsheets' },
    Administration: { title: 'Access Control & Users', subtitle: 'Role-based access management and user tab permissions' },
    AppsScriptHub: { title: 'Apps Script Deployment Hub', subtitle: 'Google Apps Script Code.gs v3.1 and Index.html source code' }
  };

  const currentInfo = tabTitles[currentTab] || { title: currentTab, subtitle: 'Property & Lease ERP' };
  const currentTax = REGIONAL_PROVINCE_TAX[selectedProvince];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between z-10 shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 leading-none">
              {currentInfo.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              USD $
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 hidden md:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Firebase Firestore Cloud Sync Badge */}
        <CloudSyncBadge onOpenQuota={onOpenCloudQuota} />

        {/* Regional Province & Tax Rate Chip */}
        <button
          onClick={onOpenTaxGuide}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          title="Click to view regional tenancy & tax guide"
        >
          <Building className="w-3.5 h-3.5 text-indigo-600" />
          <span>{currentTax.name} ({currentTax.province}):</span>
          <span className="font-bold text-indigo-700">{(currentTax.totalTaxRate * 100).toFixed(1)}% Tax</span>
        </button>

        {/* Quick Action Dropdown / Button */}
        <button
          id="btn-quick-lease"
          onClick={() => onQuickAction('NEW_LEASE')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span> Lease
        </button>

        {/* User Profile, 2FA Verified Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>2FA Verified</span>
          </div>

          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Switch User / 2FA Verification Portal"
          >
            <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span className="max-w-[100px] truncate">{currentUser.Full_Name.split(' ')[0]}</span>
            <span className="text-[10px] text-slate-500 font-normal">({currentUser.Role})</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            title="Log Out (Locks session and returns to 2FA Login)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
