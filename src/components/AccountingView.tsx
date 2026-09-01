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

  // Manual Journal Modal
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [journalDesc, setJournalDesc] = useState('');
  const [journalRef, setJournalRef] = useState('');
  const [journalLines, setJournalLines] = useState<Array<{
    account: string;
    propertyId: string;
    debit: number;
    credit: number;
    memo: string;
  }>>([
    { account: '1010', propertyId: '', debit: 0, credit: 0, memo: '' },
    { account: '4000', propertyId: '', debit: 0, credit: 0, memo: '' }
  ]);

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
    setJournalLines([...journalLines, { account: '1010', propertyId: '', debit: 0, credit: 0, memo: '' }]);
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
        Property_ID: l.propertyId,
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
                className="text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none font-semibold w-72"
              >
                {coa.map(a => (
                  <option key={a.Account_Code} value={a.Account_Code}>
                    {a.Account_Code} — {a.Account_Name} ({a.Account_Type})
                  </option>
                ))}
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
                    <th className="py-3 px-4">Description / Memo</th>
                    <th className="py-3 px-4 text-right">Debit ($)</th>
                    <th className="py-3 px-4 text-right">Credit ($)</th>
                    <th className="py-3 px-4 text-right">Running Balance ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {glRowsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No transactions found for this account in the specified period.
                      </td>
                    </tr>
                  ) : (
                    glRowsWithBalance.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-800">{row.header.Date}</td>
                        <td className="py-3 px-4 font-bold text-indigo-700">{row.Journal_ID}</td>
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
                    ))
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

      {/* 4. JOURNAL POSTING MODAL */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Double-Entry Journal Entry</h3>
                <p className="text-xs text-slate-500">Posts directly to General Ledger upon balance validation</p>
              </div>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handlePostJournal} className="p-5 space-y-4">
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
                    placeholder="e.g. ADJ-2025-01"
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
                  placeholder="e.g. Month-end HVAC repair expense adjustment"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Debit & Credit Lines</label>
                {journalLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={line.account}
                      onChange={(e) => {
                        const updated = [...journalLines];
                        updated[idx].account = e.target.value;
                        setJournalLines(updated);
                      }}
                      className="flex-1 text-xs rounded-xl border border-slate-200 p-2 bg-white outline-none"
                    >
                      {coa.map(a => (
                        <option key={a.Account_Code} value={a.Account_Code}>
                          {a.Account_Code} · {a.Account_Name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Debit"
                      value={line.debit || ''}
                      onChange={(e) => {
                        const updated = [...journalLines];
                        updated[idx].debit = Number(e.target.value);
                        setJournalLines(updated);
                      }}
                      className="w-28 text-xs rounded-xl border border-slate-200 p-2 outline-none font-mono"
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Credit"
                      value={line.credit || ''}
                      onChange={(e) => {
                        const updated = [...journalLines];
                        updated[idx].credit = Number(e.target.value);
                        setJournalLines(updated);
                      }}
                      className="w-28 text-xs rounded-xl border border-slate-200 p-2 outline-none font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => removeJournalLine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-2"
                    >
                      ✕
                    </button>
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

      {/* 5. CHART OF ACCOUNTS TAB */}
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
