import React, { useState } from 'react';
import {
  Scale, BookOpen, PieChart, FileText, Plus, CheckCircle2,
  AlertTriangle, Filter, Calendar, DollarSign, ArrowRight
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountingEngine } from '../services/accountingEngine';
import { User, JournalHeader, JournalLine } from '../types/erp';

interface AccountingViewProps {
  currentUser: User;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({ currentUser, onToast }) => {
  const [subTab, setSubTab] = useState<'TB' | 'GL' | 'FINANCIALS' | 'JOURNAL' | 'COA'>('TB');

  const coa = storage.getCOA();
  const properties = storage.getProperties();
  const periods = storage.getAccountingPeriods();

  // Trial Balance Filters with Fiscal Year Auto-Switching
  const [tbFrom, setTbFrom] = useState('2025-01-01');
  const [tbTo, setTbTo] = useState(new Date().toISOString().slice(0, 10));

  // General Ledger Filters
  const [glAccount, setGlAccount] = useState('1010');
  const [glFrom, setGlFrom] = useState('2025-01-01');
  const [glTo, setGlTo] = useState(new Date().toISOString().slice(0, 10));
  const [glFilterProperty, setGlFilterProperty] = useState('ALL');
  const [glFilterDivision, setGlFilterDivision] = useState('ALL');

  // Journal View Filters
  const [journalSearch, setJournalSearch] = useState('');
  const [journalFilterProperty, setJournalFilterProperty] = useState('ALL');
  const [journalFilterDivision, setJournalFilterDivision] = useState('ALL');

  // Manual Journal Modal
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [journalDesc, setJournalDesc] = useState('');
  const [journalRef, setJournalRef] = useState('');
  const [journalLines, setJournalLines] = useState<Array<{
    account: string;
    propertyId: string;
    divisionLevel: string;
    debit: number;
    credit: number;
    memo: string;
  }>>([
    { account: '5020', propertyId: properties[0]?.Property_ID || '', divisionLevel: 'None', debit: 0, credit: 0, memo: '' },
    { account: '1010', propertyId: properties[0]?.Property_ID || '', divisionLevel: 'None', debit: 0, credit: 0, memo: '' }
  ]);

  // Quick preset: Split Expense manually between Main Floor & Basement
  const handlePresetFloorExpenseSplit = (propId?: string) => {
    const p = properties.find(item => item.Property_ID === propId) || properties.find(item => item.Has_Divisions) || properties[0];
    const pid = p ? p.Property_ID : '';
    setJournalLines([
      { account: '5020', propertyId: pid, divisionLevel: 'Main Floor', debit: 0, credit: 0, memo: 'Main Floor allocation' },
      { account: '5020', propertyId: pid, divisionLevel: 'Basement', debit: 0, credit: 0, memo: 'Basement allocation' },
      { account: '1010', propertyId: pid, divisionLevel: 'None', debit: 0, credit: 0, memo: 'Paid from Operating Bank' }
    ]);
    if (!journalDesc) {
      setJournalDesc(`Expense allocation for ${p?.Property_Name || 'Property'}`);
    }
  };

  // Handle Trial Balance Date Change with Auto-Switching logic
  const handleTbToChange = (newTo: string) => {
    setTbTo(newTo);
    const toYear = new Date(newTo).getFullYear();
    const fromYear = new Date(tbFrom).getFullYear();
    if (toYear < fromYear) {
      // Auto switch fromDate to the start of that fiscal year
      setTbFrom(`${toYear}-01-01`);
    }
  };

  const tbResult = AccountingEngine.getTrialBalance(tbFrom, tbTo);
  const finResult = AccountingEngine.getFinancialStatements(tbFrom, tbTo);

  // General Ledger Computation
  const journalHeaders = storage.getJournalHeaders();
  const allLines = storage.getJournalLines();
  const selectedAcc = coa.find(a => a.Account_Code === glAccount);

  const glLinesFiltered = allLines.filter(l => {
    if (l.Account_Code !== glAccount) return false;
    const header = journalHeaders.find(h => h.Journal_ID === l.Journal_ID);
    if (!header || header.Status !== 'POSTED') return false;
    const d = new Date(header.Date);
    if (glFrom && d < new Date(glFrom)) return false;
    if (glTo && d > new Date(glTo + 'T23:59:59')) return false;
    if (glFilterProperty !== 'ALL' && l.Property_ID !== glFilterProperty) return false;
    if (glFilterDivision !== 'ALL') {
      if (glFilterDivision === 'None' && (l.Division_Level && l.Division_Level !== 'None')) return false;
      if (glFilterDivision !== 'None' && l.Division_Level !== glFilterDivision) return false;
    }
    return true;
  }).map(l => {
    const header = journalHeaders.find(h => h.Journal_ID === l.Journal_ID)!;
    return { ...l, header };
  }).sort((a, b) => new Date(a.header.Date).getTime() - new Date(b.header.Date).getTime());

  let runningBal = 0;
  const glRowsWithBalance = glLinesFiltered.map(l => {
    const d = l.Debit_Amount || 0;
    const c = l.Credit_Amount || 0;
    if (selectedAcc && ['Asset', 'Expense'].includes(selectedAcc.Account_Type)) {
      runningBal += (d - c);
    } else {
      runningBal += (c - d);
    }
    return { ...l, runningBal: AccountingEngine.round(runningBal) };
  });

  // Manual Journal Handlers
  const addJournalLine = () => {
    setJournalLines([...journalLines, { account: '1010', propertyId: properties[0]?.Property_ID || '', divisionLevel: 'None', debit: 0, credit: 0, memo: '' }]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length > 2) {
      setJournalLines(journalLines.filter((_, idx) => idx !== index));
    }
  };

  const totalJournalDebit = AccountingEngine.round(journalLines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
  const totalJournalCredit = AccountingEngine.round(journalLines.reduce((s, l) => s + (Number(l.credit) || 0), 0));
  const isJournalBalanced = Math.abs(totalJournalDebit - totalJournalCredit) < 0.005;

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJournalBalanced) {
      onToast('Journal entry is out of balance. Total Debit must equal Total Credit.', 'error');
      return;
    }

    const jId = 'JRN-MANUAL-' + Date.now().toString(36).toUpperCase();
    const linesToPost: JournalLine[] = journalLines
      .filter(l => (Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0)
      .map((l, idx) => ({
        Line_ID: `${jId}-${idx + 1}`,
        Journal_ID: jId,
        Account_Code: l.account,
        Property_ID: l.propertyId || undefined,
        Division_Level: (l.divisionLevel && l.divisionLevel !== 'None') ? (l.divisionLevel as any) : undefined,
        Debit_Amount: Number(l.debit) || 0,
        Credit_Amount: Number(l.credit) || 0,
        Memo: l.memo || journalDesc
      }));

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: journalDate,
      Description: journalDesc,
      Reference_Type: 'MANUAL',
      Reference_ID: journalRef || jId,
      Created_By: currentUser.Email,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };

    storage.postJournal(header, linesToPost, currentUser.Email);
    onToast(`Journal entry ${jId} posted successfully to General Ledger.`, 'success');
    setShowJournalModal(false);
    setJournalDesc('');
    setJournalRef('');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setSubTab('TB')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'TB' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Trial Balance
        </button>

        <button
          onClick={() => setSubTab('GL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'GL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          General Ledger
        </button>

        <button
          onClick={() => setSubTab('FINANCIALS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'FINANCIALS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          Financial Statements (P&L & BS)
        </button>

        <button
          onClick={() => setSubTab('JOURNAL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'JOURNAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Journal Entries
        </button>

        <button
          onClick={() => setSubTab('COA')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'COA' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Chart of Accounts
        </button>

        <div className="ml-auto">
          <button
            onClick={() => setShowJournalModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Journal Entry
          </button>
        </div>
      </div>

      {/* 1. TRIAL BALANCE TAB */}
      {subTab === 'TB' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-end gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Fiscal Year Start (From)</label>
                <input
                  type="date"
                  value={tbFrom}
                  onChange={(e) => setTbFrom(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">As of Date (To)</label>
                <input
                  type="date"
                  value={tbTo}
                  onChange={(e) => handleTbToChange(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                tbResult.isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {tbResult.isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                {tbResult.isBalanced ? 'Double-Entry In Balance' : `Out of Balance (Variance: $${tbResult.variance})`}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4 text-right">Debit ($)</th>
                    <th className="py-3 px-4 text-right">Credit ($)</th>
                    <th className="py-3 px-4 text-right">Net Balance ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {tbResult.rows.map(r => (
                    <tr key={r.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.code}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-800">{r.name}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500">{r.group}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {r.debit > 0 ? AccountingEngine.formatCurrency(r.debit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {r.credit > 0 ? AccountingEngine.formatCurrency(r.credit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700">
                        {AccountingEngine.formatCurrency(r.netBalance)} ({r.normalBalance === 'Debit' ? 'Dr' : 'Cr'})
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-bold font-mono border-t-2 border-slate-300">
                    <td colSpan={4} className="py-3.5 px-4 font-sans uppercase tracking-wider text-slate-800">
                      Total Trial Balance
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-900">
                      {AccountingEngine.formatCurrency(tbResult.totalDebit)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-900">
                      {AccountingEngine.formatCurrency(tbResult.totalCredit)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700">
                      {tbResult.isBalanced ? '✓ 0.00 Variance' : `$${tbResult.variance}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. GENERAL LEDGER TAB */}
      {subTab === 'GL' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Select Account</label>
              <select
                value={glAccount}
                onChange={(e) => setGlAccount(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none font-semibold w-64"
              >
                {coa.map(a => (
                  <option key={a.Account_Code} value={a.Account_Code}>
                    {a.Account_Code} — {a.Account_Name} ({a.Account_Type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Filter Property</label>
              <select
                value={glFilterProperty}
                onChange={(e) => setGlFilterProperty(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
              >
                <option value="ALL">All Properties</option>
                {properties.map(p => (
                  <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Filter Floor Division</label>
              <select
                value={glFilterDivision}
                onChange={(e) => setGlFilterDivision(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
              >
                <option value="ALL">All Divisions</option>
                <option value="Main Floor">🏠 Main Floor Only</option>
                <option value="Basement">🏡 Basement Only</option>
                <option value="None">Whole Property / General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">From Date</label>
              <input
                type="date"
                value={glFrom}
                onChange={(e) => setGlFrom(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">To Date</label>
              <input
                type="date"
                value={glTo}
                onChange={(e) => setGlTo(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Ledger Activity for {selectedAcc?.Account_Code} — {selectedAcc?.Account_Name}
              </h3>
              <span className="text-xs font-bold text-indigo-700">
                Closing Balance: {AccountingEngine.formatCurrency(runningBal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 font-sans">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Journal Ref</th>
                    <th className="py-3 px-4">Property & Floor</th>
                    <th className="py-3 px-4">Description / Memo</th>
                    <th className="py-3 px-4 text-right">Debit ($)</th>
                    <th className="py-3 px-4 text-right">Credit ($)</th>
                    <th className="py-3 px-4 text-right">Running Balance ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {glRowsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        No transactions found for this account in the specified period.
                      </td>
                    </tr>
                  ) : (
                    glRowsWithBalance.map((row, idx) => {
                      const prop = properties.find(p => p.Property_ID === row.Property_ID);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-800">{row.header.Date}</td>
                          <td className="py-3 px-4 font-bold text-indigo-700">{row.Journal_ID}</td>
                          <td className="py-3 px-4 font-sans text-slate-700">
                            {prop ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-semibold text-slate-900">{prop.Property_Name}</span>
                                {row.Division_Level === 'Main Floor' && (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                                    🏠 Main Floor
                                  </span>
                                )}
                                {row.Division_Level === 'Basement' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                    🏡 Basement
                                  </span>
                                )}
                                {row.Division_Level && row.Division_Level !== 'Main Floor' && row.Division_Level !== 'Basement' && row.Division_Level !== 'None' && (
                                  <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                                    {row.Division_Level}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-sans">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-700">{row.Memo || row.header.Description}</td>
                          <td className="py-3 px-4 text-right text-slate-900 font-medium">
                            {row.Debit_Amount > 0 ? AccountingEngine.formatCurrency(row.Debit_Amount) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-900 font-medium">
                            {row.Credit_Amount > 0 ? AccountingEngine.formatCurrency(row.Credit_Amount) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {AccountingEngine.formatCurrency(row.runningBal)}
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
      )}

      {/* 3. FINANCIAL STATEMENTS TAB */}
      {subTab === 'FINANCIALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Statement (P&L) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Statement of Profit & Loss (P&L)</h3>
              <p className="text-xs text-slate-500">Operating revenue & property expenses</p>
            </div>

            {/* Revenue */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Operating Revenue</p>
              <div className="space-y-1.5 text-xs">
                {finResult.pnl.revenue.items.map(it => (
                  <div key={it.code} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{it.name}</span>
                    <span className="font-mono font-semibold">{AccountingEngine.formatCurrency(it.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1 text-emerald-700">
                  <span>Total Revenue:</span>
                  <span className="font-mono">{AccountingEngine.formatCurrency(finResult.pnl.revenue.total)}</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">Property & Operating Costs</p>
              <div className="space-y-1.5 text-xs">
                {finResult.pnl.directCosts.items.map(it => (
                  <div key={it.code} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{it.name}</span>
                    <span className="font-mono font-semibold">{AccountingEngine.formatCurrency(it.amount)}</span>
                  </div>
                ))}
                {finResult.pnl.operatingExpenses.items.map(it => (
                  <div key={it.code} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{it.name}</span>
                    <span className="font-mono font-semibold">{AccountingEngine.formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Operating Income */}
            <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-center text-sm font-extrabold">
              <span className="text-slate-900">Net Operating Income (NOI):</span>
              <span className={`font-mono text-base ${finResult.pnl.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {AccountingEngine.formatCurrency(finResult.pnl.netIncome)}
              </span>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Balance Sheet</h3>
              <p className="text-xs text-slate-500">Assets = Liabilities + Owner Equity</p>
            </div>

            {/* Assets */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">Total Assets</p>
              <div className="space-y-1.5 text-xs">
                {finResult.balanceSheet.currentAssets.items.map(it => (
                  <div key={it.code} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{it.name}</span>
                    <span className="font-mono font-semibold">{AccountingEngine.formatCurrency(it.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1 text-indigo-800">
                  <span>Total Assets:</span>
                  <span className="font-mono">{AccountingEngine.formatCurrency(finResult.balanceSheet.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Liabilities & Deposits</p>
              <div className="space-y-1.5 text-xs">
                {finResult.balanceSheet.currentLiabilities.items.map(it => (
                  <div key={it.code} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{it.name}</span>
                    <span className="font-mono font-semibold">{AccountingEngine.formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equity */}
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">Equity & Retained Earnings</p>
              <div className="space-y-1.5 text-xs">
                {finResult.balanceSheet.equity.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-700">{it.name}</span>
                    <span className="font-mono font-semibold">{AccountingEngine.formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Check */}
            <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-center text-sm font-extrabold">
              <span className="text-slate-900">Total Liabilities & Equity:</span>
              <span className="font-mono text-base text-slate-900">
                {AccountingEngine.formatCurrency(finResult.balanceSheet.totalLiabilitiesAndEquity)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. JOURNAL ENTRIES VIEW TAB */}
      {subTab === 'JOURNAL' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-end gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Search Journals</label>
                <input
                  type="text"
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  placeholder="Search ref, memo, or desc..."
                  className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none w-60"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Filter Property</label>
                <select
                  value={journalFilterProperty}
                  onChange={(e) => setJournalFilterProperty(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                >
                  <option value="ALL">All Properties</option>
                  {properties.map(p => (
                    <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Filter Floor Division</label>
                <select
                  value={journalFilterDivision}
                  onChange={(e) => setJournalFilterDivision(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                >
                  <option value="ALL">All Divisions</option>
                  <option value="Main Floor">🏠 Main Floor Only</option>
                  <option value="Basement">🏡 Basement Only</option>
                  <option value="None">Whole Property / General</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowJournalModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Journal Entry
            </button>
          </div>

          <div className="space-y-3">
            {(() => {
              const allHeaders = storage.getJournalHeaders();
              const allLinesData = storage.getJournalLines();

              const filteredHeaders = allHeaders.filter(h => {
                const lines = allLinesData.filter(l => l.Journal_ID === h.Journal_ID);
                
                // Property filter
                if (journalFilterProperty !== 'ALL') {
                  const hasProp = lines.some(l => l.Property_ID === journalFilterProperty);
                  if (!hasProp) return false;
                }

                // Division filter
                if (journalFilterDivision !== 'ALL') {
                  const hasDiv = lines.some(l => {
                    if (journalFilterDivision === 'None') return !l.Division_Level || l.Division_Level === 'None';
                    return l.Division_Level === journalFilterDivision;
                  });
                  if (!hasDiv) return false;
                }

                // Search text filter
                if (journalSearch.trim()) {
                  const q = journalSearch.toLowerCase();
                  const matchHeader = h.Journal_ID.toLowerCase().includes(q) ||
                    h.Description.toLowerCase().includes(q) ||
                    (h.Reference_ID && h.Reference_ID.toLowerCase().includes(q));
                  const matchLines = lines.some(l => l.Memo?.toLowerCase().includes(q) || l.Account_Code.includes(q));
                  if (!matchHeader && !matchLines) return false;
                }

                return true;
              }).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

              if (filteredHeaders.length === 0) {
                return (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No journal entries found matching the active filters.
                  </div>
                );
              }

              return filteredHeaders.map(h => {
                const lines = allLinesData.filter(l => l.Journal_ID === h.Journal_ID);
                const totalDebit = lines.reduce((s, l) => s + (l.Debit_Amount || 0), 0);
                const totalCredit = lines.reduce((s, l) => s + (l.Credit_Amount || 0), 0);

                return (
                  <div key={h.Journal_ID} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {h.Journal_ID}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{h.Description}</span>
                        {h.Reference_ID && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Ref: {h.Reference_ID}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {h.Reference_Type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500 font-medium">Date: <strong>{h.Date}</strong></span>
                        <span className="font-mono font-bold text-slate-900">
                          {AccountingEngine.formatCurrency(totalDebit)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {h.Status}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-50/40 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-100 font-sans">
                          <tr>
                            <th className="py-2.5 px-4">Account</th>
                            <th className="py-2.5 px-4">Property & Floor Division</th>
                            <th className="py-2.5 px-4">Memo</th>
                            <th className="py-2.5 px-4 text-right">Debit ($)</th>
                            <th className="py-2.5 px-4 text-right">Credit ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lines.map((l, lIdx) => {
                            const acc = coa.find(a => a.Account_Code === l.Account_Code);
                            const prop = properties.find(p => p.Property_ID === l.Property_ID);
                            return (
                              <tr key={lIdx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4">
                                  <span className="font-bold text-indigo-700 mr-2">{l.Account_Code}</span>
                                  <span className="font-sans text-slate-700">{acc?.Account_Name}</span>
                                </td>
                                <td className="py-2.5 px-4 font-sans">
                                  {prop ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-900">{prop.Property_Name}</span>
                                      {l.Division_Level === 'Main Floor' && (
                                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                                          🏠 Main Floor
                                        </span>
                                      )}
                                      {l.Division_Level === 'Basement' && (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                          🏡 Basement
                                        </span>
                                      )}
                                      {l.Division_Level && l.Division_Level !== 'Main Floor' && l.Division_Level !== 'Basement' && l.Division_Level !== 'None' && (
                                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                                          {l.Division_Level}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 font-sans text-slate-600">{l.Memo || '—'}</td>
                                <td className="py-2.5 px-4 text-right font-medium text-slate-900">
                                  {l.Debit_Amount > 0 ? AccountingEngine.formatCurrency(l.Debit_Amount) : '—'}
                                </td>
                                <td className="py-2.5 px-4 text-right font-medium text-slate-900">
                                  {l.Credit_Amount > 0 ? AccountingEngine.formatCurrency(l.Credit_Amount) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 5. JOURNAL POSTING MODAL */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Double-Entry Journal Entry</h3>
                <p className="text-xs text-slate-500">Allocate expenses and journals to properties and specific floor divisions</p>
              </div>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            <form onSubmit={handlePostJournal} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Quick Split Helper */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs">
                  <span className="font-bold text-indigo-950 block">⚡ Quick Manual Expense Split</span>
                  <span className="text-slate-600 text-[11px]">Allocate expense separately to Main Floor & Basement without fixed percentages</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePresetFloorExpenseSplit()}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 shadow-2xs transition-colors"
                >
                  ⚡ Preset Main Floor & Basement Lines
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Journal Date</label>
                  <input
                    type="date"
                    required
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Reference ID (Optional)</label>
                  <input
                    type="text"
                    value={journalRef}
                    onChange={(e) => setJournalRef(e.target.value)}
                    placeholder="e.g. EXP-REPAIR-01"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Purpose</label>
                <input
                  type="text"
                  required
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  placeholder="e.g. Plumbing repairs & inspection invoice"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Debit & Credit Lines</label>
                  <span className="text-[11px] text-slate-500">Each line can be tagged to a specific Floor Division</span>
                </div>

                {journalLines.map((line, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Account</label>
                        <select
                          value={line.account}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].account = e.target.value;
                            setJournalLines(updated);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white outline-none"
                        >
                          {coa.map(a => (
                            <option key={a.Account_Code} value={a.Account_Code}>
                              {a.Account_Code} · {a.Account_Name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Property</label>
                        <select
                          value={line.propertyId}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].propertyId = e.target.value;
                            setJournalLines(updated);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white outline-none"
                        >
                          <option value="">General / None</option>
                          {properties.map(p => (
                            <option key={p.Property_ID} value={p.Property_ID}>{p.Property_Name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Floor Division</label>
                        <select
                          value={line.divisionLevel || 'None'}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].divisionLevel = e.target.value;
                            setJournalLines(updated);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white outline-none font-semibold"
                        >
                          <option value="None">Whole Property / General</option>
                          <option value="Main Floor">🏠 Main Floor</option>
                          <option value="Basement">🏡 Basement</option>
                          <option value="Upper Floor">🔼 Upper Floor</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Line memo / note (e.g. Main floor kitchen sink)"
                          value={line.memo}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].memo = e.target.value;
                            setJournalLines(updated);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white outline-none"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit ($)"
                          value={line.debit || ''}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].debit = Number(e.target.value);
                            setJournalLines(updated);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white outline-none font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit ($)"
                          value={line.credit || ''}
                          onChange={(e) => {
                            const updated = [...journalLines];
                            updated[idx].credit = Number(e.target.value);
                            setJournalLines(updated);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white outline-none font-mono font-bold text-slate-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeJournalLine(idx)}
                        className="text-slate-400 hover:text-rose-600 p-2 text-sm font-bold"
                        title="Remove Line"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={addJournalLine}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800"
                >
                  + Add Line
                </button>

                <div className="flex items-center gap-4 font-mono font-bold">
                  <span>Debit: {AccountingEngine.formatCurrency(totalJournalDebit)}</span>
                  <span>Credit: {AccountingEngine.formatCurrency(totalJournalCredit)}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${
                    isJournalBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isJournalBalanced ? '✓ Balanced' : 'Out of Balance'}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJournalBalanced}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs"
                >
                  Post Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CHART OF ACCOUNTS TAB */}
      {subTab === 'COA' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Group</th>
                  <th className="py-3 px-4">Normal Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coa.map(a => (
                  <tr key={a.Account_Code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{a.Account_Code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{a.Account_Name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{a.Account_Type}</td>
                    <td className="py-3.5 px-4 text-slate-500">{a.Account_Group}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{a.Normal_Balance}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
