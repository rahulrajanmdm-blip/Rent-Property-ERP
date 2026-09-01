import React from 'react';
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle2,
  Building, DoorOpen, Users, PiggyBank, Clock,
  ArrowUpRight, FileText, ChevronRight, Zap
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, onQuickAction }) => {
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants().filter(t => t.Status === 'Active');
  const leases = storage.getLeases().filter(l => l.Status === 'Active');
  const rents = storage.getRentTransactions();
  const deposits = storage.getDepositTransactions();
  const landlordPayments = storage.getLandlordPayments();

  // Metrics
  const totalBilled = rents.reduce((sum, r) => sum + r.Amount_Billed, 0);
  const totalCollected = rents.reduce((sum, r) => sum + r.Amount_Paid, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  const activeUnits = units.filter(u => u.Current_Status !== 'Inactive');
  const occupiedUnits = activeUnits.filter(u => u.Current_Status === 'Occupied').length;
  const occupancyRate = activeUnits.length > 0 ? Math.round((occupiedUnits / activeUnits.length) * 100) : 0;

  const totalDepositsHeld = deposits.reduce((sum, d) => sum + d.Paid_Amount, 0);
  const totalLandlordPaid = landlordPayments.filter(p => p.Status === 'Posted').reduce((sum, p) => sum + p.Net_Amount, 0);

  // Current month specific metrics
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthRents = rents.filter(r => r.Period_Month === currentMonth);
  const currentMonthBilled = currentMonthRents.reduce((sum, r) => sum + r.Amount_Billed, 0);
  const currentMonthPaid = currentMonthRents.reduce((sum, r) => sum + r.Amount_Paid, 0);
  const currentMonthPending = Math.max(0, currentMonthBilled - currentMonthPaid);

  // Actionable Alerts
  const alerts: { type: 'urgent' | 'warning' | 'info'; title: string; message: string; actionTab: string }[] = [];

  const overdueRents = rents.filter(r => r.Status !== 'Paid');
  if (overdueRents.length > 0) {
    alerts.push({
      type: 'urgent',
      title: `${overdueRents.length} Outstanding Rent Balances`,
      message: `Totaling ${AccountingEngine.formatCurrency(totalOutstanding)} across active Canadian leases.`,
      actionTab: 'Rent'
    });
  }

  const vacantUnits = activeUnits.filter(u => u.Current_Status === 'Vacant');
  if (vacantUnits.length > 0) {
    alerts.push({
      type: 'warning',
      title: `${vacantUnits.length} Vacant Units Ready for Lease`,
      message: `Potential monthly rent loss of ${AccountingEngine.formatCurrency(vacantUnits.reduce((s, u) => s + u.Target_Rent, 0))}.`,
      actionTab: 'Units'
    });
  }

  const pendingLandlord = landlordPayments.filter(p => p.Status === 'Pending');
  if (pendingLandlord.length > 0) {
    alerts.push({
      type: 'info',
      title: `${pendingLandlord.length} Pending Landlord Disbursements`,
      message: `Net amount ${AccountingEngine.formatCurrency(pendingLandlord.reduce((s, p) => s + p.Net_Amount, 0))} ready for EFT payment.`,
      actionTab: 'LandlordPayments'
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Summary */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-700/50">
                Canadian Portfolio Operations
              </span>
              <span className="text-xs text-slate-300">Period: {currentMonth}</span>
            </div>
            <h2 className="text-2xl font-extrabold mt-2 tracking-tight">
              {properties.length} Properties · {units.length} Units · {tenants.length} Active Leases
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Double-entry Canadian lease accounting with automated provincial rent rolls & landlord payouts.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onQuickAction('GENERATE_RENT')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Monthly Rent
            </button>
            <button
              onClick={() => onNavigateTab('LandlordPayments')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Landlord Payouts
            </button>
            <button
              onClick={() => onNavigateTab('Reports')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Export Reports
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Rent Billed (This Month)</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">
            {AccountingEngine.formatCurrency(currentMonthBilled)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <span className="font-semibold text-emerald-600">{AccountingEngine.formatCurrency(currentMonthPaid)}</span>
            <span>collected ({currentMonthBilled > 0 ? Math.round((currentMonthPaid / currentMonthBilled) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Rent Receivable / Arrears</p>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-rose-600 mt-2">
            {AccountingEngine.formatCurrency(totalOutstanding)}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {overdueRents.length} unpaid transaction(s)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Portfolio Occupancy</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">
            {occupancyRate}%
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Deposits in Trust (LMR)</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">
            {AccountingEngine.formatCurrency(totalDepositsHeld)}
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Held under GL Account 2200
          </p>
        </div>
      </div>

      {/* Main Grid: Alerts & Quick Action Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Alerts Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Operational & Action Items
            </h3>
            <span className="text-xs text-slate-500">{alerts.length} item(s) requiring attention</span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/60">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Everything is in order</p>
                <p className="text-xs text-slate-500">No overdue rents or vacant unit issues.</p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab(alert.actionTab)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:translate-x-1 ${
                    alert.type === 'urgent'
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : alert.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold">{alert.title}</p>
                    <p className="text-xs opacity-80">{alert.message}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Provincial Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Canadian Properties by Province
            </h3>
            {properties.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
                <Building className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Clean Production Workspace</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No properties created yet.</p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => onNavigateTab('Properties')}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    + Add First Property
                  </button>
                  <button
                    onClick={() => onNavigateTab('Administration')}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Or Load Demo Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map(p => {
                  const propUnits = units.filter(u => u.Property_ID === p.Property_ID);
                  const occupied = propUnits.filter(u => u.Current_Status === 'Occupied').length;
                  const occPercent = propUnits.length > 0 ? Math.round((occupied / propUnits.length) * 100) : 0;

                  return (
                    <div key={p.Property_ID} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900">{p.Property_Name}</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {p.Province}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{occupied}/{propUnits.length} Units Occupied</span>
                        <span className="font-semibold text-slate-700">{occPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${occPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('CollectionsBoard')}
            className="w-full mt-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1"
          >
            <span>Open Collections & Vacancy Board</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
