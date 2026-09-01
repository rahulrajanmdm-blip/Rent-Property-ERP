import React from 'react';
import {
  Landmark, Building2, DoorOpen, AlertTriangle, Users,
  ArrowRight, CheckCircle2, TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';

interface CollectionsVacancyBoardProps {
  onNavigateTab: (tab: string) => void;
}

export const CollectionsVacancyBoard: React.FC<CollectionsVacancyBoardProps> = ({ onNavigateTab }) => {
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();
  const leases = storage.getLeases();
  const rents = storage.getRentTransactions();
  const deposits = storage.getDepositTransactions();
  const moveOuts = storage.getMoveOuts();

  // Helper for collection rate percentage by property
  const getCollectionRatePercentage = (propertyId: string) => {
    const propRents = rents.filter(r => r.Property_ID === propertyId);
    const totalBilled = propRents.reduce((s, r) => s + r.Amount_Billed, 0);
    const totalPaid = propRents.reduce((s, r) => s + r.Amount_Paid, 0);
    return totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
  };

  const getOccupiedCount = (propertyId: string) => {
    return units.filter(u => u.Property_ID === propertyId && u.Current_Status === 'Occupied').length;
  };

  const getUnitCount = (propertyId: string) => {
    return units.filter(u => u.Property_ID === propertyId).length;
  };

  // Find upcoming lease ends & move outs (within 90 days)
  const now = new Date();
  const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const upcomingExpirations = leases.filter(l => {
    if (l.Status !== 'Active' || !l.Lease_End) return false;
    const end = new Date(l.Lease_End);
    return end >= now && end <= ninetyDaysOut;
  });

  const getTenantPendingRent = (tenantId: string) => {
    return rents
      .filter(r => r.Tenant_ID === tenantId && r.Status !== 'Paid')
      .reduce((s, r) => s + (r.Amount_Billed - r.Amount_Paid), 0);
  };

  const getTenantPendingDeposit = (tenantId: string) => {
    const dep = deposits.find(d => d.Tenant_ID === tenantId && d.Status !== 'Received');
    return dep ? dep.Due_Amount - dep.Paid_Amount : 0;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Landmark className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Collections & Vacancy Intelligence Board</h2>
              <p className="text-xs text-slate-500">Live property recovery rates, unit occupancy density, and upcoming lease transitions</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigateTab('Rent')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Open Rent Ledger
          </button>
          <button
            onClick={() => onNavigateTab('Units')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Manage Units
          </button>
        </div>
      </div>

      {/* Two Column Grid: Collections vs Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections Recovery Rate by Property */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Rent Collection Efficiency by Property
            </h3>
            <span className="text-xs text-slate-400">Target: 98%+</span>
          </div>

          <div className="space-y-4">
            {properties.map(p => {
              const rate = getCollectionRatePercentage(p.Property_ID);
              const propRents = rents.filter(r => r.Property_ID === p.Property_ID);
              const billed = propRents.reduce((s, r) => s + r.Amount_Billed, 0);
              const paid = propRents.reduce((s, r) => s + r.Amount_Paid, 0);
              const outstanding = Math.max(0, billed - paid);

              return (
                <div key={p.Property_ID} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{p.Property_Name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({p.City}, {p.Province})</span>
                    </div>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      rate >= 90 ? 'bg-emerald-100 text-emerald-700' : rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {rate}% Paid
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Billed: <b className="text-slate-700">{AccountingEngine.formatCurrency(billed)}</b></span>
                    <span>Received: <b className="text-emerald-700">{AccountingEngine.formatCurrency(paid)}</b></span>
                    <span>Arrears: <b className={outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}>{AccountingEngine.formatCurrency(outstanding)}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unit Occupancy by Property */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-indigo-600" />
              Unit Occupancy & Density Status
            </h3>
            <span className="text-xs text-slate-400">Total Units: {units.length}</span>
          </div>

          <div className="space-y-4">
            {properties.map(p => {
              const total = getUnitCount(p.Property_ID);
              const occupied = getOccupiedCount(p.Property_ID);
              const vacant = units.filter(u => u.Property_ID === p.Property_ID && u.Current_Status === 'Vacant').length;
              const maintenance = units.filter(u => u.Property_ID === p.Property_ID && u.Current_Status === 'Maintenance').length;
              const occPercent = total > 0 ? Math.round((occupied / total) * 100) : 0;

              return (
                <div key={p.Property_ID} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{p.Property_Name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600">{occPercent}% Occupied</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${occPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      {occupied} Occupied
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      {vacant} Vacant
                    </span>
                    {maintenance > 0 && (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        {maintenance} Maintenance
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Move-Outs and Expirations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Upcoming Lease Expirations & Move-Out Schedule (Next 90 Days)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated tracking of pending rents and security deposits to reconcile prior to key return</p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
            {upcomingExpirations.length} Active Notice(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tenant Name</th>
                <th className="py-3 px-4">Unit & Property</th>
                <th className="py-3 px-4">Lease Expiry</th>
                <th className="py-3 px-4 text-right">Monthly Rent</th>
                <th className="py-3 px-4 text-right">Pending Rent</th>
                <th className="py-3 px-4 text-right">Pending Deposit</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcomingExpirations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No upcoming move-outs or lease terminations in the next 90 days.
                  </td>
                </tr>
              ) : (
                upcomingExpirations.map(lease => {
                  const tenant = tenants.find(t => t.Tenant_ID === lease.Tenant_ID);
                  const property = properties.find(p => p.Property_ID === lease.Property_ID);
                  const pendingRent = getTenantPendingRent(lease.Tenant_ID);
                  const pendingDeposit = getTenantPendingDeposit(lease.Tenant_ID);

                  return (
                    <tr key={lease.Lease_ID} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {tenant ? tenant.Full_Name : lease.Tenant_ID}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{lease.Unit_ID}</span> · {property ? property.Property_Name : lease.Property_ID}
                      </td>
                      <td className="py-3.5 px-4 text-indigo-700 font-semibold">
                        {lease.Lease_End}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {AccountingEngine.formatCurrency(lease.Monthly_Rent)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${pendingRent > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {AccountingEngine.formatCurrency(pendingRent)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                        {AccountingEngine.formatCurrency(pendingDeposit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onNavigateTab('MoveOut')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                        >
                          Process Move-Out
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
