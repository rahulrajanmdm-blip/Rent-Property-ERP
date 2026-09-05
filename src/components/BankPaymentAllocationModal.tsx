import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark, X, Check, DollarSign, ArrowDownRight,
  ShieldCheck, Calendar, AlertCircle, Sparkles, Receipt,
  CheckCircle2, Split
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { User, PaymentAllocationItem } from '../types/erp';

interface BankPaymentAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  currentUser: User;
  preselectedTenantId?: string;
  preselectedLeaseId?: string;
}

export const BankPaymentAllocationModal: React.FC<BankPaymentAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onToast,
  currentUser,
  preselectedTenantId,
  preselectedLeaseId
}) => {
  const tenants = storage.getTenants();
  const leases = storage.getLeases();
  const properties = storage.getProperties();
  const units = storage.getUnits();
  const coa = storage.getChartOfAccounts();

  // Filter bank/cash accounts from COA (Assets with code 1000 to 1099)
  const bankAccounts = useMemo(() => {
    return coa.filter(a =>
      a.Account_Type === 'Asset' &&
      (a.Account_Code.startsWith('10') || a.Account_Name.toLowerCase().includes('bank') || a.Account_Name.toLowerCase().includes('deposit'))
    );
  }, [coa]);

  // Form State
  const [selectedBankCode, setSelectedBankCode] = useState<string>('1010');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(preselectedTenantId || tenants[0]?.Tenant_ID || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Interac e-Transfer');
  const [reference, setReference] = useState<string>('ET-BANK-' + Math.floor(100000 + Math.random() * 900000));
  const [notes, setNotes] = useState<string>('');
  const [allocationAmounts, setAllocationAmounts] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync preselected tenant when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preselectedTenantId) {
        setSelectedTenantId(preselectedTenantId);
      } else if (tenants.length > 0 && !selectedTenantId) {
        setSelectedTenantId(tenants[0].Tenant_ID);
      }
    }
  }, [isOpen, preselectedTenantId]);

  // Find selected tenant's active lease, property, and unit
  const activeLease = useMemo(() => {
    return leases.find(l => l.Tenant_ID === selectedTenantId && l.Status === 'Active') ||
      leases.find(l => l.Tenant_ID === selectedTenantId) ||
      (preselectedLeaseId ? leases.find(l => l.Lease_ID === preselectedLeaseId) : undefined);
  }, [leases, selectedTenantId, preselectedLeaseId]);

  const tenantProperty = useMemo(() => {
    return properties.find(p => p.Property_ID === activeLease?.Property_ID);
  }, [properties, activeLease]);

  const tenantUnit = useMemo(() => {
    return units.find(u => u.Unit_ID === activeLease?.Unit_ID);
  }, [units, activeLease]);

  // Query all pending receivables for this tenant
  const pendingItems = useMemo<PaymentAllocationItem[]>(() => {
    if (!selectedTenantId) return [];
    const items: PaymentAllocationItem[] = [];

    // 1. Last Month Rent (LMR) Deposit Charges
    const depositTxns = storage.getDepositTransactions();
    const lmrTxns = depositTxns.filter(
      d => d.Tenant_ID === selectedTenantId &&
        d.Deposit_Type === 'Last Month Rent' &&
        d.Balance > 0
    );
    lmrTxns.forEach(d => {
      items.push({
        type: 'LMR',
        id: d.Deposit_Txn_ID,
        description: `Last Month Rent (LMR) Due — ${d.Reference || d.Deposit_Txn_ID}`,
        originalDue: d.Due_Amount,
        currentBalance: d.Balance,
        allocatedAmount: 0
      });
    });

    // 2. Security & Key Deposit Charges
    const secTxns = depositTxns.filter(
      d => d.Tenant_ID === selectedTenantId &&
        d.Deposit_Type === 'Security Deposit' &&
        d.Balance > 0
    );
    secTxns.forEach(d => {
      items.push({
        type: 'Security Deposit',
        id: d.Deposit_Txn_ID,
        description: `Security / Key Deposit Due — ${d.Reference || d.Deposit_Txn_ID}`,
        originalDue: d.Due_Amount,
        currentBalance: d.Balance,
        allocatedAmount: 0
      });
    });

    // 3. Rent Billing Items
    const rentTxns = storage.getRentTransactions();
    const unpaidRents = rentTxns.filter(
      r => r.Tenant_ID === selectedTenantId && r.Balance > 0
    );
    unpaidRents.forEach(r => {
      items.push({
        type: 'Rent',
        id: r.Rent_Txn_ID,
        description: `Rent Billing (${r.Period_Month}) — Due: $${r.Amount_Billed.toLocaleString()}`,
        originalDue: r.Amount_Billed,
        currentBalance: r.Balance,
        allocatedAmount: 0
      });
    });

    // 4. Utility Splits
    const utilitySplits = storage.getUtilitySplits();
    const unpaidSplits = utilitySplits.filter(
      u => u.Tenant_ID === selectedTenantId && u.Balance > 0
    );
    unpaidSplits.forEach(u => {
      items.push({
        type: 'Utility',
        id: u.Split_ID,
        description: `Utility Split (${u.Utility_Name}) — Share: $${u.Allocated_Amount.toLocaleString()}`,
        originalDue: u.Allocated_Amount,
        currentBalance: u.Balance,
        allocatedAmount: 0
      });
    });

    return items;
  }, [selectedTenantId, isOpen]);

  // When pendingItems change or tenant changes, initialize allocation amounts
  useEffect(() => {
    const initial: { [key: string]: number } = {};
    pendingItems.forEach(item => {
      initial[item.id] = 0;
    });
    setAllocationAmounts(initial);
    // Suggest payment amount from total pendings
    const totalDue = pendingItems.reduce((acc, curr) => acc + curr.currentBalance, 0);
    if (totalDue > 0 && paymentAmount === 0) {
      setPaymentAmount(totalDue);
    }
  }, [pendingItems]);

  // Handlers for quick allocations
  const handlePayFullItem = (id: string, balance: number) => {
    setAllocationAmounts(prev => ({
      ...prev,
      [id]: balance
    }));
  };

  const handleClearItem = (id: string) => {
    setAllocationAmounts(prev => ({
      ...prev,
      [id]: 0
    }));
  };

  const handleClearAll = () => {
    const cleared: { [key: string]: number } = {};
    pendingItems.forEach(item => {
      cleared[item.id] = 0;
    });
    setAllocationAmounts(cleared);
  };

  // Auto Allocate in logical Move-In sequence: LMR -> Security Deposit -> First Month Rent -> Utilities
  const handleAutoAllocate = () => {
    let remaining = paymentAmount;
    const next: { [key: string]: number } = {};

    // Sort priority: LMR first, then Security Deposit, then Rent, then Utility
    const priorityOrder = { 'LMR': 1, 'Security Deposit': 2, 'Rent': 3, 'Utility': 4 };
    const sorted = [...pendingItems].sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

    for (const item of sorted) {
      if (remaining <= 0) {
        next[item.id] = 0;
        continue;
      }
      const canPay = Math.min(remaining, item.currentBalance);
      next[item.id] = Math.round(canPay * 100) / 100;
      remaining = Math.round((remaining - canPay) * 100) / 100;
    }

    setAllocationAmounts(next);
  };

  // Quick action: Allocate solely to LMR
  const handleAllocateOnlyLMR = () => {
    const next: { [key: string]: number } = {};
    let rem = paymentAmount;
    pendingItems.forEach(item => {
      if (item.type === 'LMR' && rem > 0) {
        const canPay = Math.min(rem, item.currentBalance);
        next[item.id] = canPay;
        rem -= canPay;
      } else {
        next[item.id] = 0;
      }
    });
    setAllocationAmounts(next);
  };

  // Quick action: Allocate solely to Security Deposit
  const handleAllocateOnlyDeposit = () => {
    const next: { [key: string]: number } = {};
    let rem = paymentAmount;
    pendingItems.forEach(item => {
      if (item.type === 'Security Deposit' && rem > 0) {
        const canPay = Math.min(rem, item.currentBalance);
        next[item.id] = canPay;
        rem -= canPay;
      } else {
        next[item.id] = 0;
      }
    });
    setAllocationAmounts(next);
  };

  // Calculations
  const totalAllocated = useMemo(() => {
    return Object.values(allocationAmounts).reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
  }, [allocationAmounts]);

  const difference = useMemo(() => {
    return Math.round((paymentAmount - totalAllocated) * 100) / 100;
  }, [paymentAmount, totalAllocated]);

  const totalOutstanding = useMemo(() => {
    return pendingItems.reduce((acc, curr) => acc + curr.currentBalance, 0);
  }, [pendingItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      onToast('Please enter a valid payment amount greater than zero.', 'error');
      return;
    }
    if (difference < 0) {
      onToast(`Allocated amount ($${totalAllocated.toFixed(2)}) cannot exceed total payment received ($${paymentAmount.toFixed(2)}).`, 'error');
      return;
    }
    if (!activeLease) {
      onToast('Could not locate an active lease for the selected tenant.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToAllocate: PaymentAllocationItem[] = pendingItems.map(item => ({
        ...item,
        allocatedAmount: allocationAmounts[item.id] || 0
      }));

      AccountingEngine.allocateBankPayment({
        bankAccountCode: selectedBankCode,
        tenantId: selectedTenantId,
        propertyId: activeLease.Property_ID,
        unitId: activeLease.Unit_ID,
        leaseId: activeLease.Lease_ID,
        totalReceived: paymentAmount,
        paymentDate,
        paymentMethod,
        reference,
        allocations: itemsToAllocate,
        notes,
        userEmail: currentUser.Email
      });

      onToast(`Successfully recorded and allocated $${paymentAmount.toLocaleString()} from Bank (${selectedBankCode}).`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      onToast(err.message || 'Failed to allocate payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bank Payment & Fund Allocation</h2>
              <p className="text-xs text-slate-600">
                Directly allocate incoming bank receipts to pending LMR, Security Deposit, Rent, and Utilities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* Top Row: Bank Account & Tenant Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Deposit Bank Account (Debit) *
              </label>
              <select
                value={selectedBankCode}
                onChange={e => setSelectedBankCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {bankAccounts.map(b => (
                  <option key={b.Account_Code} value={b.Account_Code}>
                    {b.Account_Code} — {b.Account_Name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Select Operating Bank (1010) or Dedicated Deposit Account (1020).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Select Tenant *
              </label>
              <select
                value={selectedTenantId}
                onChange={e => setSelectedTenantId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {tenants.map(t => {
                  const lease = leases.find(l => l.Tenant_ID === t.Tenant_ID);
                  const prop = properties.find(p => p.Property_ID === lease?.Property_ID);
                  return (
                    <option key={t.Tenant_ID} value={t.Tenant_ID}>
                      {t.Full_Name} {prop ? `(${prop.Property_Name})` : ''}
                    </option>
                  );
                })}
              </select>
              {tenantProperty && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  {tenantProperty.Property_Name} • {tenantUnit?.Unit_Number_Name || 'Standard Unit'}
                </p>
              )}
            </div>
          </div>

          {/* Payment Receipt Details */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Bank Receipt Information
              </span>
              <span className="text-xs text-slate-600">
                Total Outstanding: <span className="font-bold text-rose-600">${totalOutstanding.toLocaleString()}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Amount Received ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Interac e-Transfer">Interac e-Transfer</option>
                  <option value="EFT Direct Deposit">EFT Direct Deposit</option>
                  <option value="Bank Wire">Bank Wire</option>
                  <option value="Certified Cheque">Certified Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Reference / Bank Ref
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. ET-8921"
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Allocation Matrix Header & Quick Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Split className="w-4 h-4 text-emerald-600" />
                  Allocate Funds to Specific Pendings
                </h3>
                <p className="text-xs text-slate-500">
                  Select which items this deposit covers. Tenants often pay LMR or Security Deposit first.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoAllocate}
                  className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Allocate
                </button>
                <button
                  type="button"
                  onClick={handleAllocateOnlyLMR}
                  className="px-2.5 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-lg transition-colors"
                >
                  Pay LMR First
                </button>
                <button
                  type="button"
                  onClick={handleAllocateOnlyDeposit}
                  className="px-2.5 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold rounded-lg transition-colors"
                >
                  Pay Deposit First
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Pending Items Table / Card List */}
            {pendingItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Pending Receivables Found</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  This tenant has zero unpaid rent, LMR, or deposit balance. Any payment will be recorded as unearned excess.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {pendingItems.map(item => {
                  const allocated = allocationAmounts[item.id] || 0;
                  const isFullyCovered = allocated >= item.currentBalance;

                  return (
                    <div key={item.id} className="p-3.5 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'LMR' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Last Month Rent (LMR)
                            </span>
                          )}
                          {item.type === 'Security Deposit' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                              Security / Key Deposit
                            </span>
                          )}
                          {item.type === 'Rent' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                              Rent Billing
                            </span>
                          )}
                          {item.type === 'Utility' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              Utility Split
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.description}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Original Due: <strong>${item.originalDue.toLocaleString()}</strong></span>
                          <span>Unpaid Balance: <strong className="text-rose-600">${item.currentBalance.toLocaleString()}</strong></span>
                        </div>
                      </div>

                      {/* Allocation Input */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">$</span>
                          <input
                            type="number"
                            min="0"
                            max={item.currentBalance}
                            step="any"
                            value={allocated || ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setAllocationAmounts(prev => ({
                                ...prev,
                                [item.id]: Math.min(item.currentBalance, val)
                              }));
                            }}
                            className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm font-bold focus:outline-none ${
                              isFullyCovered
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : allocated > 0
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                            placeholder="0.00"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePayFullItem(item.id, item.currentBalance)}
                          className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          Full
                        </button>
                        {allocated > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Clear"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Summary Bar */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Bank Received</p>
                <p className="text-base font-bold text-emerald-400">${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Allocated</p>
                <p className="text-base font-bold text-white">${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">
                  {difference >= 0 ? 'Unallocated / Excess' : 'Over-Allocated'}
                </p>
                <p className={`text-base font-bold ${difference < 0 ? 'text-rose-400' : difference > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  ${Math.abs(difference).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {difference > 0 && (
              <span className="text-[11px] text-amber-300 font-medium">
                Excess ${difference.toFixed(2)} recorded to Unearned Revenue (GL 2300).
              </span>
            )}
            {difference < 0 && (
              <span className="text-[11px] text-rose-300 font-medium">
                Allocated exceeds bank receipt! Please adjust.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Internal Notes / Memo (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Move-in payment received via Interac. Paid LMR first as agreed."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || paymentAmount <= 0 || difference < 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post Bank Receipt & Allocations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
