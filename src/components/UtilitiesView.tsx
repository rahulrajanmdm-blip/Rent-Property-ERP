import React, { useState, useMemo } from 'react';
import {
  Zap, Plus, Split, CheckCircle2, DollarSign, Building,
  Calendar, ArrowRight, FileText, Edit3, Trash2, X, ShieldAlert,
  ShieldCheck, HelpCircle, Layers, Settings2, UserMinus, UserCheck,
  Percent, ArrowDownRight, Sparkles, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import {
  User, UtilityType, MasterUtilityBill, UtilitySplit,
  UtilityCatalogItem, Property, Tenant, Unit
} from '../types/erp';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface UtilitiesViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({ currentUser, onToast }) => {
  const masterBills = storage.getMasterUtilityBills();
  const splits = storage.getUtilitySplits();
  const properties = storage.getProperties();
  const tenants = storage.getTenants();
  const units = storage.getUnits();
  const leases = storage.getLeases();
  const depositTxns = storage.getDepositTransactions();
  const utilityCatalog = storage.getUtilityCatalog();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'SPLITS' | 'CATALOG' | 'DIVISIONS'>('SPLITS');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProperty, setFilterProperty] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Master Bill Creation & Edit Modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<MasterUtilityBill | null>(null);
  const [deletingBill, setDeletingBill] = useState<MasterUtilityBill | null>(null);

  // Split Edit & Delete State
  const [editingSplit, setEditingSplit] = useState<UtilitySplit | null>(null);
  const [deletingSplit, setDeletingSplit] = useState<UtilitySplit | null>(null);

  // Security Deposit Offset Action Modal
  const [offsetSplitTarget, setOffsetSplitTarget] = useState<UtilitySplit | null>(null);

  // Catalog Item Creation & Edit Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<UtilityCatalogItem | null>(null);
  const [deletingCatalogItem, setDeletingCatalogItem] = useState<UtilityCatalogItem | null>(null);

  // Catalog Form State
  const [catalogForm, setCatalogForm] = useState<{
    Utility_Name: string;
    Category: UtilityCatalogItem['Category'];
    Default_Vendor: string;
    Default_GL_Account: string;
    Description: string;
    Is_Active: boolean;
  }>({
    Utility_Name: '',
    Category: 'Electricity',
    Default_Vendor: '',
    Default_GL_Account: '5010',
    Description: '',
    Is_Active: true
  });

  // Bill & Manual Split Form State
  const [splitMode, setSplitMode] = useState<'MANUAL' | 'EQUAL' | 'SQFT'>('MANUAL');
  const [billForm, setBillForm] = useState<{
    propertyId: string;
    includeConnectedDivisions: boolean;
    utilityType: string;
    provider: string;
    billPeriod: string;
    amount: number;
    billReference: string;
    notes: string;
    includePastTenants: boolean;
  }>({
    propertyId: properties[0]?.Property_ID || '',
    includeConnectedDivisions: true,
    utilityType: utilityCatalog[0]?.Utility_Name || 'Hydro / Electricity',
    provider: utilityCatalog[0]?.Default_Vendor || 'Toronto Hydro',
    billPeriod: new Date().toISOString().slice(0, 7),
    amount: 450,
    billReference: `INV-${Date.now().toString().slice(-6)}`,
    notes: '',
    includePastTenants: true
  });

  // Dynamic list of tenant split rows for the bill creator modal
  interface FormSplitRow {
    propertyId: string;
    propertyName: string;
    unitId: string;
    unitName: string;
    tenantId: string;
    tenantName: string;
    isPastTenant: boolean;
    allocatedAmount: number;
    percentageShare: number;
    offsetFromDeposit: boolean;
    availableDeposit: number;
    notes: string;
    selected: boolean;
  }

  const [formSplits, setFormSplits] = useState<FormSplitRow[]>([]);

  // Split Edit Form (for single split modal)
  const [splitForm, setSplitForm] = useState<{
    allocatedAmount: number;
    amountPaid: number;
    status: UtilitySplit['Status'];
    notes: string;
  }>({
    allocatedAmount: 150,
    amountPaid: 0,
    status: 'Unpaid',
    notes: ''
  });

  const propertyName = (id: string) => properties.find(p => p.Property_ID === id)?.Property_Name || id;
  const tenantName = (id: string) => tenants.find(t => t.Tenant_ID === id)?.Full_Name || id;

  // Calculate available security deposit for a tenant
  const getTenantDepositBalance = (tenantId: string): number => {
    const txns = depositTxns.filter(d => d.Tenant_ID === tenantId && (d.Status === 'Received' || d.Status === 'Refunded'));
    const paid = txns.reduce((sum, d) => sum + (d.Paid_Amount || 0), 0);
    const refundedOrOffset = txns.reduce((sum, d) => sum + (d.Refund_Amount || 0), 0);
    return Math.max(0, paid - refundedOrOffset);
  };

  // Helper to get connected properties (e.g. if property is divided into Main Floor and Basement)
  const getConnectedPropertyIds = (propId: string, includeDivisions: boolean): string[] => {
    if (!includeDivisions) return [propId];
    const target = properties.find(p => p.Property_ID === propId);
    if (!target) return [propId];

    const connected = new Set<string>([propId]);

    // If target is a parent building, include all children
    if (target.Division_Type === 'Parent_Building') {
      properties.filter(p => p.Parent_Property_ID === propId).forEach(p => connected.add(p.Property_ID));
    }
    // If target has a parent, include parent and siblings (like Main Floor + Basement)
    if (target.Parent_Property_ID) {
      connected.add(target.Parent_Property_ID);
      properties.filter(p => p.Parent_Property_ID === target.Parent_Property_ID).forEach(p => connected.add(p.Property_ID));
    }

    return Array.from(connected);
  };

  // Populate formSplits when property, divisions, or past tenants toggle changes
  const refreshFormSplits = (
    propId: string,
    includeDivisions: boolean,
    includePast: boolean,
    totalBillAmt: number
  ) => {
    const targetPropIds = getConnectedPropertyIds(propId, includeDivisions);
    const rows: FormSplitRow[] = [];

    targetPropIds.forEach(pId => {
      const prop = properties.find(p => p.Property_ID === pId);
      const propUnits = units.filter(u => u.Property_ID === pId);

      propUnits.forEach(u => {
        // Active Leases
        const activeLease = leases.find(l => l.Unit_ID === u.Unit_ID && l.Status === 'Active');
        if (activeLease) {
          const t = tenants.find(ten => ten.Tenant_ID === activeLease.Tenant_ID);
          const depBal = getTenantDepositBalance(activeLease.Tenant_ID);
          rows.push({
            propertyId: pId,
            propertyName: prop?.Property_Name || pId,
            unitId: u.Unit_ID,
            unitName: u.Unit_Number_Name || u.Unit_ID,
            tenantId: activeLease.Tenant_ID,
            tenantName: t?.Full_Name || activeLease.Tenant_ID,
            isPastTenant: false,
            allocatedAmount: 0,
            percentageShare: 0,
            offsetFromDeposit: false,
            availableDeposit: depBal,
            notes: '',
            selected: true
          });
        }

        // Past Tenants (Vacated or Moved-Out)
        if (includePast) {
          const pastLeases = leases.filter(l => l.Unit_ID === u.Unit_ID && l.Status === 'Ended');
          pastLeases.forEach(pl => {
            const t = tenants.find(ten => ten.Tenant_ID === pl.Tenant_ID);
            const depBal = getTenantDepositBalance(pl.Tenant_ID);
            rows.push({
              propertyId: pId,
              propertyName: prop?.Property_Name || pId,
              unitId: u.Unit_ID,
              unitName: u.Unit_Number_Name || u.Unit_ID,
              tenantId: pl.Tenant_ID,
              tenantName: (t?.Full_Name || pl.Tenant_ID) + ' (Moved Out)',
              isPastTenant: true,
              allocatedAmount: 0,
              percentageShare: 0,
              offsetFromDeposit: depBal > 0, // Auto-select deposit offset if deposit available
              availableDeposit: depBal,
              notes: 'Delayed post-move-out utility billing',
              selected: false // Past tenants unselected by default unless enabled by user
            });
          });
        }
      });
    });

    // Also check for orphaned past tenants tagged with this property
    if (includePast) {
      targetPropIds.forEach(pId => {
        const prop = properties.find(p => p.Property_ID === pId);
        const pastTenantsForProp = tenants.filter(t => t.Status === 'Inactive' && t.Current_Property_ID === pId);
        pastTenantsForProp.forEach(pt => {
          if (!rows.some(r => r.tenantId === pt.Tenant_ID)) {
            const depBal = getTenantDepositBalance(pt.Tenant_ID);
            rows.push({
              propertyId: pId,
              propertyName: prop?.Property_Name || pId,
              unitId: pt.Current_Unit_ID || 'Vacated Unit',
              unitName: pt.Current_Unit_ID || 'Vacated Suite',
              tenantId: pt.Tenant_ID,
              tenantName: pt.Full_Name + ' (Past Tenant)',
              isPastTenant: true,
              allocatedAmount: 0,
              percentageShare: 0,
              offsetFromDeposit: depBal > 0,
              availableDeposit: depBal,
              notes: 'Late utility bill received after tenant move-out',
              selected: false
            });
          }
        });
      });
    }

    // Auto-distribute evenly across selected active rows
    const selectedRows = rows.filter(r => r.selected);
    if (selectedRows.length > 0) {
      const share = Number((totalBillAmt / selectedRows.length).toFixed(2));
      const pct = Number((100 / selectedRows.length).toFixed(1));
      rows.forEach(r => {
        if (r.selected) {
          r.allocatedAmount = share;
          r.percentageShare = pct;
        }
      });
    }

    setFormSplits(rows);
  };

  // Open Add Bill Modal
  const handleOpenAddBill = () => {
    setEditingBill(null);
    const initialPropId = properties[0]?.Property_ID || '';
    const initialUtil = utilityCatalog[0];
    const initAmt = 450;

    setBillForm({
      propertyId: initialPropId,
      includeConnectedDivisions: true,
      utilityType: initialUtil?.Utility_Name || 'Hydro / Electricity',
      provider: initialUtil?.Default_Vendor || 'Toronto Hydro',
      billPeriod: new Date().toISOString().slice(0, 7),
      amount: initAmt,
      billReference: `INV-${Date.now().toString().slice(-6)}`,
      notes: '',
      includePastTenants: true
    });

    setSplitMode('MANUAL');
    refreshFormSplits(initialPropId, true, true, initAmt);
    setShowBillModal(true);
  };

  // Distribute Splits Evenly
  const handleDistributeEvenly = () => {
    const selected = formSplits.filter(r => r.selected);
    if (selected.length === 0) return;
    const share = Number((billForm.amount / selected.length).toFixed(2));
    const pct = Number((100 / selected.length).toFixed(1));

    const updated = formSplits.map(r => {
      if (r.selected) {
        return { ...r, allocatedAmount: share, percentageShare: pct };
      }
      return { ...r, allocatedAmount: 0, percentageShare: 0 };
    });
    setFormSplits(updated);
  };

  // Auto-calculate remaining balance into a specific row
  const handleFillRemaining = (index: number) => {
    const totalAllocatedOther = formSplits
      .filter((_, idx) => idx !== index && formSplits[idx].selected)
      .reduce((sum, r) => sum + Number(r.allocatedAmount || 0), 0);
    const rem = Math.max(0, Number((billForm.amount - totalAllocatedOther).toFixed(2)));
    const pct = billForm.amount > 0 ? Number(((rem / billForm.amount) * 100).toFixed(1)) : 0;

    const updated = [...formSplits];
    updated[index] = {
      ...updated[index],
      selected: true,
      allocatedAmount: rem,
      percentageShare: pct
    };
    setFormSplits(updated);
  };

  // Update allocation amount and reciprocal percentage
  const handleUpdateSplitAmount = (index: number, newAmt: number) => {
    const pct = billForm.amount > 0 ? Number(((newAmt / billForm.amount) * 100).toFixed(1)) : 0;
    const updated = [...formSplits];
    updated[index] = {
      ...updated[index],
      allocatedAmount: newAmt,
      percentageShare: pct,
      selected: newAmt > 0 ? true : updated[index].selected
    };
    setFormSplits(updated);
  };

  // Update percentage and reciprocal dollar amount
  const handleUpdateSplitPct = (index: number, newPct: number) => {
    const amt = Number(((newPct / 100) * billForm.amount).toFixed(2));
    const updated = [...formSplits];
    updated[index] = {
      ...updated[index],
      percentageShare: newPct,
      allocatedAmount: amt,
      selected: newPct > 0 ? true : updated[index].selected
    };
    setFormSplits(updated);
  };

  // Handle Create / Post Master Bill & Manual Splits
  const handleCreateBillAndSplit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSplits = formSplits.filter(r => r.selected && r.allocatedAmount > 0);
      if (selectedSplits.length === 0) {
        throw new Error('Please select at least one unit/tenant with an allocated split amount.');
      }

      const totalSplitAmt = Number(selectedSplits.reduce((sum, r) => sum + r.allocatedAmount, 0).toFixed(2));
      const billTotal = Number(Number(billForm.amount).toFixed(2));

      if (Math.abs(totalSplitAmt - billTotal) > 0.05) {
        throw new Error(`Total split amounts ($${totalSplitAmt.toFixed(2)}) must equal the master bill amount ($${billTotal.toFixed(2)}). Difference: $${(billTotal - totalSplitAmt).toFixed(2)}`);
      }

      // Check if property has parent
      const prop = properties.find(p => p.Property_ID === billForm.propertyId);

      const res = AccountingEngine.createManualUtilityBillAndSplits(
        billForm.propertyId,
        billForm.utilityType,
        billForm.provider,
        billForm.billPeriod,
        billTotal,
        billForm.billReference,
        selectedSplits.map(s => ({
          propertyId: s.propertyId,
          unitId: s.unitId,
          tenantId: s.tenantId,
          allocatedAmount: s.allocatedAmount,
          percentageShare: s.percentageShare,
          isPastTenant: s.isPastTenant,
          offsetFromDeposit: s.offsetFromDeposit,
          notes: s.notes
        })),
        billForm.notes,
        prop?.Parent_Property_ID,
        currentUser.Email
      );

      const offsetCount = selectedSplits.filter(s => s.offsetFromDeposit).length;
      const offsetMsg = offsetCount > 0 ? ` (${offsetCount} split(s) automatically set-off against security deposit)` : '';

      onToast(`Master bill ${res.masterBillId} created and manually apportioned across ${res.splitCount} units!${offsetMsg}`, 'success');
      setShowBillModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to allocate utilities', 'error');
    }
  };

  // Security Deposit Offset Handler for existing unpaid splits
  const handleExecuteDepositOffset = () => {
    if (!offsetSplitTarget) return;
    try {
      const res = AccountingEngine.offsetUtilitySplitFromDeposit(offsetSplitTarget.Split_ID, currentUser.Email);
      onToast(res.message, 'success');
      setOffsetSplitTarget(null);
    } catch (err: any) {
      onToast(err.message || 'Failed to apply security deposit offset', 'error');
    }
  };

  // Catalog Item Handlers
  const handleOpenAddCatalog = () => {
    setEditingCatalogItem(null);
    setCatalogForm({
      Utility_Name: '',
      Category: 'Electricity',
      Default_Vendor: '',
      Default_GL_Account: '5010',
      Description: '',
      Is_Active: true
    });
    setShowCatalogModal(true);
  };

  const handleOpenEditCatalog = (item: UtilityCatalogItem) => {
    setEditingCatalogItem(item);
    setCatalogForm({
      Utility_Name: item.Utility_Name,
      Category: item.Category,
      Default_Vendor: item.Default_Vendor || '',
      Default_GL_Account: item.Default_GL_Account || '5010',
      Description: item.Description || '',
      Is_Active: item.Is_Active ?? true
    });
    setShowCatalogModal(true);
  };

  const handleSaveCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCatalogItem) {
        const updated: UtilityCatalogItem = {
          ...editingCatalogItem,
          Utility_Name: catalogForm.Utility_Name,
          Category: catalogForm.Category,
          Default_Vendor: catalogForm.Default_Vendor,
          Default_GL_Account: catalogForm.Default_GL_Account,
          Description: catalogForm.Description,
          Is_Active: catalogForm.Is_Active
        };
        storage.updateUtilityCatalogItem(updated, currentUser.Email);
        onToast(`Utility type "${updated.Utility_Name}" updated!`, 'success');
      } else {
        const newId = 'UTL-' + Date.now().toString(36).toUpperCase();
        const newItem: UtilityCatalogItem = {
          Utility_ID: newId,
          Utility_Name: catalogForm.Utility_Name,
          Category: catalogForm.Category,
          Default_Vendor: catalogForm.Default_Vendor,
          Default_GL_Account: catalogForm.Default_GL_Account,
          Description: catalogForm.Description,
          Is_Active: catalogForm.Is_Active,
          Created_At: new Date().toISOString().slice(0, 10)
        };
        storage.addUtilityCatalogItem(newItem, currentUser.Email);
        onToast(`New utility type "${newItem.Utility_Name}" created!`, 'success');
      }
      setShowCatalogModal(false);
    } catch (err: any) {
      onToast(err.message || 'Failed to save utility catalog item', 'error');
    }
  };

  const handleDeleteCatalogConfirm = () => {
    if (!deletingCatalogItem) return;
    storage.deleteUtilityCatalogItem(deletingCatalogItem.Utility_ID, currentUser.Email);
    onToast(`Utility type "${deletingCatalogItem.Utility_Name}" deleted`, 'info');
    setDeletingCatalogItem(null);
  };

  // Filtered Master Bills and Splits
  const filteredMasterBills = useMemo(() => {
    return masterBills.filter(b => {
      const matchProp = filterProperty === 'ALL' || b.Property_ID === filterProperty;
      const matchSearch = searchQuery === '' ||
        (b.Utility_Type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.Provider_Name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.Utility_Bill_ID || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchProp && matchSearch;
    });
  }, [masterBills, filterProperty, searchQuery]);

  const filteredSplits = useMemo(() => {
    return splits.filter(s => {
      const matchProp = filterProperty === 'ALL' || s.Property_ID === filterProperty;
      const matchStatus = filterStatus === 'ALL' || s.Status === filterStatus;
      const matchSearch = searchQuery === '' ||
        s.Split_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.Utility_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenantName(s.Tenant_ID).toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.Unit_ID.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProp && matchStatus && matchSearch;
    });
  }, [splits, filterProperty, filterStatus, searchQuery]);

  // Sum calculations for split modal validation
  const currentTotalSplitAllocated = formSplits
    .filter(r => r.selected)
    .reduce((sum, r) => sum + Number(r.allocatedAmount || 0), 0);
  const splitDifference = Number((billForm.amount - currentTotalSplitAllocated).toFixed(2));
  const isSplitBalanced = Math.abs(splitDifference) <= 0.05;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Canadian Utility Master Billing & Manual Split Engine
              </h2>
              <p className="text-xs text-slate-500">
                Manual custom splits, divided properties (Main Floor vs Basement), multi-property bills, past tenant allocations & deposit set-offs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CATALOG' ? (
            <button
              onClick={handleOpenAddCatalog}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Utility Type
            </button>
          ) : (
            <button
              onClick={handleOpenAddBill}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Master Bill & Manual Split
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl border">
        <button
          onClick={() => setActiveTab('SPLITS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'SPLITS'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Split className="w-4 h-4" />
          Master Invoices & Tenant Splits ({splits.length})
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'CATALOG'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          Utility Types & Catalog ({utilityCatalog.length})
        </button>

        <button
          onClick={() => setActiveTab('DIVISIONS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'DIVISIONS'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Property Divisions & Meter Grouping
        </button>
      </div>

      {/* TAB 1: MASTER BILLS & TENANT SPLITS */}
      {activeTab === 'SPLITS' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search utility, tenant, split ID..."
                className="px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-600 w-full sm:w-60"
              />
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-600 bg-white"
              >
                <option value="ALL">All Properties & Divisions</option>
                {properties.map(p => (
                  <option key={p.Property_ID} value={p.Property_ID}>
                    {p.Property_Name} {p.Division_Type && p.Division_Type !== 'None' ? `[${p.Division_Type}]` : ''}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-indigo-600 bg-white"
              >
                <option value="ALL">All Split Statuses</option>
                <option value="Unpaid">Unpaid / Arrears</option>
                <option value="Paid">Paid / Settled</option>
              </select>
            </div>
            <div className="text-slate-500 font-semibold text-[11px] self-end sm:self-auto">
              Showing {filteredSplits.length} of {splits.length} tenant split allocations
            </div>
          </div>

          {/* Grid Layout: Master Bills List + Tenant Split Receivables Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Bills Card List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Master Vendor Invoices ({filteredMasterBills.length})
                  </h3>
                  <p className="text-[10px] text-slate-500">Single property or divided property meters</p>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                  GL 5010 / 1110
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredMasterBills.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No master utility invoices found matching your filters.
                  </div>
                ) : (
                  filteredMasterBills.map(b => {
                    const prop = properties.find(p => p.Property_ID === b.Property_ID);
                    const billSplits = splits.filter(s => s.Utility_Bill_ID === b.Utility_Bill_ID);
                    const paidSplits = billSplits.filter(s => s.Status === 'Paid');

                    return (
                      <div key={b.Utility_Bill_ID} className="p-4 space-y-2 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-indigo-600" />
                            {b.Utility_Type || b.Utility_ID}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-700">
                            {AccountingEngine.formatCurrency(b.Total_Amount || b.Master_Amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="font-semibold">{propertyName(b.Property_ID)}</span>
                          <span className="text-[11px] font-mono text-slate-500">{b.Bill_Period || b.Bill_Date}</span>
                        </div>

                        {prop?.Division_Type && prop.Division_Type !== 'None' && (
                          <div className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Divided Property: {prop.Division_Type}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                          <span>Vendor: {b.Provider_Name || b.Vendor}</span>
                          <span className="font-semibold text-slate-600">
                            {paidSplits.length}/{billSplits.length} Splits Paid
                          </span>
                        </div>

                        {b.Notes && (
                          <div className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                            {b.Notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Individual Tenant Splits Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Tenant Utility Split Receivables & Sub-Ledger
                  </h3>
                  <p className="text-[10px] text-slate-500">Custom manual allocations, past tenant charges & deposit offsets</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Deposit Offset Ready
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3">Split ID</th>
                      <th className="py-3 px-3">Utility</th>
                      <th className="py-3 px-3">Tenant & Property</th>
                      <th className="py-3 px-3 text-right">Share</th>
                      <th className="py-3 px-3 text-right">Allocated ($)</th>
                      <th className="py-3 px-3">Status / Method</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSplits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No utility splits recorded yet. Click "Record Master Bill & Manual Split" to apportion utility charges.
                        </td>
                      </tr>
                    ) : (
                      filteredSplits.map(s => {
                        const isPaid = s.Status === 'Paid' || (s.Balance !== undefined && s.Balance <= 0);
                        const depBal = getTenantDepositBalance(s.Tenant_ID);

                        return (
                          <tr key={s.Split_ID} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                              {s.Split_ID}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900">
                              {s.Utility_Name}
                            </td>
                            <td className="py-3 px-3 text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{tenantName(s.Tenant_ID)}</span>
                                {s.Is_Past_Tenant && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                    <UserMinus className="w-2.5 h-2.5" />
                                    Past Tenant
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <span>{propertyName(s.Property_ID)}</span>
                                <span>·</span>
                                <span className="font-semibold text-slate-700">{s.Unit_ID}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {s.Percentage_Share ? `${s.Percentage_Share}%` : 'Manual'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {AccountingEngine.formatCurrency(s.Allocated_Amount)}
                            </td>
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                                {s.Payment_Method === 'Security Deposit Offset' && (
                                  <div className="text-[10px] text-indigo-700 font-semibold flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                    Deposit Offset
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isPaid && (
                                  <button
                                    onClick={() => setOffsetSplitTarget(s)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                                    title={`Set-off against held security deposit (Avail: $${depBal.toFixed(2)})`}
                                  >
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Offset Deposit</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingSplit(s);
                                    setSplitForm({
                                      allocatedAmount: s.Allocated_Amount,
                                      amountPaid: s.Amount_Paid || 0,
                                      status: s.Status,
                                      notes: s.Notes || ''
                                    });
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                  title="Edit Split"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingSplit(s)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Delete Split"
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
          </div>
        </div>
      )}

      {/* TAB 2: UTILITY TYPES & CATALOG */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilityCatalog.map(item => (
              <div
                key={item.Utility_ID}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.Is_Active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.Is_Active ? 'Active Service' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleOpenEditCatalog(item)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit Utility Type"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCatalogItem(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Utility Type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.Utility_Name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.Description || 'Standard recurring Canadian property utility service'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Category:</span>
                      <span className="font-semibold text-slate-900">{item.Category}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Default Vendor:</span>
                      <span className="font-semibold text-slate-900">{item.Default_Vendor || '—'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GL Account Code:</span>
                      <span className="font-mono font-bold text-indigo-700">{item.Default_GL_Account || '5010'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ID: {item.Utility_ID}</span>
                  <button
                    onClick={() => handleOpenEditCatalog(item)}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROPERTY DIVISIONS & METER GROUPING */}
      {activeTab === 'DIVISIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Divided Property Single-Bill Meter Apportionment (Main Floor & Basement Suites)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  In Canada, many detached properties (e.g. single triplex or house) have a single shared utility meter (Toronto Hydro, Enbridge Gas, City Water) that must be split between Main Floor and Basement suites with customized split ratios (e.g. 60% / 40%).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {properties
                .filter(p => p.Division_Type && p.Division_Type !== 'None')
                .map(p => {
                  const parent = properties.find(par => par.Property_ID === p.Parent_Property_ID);
                  const propUnits = units.filter(u => u.Property_ID === p.Property_ID);

                  return (
                    <div key={p.Property_ID} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.Property_Name}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {p.Division_Type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><b>Address:</b> {p.Address}, {p.City}</p>
                        {parent && (
                          <p><b>Master Parent Building:</b> {parent.Property_Name}</p>
                        )}
                        <p><b>Units in Division:</b> {propUnits.length} units ({propUnits.map(u => u.Unit_Number_Name || u.Unit_ID).join(', ')})</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* RECORD MASTER UTILITY BILL & MANUAL SPLIT MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/40 rounded-xl text-indigo-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Record Master Utility Bill & Manual Custom Apportionment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Split across properties, divided suites (Main Floor/Basement), or set-off past tenant arrears from security deposits
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateBillAndSplit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Section 1: Master Invoice Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  1. Master Invoice Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Property / Building</label>
                    <select
                      value={billForm.propertyId}
                      onChange={(e) => {
                        const newPropId = e.target.value;
                        setBillForm({ ...billForm, propertyId: newPropId });
                        refreshFormSplits(newPropId, billForm.includeConnectedDivisions, billForm.includePastTenants, billForm.amount);
                      }}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white font-medium"
                      required
                    >
                      {properties.map(p => (
                        <option key={p.Property_ID} value={p.Property_ID}>
                          {p.Property_Name} ({p.City}) {p.Division_Type && p.Division_Type !== 'None' ? `[${p.Division_Type}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Utility Service Type</label>
                    <select
                      value={billForm.utilityType}
                      onChange={(e) => {
                        const ut = utilityCatalog.find(u => u.Utility_Name === e.target.value);
                        setBillForm({
                          ...billForm,
                          utilityType: e.target.value,
                          provider: ut?.Default_Vendor || billForm.provider
                        });
                      }}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white font-medium"
                    >
                      {utilityCatalog.map(u => (
                        <option key={u.Utility_ID} value={u.Utility_Name}>{u.Utility_Name} ({u.Category})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Utility Provider / Vendor</label>
                    <input
                      type="text"
                      required
                      value={billForm.provider}
                      onChange={(e) => setBillForm({ ...billForm, provider: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Billing Period (Month)</label>
                    <input
                      type="month"
                      required
                      value={billForm.billPeriod}
                      onChange={(e) => setBillForm({ ...billForm, billPeriod: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Total Bill Amount ($ CAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={billForm.amount}
                      onChange={(e) => {
                        const newAmt = Number(e.target.value);
                        setBillForm({ ...billForm, amount: newAmt });
                      }}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white font-bold text-indigo-700 text-sm"
                    />
                  </div>
                </div>

                {/* Divided Property Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billForm.includeConnectedDivisions}
                      onChange={(e) => {
                        const inc = e.target.checked;
                        setBillForm({ ...billForm, includeConnectedDivisions: inc });
                        refreshFormSplits(billForm.propertyId, inc, billForm.includePastTenants, billForm.amount);
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800">
                      Include Connected Divided Units (e.g. Main Floor + Basement)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billForm.includePastTenants}
                      onChange={(e) => {
                        const incPast = e.target.checked;
                        setBillForm({ ...billForm, includePastTenants: incPast });
                        refreshFormSplits(billForm.propertyId, billForm.includeConnectedDivisions, incPast, billForm.amount);
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      <UserMinus className="w-3.5 h-3.5 text-amber-600" />
                      Show Past / Moved-Out Tenants (For Deposit Set-Off)
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 2: Manual Split Distribution Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5 text-indigo-600" />
                      2. Custom Tenant Split Allocation
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Specify exact dollar amounts or percentage shares for each active or past tenant suite
                    </p>
                  </div>

                  {/* Distribution Action Helpers */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleDistributeEvenly}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Distribute Evenly
                    </button>
                  </div>
                </div>

                {/* Splits Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3 w-8">Include</th>
                        <th className="py-2.5 px-3">Unit / Division</th>
                        <th className="py-2.5 px-3">Tenant Name</th>
                        <th className="py-2.5 px-3 text-right w-24">Share (%)</th>
                        <th className="py-2.5 px-3 text-right w-32">Allocated ($)</th>
                        <th className="py-2.5 px-3 w-48">Deposit Offset</th>
                        <th className="py-2.5 px-2 text-right w-16">Auto-fill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formSplits.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No active or past tenants found for selected properties.
                          </td>
                        </tr>
                      ) : (
                        formSplits.map((row, idx) => (
                          <tr key={`${row.tenantId}-${row.unitId}-${idx}`} className={`transition-colors ${row.selected ? 'bg-indigo-50/20' : 'opacity-60 bg-slate-50/50'}`}>
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={(e) => {
                                  const sel = e.target.checked;
                                  const updated = [...formSplits];
                                  updated[idx] = { ...updated[idx], selected: sel };
                                  setFormSplits(updated);
                                }}
                                className="rounded text-indigo-600"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              <div>{row.unitName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{row.propertyName}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1 font-bold text-slate-900">
                                <span>{row.tenantName}</span>
                              </div>
                              {row.isPastTenant && (
                                <div className="text-[10px] text-amber-700 font-medium">
                                  Moved-Out Tenant
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  disabled={!row.selected}
                                  value={row.percentageShare}
                                  onChange={(e) => handleUpdateSplitPct(idx, Number(e.target.value))}
                                  className="w-20 text-right text-xs rounded-lg border border-slate-200 p-1.5 outline-none focus:border-indigo-600 bg-white font-mono"
                                />
                                <span className="absolute right-2 top-2 text-slate-400 text-[10px]">%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-slate-400 text-[10px]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  disabled={!row.selected}
                                  value={row.allocatedAmount}
                                  onChange={(e) => handleUpdateSplitAmount(idx, Number(e.target.value))}
                                  className="w-28 text-right text-xs rounded-lg border border-slate-200 p-1.5 pl-5 outline-none focus:border-indigo-600 bg-white font-mono font-bold text-slate-900"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!row.selected || row.availableDeposit <= 0}
                                  checked={row.offsetFromDeposit}
                                  onChange={(e) => {
                                    const updated = [...formSplits];
                                    updated[idx] = { ...updated[idx], offsetFromDeposit: e.target.checked };
                                    setFormSplits(updated);
                                  }}
                                  className="rounded text-emerald-600"
                                />
                                <span className="text-[11px] text-slate-700">
                                  Offset from Deposit <span className="text-[10px] font-mono text-emerald-700 font-bold">(${row.availableDeposit.toFixed(2)})</span>
                                </span>
                              </label>
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleFillRemaining(idx)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded"
                                title="Auto-fill remainder balance"
                              >
                                Balance
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Split Balance Summary Card */}
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isSplitBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center gap-2">
                    {isSplitBalanced ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-xs">
                        {isSplitBalanced ? 'Splits are 100% Balanced with Master Invoice' : 'Splits Must Equal Master Invoice Amount'}
                      </div>
                      <div className="text-[11px] opacity-80">
                        Allocated: <b>${currentTotalSplitAllocated.toFixed(2)}</b> / Master Total: <b>${billForm.amount.toFixed(2)}</b>
                      </div>
                    </div>
                  </div>

                  {!isSplitBalanced && (
                    <div className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded border border-rose-200 text-rose-700">
                      Difference: ${splitDifference.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isSplitBalanced}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                    isSplitBalanced
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Post Master Bill & Apportion Splits</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY DEPOSIT OFFSET CONFIRMATION MODAL */}
      {offsetSplitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Set-Off Utility from Security Deposit</h3>
                <p className="text-xs text-slate-500">Double-entry deduction against held deposit liability</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Tenant:</span>
                <span className="font-bold text-slate-900">{tenantName(offsetSplitTarget.Tenant_ID)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Utility Split:</span>
                <span className="font-semibold text-slate-900">{offsetSplitTarget.Utility_Name} ({offsetSplitTarget.Split_ID})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unpaid Split Balance:</span>
                <span className="font-mono font-bold text-rose-700">${(offsetSplitTarget.Balance || offsetSplitTarget.Allocated_Amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Available Security Deposit:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${getTenantDepositBalance(offsetSplitTarget.Tenant_ID).toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-normal">
              Executing this will debit <b>GL 2200 (Tenant Deposits Held)</b> and credit <b>GL 1110 (AR Utilities)</b> for <b>${(offsetSplitTarget.Balance || offsetSplitTarget.Allocated_Amount).toFixed(2)}</b>, settling this utility charge in full.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOffsetSplitTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDepositOffset}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Deposit Offset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT UTILITY CATALOG ITEM MODAL */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingCatalogItem ? `Edit Utility Type: ${editingCatalogItem.Utility_Name}` : 'Add New Utility Service Type'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure catalog metadata, GL account, and default vendor</p>
                </div>
              </div>
              <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCatalogItem} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Utility Service Name</label>
                <input
                  type="text"
                  required
                  value={catalogForm.Utility_Name}
                  onChange={(e) => setCatalogForm({ ...catalogForm, Utility_Name: e.target.value })}
                  placeholder="e.g. Solar Power Grid Surcharge, District Steam Heating"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={catalogForm.Category}
                    onChange={(e) => setCatalogForm({ ...catalogForm, Category: e.target.value as any })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Electricity">Electricity / Hydro</option>
                    <option value="Natural Gas">Natural Gas / Pipeline</option>
                    <option value="Water & Sewage">Water & Municipal Sewage</option>
                    <option value="Internet & Telecom">Internet & Telecom</option>
                    <option value="Waste Management">Waste & Recycling</option>
                    <option value="Heating Oil">Heating Oil & Bulk Fuel</option>
                    <option value="Custom">Custom Utility Service</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GL Account Code</label>
                  <select
                    value={catalogForm.Default_GL_Account}
                    onChange={(e) => setCatalogForm({ ...catalogForm, Default_GL_Account: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white font-mono"
                  >
                    <option value="5010">5010 — Utilities Expense</option>
                    <option value="5020">5020 — Property Maintenance</option>
                    <option value="5200">5200 — Communications & Internet</option>
                    <option value="5000">5000 — Master Lease Cost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Default Vendor / Utility Company</label>
                <input
                  type="text"
                  value={catalogForm.Default_Vendor}
                  onChange={(e) => setCatalogForm({ ...catalogForm, Default_Vendor: e.target.value })}
                  placeholder="e.g. Toronto Hydro, Enbridge, Rogers"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Service Description</label>
                <textarea
                  rows={2}
                  value={catalogForm.Description}
                  onChange={(e) => setCatalogForm({ ...catalogForm, Description: e.target.value })}
                  placeholder="Details regarding sub-metering, billing schedule, or unit allocation rules"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingCatalogItem ? 'Save Changes' : 'Create Utility Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SINGLE SPLIT MODAL */}
      {editingSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Tenant Split: {editingSplit.Split_ID}</h3>
                <p className="text-xs text-slate-500">{editingSplit.Utility_Name} · {tenantName(editingSplit.Tenant_ID)}</p>
              </div>
              <button onClick={() => setEditingSplit(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updated: UtilitySplit = {
                  ...editingSplit,
                  Allocated_Amount: Number(splitForm.allocatedAmount),
                  Amount_Paid: Number(splitForm.amountPaid),
                  Balance: Math.max(0, Number(splitForm.allocatedAmount) - Number(splitForm.amountPaid)),
                  Status: splitForm.status,
                  Notes: splitForm.notes
                };
                storage.updateUtilitySplit(updated, currentUser.Email);
                onToast(`Split ${updated.Split_ID} updated`, 'success');
                setEditingSplit(null);
              }}
              className="p-5 space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Allocated Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={splitForm.allocatedAmount}
                  onChange={(e) => setSplitForm({ ...splitForm, allocatedAmount: Number(e.target.value) })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount Paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={splitForm.amountPaid}
                  onChange={(e) => setSplitForm({ ...splitForm, amountPaid: Number(e.target.value) })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 text-emerald-700 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Status</label>
                <select
                  value={splitForm.status}
                  onChange={(e) => setSplitForm({ ...splitForm, status: e.target.value as any })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={splitForm.notes}
                  onChange={(e) => setSplitForm({ ...splitForm, notes: e.target.value })}
                  placeholder="e.g. Adjusted after meter re-read"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSplit(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Save Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODALS */}
      <ConfirmDeleteModal
        isOpen={!!deletingBill}
        title="Delete Master Utility Bill"
        itemName={deletingBill ? `${deletingBill.Utility_Bill_ID} (${deletingBill.Utility_Type || deletingBill.Utility_ID})` : ''}
        itemType="master utility bill"
        warningMessage="Deleting this master utility invoice will remove it from the property billing log."
        onConfirm={() => {
          if (!deletingBill) return;
          storage.deleteMasterUtilityBill(deletingBill.Utility_Bill_ID, currentUser.Email);
          onToast(`Master bill ${deletingBill.Utility_Bill_ID} deleted`, 'info');
          setDeletingBill(null);
        }}
        onCancel={() => setDeletingBill(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingSplit}
        title="Delete Utility Split Receivable"
        itemName={deletingSplit ? `Split ${deletingSplit.Split_ID} (${tenantName(deletingSplit.Tenant_ID)})` : ''}
        itemType="tenant utility split"
        warningMessage="Deleting this utility split will remove this sub-ledger charge from the tenant."
        onConfirm={() => {
          if (!deletingSplit) return;
          storage.deleteUtilitySplit(deletingSplit.Split_ID, currentUser.Email);
          onToast(`Split receivable ${deletingSplit.Split_ID} deleted`, 'info');
          setDeletingSplit(null);
        }}
        onCancel={() => setDeletingSplit(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingCatalogItem}
        title="Delete Utility Service Type"
        itemName={deletingCatalogItem ? deletingCatalogItem.Utility_Name : ''}
        itemType="utility catalog service"
        warningMessage="Deleting this utility type will remove it from future billing dropdowns."
        onConfirm={handleDeleteCatalogConfirm}
        onCancel={() => setDeletingCatalogItem(null)}
      />
    </div>
  );
};
