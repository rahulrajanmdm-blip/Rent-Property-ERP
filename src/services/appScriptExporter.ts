// Source generator for merged Google Apps Script Code.gs and Index.html v3.1

export const APPS_SCRIPT_CODE_GS_V3_1 = `// ============================================================================
// Dream Dwell ERP v3.1 — Production Google Apps Script (Code.gs)
// Canadian Lease & Property Management with Double-Entry Accounting
// ============================================================================

const API_VERSION = '3.1';
const SHEET_DB = SpreadsheetApp.getActiveSpreadsheet();
const CACHE = CacheService.getScriptCache();

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Dream Dwell ERP — Canadian Property & Lease Management')
    .setWidth(1280).setHeight(850)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ----------------------------------------------------------------------------
// DATABASE INITIALIZATION & SCHEMA BOOTSTRAP
// ----------------------------------------------------------------------------
function setupDatabase() {
  const tables = [
    'M_Users', 'M_Properties', 'M_Units', 'M_Landlords', 'M_Tenants', 'M_Utilities_Master',
    'M_ChartOfAccounts', 'M_Settings', 'M_Accounting_Periods', 'M_User_Tab_Access',
    'T_Bookings', 'T_Leases', 'T_MoveIns', 'T_MoveOuts', 'T_Tenant_ID_Proof',
    'T_Rent_Transactions', 'T_Deposit_Transactions', 'T_Landlord_Payments',
    'T_Utility_Bills', 'T_Utility_Splits', 'T_Collections', 'T_Excess_Payments', 'T_Refunds',
    'T_Inventory', 'A_Journal_Headers', 'A_Journal_Lines', 'A_Audit_Log'
  ];

  tables.forEach(name => {
    let sheet = SHEET_DB.getSheetByName(name);
    if (!sheet) sheet = SHEET_DB.insertSheet(name);
    else sheet.clear();
  });

  // Table Headers
  SHEET_DB.getSheetByName('M_Users').appendRow(['User_ID', 'Email', 'Full_Name', 'Password_Hash', 'Role', 'Is_Active', 'Last_OTP', 'OTP_Expiry', 'Session_Token', 'Session_Expiry', 'Created_Date']);
  SHEET_DB.getSheetByName('M_Properties').appendRow(['Property_ID', 'Name', 'Address', 'City', 'Province', 'Postal_Code', 'Country', 'Landlord_ID', 'Status', 'Notes', 'Created_Date']);
  SHEET_DB.getSheetByName('M_Units').appendRow(['Unit_ID', 'Property_ID', 'Unit_Name', 'Type', 'Bedrooms', 'Bathrooms', 'Target_Rent', 'Occupancy_Status', 'Notes', 'Created_Date']);
  SHEET_DB.getSheetByName('M_Tenants').appendRow(['Tenant_ID', 'Name', 'Email', 'Phone', 'Emergency_Contact', 'Emergency_Phone', 'Current_Unit_ID', 'Status', 'Created_Date']);
  SHEET_DB.getSheetByName('M_Landlords').appendRow(['Landlord_ID', 'Name', 'Email', 'Phone', 'Bank_Account', 'Bank_Name', 'Payment_Method', 'Created_Date']);
  
  const M_Utilities_Master = SHEET_DB.getSheetByName('M_Utilities_Master');
  M_Utilities_Master.appendRow(['Utility_ID', 'Name']);
  M_Utilities_Master.appendRow(['UTL-001', 'Hydro / Electricity']);
  M_Utilities_Master.appendRow(['UTL-002', 'City Water & Sewage']);
  M_Utilities_Master.appendRow(['UTL-003', 'Natural Gas / Enbridge']);
  M_Utilities_Master.appendRow(['UTL-004', 'High Speed Fibre Internet']);
  M_Utilities_Master.appendRow(['UTL-005', 'Municipal Property Taxes']);

  const M_ChartOfAccounts = SHEET_DB.getSheetByName('M_ChartOfAccounts');
  M_ChartOfAccounts.appendRow(['Account_Code', 'Account_Name', 'Account_Type', 'Account_Group', 'Normal_Balance', 'Is_Active']);
  const coa = [
    ['1000','Cash on Hand','Asset','Current Assets','Debit','TRUE'],
    ['1010','Operating Bank (TD / RBC)','Asset','Current Assets','Debit','TRUE'],
    ['1020','Savings / Trust Account','Asset','Current Assets','Debit','TRUE'],
    ['1100','Accounts Receivable - Rent','Asset','Current Assets','Debit','TRUE'],
    ['1110','Accounts Receivable - Utilities','Asset','Current Assets','Debit','TRUE'],
    ['1120','Deposit Receivable','Asset','Current Assets','Debit','TRUE'],
    ['1200','Prepaid Expenses & Insurance','Asset','Current Assets','Debit','TRUE'],
    ['1300','Property Maintenance Inventory','Asset','Current Assets','Debit','TRUE'],
    ['1500','Property Improvements & CapEx','Asset','Fixed Assets','Debit','TRUE'],
    ['2000','Accounts Payable - Vendors','Liability','Current Liabilities','Credit','TRUE'],
    ['2100','Landlord Payable (Net Rent Payouts)','Liability','Current Liabilities','Credit','TRUE'],
    ['2200','Tenant Deposits Held (Security/LMR)','Liability','Current Liabilities','Credit','TRUE'],
    ['2300','Unearned Revenue / Excess Payments','Liability','Current Liabilities','Credit','TRUE'],
    ['2400','GST / HST Payable','Liability','Current Liabilities','Credit','TRUE'],
    ['3000','Owner Capital & Equity','Equity','Capital','Credit','TRUE'],
    ['3100','Retained Earnings','Equity','Retained Earnings','Credit','TRUE'],
    ['4000','Gross Rent Revenue','Revenue','Operating Revenue','Credit','TRUE'],
    ['4010','Utility Recovery Revenue','Revenue','Operating Revenue','Credit','TRUE'],
    ['4020','Late Fees & Property Management Income','Revenue','Other Revenue','Credit','TRUE'],
    ['5000','Master Lease / Landlord Expense','Expense','Direct Costs','Debit','TRUE'],
    ['5010','Property Utilities Expense','Expense','Operating Expenses','Debit','TRUE'],
    ['5020','Repairs & Maintenance','Expense','Operating Expenses','Debit','TRUE'],
    ['5030','Cleaning, Turnover & Staging','Expense','Operating Expenses','Debit','TRUE'],
    ['5040','Property Management Commission','Expense','Operating Expenses','Debit','TRUE'],
    ['5100','Bank Charges & Processing','Expense','Administrative','Debit','TRUE'],
    ['5200','Software, Legal & Office','Expense','Administrative','Debit','TRUE'],
    ['5300','Bad Debt Expense','Expense','Administrative','Debit','TRUE']
  ];
  coa.forEach(row => M_ChartOfAccounts.appendRow(row));

  const M_Settings = SHEET_DB.getSheetByName('M_Settings');
  M_Settings.appendRow(['Setting_Key', 'Setting_Value']);
  M_Settings.appendRow(['Company_Name', 'Dream Dwell Properties Canada']);
  M_Settings.appendRow(['Currency', 'CAD']);
  M_Settings.appendRow(['Fiscal_Year_Start', '01-01']);
  M_Settings.appendRow(['Default_Bank_Account', '1010']);
  M_Settings.appendRow(['Default_Cash_Account', '1000']);
  M_Settings.appendRow(['App_Version', API_VERSION]);

  const M_Accounting_Periods = SHEET_DB.getSheetByName('M_Accounting_Periods');
  M_Accounting_Periods.appendRow(['Period_ID', 'Period_Name', 'Start_Date', 'End_Date', 'Is_Closed', 'Fiscal_Year']);
  M_Accounting_Periods.appendRow(['PER-2025', '2025', '2025-01-01', '2025-12-31', 'FALSE', '2025']);

  SHEET_DB.getSheetByName('M_User_Tab_Access').appendRow(['User_ID', 'Tab_Name', 'Has_Access']);
  SHEET_DB.getSheetByName('T_Rent_Transactions').appendRow(['Rent_ID', 'Lease_ID', 'Unit_ID', 'Tenant_ID', 'Month', 'Amount', 'Amount_Paid', 'Status', 'Journal_Ref', 'Due_Date', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Deposit_Transactions').appendRow(['Deposit_ID', 'Lease_ID', 'Tenant_ID', 'Amount_Due', 'Amount_Paid', 'Status', 'Journal_Ref', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Landlord_Payments').appendRow(['Landlord_Pay_ID', 'Property_ID', 'Landlord_ID', 'Period', 'Rent_Amount', 'Deductions', 'Net_Amount', 'Status', 'Payment_Date', 'Journal_Ref', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Leases').appendRow(['Lease_ID', 'Tenant_ID', 'Unit_ID', 'Property_ID', 'Start_Date', 'End_Date', 'Monthly_Rent', 'Security_Deposit', 'Last_Month_Rent', 'Status', 'Drive_Folder_ID', 'Journal_Ref_Initial', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Tenant_ID_Proof').appendRow(['ID_Proof_ID', 'Tenant_ID', 'ID_Type', 'ID_Number', 'Issue_Date', 'Expiry_Date', 'File_URL', 'Verified', 'Created_Date']);
  SHEET_DB.getSheetByName('T_MoveIns').appendRow(['MoveIn_ID', 'Lease_ID', 'Unit_ID', 'Tenant_ID', 'Move_In_Date', 'Initial_Condition', 'Notes', 'Created_Date']);
  SHEET_DB.getSheetByName('T_MoveOuts').appendRow(['MoveOut_ID', 'Lease_ID', 'Unit_ID', 'Tenant_ID', 'Move_Out_Date', 'Final_Condition', 'Damage_Amount', 'Deposit_Refund_Amount', 'Journal_Ref_Refund', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Utility_Bills').appendRow(['Bill_ID', 'Property_ID', 'Utility_ID', 'Vendor', 'Bill_Date', 'Master_Amount', 'Status', 'Journal_Ref', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Utility_Splits').appendRow(['Split_ID', 'Bill_ID', 'Unit_ID', 'Tenant_ID', 'Allocated_Amount', 'Amount_Paid', 'Status', 'Journal_Ref', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Collections').appendRow(['Collection_ID', 'Tenant_ID', 'Collection_Type', 'Amount', 'Payment_Method', 'Reference', 'Collection_Date', 'Journal_Ref', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Excess_Payments').appendRow(['Excess_ID', 'Tenant_ID', 'Excess_Amount', 'Resolution_Status', 'Payment_Date', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Refunds').appendRow(['Refund_ID', 'Lease_ID', 'Tenant_ID', 'Refund_Type', 'Amount', 'Status', 'Journal_Ref', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Bookings').appendRow(['Booking_ID', 'Tenant_ID', 'Unit_ID', 'Proposed_Move_In', 'Quoted_Rent', 'Application_Fee', 'Status', 'Created_Date']);
  SHEET_DB.getSheetByName('T_Inventory').appendRow(['Inventory_ID', 'Unit_ID', 'Item_Name', 'Condition', 'Value', 'Created_Date']);
  SHEET_DB.getSheetByName('A_Journal_Headers').appendRow(['Journal_ID', 'Journal_Date', 'Description', 'Reference_Type', 'Reference_ID', 'Created_By', 'Period_ID', 'Status', 'Created_Date']);
  SHEET_DB.getSheetByName('A_Journal_Lines').appendRow(['Line_ID', 'Journal_ID', 'Account_Code', 'Debit_Amount', 'Credit_Amount', 'Property_ID', 'Unit_ID', 'Tenant_ID', 'Memo']);
  SHEET_DB.getSheetByName('A_Audit_Log').appendRow(['Audit_ID', 'User_Email', 'Action', 'Module', 'Record_ID', 'Before_State', 'After_State', 'Timestamp']);

  // Admin User
  const adminHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'admin123', Utilities.Charset.UTF_8);
  const adminHashStr = adminHash.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
  SHEET_DB.getSheetByName('M_Users').appendRow(['USR-ADMIN', 'admin@dreamdwell.com', 'Alexander Wright (Managing Broker)', adminHashStr, 'Admin', 'TRUE', '', '', '', '', new Date()]);

  const allTabs = ['Dashboard', 'CollectionsBoard', 'Properties', 'Units', 'Landlords', 'LandlordPayments', 'Tenants', 'Bookings', 'Leases', 'MoveIn', 'MoveOut', 'Rent', 'Deposits', 'Utilities', 'Collections', 'Accounting', 'Reports', 'Administration'];
  const M_User_Tab = SHEET_DB.getSheetByName('M_User_Tab_Access');
  allTabs.forEach(tab => M_User_Tab.appendRow(['USR-ADMIN', tab, 'TRUE']));

  return { success: true, message: 'Database initialized successfully', version: API_VERSION };
}

// ----------------------------------------------------------------------------
// DOUBLE-ENTRY ACCOUNTING POSTING ENGINE
// ----------------------------------------------------------------------------
function postJournal_(date, desc, refType, refId, lines, userId) {
  const jId = 'JNL-' + Date.now();
  const period = getCurrentPeriod_();
  if (period && period.Is_Closed === 'TRUE') {
    throw new Error('Accounting period is closed. Cannot post.');
  }

  let totalDebit = 0, totalCredit = 0;
  lines.forEach(line => {
    totalDebit += Number(line.Debit_Amount) || 0;
    totalCredit += Number(line.Credit_Amount) || 0;
  });

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Journal not balanced. Debit: ' + totalDebit + ', Credit: ' + totalCredit);
  }

  append_('A_Journal_Headers', {
    Journal_ID: jId,
    Journal_Date: date,
    Description: desc,
    Reference_Type: refType,
    Reference_ID: refId,
    Created_By: userId,
    Period_ID: period ? period.Period_ID : 'OPEN',
    Status: 'POSTED',
    Created_Date: new Date()
  });

  lines.forEach((line, idx) => {
    append_('A_Journal_Lines', {
      Line_ID: jId + '-' + idx,
      Journal_ID: jId,
      Account_Code: line.Account_Code,
      Debit_Amount: Number(line.Debit_Amount) || 0,
      Credit_Amount: Number(line.Credit_Amount) || 0,
      Property_ID: line.Property_ID || '',
      Unit_ID: line.Unit_ID || '',
      Tenant_ID: line.Tenant_ID || '',
      Memo: line.Memo || ''
    });
  });

  return jId;
}

// ----------------------------------------------------------------------------
// TRIAL BALANCE WITH NORMAL BALANCE NATURE
// ----------------------------------------------------------------------------
function getTrialBalance(dateStr) {
  const journalLines = table_('A_Journal_Lines');
  const coa = table_('M_ChartOfAccounts');
  const balances = {};

  coa.forEach(acc => {
    balances[acc.Account_Code] = {
      Code: acc.Account_Code,
      Name: acc.Account_Name,
      Type: acc.Account_Type,
      NormalBalance: acc.Normal_Balance,
      Debit: 0,
      Credit: 0,
      Balance: 0
    };
  });

  journalLines.forEach(line => {
    if (!balances[line.Account_Code]) return;
    balances[line.Account_Code].Debit += Number(line.Debit_Amount) || 0;
    balances[line.Account_Code].Credit += Number(line.Credit_Amount) || 0;
  });

  // Normal Balance Nature:
  // Assets & Expenses: Net Debit = Debit - Credit
  // Liabilities, Equity, Revenue: Net Credit = Credit - Debit
  Object.keys(balances).forEach(code => {
    const acc = balances[code];
    if (['Asset', 'Expense'].includes(acc.Type)) {
      acc.Balance = acc.Debit - acc.Credit;
    } else {
      acc.Balance = acc.Credit - acc.Debit;
    }
  });

  const result = Object.values(balances);
  const totalDebits = result.reduce((s, a) => s + (a.Debit || 0), 0);
  const totalCredits = result.reduce((s, a) => s + (a.Credit || 0), 0);

  return {
    accounts: result,
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
  };
}

// ----------------------------------------------------------------------------
// IDEMPOTENT RENT GENERATOR
// ----------------------------------------------------------------------------
function generateMonthlyRent(month, propertyId, userId) {
  const leases = table_('T_Leases');
  const existingRent = table_('T_Rent_Transactions');
  const toGenerate = [];

  leases.forEach(lease => {
    if (propertyId && lease.Property_ID !== propertyId) return;
    if (lease.Status !== 'ACTIVE') return;

    const leaseStart = new Date(lease.Start_Date);
    const leaseEnd = new Date(lease.End_Date);
    const checkDate = new Date(month + '-01');
    if (checkDate < leaseStart || checkDate > leaseEnd) return;

    // Idempotency: Prevent duplicate rent bills for same lease & month
    const alreadyExists = existingRent.some(r => r.Lease_ID === lease.Lease_ID && r.Month === month);
    if (!alreadyExists) toGenerate.push(lease);
  });

  const jLines = [];
  const createdRents = [];

  toGenerate.forEach(lease => {
    const rentId = 'RENT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const dueDate = new Date(month + '-01');

    append_('T_Rent_Transactions', {
      Rent_ID: rentId,
      Lease_ID: lease.Lease_ID,
      Unit_ID: lease.Unit_ID,
      Tenant_ID: lease.Tenant_ID,
      Month: month,
      Amount: lease.Monthly_Rent,
      Amount_Paid: 0,
      Status: 'UNPAID',
      Due_Date: dueDate,
      Created_Date: new Date()
    });

    jLines.push({ Account_Code: '1100', Debit_Amount: lease.Monthly_Rent, Unit_ID: lease.Unit_ID, Tenant_ID: lease.Tenant_ID, Memo: 'Rent - ' + lease.Unit_ID });
    jLines.push({ Account_Code: '4000', Credit_Amount: lease.Monthly_Rent, Unit_ID: lease.Unit_ID, Tenant_ID: lease.Tenant_ID, Memo: 'Rent Rev - ' + lease.Unit_ID });
    createdRents.push(rentId);
  });

  if (jLines.length > 0) {
    postJournal_(new Date(), 'Monthly Rent Generation — ' + month, 'RENT_GENERATION', month, jLines, userId);
  }

  return { success: true, count: createdRents.length, generated: createdRents };
}

// ----------------------------------------------------------------------------
// LANDLORD PAYMENT WORKFLOW
// ----------------------------------------------------------------------------
function createLandlordPayment(propertyId, landlordId, period, rentAmount, deductions, userId) {
  const payId = 'LRDPAY-' + Date.now();
  const netAmount = Number(rentAmount || 0) - Number(deductions || 0);

  append_('T_Landlord_Payments', {
    Landlord_Pay_ID: payId,
    Property_ID: propertyId,
    Landlord_ID: landlordId,
    Period: period,
    Rent_Amount: rentAmount,
    Deductions: deductions,
    Net_Amount: netAmount,
    Status: 'POSTED',
    Payment_Date: new Date().toISOString().slice(0,10),
    Created_Date: new Date()
  });

  const lines = [
    { Account_Code: '5000', Debit_Amount: rentAmount, Memo: 'Landlord Gross Rent Distribution' },
    { Account_Code: '4020', Credit_Amount: deductions, Memo: 'Management Fee / Deduction Income' },
    { Account_Code: '1010', Credit_Amount: netAmount, Memo: 'Net EFT Rent Payout' }
  ];

  const jId = postJournal_(new Date(), 'Landlord Payout — ' + landlordId, 'Landlord_Payment', payId, lines, userId);
  updateById_('T_Landlord_Payments', 'Landlord_Pay_ID', payId, { Journal_Ref: jId });

  return { success: true, paymentId: payId, netAmount };
}

// ----------------------------------------------------------------------------
// TENANT ID PROOF MANAGEMENT
// ----------------------------------------------------------------------------
function addTenantIDProof(tenantId, idType, idNumber, issueDate, expiryDate, fileURL, userId) {
  const proofId = 'IDPROOF-' + Date.now();
  append_('T_Tenant_ID_Proof', {
    ID_Proof_ID: proofId,
    Tenant_ID: tenantId,
    ID_Type: idType,
    ID_Number: idNumber,
    Issue_Date: issueDate,
    Expiry_Date: expiryDate,
    File_URL: fileURL,
    Verified: 'TRUE',
    Created_Date: new Date()
  });
  return { success: true, proofId };
}

// ----------------------------------------------------------------------------
// EXCEL / CSV REPORT EXPORTS
// ----------------------------------------------------------------------------
function generateReportExcel(reportType, propertyId, startDate, endDate, token) {
  let data = [];
  let filename = '';

  if (reportType === 'rent_pending') {
    const rents = table_('T_Rent_Transactions').filter(r => r.Status !== 'PAID');
    data = [['Month', 'Tenant ID', 'Unit ID', 'Amount', 'Status', 'Due Date'],
      ...rents.map(r => [r.Month, r.Tenant_ID, r.Unit_ID, r.Amount, r.Status, r.Due_Date])
    ];
    filename = 'Rent_Pending_' + new Date().toISOString().slice(0, 10) + '.csv';
  } else if (reportType === 'utility_pending') {
    const utils = table_('T_Utility_Splits').filter(u => u.Status !== 'PAID');
    data = [['Bill ID', 'Unit ID', 'Tenant ID', 'Allocated Amount', 'Status'],
      ...utils.map(u => [u.Bill_ID, u.Unit_ID, u.Tenant_ID, u.Allocated_Amount, u.Status])
    ];
    filename = 'Utility_Pending_' + new Date().toISOString().slice(0, 10) + '.csv';
  } else if (reportType === 'move_out_current') {
    const moveOuts = table_('T_MoveOuts');
    data = [['Tenant ID', 'Unit ID', 'Move Out Date', 'Damage Amount', 'Deposit Refund'],
      ...moveOuts.map(m => [m.Tenant_ID, m.Unit_ID, m.Move_Out_Date, m.Damage_Amount, m.Deposit_Refund_Amount])
    ];
    filename = 'Current_Moveouts_' + new Date().toISOString().slice(0, 10) + '.csv';
  } else if (reportType === 'deposit_pending') {
    const deposits = table_('T_Deposit_Transactions').filter(d => d.Status !== 'PAID');
    data = [['Lease ID', 'Tenant ID', 'Amount Due', 'Amount Paid', 'Balance'],
      ...deposits.map(d => [d.Lease_ID, d.Tenant_ID, d.Amount_Due, d.Amount_Paid, Number(d.Amount_Due || 0) - Number(d.Amount_Paid || 0)])
    ];
    filename = 'Deposits_Pending_' + new Date().toISOString().slice(0, 10) + '.csv';
  }

  const csv = data.map(row => row.map(v => '"' + (v || '') + '"').join(',')).join('\\n');
  return { success: true, csv, filename };
}

// ----------------------------------------------------------------------------
// GENERIC HELPERS
// ----------------------------------------------------------------------------
function table_(name) {
  const sheet = SHEET_DB.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function append_(name, obj) {
  const sheet = SHEET_DB.getSheetByName(name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
}

function updateById_(name, idField, id, patch) {
  const sheet = SHEET_DB.getSheetByName(name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf(idField);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(id)) {
      Object.keys(patch).forEach(key => {
        const colIdx = headers.indexOf(key);
        if (colIdx >= 0) data[i][colIdx] = patch[key];
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      return true;
    }
  }
  return false;
}

function getCurrentPeriod_() {
  const periods = table_('M_Accounting_Periods');
  return periods.find(p => p.Is_Closed !== 'TRUE') || periods[0] || null;
}
`;

export const AppScriptExporter = {
  generateCompleteCodeGs: (): string => APPS_SCRIPT_CODE_GS_V3_1
};

