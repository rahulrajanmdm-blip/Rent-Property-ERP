import React, { useState, useMemo } from 'react';
import {
  PiggyBank, Plus, Search, Landmark, ShieldCheck,
  AlertCircle, Building2, CheckCircle2, DollarSign,
  ArrowRight, FileText, Scale, X, Check, Clock, Edit3, Trash2,
  Filter, Split, ArrowDownLeft
} from 'lucide-react';
import { storage } from '../services/storage';
import { DepositTransaction, Lease, Property, Unit, Tenant, User, JournalHeader, JournalLine } from '../types/erp';
import { AccountingEngine } from '../services/accountingEngine';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { BankPaymentAllocationModal } from './BankPaymentAllocationModal';

interface DepositsViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({ currentUser, onToast }) => {
  const depositTxns = storage.getDepositTransactions();
  const leases = storage.getLeases();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const tenants = storage.getTenants();
  const coa = storage.getChartOfAccounts();

  // Tab & Filters State
  const [activeTab, setActiveTab] = useState<'ALL' | 'SECURITY' | 'LMR'>('ALL');
  const [search, setSearch] = useState('');
  const [filterProperty, setFilterProperty] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocPreselectedTenantId, setAllocPreselectedTenantId] = useState<string | undefined>(undefined);
  const [editingDeposit, setEditingDeposit] = useState<DepositTransaction | null>(null);
  const [deletingDeposit, setDeletingDeposit] = useState<DepositTransaction | null>(null);

  // Form State for Direct Record Modal
  const [depositType, setDepositType] = useState<'Security Deposit' | 'Last Month Rent'>('Security Deposit');
  const [selectedBankCode, setSelectedBankCode] = useState<string>('1020');
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(leases[0]?.Lease_ID || '');
  const [paidAmount, setPaidAmount] = useState<number>(2000);
  const [dueAmount, setDueAmount] = useState<number>(2000);
  const [txnDate, setTxnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('Interac e-Transfer #DEP-' + Math.floor(1000 + Math.random() * 9000));
  const [status, setStatus] = useState<DepositTransaction['Status']>('Received');
  const [notes, setNotes] = useState<string>('');

  // Bank accounts from Chart of Accounts (1000-1099)
  const bankAccounts = useMemo(() => {
    return coa.filter(a =>
      a.Account_Type === 'Asset' &&
      (a.Account_Code.startsWith('10') || a.Account_Name.toLowerCase().includes('bank') || a.Account_Name.toLowerCase().includes('deposit'))
    );
  }, [coa]);

  // Filtered list based on search, tab, property, and status
  const filteredTxns = useMemo(() => {
    return depositTxns.filter(txn => {
      // Tab filter: Security Deposit vs Last Month Rent
      if (activeTab === 'SECURITY' && txn.Deposit_Type !== 'Security Deposit') return false;
      if (activeTab === 'LMR' && txn.Deposit_Type !== 'Last Month Rent') return false;

      const tenant = tenants.find(t => t.Tenant_ID === txn.Tenant_ID);
      const prop = properties.find(p => p.Property_ID === txn.Property_ID);
      const term = search.toLowerCase();
      const matchSearch =
        txn.Deposit_Txn_ID.toLowerCase().includes(term) ||
        (tenant && tenant.Full_Name.toLowerCase().includes(term)) ||
        (prop && prop.Property_Name.toLowerCase().includes(term)) ||
        (txn.Reference && txn.Reference.toLowerCase().includes(term)) ||
        (txn.Deposit_Type && txn.Deposit_Type.toLowerCase().includes(term));
      const matchProp = filterProperty === 'ALL' || txn.Property_ID === filterProperty;
      const matchStatus = filterStatus === 'ALL' || txn.Status === filterStatus;
      return matchSearch && matchProp && matchStatus;
    });
  }, [depositTxns, activeTab, search, filterProperty, filterStatus, tenants, properties]);

  // Dedicated Analytics separated by Ledger
  const totalHeldSecurity = useMemo(() => {
    return depositTxns
      .filter(t => t.Deposit_Type === 'Security Deposit')
      .reduce((sum, t) => sum + (t.Paid_Amount || 0) - (t.Refund_Amount || 0), 0);
  }, [depositTxns]);

  const totalHeldLMR = useMemo(() => {
    return depositTxns
      .filter(t => t.Deposit_Type === 'Last Month Rent')
      .reduce((sum, t) => sum + (t.Paid_Amount || 0) - (t.Refund_Amount || 0), 0);
  }, [depositTxns]);

  const totalPendingSecurity = useMemo(() => {
    return depositTxns
      .filter(t => t.Deposit_Type === 'Security Deposit')
      .reduce((sum, t) => sum + (t.Balance || 0), 0);
  }, [depositTxns]);

  const totalPendingLMR = useMemo(() => {
    return depositTxns
      .filter(t => t.Deposit_Type === 'Last Month Rent')
      .reduce((sum, t) => sum + (t.Balance || 0), 0);
  }, [depositTxns]);

  const handleOpenAdd = (type?: 'Security Deposit' | 'Last Month Rent') => {
    setEditingDeposit(null);
    const targetType = type || (activeTab === 'LMR' ? 'Last Month Rent' : 'Security Deposit');
    setDepositType(targetType);
    setSelectedBankCode('1020');

    if (leases.length > 0) {
      const l = leases[0];
      setSelectedLeaseId(l.Lease_ID);
      const req = targetType === 'Last Month Rent'
        ? (l.Last_Month_Rent || l.Monthly_Rent || 2000)
        : (l.Deposit_Required || 250);
      setDueAmount(req);
      setPaidAmount(req);
    }
    setTxnDate(new Date().toISOString().split('T')[0]);
    setReference(`Interac e-Transfer #${targetType === 'Last Month Rent' ? 'LMR' : 'DEP'}-${Math.floor(1000 + Math.random() * 9000)}`);
    setStatus('Received');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (d: DepositTransaction) => {
    setEditingDeposit(d);
    setDepositType(d.Deposit_Type || 'Security Deposit');
    setSelectedLeaseId(d.Lease_ID);
    setDueAmount(d.Due_Amount || 2000);
    setPaidAmount(d.Paid_Amount || 0);
    setTxnDate(d.Txn_Date);
    setReference(d.Reference || '');
    setStatus(d.Status);
    setNotes(d.Notes || '');
    setShowAddModal(true);
  };

  const handleOpenAllocationForTenant = (tenantId: string) => {
    setAllocPreselectedTenantId(tenantId);
    setShowAllocModal(true);
  };

  const handleSaveDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const lease = leases.find(l => l.Lease_ID === selectedLeaseId);
    if (!lease) {
      onToast('Please select a valid lease', 'error');
      return;
    }

    if (editingDeposit) {
      const updated: DepositTransaction = {
        ...editingDeposit,
        Deposit_Type: depositType,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Due_Amount: dueAmount,
        Paid_Amount: paidAmount,
        Balance: Math.max(0, dueAmount - paidAmount),
        Txn_Date: txnDate,
        Status: status,
        Reference: reference,
        Notes: notes
      };
      storage.updateDepositTransaction(updated, currentUser.Email);
      onToast(`Deposit record ${updated.Deposit_Txn_ID} (${depositType}) updated`, 'success');
    } else {
      const prefix = depositType === 'Last Month Rent' ? 'LMR' : 'SEC';
      const uniqueId = `DEP-${prefix}-${Date.now().toString(36).toUpperCase()}`;

      const newTxn: DepositTransaction = {
        Deposit_Txn_ID: uniqueId,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Deposit_Type: depositType,
        Txn_Type: 'Payment',
        Due_Amount: dueAmount,
        Paid_Amount: paidAmount,
        Refund_Amount: 0,
        Balance: Math.max(0, dueAmount - paidAmount),
        Txn_Date: txnDate,
        Status: paidAmount >= dueAmount ? 'Received' : paidAmount > 0 ? 'Partial' : 'Receivable',
        Reference: reference,
        Notes: notes,
        Created_By: currentUser.Email
      };

      storage.addDepositTransaction(newTxn, currentUser.Email);

      // Double Entry Journal:
      // DR Selected Bank (e.g. 1020 or 1010)
      // CR 2200 (Security Deposits Held) or CR 2210 (Last Month Rent Held)
      if (paidAmount > 0) {
        const liabilityAccountCode = depositType === 'Last Month Rent' ? '2210' : '2200';
        const liabilityAccountName = depositType === 'Last Month Rent'
          ? 'Last Month Rent (LMR) Held Liability'
          : 'Tenant Security Deposits Held Liability';

        const jId = 'JRN-DEP-' + Date.now().toString(36).toUpperCase();
        const jLines: JournalLine[] = [
          {
            Line_ID: `${jId}-1`,
            Journal_ID: jId,
            Account_Code: selectedBankCode,
            Property_ID: lease.Property_ID,
            Unit_ID: lease.Unit_ID,
            Tenant_ID: lease.Tenant_ID,
            Debit_Amount: paidAmount,
            Credit_Amount: 0,
            Memo: `${depositType} Received for Lease ${lease.Lease_ID} - ${reference}`
          },
          {
            Line_ID: `${jId}-2`,
            Journal_ID: jId,
            Account_Code: liabilityAccountCode,
            Property_ID: lease.Property_ID,
            Unit_ID: lease.Unit_ID,
            Tenant_ID: lease.Tenant_ID,
            Debit_Amount: 0,
            Credit_Amount: paidAmount,
            Memo: `${liabilityAccountName} (GL ${liabilityAccountCode})`
          }
        ];

        const header: JournalHeader = {
          Journal_ID: jId,
          Date: txnDate,
          Description: `${depositType} Receipt — ${lease.Lease_ID} (${reference})`,
          Reference_Type: 'DEPOSIT_RECEIPT',
          Reference_ID: uniqueId,
          Created_By: currentUser.Email,
          Status: 'POSTED',
          Period_ID: 'PER-2025',
          Created_At: new Date().toISOString()
        };

        storage.postJournal(header, jLines, currentUser.Email);
      }

      onToast(`🏦 ${depositType} ${uniqueId} of $${paidAmount.toLocaleString()} recorded & posted!`, 'success');
    }
    setShowAddModal(false);
  };

  const handleDeleteDepositConfirm = () => {
    if (!deletingDeposit) return;
    storage.deleteDepositTransaction(deletingDeposit.Deposit_Txn_ID, currentUser.Email);
    onToast(`Deposit entry ${deletingDeposit.Deposit_Txn_ID} deleted`, 'info');
    setDeletingDeposit(null);
  };

  const getStatusBadge = (status: DepositTransaction['Status']) => {
    switch (status) {
      case 'Received':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Held</span>;
      case 'Partial':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Partial</span>;
      case 'Receivable':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Pending Receipt</span>;
      case 'Refunded':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Refunded / Offset</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'Last Month Rent') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
          Last Month Rent (LMR)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
        Security / Key Deposit
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <PiggyBank className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Deposits & Last Month Rent Ledgers</h2>
              <p className="text-xs text-slate-500">
                Independent tracking & accounting for Security Deposits (GL 2200) and Last Month Rent (GL 2210)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAllocPreselectedTenantId(undefined);
              setShowAllocModal(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Landmark className="w-4 h-4" />
            Allocate Bank Payment
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Record Direct Deposit
          </button>
        </div>
      </div>

      {/* Ledger KPI Cards (Separated into Security vs LMR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Security Deposits Held</p>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">GL 2200</span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{AccountingEngine.formatCurrency(totalHeldSecurity)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Key & damage reserves in escrow</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Month Rent (LMR) Held</p>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">GL 2210</span>
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1">{AccountingEngine.formatCurrency(totalHeldLMR)}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Prepaid final month rent held</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Pending Security Receivable</p>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-100">GL 1120</span>
          </div>
          <p className="text-xl font-black text-rose-600 mt-1">{AccountingEngine.formatCurrency(totalPendingSecurity)}</p>
          <span className="text-[10px] text-slate-500">Awaiting move-in deposit funds</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending LMR Receivable</p>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-100">GL 1125</span>
          </div>
          <p className="text-xl font-black text-amber-600 mt-1">{AccountingEngine.formatCurrency(totalPendingLMR)}</p>
          <span className="text-[10px] text-slate-500">Uncollected initial LMR charges</span>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Ledger Records ({depositTxns.length})
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'SECURITY'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Key Deposits ({depositTxns.filter(t => t.Deposit_Type === 'Security Deposit').length})
          </button>
          <button
            onClick={() => setActiveTab('LMR')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'LMR'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Last Month Rent (LMR) ({depositTxns.filter(t => t.Deposit_Type === 'Last Month Rent').length})
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipts by tenant, suite, property, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Properties</option>
            {properties.map(p => (
              <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Received">Held</option>
            <option value="Partial">Partial</option>
            <option value="Receivable">Pending Receipt</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Deposit Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Txn ID & Date</th>
                <th className="py-3 px-4">Ledger Type</th>
                <th className="py-3 px-4">Tenant & Suite</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4 text-right">Required Due</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Reference / Memo</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No deposit ledger transactions found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Use "Allocate Bank Payment" to record tenant payments or "Record Direct Deposit" to post.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTxns.map((txn, idx) => {
                  const tenant = tenants.find(t => t.Tenant_ID === txn.Tenant_ID);
                  const property = properties.find(p => p.Property_ID === txn.Property_ID);
                  const unit = units.find(u => u.Unit_ID === txn.Unit_ID);

                  return (
                    <tr key={`${txn.Deposit_Txn_ID || 'dep'}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-slate-900">{txn.Deposit_Txn_ID}</p>
                        <span className="text-[11px] text-slate-400">{txn.Txn_Date}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getTypeBadge(txn.Deposit_Type)}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{tenant?.Full_Name || txn.Tenant_ID}</p>
                        <span className="text-[11px] text-slate-500">
                          {unit ? (unit.Unit_Number_Name || unit.Unit_Number || unit.Unit_ID) : txn.Unit_ID}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{property?.Property_Name}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                        {AccountingEngine.formatCurrency(txn.Due_Amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {AccountingEngine.formatCurrency(txn.Paid_Amount)}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${txn.Balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {AccountingEngine.formatCurrency(txn.Balance)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(txn.Status)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-600 block truncate max-w-[200px]" title={txn.Reference}>
                          {txn.Reference || 'Direct bank transfer'}
                        </span>
                        {txn.Notes && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={txn.Notes}>
                            {txn.Notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {txn.Balance > 0 && (
                            <button
                              onClick={() => handleOpenAllocationForTenant(txn.Tenant_ID)}
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Allocate Bank Payment to this tenant"
                            >
                              Allocate
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(txn)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Deposit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingDeposit(txn)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Deposit Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Record / Edit Deposit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDeposit ? `Edit Deposit Entry: ${editingDeposit.Deposit_Txn_ID}` : 'Record Direct Deposit'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Posts to selected bank and liability ledger ({depositType === 'Last Month Rent' ? 'GL 2210' : 'GL 2200'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} className="space-y-4 text-xs">
              
              {/* Deposit Type & Bank Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deposit Ledger Type *</label>
                  <select
                    value={depositType}
                    onChange={(e) => {
                      const newType = e.target.value as 'Security Deposit' | 'Last Month Rent';
                      setDepositType(newType);
                      const lObj = leases.find(x => x.Lease_ID === selectedLeaseId);
                      if (lObj && !editingDeposit) {
                        const req = newType === 'Last Month Rent'
                          ? (lObj.Last_Month_Rent || lObj.Monthly_Rent || 2000)
                          : (lObj.Deposit_Required || 250);
                        setDueAmount(req);
                        setPaidAmount(req);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    <option value="Security Deposit">Security / Key Deposit (GL 2200)</option>
                    <option value="Last Month Rent">Last Month Rent (LMR) (GL 2210)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Account (Debit) *</label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  >
                    {bankAccounts.map(b => (
                      <option key={b.Account_Code} value={b.Account_Code}>
                        {b.Account_Code} - {b.Account_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Lease *</label>
                <select
                  value={selectedLeaseId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setSelectedLeaseId(lId);
                    const lObj = leases.find(x => x.Lease_ID === lId);
                    if (lObj && !editingDeposit) {
                      const req = depositType === 'Last Month Rent'
                        ? (lObj.Last_Month_Rent || lObj.Monthly_Rent || 2000)
                        : (lObj.Deposit_Required || 250);
                      setDueAmount(req);
                      setPaidAmount(req);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  required
                >
                  {leases.map(l => {
                    const t = tenants.find(x => x.Tenant_ID === l.Tenant_ID);
                    const p = properties.find(x => x.Property_ID === l.Property_ID);
                    return (
                      <option key={l.Lease_ID} value={l.Lease_ID}>
                        {l.Lease_ID} — {t?.Full_Name || l.Tenant_ID} ({p?.Property_Name})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Due ($ CAD) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid ($ CAD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DepositTransaction['Status'])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Received">Held</option>
                    <option value="Partial">Partial</option>
                    <option value="Receivable">Pending Receipt</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Banking / Transfer Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Interac e-Transfer #DEP-9082 / Bank Wire"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Move-in deposit receipt"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingDeposit ? 'Save Changes' : 'Post Deposit to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Payment Allocation Modal */}
      <BankPaymentAllocationModal
        isOpen={showAllocModal}
        onClose={() => setShowAllocModal(false)}
        onSuccess={() => {
          onToast('Payment allocated and applied to tenant pendings!', 'success');
        }}
        onToast={onToast}
        currentUser={currentUser}
        preselectedTenantId={allocPreselectedTenantId}
      />

      {/* Confirm Delete Deposit Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingDeposit}
        title="Delete Deposit Transaction"
        itemName={deletingDeposit ? `Deposit ${deletingDeposit.Deposit_Txn_ID} (${AccountingEngine.formatCurrency(deletingDeposit.Paid_Amount)})` : ''}
        itemType="deposit entry"
        warningMessage="Deleting this deposit entry will remove it from the deposit liability ledger."
        onConfirm={handleDeleteDepositConfirm}
        onCancel={() => setDeletingDeposit(null)}
      />
    </div>
  );
};
