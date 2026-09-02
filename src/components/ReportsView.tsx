import React, { useState } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Filter, CheckCircle2,
  DollarSign, Zap, PiggyBank, ArrowRight, Table
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { User } from '../types/erp';

interface ReportsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser, onToast }) => {
  const rents = storage.getRentTransactions();
  const utilities = storage.getUtilitySplits();
  const deposits = storage.getDepositTransactions();
  const moveOuts = storage.getMoveOuts();
  const collections = storage.getCollections();
  const tenants = storage.getTenants();
  const properties = storage.getProperties();

  const [collectionStart, setCollectionStart] = useState('2025-01-01');
  const [collectionEnd, setCollectionEnd] = useState(new Date().toISOString().slice(0, 10));

  const tenantName = (id: string) => tenants.find(t => t.Tenant_ID === id)?.Full_Name || id;
  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    onToast(`Downloaded ${filename}`, 'success');
  };

  const handleExportRentPending = () => {
    const pending = rents.filter(r => r.Status !== 'Paid');
    const headers = ['Rent ID', 'Month', 'Tenant Name', 'Property ID', 'Unit ID', 'Amount Billed', 'Amount Paid', 'Balance Due', 'Status', 'Due Date'];
    const rows = pending.map(r => [
      r.Rent_Txn_ID,
      r.Period_Month,
      `"${tenantName(r.Tenant_ID)}"`,
      `"${propertyName(r.Property_ID)}"`,
      r.Unit_ID,
      r.Amount_Billed,
      r.Amount_Paid,
      r.Balance,
      r.Status,
      r.Due_Date
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `Rent_Pending_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportUtilityPending = () => {
    const pending = utilities.filter(u => u.Status !== 'Paid');
    const headers = ['Split ID', 'Utility Type', 'Tenant Name', 'Unit ID', 'Allocated Amount', 'Amount Paid', 'Balance', 'Status'];
    const rows = pending.map(u => [
      u.Split_ID,
      `"${u.Utility_Name}"`,
      `"${tenantName(u.Tenant_ID)}"`,
      u.Unit_ID,
      u.Allocated_Amount,
      u.Amount_Paid,
      u.Balance,
      u.Status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `Utility_Pending_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportMoveOuts = () => {
    const headers = ['MoveOut ID', 'Lease ID', 'Tenant Name', 'Unit ID', 'Move Out Date', 'Damage Amount', 'Deposit Refund', 'Status'];
    const rows = moveOuts.map(m => [
      m.MoveOut_ID,
      m.Lease_ID,
      `"${tenantName(m.Tenant_ID)}"`,
      m.Unit_ID,
      m.MoveOut_Date,
      m.Damage_Amount,
      m.Deposit_Refund,
      m.Status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `Current_Moveouts_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportDepositsPending = () => {
    const pending = deposits.filter(d => d.Status !== 'Received');
    const headers = ['Deposit Txn ID', 'Lease ID', 'Tenant Name', 'Unit ID', 'Due Amount', 'Paid Amount', 'Balance Due', 'Status'];
    const rows = pending.map(d => [
      d.Deposit_Txn_ID,
      d.Lease_ID,
      `"${tenantName(d.Tenant_ID)}"`,
      d.Unit_ID,
      d.Due_Amount,
      d.Paid_Amount,
      d.Balance,
      d.Status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `Deposits_Pending_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportCollectionsLog = () => {
    const filtered = collections.filter(c => {
      const d = c.Collection_Date;
      return d >= collectionStart && d <= collectionEnd;
    });

    const headers = ['Collection ID', 'Date', 'Tenant Name', 'Property ID', 'Unit ID', 'Type', 'Amount', 'Method', 'Reference'];
    const rows = filtered.map(c => [
      c.Collection_ID,
      c.Collection_Date,
      `"${tenantName(c.Tenant_ID)}"`,
      `"${propertyName(c.Property_ID)}"`,
      c.Unit_ID,
      c.Collection_Type,
      c.Amount,
      `"${c.Payment_Method}"`,
      `"${c.Reference || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `Collections_Log_${collectionStart}_to_${collectionEnd}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Financial & Operational Report Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate and download standard CSV/Excel reports compatible with standard accounting software</p>
        </div>
      </div>

      {/* Reports Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Rent Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-rose-600">
                {rents.filter(r => r.Status !== 'Paid').length} Unpaid
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Rent Pending / Arrears</h3>
            <p className="text-xs text-slate-500 mt-1">
              Extract all unpaid and partial tenant rent invoices with contact and unit identifiers.
            </p>
          </div>
          <button
            onClick={handleExportRentPending}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Rent Pending (CSV)
          </button>
        </div>

        {/* 2. Utility Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Zap className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-amber-600">
                {utilities.filter(u => u.Status !== 'Paid').length} Open Splits
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Utility Pending Splits</h3>
            <p className="text-xs text-slate-500 mt-1">
              Uncollected Hydro, City Water and Gas utility allocations across all property units.
            </p>
          </div>
          <button
            onClick={handleExportUtilityPending}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Utility Pending (CSV)
          </button>
        </div>

        {/* 3. Deposits Pending */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <PiggyBank className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-purple-600">
                {deposits.filter(d => d.Status !== 'Received').length} Pending
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Deposits & LMR Pending</h3>
            <p className="text-xs text-slate-500 mt-1">
              Outstanding security and Last Month Rent (LMR) deposits due from active lease inceptions.
            </p>
          </div>
          <button
            onClick={handleExportDepositsPending}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Deposits Pending (CSV)
          </button>
        </div>

        {/* 4. Current Month Move-Outs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {moveOuts.length} Recorded
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Move-Out Settlements</h3>
            <p className="text-xs text-slate-500 mt-1">
              Schedule of tenant move-outs with damage holdbacks and deposit refunds issued.
            </p>
          </div>
          <button
            onClick={handleExportMoveOuts}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Move-Outs (CSV)
          </button>
        </div>

        {/* 5. Collections Log with Date Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Table className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {collections.length} Total Receipts
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Collections & Payment Receipt Log</h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive transaction history of all Interac e-Transfers, PAD, EFT and cheques received.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={collectionStart}
                  onChange={(e) => setCollectionStart(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">End Date</label>
                <input
                  type="date"
                  value={collectionEnd}
                  onChange={(e) => setCollectionEnd(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleExportCollectionsLog}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Filtered Collections Log (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
