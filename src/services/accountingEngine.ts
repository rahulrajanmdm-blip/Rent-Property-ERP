import { storage } from './storage';
import {
  JournalHeader, JournalLine, Lease, LandlordPayment, RentTransaction,
  DepositTransaction, CollectionRecord, RegionalProvince, REGIONAL_PROVINCE_TAX,
  UtilitySplit
} from '../types/erp';

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  group: string;
  normalBalance: 'Debit' | 'Credit';
  debit: number;
  credit: number;
  netBalance: number;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  variance: number;
}

export interface FinancialStatementResult {
  pnl: {
    revenue: { items: { code: string; name: string; amount: number }[]; total: number };
    directCosts: { items: { code: string; name: string; amount: number }[]; total: number };
    operatingExpenses: { items: { code: string; name: string; amount: number }[]; total: number };
    administrativeExpenses: { items: { code: string; name: string; amount: number }[]; total: number };
    netIncome: number;
  };
  balanceSheet: {
    currentAssets: { items: { code: string; name: string; amount: number }[]; total: number };
    fixedAssets: { items: { code: string; name: string; amount: number }[]; total: number };
    totalAssets: number;
    currentLiabilities: { items: { code: string; name: string; amount: number }[]; total: number };
    totalLiabilities: number;
    equity: { items: { code: string; name: string; amount: number }[]; total: number };
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
  };
}

export class AccountingEngine {
  public static round(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  public static formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(this.round(val));
  }

  public static getTrialBalance(from?: string, to?: string): TrialBalanceResult {
    const coa = storage.getCOA();
    const headers = storage.getJournalHeaders();
    const lines = storage.getJournalLines();

    // Filter headers by date if provided
    const validHeaderIds = new Set(
      headers.filter(h => {
        if (h.Status !== 'POSTED') return false;
        const d = new Date(h.Date);
        if (from && d < new Date(from)) return false;
        if (to && d > new Date(to + 'T23:59:59')) return false;
        return true;
      }).map(h => h.Journal_ID)
    );

    const sums: Record<string, { debit: number; credit: number }> = {};
    coa.forEach(a => {
      sums[a.Account_Code] = { debit: 0, credit: 0 };
    });

    lines.forEach(l => {
      if (!validHeaderIds.has(l.Journal_ID)) return;
      if (sums[l.Account_Code]) {
        sums[l.Account_Code].debit += this.round(l.Debit_Amount || 0);
        sums[l.Account_Code].credit += this.round(l.Credit_Amount || 0);
      }
    });

    const rows: TrialBalanceRow[] = coa.map(acc => {
      const d = this.round(sums[acc.Account_Code]?.debit || 0);
      const c = this.round(sums[acc.Account_Code]?.credit || 0);
      
      // FIXED DEBIT/CREDIT NORMAL BALANCE NATURE:
      // Assets & Expenses: Net Debit = Debit - Credit
      // Liabilities, Equity, Revenue: Net Credit = Credit - Debit
      let netBalance = 0;
      if (['Asset', 'Expense'].includes(acc.Account_Type)) {
        netBalance = this.round(d - c);
      } else {
        netBalance = this.round(c - d);
      }

      return {
        code: acc.Account_Code,
        name: acc.Account_Name,
        type: acc.Account_Type,
        group: acc.Account_Group,
        normalBalance: acc.Normal_Balance,
        debit: d,
        credit: c,
        netBalance
      };
    }).filter(r => r.debit > 0 || r.credit > 0 || r.code === '1010' || r.code === '1100');

    const totalDebit = this.round(rows.reduce((sum, r) => sum + r.debit, 0));
    const totalCredit = this.round(rows.reduce((sum, r) => sum + r.credit, 0));
    const variance = this.round(Math.abs(totalDebit - totalCredit));

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced: variance < 0.01,
      variance
    };
  }

  public static getFinancialStatements(from?: string, to?: string): FinancialStatementResult {
    const tb = this.getTrialBalance(from, to);
    
    const pnl = {
      revenue: { items: [] as any[], total: 0 },
      directCosts: { items: [] as any[], total: 0 },
      operatingExpenses: { items: [] as any[], total: 0 },
      administrativeExpenses: { items: [] as any[], total: 0 },
      netIncome: 0
    };

    const bs = {
      currentAssets: { items: [] as any[], total: 0 },
      fixedAssets: { items: [] as any[], total: 0 },
      totalAssets: 0,
      currentLiabilities: { items: [] as any[], total: 0 },
      totalLiabilities: 0,
      equity: { items: [] as any[], total: 0 },
      totalLiabilitiesAndEquity: 0,
      isBalanced: false
    };

    tb.rows.forEach(r => {
      const bal = r.netBalance;
      if (r.type === 'Revenue') {
        pnl.revenue.items.push({ code: r.code, name: r.name, amount: bal });
        pnl.revenue.total += bal;
      } else if (r.type === 'Expense') {
        if (r.group === 'Direct Property Costs') {
          pnl.directCosts.items.push({ code: r.code, name: r.name, amount: bal });
          pnl.directCosts.total += bal;
        } else if (r.group === 'Operating Expenses') {
          pnl.operatingExpenses.items.push({ code: r.code, name: r.name, amount: bal });
          pnl.operatingExpenses.total += bal;
        } else {
          pnl.administrativeExpenses.items.push({ code: r.code, name: r.name, amount: bal });
          pnl.administrativeExpenses.total += bal;
        }
      } else if (r.type === 'Asset') {
        if (r.group === 'Fixed Assets') {
          bs.fixedAssets.items.push({ code: r.code, name: r.name, amount: bal });
          bs.fixedAssets.total += bal;
        } else {
          bs.currentAssets.items.push({ code: r.code, name: r.name, amount: bal });
          bs.currentAssets.total += bal;
        }
      } else if (r.type === 'Liability') {
        bs.currentLiabilities.items.push({ code: r.code, name: r.name, amount: bal });
        bs.currentLiabilities.total += bal;
      } else if (r.type === 'Equity') {
        bs.equity.items.push({ code: r.code, name: r.name, amount: bal });
        bs.equity.total += bal;
      }
    });

    pnl.revenue.total = this.round(pnl.revenue.total);
    pnl.directCosts.total = this.round(pnl.directCosts.total);
    pnl.operatingExpenses.total = this.round(pnl.operatingExpenses.total);
    pnl.administrativeExpenses.total = this.round(pnl.administrativeExpenses.total);
    const totalExpenses = this.round(pnl.directCosts.total + pnl.operatingExpenses.total + pnl.administrativeExpenses.total);
    pnl.netIncome = this.round(pnl.revenue.total - totalExpenses);

    bs.currentAssets.total = this.round(bs.currentAssets.total);
    bs.fixedAssets.total = this.round(bs.fixedAssets.total);
    bs.totalAssets = this.round(bs.currentAssets.total + bs.fixedAssets.total);

    bs.currentLiabilities.total = this.round(bs.currentLiabilities.total);
    bs.totalLiabilities = bs.currentLiabilities.total;

    // Roll Net Income into Retained Earnings
    bs.equity.items.push({ code: '3100-CURR', name: 'Current Period Net Income (Loss)', amount: pnl.netIncome });
    bs.equity.total = this.round(bs.equity.total + pnl.netIncome);

    bs.totalLiabilitiesAndEquity = this.round(bs.totalLiabilities + bs.equity.total);
    bs.isBalanced = Math.abs(bs.totalAssets - bs.totalLiabilitiesAndEquity) < 0.01;

    return { pnl, balanceSheet: bs };
  }

  // Idempotent Rent Generator
  public static generateMonthlyRent(month: string, propertyIdFilter?: string, userEmail = 'admin@dreamdwell.com'): {
    count: number;
    createdList: string[];
    skippedList: string[];
    journalId?: string;
  } {
    const leases = storage.getLeases().filter(l => l.Status === 'Active');
    const existingRents = storage.getRentTransactions();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const createdList: string[] = [];
    const skippedList: string[] = [];
    const jLines: JournalLine[] = [];

    const jId = 'JRN-RENT-GEN-' + targetMonth.replace('-', '') + '-' + Date.now().toString(36).toUpperCase();

    leases.forEach(lease => {
      if (propertyIdFilter && lease.Property_ID !== propertyIdFilter) return;

      // Check lease validity for this month
      const startMonth = lease.Lease_Start.slice(0, 7);
      const endMonth = lease.Lease_End ? lease.Lease_End.slice(0, 7) : '9999-12';
      if (targetMonth < startMonth || targetMonth > endMonth) return;

      // IDEMPOTENCY CHECK: Does rent already exist for this Lease + Month?
      const alreadyExists = existingRents.some(r => r.Lease_ID === lease.Lease_ID && r.Period_Month === targetMonth);
      if (alreadyExists) {
        skippedList.push(`${lease.Lease_ID} (${lease.Unit_ID})`);
        return;
      }

      const rentTxnId = `RENT-${targetMonth.replace('-', '')}-${lease.Unit_ID}`;
      const amount = this.round(lease.Monthly_Rent);
      const dueDate = `${targetMonth}-01`;

      const newRent: RentTransaction = {
        Rent_Txn_ID: rentTxnId,
        Lease_ID: lease.Lease_ID,
        Tenant_ID: lease.Tenant_ID,
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Period_Month: targetMonth,
        Due_Date: dueDate,
        Amount_Billed: amount,
        Amount_Paid: 0,
        Balance: amount,
        Status: 'Unpaid',
        Journal_Ref_ID: jId,
        Created_By: userEmail,
        Created_At: new Date().toISOString()
      };

      storage.addRentTransaction(newRent, userEmail);
      createdList.push(rentTxnId);

      // Debit A/R - Rent (1100), Credit Gross Rent Revenue (4000)
      jLines.push({
        Line_ID: `${jId}-D-${lease.Unit_ID}`,
        Journal_ID: jId,
        Account_Code: '1100',
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Tenant_ID: lease.Tenant_ID,
        Debit_Amount: amount,
        Credit_Amount: 0,
        Memo: `Rent billing for ${lease.Unit_ID} (${targetMonth})`
      });

      jLines.push({
        Line_ID: `${jId}-C-${lease.Unit_ID}`,
        Journal_ID: jId,
        Account_Code: '4000',
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Tenant_ID: lease.Tenant_ID,
        Debit_Amount: 0,
        Credit_Amount: amount,
        Memo: `Rent revenue earned for ${lease.Unit_ID} (${targetMonth})`
      });
    });

    if (jLines.length > 0) {
      const header: JournalHeader = {
        Journal_ID: jId,
        Date: `${targetMonth}-01`,
        Description: `Monthly Automated Rent Generation — ${targetMonth}`,
        Reference_Type: 'RENT_GENERATION',
        Reference_ID: targetMonth,
        Created_By: userEmail,
        Status: 'POSTED',
        Period_ID: 'PER-2025',
        Created_At: new Date().toISOString()
      };
      storage.postJournal(header, jLines, userEmail);
    }

    return {
      count: createdList.length,
      createdList,
      skippedList,
      journalId: jLines.length > 0 ? jId : undefined
    };
  }

  // Create Lease with First Month + Last Month + Security Deposit Double Entry
  public static createLeaseWithCharges(
    leaseData: Omit<Lease, 'Lease_ID' | 'Created_At' | 'Status'>,
    userEmail = 'admin@dreamdwell.com'
  ): { leaseId: string; journalId: string } {
    const leaseId = 'LEASE-' + Date.now().toString(36).toUpperCase();
    const monthlyRent = this.round(leaseData.Monthly_Rent);
    const depositRequired = this.round(leaseData.Deposit_Required || 0);
    const lastMonthRent = this.round(leaseData.Last_Month_Rent || 0);

    const lease: Lease = {
      ...leaseData,
      Lease_ID: leaseId,
      Monthly_Rent: monthlyRent,
      Deposit_Required: depositRequired,
      Deposit_Received: 0,
      Last_Month_Rent: lastMonthRent,
      Status: 'Active',
      Created_At: new Date().toISOString()
    };

    storage.addLease(lease, userEmail);

    const jId = 'JRN-LEASE-INIT-' + leaseId;
    const jLines: JournalLine[] = [];

    // 1. First Month Rent: Debit AR-Rent (1100), Credit Rent Revenue (4000)
    const firstMonthStr = leaseData.Lease_Start.slice(0, 7);
    const rentTxnId = `RENT-${firstMonthStr.replace('-', '')}-${leaseData.Unit_ID}`;
    storage.addRentTransaction({
      Rent_Txn_ID: rentTxnId,
      Lease_ID: leaseId,
      Tenant_ID: leaseData.Tenant_ID,
      Property_ID: leaseData.Property_ID,
      Unit_ID: leaseData.Unit_ID,
      Period_Month: firstMonthStr,
      Due_Date: leaseData.Lease_Start,
      Amount_Billed: monthlyRent,
      Amount_Paid: 0,
      Balance: monthlyRent,
      Status: 'Unpaid',
      Journal_Ref_ID: jId,
      Created_By: userEmail,
      Created_At: new Date().toISOString()
    }, userEmail);

    jLines.push({
      Line_ID: `${jId}-1`,
      Journal_ID: jId,
      Account_Code: '1100',
      Property_ID: leaseData.Property_ID,
      Unit_ID: leaseData.Unit_ID,
      Tenant_ID: leaseData.Tenant_ID,
      Debit_Amount: monthlyRent,
      Credit_Amount: 0,
      Memo: `Initial 1st Month Rent Charge (${firstMonthStr})`
    });

    jLines.push({
      Line_ID: `${jId}-2`,
      Journal_ID: jId,
      Account_Code: '4000',
      Property_ID: leaseData.Property_ID,
      Unit_ID: leaseData.Unit_ID,
      Tenant_ID: leaseData.Tenant_ID,
      Debit_Amount: 0,
      Credit_Amount: monthlyRent,
      Memo: `Initial 1st Month Rent Revenue`
    });

    // 2. Security Deposit / Last Month Rent Deposit: Debit Deposit Receivable (1120), Credit Tenant Deposit Liability (2200)
    const totalDepositDue = depositRequired + lastMonthRent;
    if (totalDepositDue > 0) {
      const depTxnId = `DEP-${leaseId}`;
      storage.addDepositTransaction({
        Deposit_Txn_ID: depTxnId,
        Lease_ID: leaseId,
        Tenant_ID: leaseData.Tenant_ID,
        Property_ID: leaseData.Property_ID,
        Unit_ID: leaseData.Unit_ID,
        Txn_Type: 'Charge',
        Due_Amount: totalDepositDue,
        Paid_Amount: 0,
        Refund_Amount: 0,
        Balance: totalDepositDue,
        Txn_Date: leaseData.Lease_Start,
        Status: 'Receivable',
        Journal_Ref_ID: jId,
        Created_By: userEmail
      }, userEmail);

      jLines.push({
        Line_ID: `${jId}-3`,
        Journal_ID: jId,
        Account_Code: '1120',
        Property_ID: leaseData.Property_ID,
        Unit_ID: leaseData.Unit_ID,
        Tenant_ID: leaseData.Tenant_ID,
        Debit_Amount: totalDepositDue,
        Credit_Amount: 0,
        Memo: `Deposit / Last Month Rent Receivable`
      });

      jLines.push({
        Line_ID: `${jId}-4`,
        Journal_ID: jId,
        Account_Code: '2200',
        Property_ID: leaseData.Property_ID,
        Unit_ID: leaseData.Unit_ID,
        Tenant_ID: leaseData.Tenant_ID,
        Debit_Amount: 0,
        Credit_Amount: totalDepositDue,
        Memo: `Tenant Deposit Held Liability (Security & LMR)`
      });
    }

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: leaseData.Lease_Start,
      Description: `Lease Inception — ${leaseId} (${leaseData.Unit_ID})`,
      Reference_Type: 'LEASE_INCEPTION',
      Reference_ID: leaseId,
      Created_By: userEmail,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };
    storage.postJournal(header, jLines, userEmail);

    return { leaseId, journalId: jId };
  }

  // Record Rent Collection with Excess Payment & Double Entry Posting
  public static recordRentPayment(
    rentTxnId: string,
    amountPaid: number,
    paymentMethod: string,
    paymentDate: string,
    reference: string,
    userEmail = 'admin@dreamdwell.com'
  ): { success: boolean; collectionId: string; excess: number; journalId: string } {
    const rents = storage.getRentTransactions();
    const r = rents.find(x => x.Rent_Txn_ID === rentTxnId);
    if (!r) throw new Error('Rent transaction not found.');

    const paid = this.round(amountPaid);
    if (paid <= 0) throw new Error('Payment amount must be greater than zero.');

    const remainingDue = this.round(r.Amount_Billed - r.Amount_Paid);
    const applied = Math.min(remainingDue, paid);
    const excess = this.round(Math.max(0, paid - remainingDue));

    const newAmountPaid = this.round(r.Amount_Paid + applied);
    const newBalance = this.round(Math.max(0, r.Amount_Billed - newAmountPaid));
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    storage.updateRentTransaction({
      ...r,
      Amount_Paid: newAmountPaid,
      Balance: newBalance,
      Payment_Date: paymentDate || new Date().toISOString().slice(0, 10),
      Payment_Method: paymentMethod || 'Interac e-Transfer',
      Reference: reference,
      Status: newStatus
    }, userEmail);

    const colId = 'COL-' + Date.now().toString(36).toUpperCase();
    const jId = 'JRN-COL-' + colId;

    // Journal: Debit Bank (1010), Credit AR-Rent (1100) for applied, Credit Unearned Rev (2300) for excess
    const jLines: JournalLine[] = [
      {
        Line_ID: `${jId}-1`,
        Journal_ID: jId,
        Account_Code: '1010',
        Property_ID: r.Property_ID,
        Unit_ID: r.Unit_ID,
        Tenant_ID: r.Tenant_ID,
        Debit_Amount: paid,
        Credit_Amount: 0,
        Memo: `Rent received via ${paymentMethod} (${r.Period_Month})`
      },
      {
        Line_ID: `${jId}-2`,
        Journal_ID: jId,
        Account_Code: '1100',
        Property_ID: r.Property_ID,
        Unit_ID: r.Unit_ID,
        Tenant_ID: r.Tenant_ID,
        Debit_Amount: 0,
        Credit_Amount: applied,
        Memo: `Apply to AR Rent (${r.Period_Month})`
      }
    ];

    if (excess > 0) {
      jLines.push({
        Line_ID: `${jId}-3`,
        Journal_ID: jId,
        Account_Code: '2300',
        Property_ID: r.Property_ID,
        Unit_ID: r.Unit_ID,
        Tenant_ID: r.Tenant_ID,
        Debit_Amount: 0,
        Credit_Amount: excess,
        Memo: `Unapplied / Excess tenant payment liability`
      });

      storage.addExcessPayment({
        Excess_ID: 'EXC-' + Date.now().toString(36).toUpperCase(),
        Collection_ID: colId,
        Tenant_ID: r.Tenant_ID,
        Property_ID: r.Property_ID,
        Payment_Date: paymentDate,
        Excess_Amount: excess,
        Resolution_Status: 'Unresolved',
        Notes: `Excess of $${excess} collected on rent txn ${rentTxnId}`,
        Journal_Ref_ID: jId
      }, userEmail);
    }

    const colRecord: CollectionRecord = {
      Collection_ID: colId,
      Collection_Date: paymentDate,
      Tenant_ID: r.Tenant_ID,
      Property_ID: r.Property_ID,
      Unit_ID: r.Unit_ID,
      Collection_Type: 'Rent',
      Amount: paid,
      Payment_Method: paymentMethod,
      Reference: reference,
      Applied_To: rentTxnId,
      Notes: excess > 0 ? `Applied $${applied}, Excess $${excess}` : `Full rent payment`,
      Journal_Ref_ID: jId,
      Created_By: userEmail,
      Created_At: new Date().toISOString()
    };
    storage.addCollection(colRecord, userEmail);

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: paymentDate,
      Description: `Rent Collection — ${r.Unit_ID} (${r.Period_Month})`,
      Reference_Type: 'COLLECTION',
      Reference_ID: colId,
      Created_By: userEmail,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };
    storage.postJournal(header, jLines, userEmail);

    return { success: true, collectionId: colId, excess, journalId: jId };
  }

  // Create Landlord Net Rent Payment & Post to Ledger
  public static createLandlordPayment(
    propertyId: string,
    landlordId: string,
    period: string,
    rentAmount: number,
    deductions: number,
    notes?: string,
    userEmail = 'admin@dreamdwell.com'
  ): { paymentId: string; netAmount: number; journalId: string } {
    const payId = 'LRDPAY-' + Date.now().toString(36).toUpperCase();
    const grossRent = this.round(rentAmount);
    const ded = this.round(deductions);
    const netAmount = this.round(grossRent - ded);

    const jId = 'JRN-LPAY-' + payId;

    // Journal: Debit Master Lease / Landlord Expense (5000) for gross, Credit Management Fee Income (4020) for deductions, Credit Bank (1010) for net payment
    const jLines: JournalLine[] = [
      {
        Line_ID: `${jId}-1`,
        Journal_ID: jId,
        Account_Code: '5000',
        Property_ID: propertyId,
        Debit_Amount: grossRent,
        Credit_Amount: 0,
        Memo: `Landlord Gross Rent Distribution (${period})`
      }
    ];

    if (ded > 0) {
      jLines.push({
        Line_ID: `${jId}-2`,
        Journal_ID: jId,
        Account_Code: '4020',
        Property_ID: propertyId,
        Debit_Amount: 0,
        Credit_Amount: ded,
        Memo: `Property Management Fee / Deductions Retained`
      });
    }

    jLines.push({
      Line_ID: `${jId}-3`,
      Journal_ID: jId,
      Account_Code: '1010',
      Property_ID: propertyId,
      Debit_Amount: 0,
      Credit_Amount: netAmount,
      Memo: `Net EFT Disbursement to Landlord`
    });

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: new Date().toISOString().slice(0, 10),
      Description: `Landlord Payout — ${period} (${propertyId})`,
      Reference_Type: 'LANDLORD_PAYOUT',
      Reference_ID: payId,
      Created_By: userEmail,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };
    storage.postJournal(header, jLines, userEmail);

    const payment: LandlordPayment = {
      Landlord_Pay_ID: payId,
      Property_ID: propertyId,
      Landlord_ID: landlordId,
      Period: period,
      Rent_Amount: grossRent,
      Deductions: ded,
      Net_Amount: netAmount,
      Status: 'Posted',
      Payment_Date: new Date().toISOString().slice(0, 10),
      Journal_Ref_ID: jId,
      Notes: notes,
      Created_Date: new Date().toISOString(),
      Created_By: userEmail
    };
    storage.addLandlordPayment(payment, userEmail);

    return { paymentId: payId, netAmount, journalId: jId };
  }

  // Create Master Utility Bill and apportion splits across occupied units
  public static createMasterUtilityBillAndSplits(
    propertyId: string,
    utilityType: any,
    provider: string,
    billPeriod: string,
    amount: number,
    splitMethod: 'EQUAL' | 'SQFT' | 'OCCUPANTS',
    userEmail = 'admin@dreamdwell.com'
  ): { masterBillId: string; splitCount: number; journalId: string } {
    const billId = 'UBILL-' + Date.now().toString(36).toUpperCase();
    const roundedAmount = this.round(amount);
    const activeLeases = storage.getLeases().filter(l => l.Property_ID === propertyId && l.Status === 'Active');

    if (activeLeases.length === 0) {
      throw new Error(`No active tenant leases found for property ${propertyId} to allocate utilities.`);
    }

    const jId = 'JRN-UBILL-' + billId;
    const bill: any = {
      Utility_Bill_ID: billId,
      Property_ID: propertyId,
      Utility_ID: utilityType,
      Utility_Type: utilityType,
      Bill_Date: new Date().toISOString().slice(0, 10),
      Due_Date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      Vendor: provider,
      Provider_Name: provider,
      Bill_Period: billPeriod,
      Master_Amount: roundedAmount,
      Total_Amount: roundedAmount,
      Bill_Reference: `INV-${Date.now()}`,
      Status: 'Allocated',
      Notes: `${utilityType} apportioned via ${splitMethod}`,
      Created_By: userEmail
    };
    storage.addUtilityBill(bill, userEmail);

    const sharePerLease = this.round(roundedAmount / activeLeases.length);
    const jLines: JournalLine[] = [];

    activeLeases.forEach((l, idx) => {
      const splitId = `USPLIT-${billId}-${idx + 1}`;
      const splitAmt = idx === activeLeases.length - 1
        ? this.round(roundedAmount - sharePerLease * (activeLeases.length - 1))
        : sharePerLease;

      storage.addUtilitySplit({
        Split_ID: splitId,
        Utility_Bill_ID: billId,
        Utility_Name: utilityType,
        Property_ID: propertyId,
        Unit_ID: l.Unit_ID,
        Tenant_ID: l.Tenant_ID,
        Allocated_Amount: splitAmt,
        Amount_Paid: 0,
        Balance: splitAmt,
        Status: 'Unpaid',
        Journal_Ref_ID: jId,
        Created_By: userEmail
      }, userEmail);

      jLines.push({
        Line_ID: `${jId}-DR-${idx + 1}`,
        Journal_ID: jId,
        Account_Code: '1110', // AR Utility
        Property_ID: propertyId,
        Unit_ID: l.Unit_ID,
        Tenant_ID: l.Tenant_ID,
        Debit_Amount: splitAmt,
        Credit_Amount: 0,
        Memo: `Tenant utility receivable — ${utilityType} (${billPeriod})`
      });
    });

    jLines.push({
      Line_ID: `${jId}-CR-EXP`,
      Journal_ID: jId,
      Account_Code: '5010', // Property Utilities Expense Credit / Recovery
      Property_ID: propertyId,
      Debit_Amount: 0,
      Credit_Amount: roundedAmount,
      Memo: `Master Utility Invoice Apportionment — ${provider}`
    });

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: new Date().toISOString().slice(0, 10),
      Description: `Master Utility Apportionment — ${utilityType} (${propertyId})`,
      Reference_Type: 'EXPENSE',
      Reference_ID: billId,
      Created_By: userEmail,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };
    storage.postJournal(header, jLines, userEmail);

    return { masterBillId: billId, splitCount: activeLeases.length, journalId: jId };
  }

  // Create Manual Utility Bill & Custom Apportionment (Multi-property / Divided property / Past tenant support)
  public static createManualUtilityBillAndSplits(
    primaryPropertyId: string,
    utilityType: string,
    provider: string,
    billPeriod: string,
    totalAmount: number,
    billReference: string,
    splits: Array<{
      propertyId: string;
      unitId: string;
      tenantId: string;
      allocatedAmount: number;
      percentageShare?: number;
      isPastTenant?: boolean;
      offsetFromDeposit?: boolean;
      notes?: string;
    }>,
    notes?: string,
    parentPropertyId?: string,
    userEmail = 'admin@dreamdwell.com'
  ): { masterBillId: string; splitCount: number; journalId: string } {
    const billId = 'UBILL-' + Date.now().toString(36).toUpperCase();
    const roundedAmount = this.round(totalAmount);

    if (!splits || splits.length === 0) {
      throw new Error('At least one tenant/unit split must be provided.');
    }

    const totalSplitAmt = this.round(splits.reduce((acc, s) => acc + (s.allocatedAmount || 0), 0));
    if (Math.abs(totalSplitAmt - roundedAmount) > 0.05) {
      throw new Error(`Total split amounts ($${totalSplitAmt.toFixed(2)}) must equal the master bill amount ($${roundedAmount.toFixed(2)}).`);
    }

    const jId = 'JRN-UBILL-' + billId;
    const bill: any = {
      Utility_Bill_ID: billId,
      Property_ID: primaryPropertyId,
      Parent_Property_ID: parentPropertyId || undefined,
      Utility_ID: utilityType,
      Utility_Type: utilityType,
      Bill_Date: new Date().toISOString().slice(0, 10),
      Due_Date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      Vendor: provider,
      Provider_Name: provider,
      Bill_Period: billPeriod,
      Master_Amount: roundedAmount,
      Total_Amount: roundedAmount,
      Bill_Reference: billReference || `INV-${Date.now()}`,
      Status: 'Allocated',
      Notes: notes || `Manual custom split apportioned across ${splits.length} units/tenants`,
      Created_By: userEmail
    };
    storage.addUtilityBill(bill, userEmail);

    const jLines: JournalLine[] = [];

    splits.forEach((s, idx) => {
      const splitId = `USPLIT-${billId}-${idx + 1}`;
      const splitAmt = this.round(s.allocatedAmount);
      const isOffset = !!s.offsetFromDeposit;

      storage.addUtilitySplit({
        Split_ID: splitId,
        Utility_Bill_ID: billId,
        Utility_Name: utilityType,
        Property_ID: s.propertyId || primaryPropertyId,
        Unit_ID: s.unitId,
        Tenant_ID: s.tenantId,
        Allocated_Amount: splitAmt,
        Amount_Paid: isOffset ? splitAmt : 0,
        Balance: isOffset ? 0 : splitAmt,
        Percentage_Share: s.percentageShare,
        Is_Past_Tenant: s.isPastTenant,
        Payment_Method: isOffset ? 'Security Deposit Offset' : undefined,
        Payment_Date: isOffset ? new Date().toISOString().slice(0, 10) : undefined,
        Deposit_Offset_Txn_ID: isOffset ? `DEP-OFF-${splitId}` : undefined,
        Status: isOffset ? 'Paid' : 'Unpaid',
        Journal_Ref_ID: jId,
        Notes: s.notes,
        Created_By: userEmail
      }, userEmail);

      // Debit AR Utilities
      jLines.push({
        Line_ID: `${jId}-DR-${idx + 1}`,
        Journal_ID: jId,
        Account_Code: '1110', // AR Utility
        Property_ID: s.propertyId || primaryPropertyId,
        Unit_ID: s.unitId,
        Tenant_ID: s.tenantId,
        Debit_Amount: splitAmt,
        Credit_Amount: 0,
        Memo: `Tenant utility receivable — ${utilityType} (${s.isPastTenant ? 'Past Tenant Offset' : billPeriod})`
      });

      // If offset immediately from security deposit
      if (isOffset) {
        // Record deposit offset transaction
        const depTxnId = `DEP-OFF-${splitId}`;
        storage.addDepositTransaction({
          Deposit_Txn_ID: depTxnId,
          Lease_ID: 'LEASE-OFFSET',
          Tenant_ID: s.tenantId,
          Property_ID: s.propertyId || primaryPropertyId,
          Unit_ID: s.unitId,
          Txn_Type: 'Payment',
          Due_Amount: 0,
          Paid_Amount: 0,
          Refund_Amount: splitAmt,
          Balance: 0,
          Txn_Date: new Date().toISOString().slice(0, 10),
          Status: 'Refunded',
          Reference: `Offset against utility bill ${billId} (${utilityType})`,
          Journal_Ref_ID: jId,
          Created_By: userEmail
        }, userEmail);

        // Journal line: Debit GL 2200 Tenant Deposits Held, Credit GL 1110 AR Utilities
        jLines.push({
          Line_ID: `${jId}-DR-DEP-${idx + 1}`,
          Journal_ID: jId,
          Account_Code: '2200', // Tenant Deposits Held Liability
          Property_ID: s.propertyId || primaryPropertyId,
          Unit_ID: s.unitId,
          Tenant_ID: s.tenantId,
          Debit_Amount: splitAmt,
          Credit_Amount: 0,
          Memo: `Security deposit holdback applied to utility bill ${billId}`
        });

        jLines.push({
          Line_ID: `${jId}-CR-ARUTIL-${idx + 1}`,
          Journal_ID: jId,
          Account_Code: '1110', // AR Utilities Credit (settling receivable)
          Property_ID: s.propertyId || primaryPropertyId,
          Unit_ID: s.unitId,
          Tenant_ID: s.tenantId,
          Debit_Amount: 0,
          Credit_Amount: splitAmt,
          Memo: `AR Utility cleared via security deposit deduction`
        });
      }
    });

    // Credit Property Utility Expense / Recovery
    jLines.push({
      Line_ID: `${jId}-CR-EXP`,
      Journal_ID: jId,
      Account_Code: '5010', // Property Utilities Expense Recovery
      Property_ID: primaryPropertyId,
      Debit_Amount: 0,
      Credit_Amount: roundedAmount,
      Memo: `Master Utility Invoice Apportionment — ${provider} (${billReference || 'Direct'})`
    });

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: new Date().toISOString().slice(0, 10),
      Description: `Manual Master Utility Apportionment — ${utilityType} (${primaryPropertyId})`,
      Reference_Type: 'EXPENSE',
      Reference_ID: billId,
      Created_By: userEmail,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };
    storage.postJournal(header, jLines, userEmail);

    return { masterBillId: billId, splitCount: splits.length, journalId: jId };
  }

  // Set-off an existing Utility Split against Tenant Security Deposit (for active or past tenants)
  public static offsetUtilitySplitFromDeposit(
    splitId: string,
    userEmail = 'admin@dreamdwell.com'
  ): { success: boolean; message: string; offsetAmount: number; journalId: string } {
    const split = storage.getUtilitySplits().find(s => s.Split_ID === splitId);
    if (!split) {
      throw new Error(`Utility split ${splitId} not found.`);
    }

    if (split.Status === 'Paid' || split.Balance <= 0) {
      throw new Error(`Utility split ${splitId} is already fully settled.`);
    }

    const offsetAmount = this.round(split.Balance);
    const jId = 'JRN-DEPOFF-' + Date.now().toString(36).toUpperCase();
    const depTxnId = `DEP-OFF-${splitId}`;

    // Record Deposit Offset Transaction
    storage.addDepositTransaction({
      Deposit_Txn_ID: depTxnId,
      Lease_ID: 'LEASE-DEPOSIT-OFFSET',
      Tenant_ID: split.Tenant_ID,
      Property_ID: split.Property_ID,
      Unit_ID: split.Unit_ID,
      Txn_Type: 'Payment',
      Due_Amount: 0,
      Paid_Amount: 0,
      Refund_Amount: offsetAmount,
      Balance: 0,
      Txn_Date: new Date().toISOString().slice(0, 10),
      Status: 'Refunded',
      Reference: `Deposit Offset for Utility Split ${split.Split_ID} (${split.Utility_Name})`,
      Journal_Ref_ID: jId,
      Created_By: userEmail
    }, userEmail);

    // Update the Utility Split
    const updatedSplit: UtilitySplit = {
      ...split,
      Status: 'Paid',
      Amount_Paid: split.Allocated_Amount,
      Balance: 0,
      Payment_Method: 'Security Deposit Offset',
      Payment_Date: new Date().toISOString().slice(0, 10),
      Deposit_Offset_Txn_ID: depTxnId,
      Notes: (split.Notes ? split.Notes + ' | ' : '') + `Set-off against security deposit on ${new Date().toISOString().slice(0, 10)}`
    };
    storage.updateUtilitySplit(updatedSplit, userEmail);

    // Double-entry journal: Debit GL 2200 (Tenant Deposits Held), Credit GL 1110 (AR Utilities)
    const jLines: JournalLine[] = [
      {
        Line_ID: `${jId}-DR-2200`,
        Journal_ID: jId,
        Account_Code: '2200', // Tenant Deposits Held
        Property_ID: split.Property_ID,
        Unit_ID: split.Unit_ID,
        Tenant_ID: split.Tenant_ID,
        Debit_Amount: offsetAmount,
        Credit_Amount: 0,
        Memo: `Security deposit deduction for utility split ${split.Split_ID}`
      },
      {
        Line_ID: `${jId}-CR-1110`,
        Journal_ID: jId,
        Account_Code: '1110', // Accounts Receivable - Utilities
        Property_ID: split.Property_ID,
        Unit_ID: split.Unit_ID,
        Tenant_ID: split.Tenant_ID,
        Debit_Amount: 0,
        Credit_Amount: offsetAmount,
        Memo: `AR Utility settlement via security deposit deduction`
      }
    ];

    const header: JournalHeader = {
      Journal_ID: jId,
      Date: new Date().toISOString().slice(0, 10),
      Description: `Deposit Offset for Utility Split ${split.Split_ID} (${split.Tenant_ID})`,
      Reference_Type: 'EXPENSE',
      Reference_ID: splitId,
      Created_By: userEmail,
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: new Date().toISOString()
    };
    storage.postJournal(header, jLines, userEmail);

    return {
      success: true,
      message: `Successfully set-off $${offsetAmount.toFixed(2)} from security deposit for split ${splitId}.`,
      offsetAmount,
      journalId: jId
    };
  }

  // Process Move-Out Settlement: Reconcile deposits, damages, and clear unit occupancy
  public static processMoveOut(
    leaseId: string,
    moveOutDate: string,
    damageAmount: number,
    inspectionNotes: string,
    userEmail = 'admin@dreamdwell.com'
  ): { moveOutId: string; depositRefund: number; journalId: string } {
    const lease = storage.getLeases().find(l => l.Lease_ID === leaseId);
    if (!lease) throw new Error(`Lease ${leaseId} not found.`);

    const moveOutId = 'MOVEOUT-' + Date.now().toString(36).toUpperCase();
    const damage = this.round(damageAmount);

    const deposits = storage.getDepositTransactions().filter(d => d.Tenant_ID === lease.Tenant_ID && d.Status === 'Received');
    const totalDeposit = deposits.reduce((s, d) => s + d.Paid_Amount, 0);

    const rents = storage.getRentTransactions().filter(r => r.Tenant_ID === lease.Tenant_ID && r.Status !== 'Paid');
    const rentDue = rents.reduce((s, r) => s + (r.Amount_Billed - r.Amount_Paid), 0);

    const depositRefund = Math.max(0, this.round(totalDeposit - damage - rentDue));
    const jId = 'JRN-MOVEOUT-' + moveOutId;

    // Journal: Debit Security Deposit Liability (2100) for full deposit,
    // Credit Repair Income / Offset (4010) for damage, Credit AR (1100) for rent due, Credit Bank (1010) for refund
    const jLines: JournalLine[] = [];

    if (totalDeposit > 0) {
      jLines.push({
        Line_ID: `${jId}-1`,
        Journal_ID: jId,
        Account_Code: '2100',
        Property_ID: lease.Property_ID,
        Unit_ID: lease.Unit_ID,
        Tenant_ID: lease.Tenant_ID,
        Debit_Amount: totalDeposit,
        Credit_Amount: 0,
        Memo: `Clear Security Deposit Liability on Move-Out`
      });

      if (damage > 0) {
        jLines.push({
          Line_ID: `${jId}-2`,
          Journal_ID: jId,
          Account_Code: '4010',
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Debit_Amount: 0,
          Credit_Amount: damage,
          Memo: `Deposit holdback for repair & maintenance damages`
        });
      }

      if (rentDue > 0) {
        jLines.push({
          Line_ID: `${jId}-3`,
          Journal_ID: jId,
          Account_Code: '1100',
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Tenant_ID: lease.Tenant_ID,
          Debit_Amount: 0,
          Credit_Amount: rentDue,
          Memo: `Deposit offset against outstanding rent arrears`
        });
      }

      if (depositRefund > 0) {
        jLines.push({
          Line_ID: `${jId}-4`,
          Journal_ID: jId,
          Account_Code: '1010',
          Property_ID: lease.Property_ID,
          Debit_Amount: 0,
          Credit_Amount: depositRefund,
          Memo: `Deposit Refund EFT to Tenant`
        });
      }

      const header: JournalHeader = {
        Journal_ID: jId,
        Date: moveOutDate,
        Description: `Tenant Move-Out Settlement — ${lease.Unit_ID}`,
        Reference_Type: 'MOVEOUT',
        Reference_ID: moveOutId,
        Created_By: userEmail,
        Status: 'POSTED',
        Period_ID: 'PER-2025',
        Created_At: new Date().toISOString()
      };
      storage.postJournal(header, jLines, userEmail);
    }

    storage.addMoveOut({
      MoveOut_ID: moveOutId,
      Lease_ID: leaseId,
      Tenant_ID: lease.Tenant_ID,
      Property_ID: lease.Property_ID,
      Unit_ID: lease.Unit_ID,
      MoveOut_Date: moveOutDate,
      Damage_Amount: damage,
      Deposit_Refund: depositRefund,
      Inspection_Notes: inspectionNotes,
      Status: 'Settled',
      Journal_Ref_ID: jId,
      Created_By: userEmail,
      Created_At: new Date().toISOString()
    }, userEmail);

    return { moveOutId, depositRefund, journalId: jId };
  }

  // Tax calculation helper for regional operations
  public static getTaxRate(province: RegionalProvince): number {
    return REGIONAL_PROVINCE_TAX[province]?.totalTaxRate || 0.13;
  }
}

