import {
  Property, Unit, Landlord, Tenant, TenantIDProof, Booking, Lease,
  LandlordPayment, RentTransaction, DepositTransaction, UtilityBill, UtilitySplit,
  CollectionRecord, ExcessPayment, RefundRecord, MoveInRecord, MoveOutRecord,
  ChartOfAccount, JournalHeader, JournalLine, AccountingPeriod, User, AuditEntry,
  UtilityCatalogItem
} from '../types/erp';

export const DEFAULT_COA: ChartOfAccount[] = [
  { Account_Code: '1000', Account_Name: 'Cash on Hand', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1010', Account_Name: 'Operating Bank (TD / RBC)', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1020', Account_Name: 'Savings / Trust Account', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1100', Account_Name: 'Accounts Receivable - Rent', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1110', Account_Name: 'Accounts Receivable - Utilities', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1120', Account_Name: 'Deposit Receivable', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1200', Account_Name: 'Prepaid Expenses & Insurance', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1300', Account_Name: 'Property Maintenance Inventory', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '1500', Account_Name: 'Property Improvements & CapEx', Account_Type: 'Asset', Account_Group: 'Fixed Assets', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '2000', Account_Name: 'Accounts Payable - Vendors', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2100', Account_Name: 'Landlord Payable (Net Rent Payouts)', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2200', Account_Name: 'Tenant Deposits Held (Security/LMR)', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2300', Account_Name: 'Unearned Revenue / Excess Payments', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2400', Account_Name: 'GST / HST Payable (Commercial/Ops)', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '3000', Account_Name: 'Owner Capital & Equity', Account_Type: 'Equity', Account_Group: 'Capital', Normal_Balance: 'Credit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '3100', Account_Name: 'Retained Earnings', Account_Type: 'Equity', Account_Group: 'Retained Earnings', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '4000', Account_Name: 'Gross Rent Revenue', Account_Type: 'Revenue', Account_Group: 'Operating Revenue', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '4010', Account_Name: 'Utility Recovery Revenue', Account_Type: 'Revenue', Account_Group: 'Operating Revenue', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '4020', Account_Name: 'Late Fees & Parking Income', Account_Type: 'Revenue', Account_Group: 'Other Revenue', Normal_Balance: 'Credit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5000', Account_Name: 'Master Lease / Landlord Expense', Account_Type: 'Expense', Account_Group: 'Direct Property Costs', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5010', Account_Name: 'Property Utilities Expense (Hydro/Gas/Water)', Account_Type: 'Expense', Account_Group: 'Operating Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5020', Account_Name: 'Repairs & Maintenance', Account_Type: 'Expense', Account_Group: 'Operating Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5030', Account_Name: 'Cleaning, Turnover & Staging', Account_Type: 'Expense', Account_Group: 'Operating Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5040', Account_Name: 'Property Management Commission', Account_Type: 'Expense', Account_Group: 'Operating Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5100', Account_Name: 'Bank Charges & Payment Processing', Account_Type: 'Expense', Account_Group: 'Administrative Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5200', Account_Name: 'Software, Legal & General Office', Account_Type: 'Expense', Account_Group: 'Administrative Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '5300', Account_Name: 'Bad Debt Expense', Account_Type: 'Expense', Account_Group: 'Administrative Expenses', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true }
];

export const ALL_ERP_TABS = [
  'Dashboard',
  'CollectionsBoard',
  'Properties',
  'Units',
  'Landlords',
  'LandlordPayments',
  'Tenants',
  'Bookings',
  'Leases',
  'MoveIn',
  'MoveOut',
  'Rent',
  'Deposits',
  'Utilities',
  'Collections',
  'Accounting',
  'Reports',
  'Administration',
  'AppsScriptHub'
];

interface ERPDataStore {
  users: User[];
  properties: Property[];
  units: Unit[];
  landlords: Landlord[];
  tenants: Tenant[];
  tenantIDProofs: TenantIDProof[];
  bookings: Booking[];
  leases: Lease[];
  landlordPayments: LandlordPayment[];
  rentTransactions: RentTransaction[];
  depositTransactions: DepositTransaction[];
  utilityBills: UtilityBill[];
  utilitySplits: UtilitySplit[];
  utilityCatalog: UtilityCatalogItem[];
  collections: CollectionRecord[];
  excessPayments: ExcessPayment[];
  refunds: RefundRecord[];
  moveIns: MoveInRecord[];
  moveOuts: MoveOutRecord[];
  coa: ChartOfAccount[];
  journalHeaders: JournalHeader[];
  journalLines: JournalLine[];
  accountingPeriods: AccountingPeriod[];
  auditLogs: AuditEntry[];
}

const STORAGE_KEY = 'canadian_lease_erp_v3_4';

function getInitialData(): ERPDataStore {
  const users: User[] = [
    {
      User_ID: 'USR-ADMIN',
      Email: 'admin@dreamdwell.com',
      Full_Name: 'Alexander Wright (Managing Broker)',
      Role: 'Admin',
      Is_Active: true,
      Password: 'admin',
      Phone: '(416) 555-0100',
      Created_At: '2025-01-01',
      Last_Login: new Date().toISOString(),
      Assigned_Tabs: [...ALL_ERP_TABS]
    },
    {
      User_ID: 'USR-FINANCE',
      Email: 'priya.kapoor@dreamdwell.com',
      Full_Name: 'Priya Kapoor (CPA / Controller)',
      Role: 'Finance',
      Is_Active: true,
      Password: 'admin',
      Phone: '(416) 555-0102',
      Created_At: '2025-02-01',
      Last_Login: '2025-08-28T14:30:00Z',
      Assigned_Tabs: ['Dashboard', 'CollectionsBoard', 'LandlordPayments', 'Rent', 'Deposits', 'Utilities', 'Collections', 'Accounting', 'Reports']
    },
    {
      User_ID: 'USR-OPS',
      Email: 'marcus.leblanc@dreamdwell.com',
      Full_Name: 'Marcus LeBlanc (Property Operations)',
      Role: 'Operations',
      Is_Active: true,
      Password: 'admin',
      Phone: '(604) 555-0105',
      Created_At: '2025-03-01',
      Last_Login: '2025-08-30T10:15:00Z',
      Assigned_Tabs: ['Dashboard', 'CollectionsBoard', 'Properties', 'Units', 'Landlords', 'Tenants', 'Bookings', 'Leases', 'MoveIn', 'MoveOut']
    }
  ];

  const landlords: Landlord[] = [
    {
      Landlord_ID: 'LAND-001',
      Full_Name: 'Michael & Catherine Chen',
      Email: 'chen.holdings@outlook.com',
      Phone: '(416) 555-0110',
      Address: '22 King St W, Suite 1400, Toronto, ON M5H 1J9',
      Payment_Method: 'EFT / Direct Deposit',
      Bank_Reference: 'RBC Royal Bank Transit #00002 Acct #1089201',
      Status: 'Active',
      Notes: 'Owns Maple Heights luxury residential building in Midtown Toronto.'
    },
    {
      Landlord_ID: 'LAND-002',
      Full_Name: 'Westcoast Horizons Asset Corp',
      Email: 'accounts@westcoasthorizons.ca',
      Phone: '(604) 555-0842',
      Address: '1055 W Georgia St, Vancouver, BC V6E 3P3',
      Payment_Method: 'EFT / Direct Deposit',
      Bank_Reference: 'TD Canada Trust Transit #90123 Acct #5839201',
      Status: 'Active',
      Notes: 'Commercial & Multi-residential portfolio in Downtown Vancouver.'
    },
    {
      Landlord_ID: 'LAND-003',
      Full_Name: 'Jean-Luc Gagnon',
      Email: 'jlgagnon.immo@videotron.ca',
      Phone: '(514) 555-3921',
      Address: '1100 Boulevard René-Lévesque O, Montréal, QC H3B 4N4',
      Payment_Method: 'Interac e-Transfer',
      Bank_Reference: 'Desjardins Transit #815 Acct #392819',
      Status: 'Active',
      Notes: 'Heritage loft apartments in Le Plateau-Mont-Royal.'
    }
  ];

  const properties: Property[] = [
    {
      Property_ID: 'PROP-001',
      Property_Name: 'Maple Heights Residences',
      Address: '120 Maple Ave, Midtown',
      City: 'Toronto',
      Province: 'ON',
      Postal_Code: 'M4B 1B3',
      Landlord_ID: 'LAND-001',
      Property_Status: 'Active',
      Master_Rent_Amount: 6500,
      Notes: '6-unit boutique apartment building near Yonge & St Clair.',
      Created_At: '2025-01-05'
    },
    {
      Property_ID: 'PROP-002',
      Property_Name: 'Harbourview Tower',
      Address: '88 Bay Street, Financial District',
      City: 'Toronto',
      Province: 'ON',
      Postal_Code: 'M5J 2N8',
      Landlord_ID: 'LAND-001',
      Property_Status: 'Active',
      Master_Rent_Amount: 11000,
      Notes: 'High-rise waterfront suites with panoramic lake views.',
      Created_At: '2025-01-10'
    },
    {
      Property_ID: 'PROP-003',
      Property_Name: 'Pacific Ocean Breeze',
      Address: '1420 Robson Street, West End',
      City: 'Vancouver',
      Province: 'BC',
      Postal_Code: 'V6G 1C1',
      Landlord_ID: 'LAND-002',
      Property_Status: 'Active',
      Master_Rent_Amount: 9200,
      Notes: 'Modern eco-certified residential community in Downtown Vancouver.',
      Created_At: '2025-02-01'
    },
    {
      Property_ID: 'PROP-004',
      Property_Name: 'Le Sanctuaire Mont-Royal',
      Address: '425 Avenue du Mont-Royal E',
      City: 'Montréal',
      Province: 'QC',
      Postal_Code: 'H2J 1W2',
      Landlord_ID: 'LAND-003',
      Property_Status: 'Active',
      Master_Rent_Amount: 5800,
      Notes: 'Renovated stone building in historic Plateau.',
      Created_At: '2025-02-15'
    },
    {
      Property_ID: 'PROP-005',
      Property_Name: '148 Spruce St - Main Floor',
      Address: '148 Spruce Street (Main Level)',
      City: 'Toronto',
      Province: 'ON',
      Postal_Code: 'M5A 2J5',
      Landlord_ID: 'LAND-001',
      Property_Status: 'Active',
      Master_Rent_Amount: 2400,
      Parent_Property_ID: 'PROP-005-PARENT',
      Division_Type: 'Main Floor',
      Meter_Tag: 'Shared Gas & Hydro Meter #148',
      Notes: 'Upper two levels of Victorian semi-detached. Shares main utility meter with basement suite.',
      Created_At: '2025-02-01'
    },
    {
      Property_ID: 'PROP-006',
      Property_Name: '148 Spruce St - Basement Suite',
      Address: '148 Spruce Street (Lower Suite)',
      City: 'Toronto',
      Province: 'ON',
      Postal_Code: 'M5A 2J5',
      Landlord_ID: 'LAND-001',
      Property_Status: 'Active',
      Master_Rent_Amount: 1600,
      Parent_Property_ID: 'PROP-005-PARENT',
      Division_Type: 'Basement Suite',
      Meter_Tag: 'Shared Gas & Hydro Meter #148',
      Notes: 'Separate entrance basement apartment. Shares master gas/water/hydro bills with main floor.',
      Created_At: '2025-02-01'
    }
  ];

  const units: Unit[] = [
    { Unit_ID: 'UNIT-101', Property_ID: 'PROP-001', Unit_Number_Name: 'Suite 101', Unit_Type: '1BR + Den', Target_Rent: 2250, Current_Status: 'Occupied', Bedrooms: 1, Bathrooms: 1, Notes: 'Renovated quartz kitchen, balcony facing South.' },
    { Unit_ID: 'UNIT-102', Property_ID: 'PROP-001', Unit_Number_Name: 'Suite 102', Unit_Type: '2BR / 2BA', Target_Rent: 2850, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 2, Notes: 'Corner unit with in-suite laundry.' },
    { Unit_ID: 'UNIT-103', Property_ID: 'PROP-001', Unit_Number_Name: 'Suite 103', Unit_Type: 'Studio Deluxe', Target_Rent: 1750, Current_Status: 'Vacant', Bedrooms: 0, Bathrooms: 1, Notes: 'Freshly painted, available for immediate lease.' },
    { Unit_ID: 'UNIT-201', Property_ID: 'PROP-002', Unit_Number_Name: 'Suite 2405', Unit_Type: '2BR Luxury Suite', Target_Rent: 3600, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 2, Notes: 'Lake Ontario view, 1 underground parking stall.' },
    { Unit_ID: 'UNIT-202', Property_ID: 'PROP-002', Unit_Number_Name: 'Penthouse 02', Unit_Type: '3BR Executive Penthouse', Target_Rent: 5400, Current_Status: 'Vacant', Bedrooms: 3, Bathrooms: 3, Notes: 'Wrap-around terrace, private elevator access.' },
    { Unit_ID: 'UNIT-301', Property_ID: 'PROP-003', Unit_Number_Name: 'Suite 408', Unit_Type: '1BR West End', Target_Rent: 2400, Current_Status: 'Occupied', Bedrooms: 1, Bathrooms: 1, Notes: 'Minutes to Stanley Park and English Bay.' },
    { Unit_ID: 'UNIT-302', Property_ID: 'PROP-003', Unit_Number_Name: 'Suite 602', Unit_Type: '2BR Penthouse', Target_Rent: 3950, Current_Status: 'Maintenance', Bedrooms: 2, Bathrooms: 2, Notes: 'Bathroom regrouting and heat pump servicing in progress.' },
    { Unit_ID: 'UNIT-401', Property_ID: 'PROP-004', Unit_Number_Name: 'Appartement 3A', Unit_Type: '2BR Plateau Loft', Target_Rent: 2100, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 1, Notes: 'High ceilings, exposed brick, original hardwood.' },
    { Unit_ID: 'UNIT-501', Property_ID: 'PROP-005', Unit_Number_Name: 'Main Floor Living Unit', Unit_Type: '2BR Upper Suite', Target_Rent: 2400, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 1, Notes: 'Main & upper floors of 148 Spruce.' },
    { Unit_ID: 'UNIT-601', Property_ID: 'PROP-006', Unit_Number_Name: 'Basement Apartment', Unit_Type: '1BR Basement Suite', Target_Rent: 1600, Current_Status: 'Occupied', Bedrooms: 1, Bathrooms: 1, Notes: 'Lower level suite with separate side entry.' }
  ];

  const tenants: Tenant[] = [
    {
      Tenant_ID: 'TEN-001',
      Full_Name: 'Sarah Jean Thompson',
      Email: 'sarah.thompson@bell.net',
      Phone: '(647) 555-0199',
      Emergency_Contact: 'Dr. John Thompson (Father) - (647) 555-0200',
      Status: 'Active',
      Current_Property_ID: 'PROP-001',
      Current_Unit_ID: 'UNIT-101',
      Created_At: '2025-01-10',
      Notes: 'Employed at University Health Network (Toronto General).'
    },
    {
      Tenant_ID: 'TEN-002',
      Full_Name: 'David Nnamdi Okafor',
      Email: 'david.okafor@shopify.com',
      Phone: '(416) 555-0134',
      Emergency_Contact: 'Amara Okafor (Sister) - (416) 555-0188',
      Status: 'Active',
      Current_Property_ID: 'PROP-001',
      Current_Unit_ID: 'UNIT-102',
      Created_At: '2025-01-12',
      Notes: 'Senior Software Engineer, setup on automatic pre-authorized debit.'
    },
    {
      Tenant_ID: 'TEN-003',
      Full_Name: 'Liam & Emma MacIntyre',
      Email: 'l.macintyre@scotiabank.com',
      Phone: '(416) 555-9082',
      Emergency_Contact: 'Robert MacIntyre - (905) 555-8812',
      Status: 'Active',
      Current_Property_ID: 'PROP-002',
      Current_Unit_ID: 'UNIT-201',
      Created_At: '2025-02-01',
      Notes: 'Corporate executive lease, flawless payment record.'
    },
    {
      Tenant_ID: 'TEN-004',
      Full_Name: 'Chloe Tremblay',
      Email: 'chloe.tremblay@ubc.ca',
      Phone: '(604) 555-4421',
      Emergency_Contact: 'Marc Tremblay - (514) 555-7733',
      Status: 'Active',
      Current_Property_ID: 'PROP-003',
      Current_Unit_ID: 'UNIT-301',
      Created_At: '2025-03-01',
      Notes: 'UBC Postdoctoral Researcher.'
    },
    {
      Tenant_ID: 'TEN-005',
      Full_Name: 'Mathieu Bélanger',
      Email: 'm.belanger@hydroquebec.com',
      Phone: '(514) 555-6677',
      Emergency_Contact: 'Sophie Bélanger - (514) 555-6688',
      Status: 'Active',
      Current_Property_ID: 'PROP-004',
      Current_Unit_ID: 'UNIT-401',
      Created_At: '2025-02-20',
      Notes: 'Permanent Hydro-Québec engineer.'
    },
    {
      Tenant_ID: 'TEN-006',
      Full_Name: 'Lucas Vance (Main Floor)',
      Email: 'lucas.vance@gmail.com',
      Phone: '(416) 555-0811',
      Emergency_Contact: 'Clara Vance - (416) 555-0812',
      Status: 'Active',
      Current_Property_ID: 'PROP-005',
      Current_Unit_ID: 'UNIT-501',
      Created_At: '2025-02-01',
      Notes: 'Architect tenant, pays 60% of shared gas and hydro bills.'
    },
    {
      Tenant_ID: 'TEN-007',
      Full_Name: 'Emily Zhao (Basement Suite)',
      Email: 'emily.zhao@utoronto.ca',
      Phone: '(416) 555-0922',
      Emergency_Contact: 'Helen Zhao - (416) 555-0923',
      Status: 'Active',
      Current_Property_ID: 'PROP-006',
      Current_Unit_ID: 'UNIT-601',
      Created_At: '2025-02-01',
      Notes: 'U of T graduate student, pays 40% of shared gas and hydro bills.'
    },
    {
      Tenant_ID: 'TEN-008',
      Full_Name: 'Jordan Miller (Moved Out Past Tenant)',
      Email: 'jordan.miller.past@gmail.com',
      Phone: '(647) 555-3344',
      Emergency_Contact: 'Gary Miller - (647) 555-3345',
      Status: 'Inactive',
      Current_Property_ID: 'PROP-001',
      Current_Unit_ID: 'UNIT-103',
      Created_At: '2024-06-01',
      Notes: 'Moved out July 31. Security deposit of $1,500 held in trust for final utility reconciliations.'
    }
  ];

  const tenantIDProofs: TenantIDProof[] = [
    {
      ID_Proof_ID: 'IDP-001',
      Tenant_ID: 'TEN-001',
      ID_Type: 'Driver License',
      ID_Number: 'T4829-10928-39201',
      Issue_Date: '2022-05-14',
      Expiry_Date: '2027-05-14',
      File_URL: 'https://drive.google.com/file/d/demo-ontario-dl-sarah',
      Verified: true,
      Created_Date: '2025-01-10'
    },
    {
      ID_Proof_ID: 'IDP-002',
      Tenant_ID: 'TEN-002',
      ID_Type: 'Passport',
      ID_Number: 'CA9948210',
      Issue_Date: '2021-08-20',
      Expiry_Date: '2031-08-20',
      File_URL: 'https://drive.google.com/file/d/demo-passport-david',
      Verified: true,
      Created_Date: '2025-01-12'
    },
    {
      ID_Proof_ID: 'IDP-003',
      Tenant_ID: 'TEN-003',
      ID_Type: 'Driver License',
      ID_Number: 'M9283-48192-09281',
      Issue_Date: '2023-01-10',
      Expiry_Date: '2028-01-10',
      File_URL: 'https://drive.google.com/file/d/demo-ontario-dl-liam',
      Verified: true,
      Created_Date: '2025-02-01'
    },
    {
      ID_Proof_ID: 'IDP-004',
      Tenant_ID: 'TEN-004',
      ID_Type: 'Provincial Photo ID',
      ID_Number: 'BC-8839201-9',
      Issue_Date: '2024-02-15',
      Expiry_Date: '2029-02-15',
      File_URL: 'https://drive.google.com/file/d/demo-bc-photocard-chloe',
      Verified: true,
      Created_Date: '2025-03-01'
    }
  ];

  const bookings: Booking[] = [
    {
      Booking_ID: 'BOOK-001',
      Applicant_Name: 'Jonathan Vance',
      Email: 'jvance.legal@gmail.com',
      Phone: '(416) 555-7799',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-103',
      Booking_Date: '2025-08-15',
      Expected_Move_In: '2025-10-01',
      Quoted_Rent: 1750,
      Deposit_Required: 1750,
      Status: 'Pending',
      Notes: 'Application under credit review with Equifax Canada.',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-08-15'
    }
  ];

  const leases: Lease[] = [
    {
      Lease_ID: 'LEASE-001',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Lease_Start: '2025-01-15',
      Lease_End: '2026-01-14',
      Monthly_Rent: 2250,
      Deposit_Required: 2250,
      Deposit_Received: 2250,
      Last_Month_Rent: 2250,
      Status: 'Active',
      Drive_Folder_URL: 'https://drive.google.com/drive/folders/lease-001-sarah-thompson',
      Notes: 'Standard Ontario Residential Tenancy Agreement (Form 2229E).',
      Created_At: '2025-01-10'
    },
    {
      Lease_ID: 'LEASE-002',
      Tenant_ID: 'TEN-002',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Lease_Start: '2025-02-01',
      Lease_End: '2026-01-31',
      Monthly_Rent: 2850,
      Deposit_Required: 2850,
      Deposit_Received: 2850,
      Last_Month_Rent: 2850,
      Status: 'Active',
      Drive_Folder_URL: 'https://drive.google.com/drive/folders/lease-002-david-okafor',
      Notes: 'Includes key deposit of $200 and Last Month Rent.',
      Created_At: '2025-01-15'
    },
    {
      Lease_ID: 'LEASE-003',
      Tenant_ID: 'TEN-003',
      Property_ID: 'PROP-002',
      Unit_ID: 'UNIT-201',
      Lease_Start: '2025-02-15',
      Lease_End: '2026-02-14',
      Monthly_Rent: 3600,
      Deposit_Required: 3600,
      Deposit_Received: 3600,
      Last_Month_Rent: 3600,
      Status: 'Active',
      Drive_Folder_URL: 'https://drive.google.com/drive/folders/lease-003-liam-macintyre',
      Notes: 'Harbourview Tower luxury tenancy.',
      Created_At: '2025-02-01'
    },
    {
      Lease_ID: 'LEASE-004',
      Tenant_ID: 'TEN-004',
      Property_ID: 'PROP-003',
      Unit_ID: 'UNIT-301',
      Lease_Start: '2025-03-01',
      Lease_End: '2026-02-28',
      Monthly_Rent: 2400,
      Deposit_Required: 1200, // BC standard is 1/2 month rent security deposit
      Deposit_Received: 1200,
      Last_Month_Rent: 0,
      Status: 'Active',
      Drive_Folder_URL: 'https://drive.google.com/drive/folders/lease-004-chloe-tremblay',
      Notes: 'BC Residential Tenancy Branch (RTB-1) standard lease.',
      Created_At: '2025-02-20'
    },
    {
      Lease_ID: 'LEASE-005',
      Tenant_ID: 'TEN-005',
      Property_ID: 'PROP-004',
      Unit_ID: 'UNIT-401',
      Lease_Start: '2025-03-01',
      Lease_End: '2026-06-30',
      Monthly_Rent: 2100,
      Deposit_Required: 0, // Quebec civil code strictly prohibits security deposits
      Deposit_Received: 0,
      Last_Month_Rent: 2100,
      Status: 'Active',
      Drive_Folder_URL: 'https://drive.google.com/drive/folders/lease-005-mathieu-belanger',
      Notes: 'Tribunal administratif du logement (TAL) mandatory lease form.',
      Created_At: '2025-02-22'
    }
  ];

  const landlordPayments: LandlordPayment[] = [
    {
      Landlord_Pay_ID: 'LRDPAY-001',
      Property_ID: 'PROP-001',
      Landlord_ID: 'LAND-001',
      Period: '2025-07',
      Rent_Amount: 5100,
      Deductions: 408, // 8% management fee
      Net_Amount: 4692,
      Status: 'Posted',
      Payment_Date: '2025-07-15',
      Journal_Ref_ID: 'JRN-LPAY-01',
      Notes: 'July net rent disbursement after 8% management fee.',
      Created_Date: '2025-07-15',
      Created_By: 'priya.kapoor@dreamdwell.com'
    },
    {
      Landlord_Pay_ID: 'LRDPAY-002',
      Property_ID: 'PROP-002',
      Landlord_ID: 'LAND-001',
      Period: '2025-07',
      Rent_Amount: 3600,
      Deductions: 288,
      Net_Amount: 3312,
      Status: 'Posted',
      Payment_Date: '2025-07-15',
      Journal_Ref_ID: 'JRN-LPAY-02',
      Notes: 'July Harbourview 2405 disbursement.',
      Created_Date: '2025-07-15',
      Created_By: 'priya.kapoor@dreamdwell.com'
    },
    {
      Landlord_Pay_ID: 'LRDPAY-003',
      Property_ID: 'PROP-001',
      Landlord_ID: 'LAND-001',
      Period: '2025-08',
      Rent_Amount: 5100,
      Deductions: 558, // $408 fee + $150 plumbing repair
      Net_Amount: 4542,
      Status: 'Pending',
      Payment_Date: '2025-08-15',
      Notes: 'August payout pending bank batch confirmation.',
      Created_Date: '2025-08-10',
      Created_By: 'priya.kapoor@dreamdwell.com'
    }
  ];

  const rentTransactions: RentTransaction[] = [
    {
      Rent_Txn_ID: 'RENT-202507-001',
      Lease_ID: 'LEASE-001',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Period_Month: '2025-07',
      Due_Date: '2025-07-01',
      Amount_Billed: 2250,
      Amount_Paid: 2250,
      Balance: 0,
      Payment_Date: '2025-07-01',
      Payment_Method: 'Interac e-Transfer',
      Reference: 'EFT-8849102',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-RNT-0701',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-06-28'
    },
    {
      Rent_Txn_ID: 'RENT-202507-002',
      Lease_ID: 'LEASE-002',
      Tenant_ID: 'TEN-002',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Period_Month: '2025-07',
      Due_Date: '2025-07-01',
      Amount_Billed: 2850,
      Amount_Paid: 2850,
      Balance: 0,
      Payment_Date: '2025-07-02',
      Payment_Method: 'Pre-Authorized Debit',
      Reference: 'PAD-492019',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-RNT-0702',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-06-28'
    },
    {
      Rent_Txn_ID: 'RENT-202508-001',
      Lease_ID: 'LEASE-001',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Period_Month: '2025-08',
      Due_Date: '2025-08-01',
      Amount_Billed: 2250,
      Amount_Paid: 2250,
      Balance: 0,
      Payment_Date: '2025-08-01',
      Payment_Method: 'Interac e-Transfer',
      Reference: 'EFT-9910293',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-RNT-0801',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-07-28'
    },
    {
      Rent_Txn_ID: 'RENT-202508-002',
      Lease_ID: 'LEASE-002',
      Tenant_ID: 'TEN-002',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Period_Month: '2025-08',
      Due_Date: '2025-08-01',
      Amount_Billed: 2850,
      Amount_Paid: 2850,
      Balance: 0,
      Payment_Date: '2025-08-02',
      Payment_Method: 'Pre-Authorized Debit',
      Reference: 'PAD-993011',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-RNT-0802',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-07-28'
    },
    {
      Rent_Txn_ID: 'RENT-202508-003',
      Lease_ID: 'LEASE-003',
      Tenant_ID: 'TEN-003',
      Property_ID: 'PROP-002',
      Unit_ID: 'UNIT-201',
      Period_Month: '2025-08',
      Due_Date: '2025-08-01',
      Amount_Billed: 3600,
      Amount_Paid: 3600,
      Balance: 0,
      Payment_Date: '2025-08-01',
      Payment_Method: 'Wire Transfer',
      Reference: 'WIRE-382910',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-RNT-0803',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-07-28'
    },
    {
      Rent_Txn_ID: 'RENT-202508-004',
      Lease_ID: 'LEASE-004',
      Tenant_ID: 'TEN-004',
      Property_ID: 'PROP-003',
      Unit_ID: 'UNIT-301',
      Period_Month: '2025-08',
      Due_Date: '2025-08-01',
      Amount_Billed: 2400,
      Amount_Paid: 1200,
      Balance: 1200,
      Payment_Date: '2025-08-05',
      Payment_Method: 'Interac e-Transfer',
      Reference: 'EFT-772910',
      Status: 'Partial',
      Journal_Ref_ID: 'JRN-RNT-0804',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-07-28'
    },
    {
      Rent_Txn_ID: 'RENT-202508-005',
      Lease_ID: 'LEASE-005',
      Tenant_ID: 'TEN-005',
      Property_ID: 'PROP-004',
      Unit_ID: 'UNIT-401',
      Period_Month: '2025-08',
      Due_Date: '2025-08-01',
      Amount_Billed: 2100,
      Amount_Paid: 0,
      Balance: 2100,
      Status: 'Unpaid',
      Journal_Ref_ID: 'JRN-RNT-0805',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-07-28'
    }
  ];

  const depositTransactions: DepositTransaction[] = [
    {
      Deposit_Txn_ID: 'DEP-001',
      Lease_ID: 'LEASE-001',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Txn_Type: 'Payment',
      Due_Amount: 2250,
      Paid_Amount: 2250,
      Refund_Amount: 0,
      Balance: 0,
      Txn_Date: '2025-01-10',
      Status: 'Received',
      Journal_Ref_ID: 'JRN-DEP-01',
      Reference: 'CERT-CHQ-1092',
      Created_By: 'admin@dreamdwell.com'
    },
    {
      Deposit_Txn_ID: 'DEP-002',
      Lease_ID: 'LEASE-002',
      Tenant_ID: 'TEN-002',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Txn_Type: 'Payment',
      Due_Amount: 2850,
      Paid_Amount: 2850,
      Refund_Amount: 0,
      Balance: 0,
      Txn_Date: '2025-01-15',
      Status: 'Received',
      Journal_Ref_ID: 'JRN-DEP-02',
      Reference: 'EFT-DEPOSIT-201',
      Created_By: 'admin@dreamdwell.com'
    },
    {
      Deposit_Txn_ID: 'DEP-004',
      Lease_ID: 'LEASE-004',
      Tenant_ID: 'TEN-004',
      Property_ID: 'PROP-003',
      Unit_ID: 'UNIT-301',
      Txn_Type: 'Payment',
      Due_Amount: 1200,
      Paid_Amount: 600,
      Refund_Amount: 0,
      Balance: 600,
      Txn_Date: '2025-02-28',
      Status: 'Partial',
      Journal_Ref_ID: 'JRN-DEP-04',
      Reference: 'E-TRANSFER-PARTIAL',
      Created_By: 'admin@dreamdwell.com'
    }
  ];

  const utilityBills: UtilityBill[] = [
    {
      Utility_Bill_ID: 'UBILL-001',
      Property_ID: 'PROP-001',
      Utility_ID: 'UTL-001',
      Bill_Date: '2025-07-15',
      Due_Date: '2025-08-05',
      Vendor: 'Toronto Hydro Corporation',
      Master_Amount: 480.50,
      Bill_Reference: 'TH-2025-JUL-99120',
      Status: 'Allocated',
      Notes: 'Mid-summer cooling peak bill.',
      Created_By: 'priya.kapoor@dreamdwell.com'
    },
    {
      Utility_Bill_ID: 'UBILL-002',
      Property_ID: 'PROP-001',
      Utility_ID: 'UTL-002',
      Bill_Date: '2025-07-20',
      Due_Date: '2025-08-10',
      Vendor: 'City of Toronto Water Services',
      Master_Amount: 310.00,
      Bill_Reference: 'TO-WTR-Q2-8821',
      Status: 'Allocated',
      Notes: 'Quarterly metered water utility.',
      Created_By: 'priya.kapoor@dreamdwell.com'
    },
    {
      Utility_Bill_ID: 'UBILL-003',
      Property_ID: 'PROP-003',
      Utility_ID: 'UTL-001',
      Bill_Date: '2025-08-01',
      Due_Date: '2025-08-20',
      Vendor: 'BC Hydro',
      Master_Amount: 220.00,
      Bill_Reference: 'BCH-AUG-48190',
      Status: 'Open',
      Notes: 'Pending sub-metering breakdown.',
      Created_By: 'priya.kapoor@dreamdwell.com'
    }
  ];

  const utilitySplits: UtilitySplit[] = [
    {
      Split_ID: 'USPL-001',
      Utility_Bill_ID: 'UBILL-001',
      Utility_Name: 'Hydro / Electricity',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Tenant_ID: 'TEN-001',
      Allocated_Amount: 240.25,
      Amount_Paid: 240.25,
      Balance: 0,
      Payment_Date: '2025-08-01',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-UTIL-01',
      Created_By: 'priya.kapoor@dreamdwell.com'
    },
    {
      Split_ID: 'USPL-002',
      Utility_Bill_ID: 'UBILL-001',
      Utility_Name: 'Hydro / Electricity',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Tenant_ID: 'TEN-002',
      Allocated_Amount: 240.25,
      Amount_Paid: 0,
      Balance: 240.25,
      Status: 'Unpaid',
      Journal_Ref_ID: 'JRN-UTIL-02',
      Created_By: 'priya.kapoor@dreamdwell.com'
    }
  ];

  const collections: CollectionRecord[] = [
    {
      Collection_ID: 'COL-001',
      Collection_Date: '2025-08-01',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Collection_Type: 'Rent',
      Amount: 2250,
      Payment_Method: 'Interac e-Transfer',
      Reference: 'EFT-9910293',
      Applied_To: 'RENT-202508-001',
      Notes: 'August rent received on 1st.',
      Journal_Ref_ID: 'JRN-COL-001',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-08-01'
    },
    {
      Collection_ID: 'COL-002',
      Collection_Date: '2025-08-02',
      Tenant_ID: 'TEN-002',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Collection_Type: 'Rent',
      Amount: 2850,
      Payment_Method: 'Pre-Authorized Debit',
      Reference: 'PAD-993011',
      Applied_To: 'RENT-202508-002',
      Notes: 'August PAD executed.',
      Journal_Ref_ID: 'JRN-COL-002',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-08-02'
    },
    {
      Collection_ID: 'COL-003',
      Collection_Date: '2025-08-01',
      Tenant_ID: 'TEN-003',
      Property_ID: 'PROP-002',
      Unit_ID: 'UNIT-201',
      Collection_Type: 'Rent',
      Amount: 3600,
      Payment_Method: 'Wire Transfer',
      Reference: 'WIRE-382910',
      Applied_To: 'RENT-202508-003',
      Notes: 'Harbourview Penthouse rent.',
      Journal_Ref_ID: 'JRN-COL-003',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-08-01'
    },
    {
      Collection_ID: 'COL-004',
      Collection_Date: '2025-08-05',
      Tenant_ID: 'TEN-004',
      Property_ID: 'PROP-003',
      Unit_ID: 'UNIT-301',
      Collection_Type: 'Rent',
      Amount: 1200,
      Payment_Method: 'Interac e-Transfer',
      Reference: 'EFT-772910',
      Applied_To: 'RENT-202508-004',
      Notes: 'Partial rent payment. Balance $1200 due Aug 15.',
      Journal_Ref_ID: 'JRN-COL-004',
      Created_By: 'admin@dreamdwell.com',
      Created_At: '2025-08-05'
    }
  ];

  const excessPayments: ExcessPayment[] = [
    {
      Excess_ID: 'EXC-001',
      Collection_ID: 'COL-005-DEMO',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Payment_Date: '2025-07-28',
      Excess_Amount: 100,
      Resolution_Status: 'Unresolved',
      Notes: 'Tenant rounded up payment by $100 for key replacement credit.',
      Journal_Ref_ID: 'JRN-EXC-01'
    }
  ];

  const refunds: RefundRecord[] = [
    {
      Refund_ID: 'REF-001',
      Tenant_ID: 'TEN-003',
      Property_ID: 'PROP-002',
      Unit_ID: 'UNIT-201',
      Refund_Type: 'Deposit Adjustment',
      Amount: 150,
      Refund_Date: '2025-08-10',
      Payment_Method: 'EFT / Direct Deposit',
      Status: 'Paid',
      Reason: 'Key deposit refund after duplicate FOB return.',
      Journal_Ref_ID: 'JRN-REF-01',
      Created_By: 'priya.kapoor@dreamdwell.com'
    }
  ];

  const moveIns: MoveInRecord[] = [
    {
      MoveIn_ID: 'MIN-001',
      Lease_ID: 'LEASE-001',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      MoveIn_Date: '2025-01-15',
      Meter_Reading: 'Hydro: 49102 kWh, Gas: 102.4 m3',
      Condition_Notes: 'Walls pristine, appliances brand new, smoke detectors certified.',
      Keys_Provided: 2,
      Inspection_Passed: true,
      Created_By: 'marcus.leblanc@dreamdwell.com'
    }
  ];

  const moveOuts: MoveOutRecord[] = [];

  const accountingPeriods: AccountingPeriod[] = [
    {
      Period_ID: 'PER-2025',
      Period_Name: 'Fiscal Year 2025',
      Start_Date: '2025-01-01',
      End_Date: '2025-12-31',
      Status: 'OPEN'
    },
    {
      Period_ID: 'PER-2024',
      Period_Name: 'Fiscal Year 2024',
      Start_Date: '2024-01-01',
      End_Date: '2024-12-31',
      Status: 'Closed',
      Closed_By: 'priya.kapoor@dreamdwell.com',
      Closed_At: '2025-01-15T18:00:00Z'
    }
  ];

  const journalHeaders: JournalHeader[] = [
    {
      Journal_ID: 'JRN-INIT-01',
      Date: '2025-01-01',
      Description: 'Opening Balance Capital Contribution',
      Reference_Type: 'Opening_Balance',
      Reference_ID: 'SYS-INIT',
      Created_By: 'admin@dreamdwell.com',
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: '2025-01-01'
    },
    {
      Journal_ID: 'JRN-RNT-0801',
      Date: '2025-08-01',
      Description: 'Rent Charge & Collection - Suite 101',
      Reference_Type: 'Rent_Billing',
      Reference_ID: 'RENT-202508-001',
      Created_By: 'admin@dreamdwell.com',
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: '2025-08-01'
    },
    {
      Journal_ID: 'JRN-LPAY-01',
      Date: '2025-07-15',
      Description: 'Landlord Net Rent Disbursement - Michael Chen',
      Reference_Type: 'Landlord_Payment',
      Reference_ID: 'LRDPAY-001',
      Created_By: 'priya.kapoor@dreamdwell.com',
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: '2025-07-15'
    }
  ];

  const journalLines: JournalLine[] = [
    { Line_ID: 'JRN-INIT-01-1', Journal_ID: 'JRN-INIT-01', Account_Code: '1010', Debit_Amount: 150000, Credit_Amount: 0, Memo: 'Initial operating reserve' },
    { Line_ID: 'JRN-INIT-01-2', Journal_ID: 'JRN-INIT-01', Account_Code: '3000', Debit_Amount: 0, Credit_Amount: 150000, Memo: 'Owner initial capital' },
    { Line_ID: 'JRN-RNT-0801-1', Journal_ID: 'JRN-RNT-0801', Account_Code: '1010', Property_ID: 'PROP-001', Unit_ID: 'UNIT-101', Tenant_ID: 'TEN-001', Debit_Amount: 2250, Credit_Amount: 0, Memo: 'Rent received in bank' },
    { Line_ID: 'JRN-RNT-0801-2', Journal_ID: 'JRN-RNT-0801', Account_Code: '4000', Property_ID: 'PROP-001', Unit_ID: 'UNIT-101', Tenant_ID: 'TEN-001', Debit_Amount: 0, Credit_Amount: 2250, Memo: 'Gross residential rent revenue' },
    { Line_ID: 'JRN-LPAY-01-1', Journal_ID: 'JRN-LPAY-01', Account_Code: '5000', Property_ID: 'PROP-001', Debit_Amount: 5100, Credit_Amount: 0, Memo: 'Master lease cost' },
    { Line_ID: 'JRN-LPAY-01-2', Journal_ID: 'JRN-LPAY-01', Account_Code: '4020', Property_ID: 'PROP-001', Debit_Amount: 0, Credit_Amount: 408, Memo: 'Property management fee earned' },
    { Line_ID: 'JRN-LPAY-01-3', Journal_ID: 'JRN-LPAY-01', Account_Code: '1010', Property_ID: 'PROP-001', Debit_Amount: 0, Credit_Amount: 4692, Memo: 'EFT payment to Landlord' }
  ];

  const auditLogs: AuditEntry[] = [
    {
      Audit_ID: 'AUD-001',
      Timestamp: '2025-08-01T09:00:00Z',
      User_Email: 'admin@dreamdwell.com',
      Action: 'GENERATE',
      Module: 'Rent',
      Record_ID: '2025-08',
      After_JSON: '{"generatedUnits": 5, "month": "2025-08"}'
    },
    {
      Audit_ID: 'AUD-002',
      Timestamp: '2025-08-01T10:15:00Z',
      User_Email: 'priya.kapoor@dreamdwell.com',
      Action: 'CREATE',
      Module: 'LandlordPayment',
      Record_ID: 'LRDPAY-001',
      After_JSON: '{"netAmount": 4692, "landlord": "LAND-001"}'
    }
  ];

  const utilityCatalog: UtilityCatalogItem[] = [
    {
      Utility_ID: 'UTL-001',
      Utility_Name: 'Hydro / Electricity',
      Category: 'Electricity',
      Default_Vendor: 'Toronto Hydro / BC Hydro',
      Default_GL_Account: '5010',
      Description: 'Standard residential & commercial power and electrical consumption',
      Is_Active: true,
      Created_At: '2025-01-01'
    },
    {
      Utility_ID: 'UTL-002',
      Utility_Name: 'Natural Gas (Enbridge)',
      Category: 'Natural Gas',
      Default_Vendor: 'Enbridge Gas',
      Default_GL_Account: '5010',
      Description: 'Central radiator heating, furnace and hot water gas pipeline billing',
      Is_Active: true,
      Created_At: '2025-01-01'
    },
    {
      Utility_ID: 'UTL-003',
      Utility_Name: 'Municipal Water & Sewage',
      Category: 'Water & Sewage',
      Default_Vendor: 'City Water & Sewerage Department',
      Default_GL_Account: '5010',
      Description: 'Quarterly municipal metered water supply, stormwater and wastewater services',
      Is_Active: true,
      Created_At: '2025-01-01'
    },
    {
      Utility_ID: 'UTL-004',
      Utility_Name: 'High-Speed Internet / Fiber',
      Category: 'Internet & Telecom',
      Default_Vendor: 'Rogers / Bell / Telus Gigabit',
      Default_GL_Account: '5200',
      Description: 'Shared building dedicated fiber optic internet and Wi-Fi mesh network',
      Is_Active: true,
      Created_At: '2025-01-01'
    },
    {
      Utility_ID: 'UTL-005',
      Utility_Name: 'Waste & Recycling Removal',
      Category: 'Waste Management',
      Default_Vendor: 'Municipal Solid Waste & Recycling Services',
      Default_GL_Account: '5020',
      Description: 'Weekly curbside organics, recycling, and commercial bin pickups',
      Is_Active: true,
      Created_At: '2025-01-01'
    },
    {
      Utility_ID: 'UTL-006',
      Utility_Name: 'Heating Oil & Bulk Fuel',
      Category: 'Heating Oil',
      Default_Vendor: 'Superior Propane / Ultramar Energy',
      Default_GL_Account: '5010',
      Description: 'Bulk fuel and heating oil tank refills for heritage and rural properties',
      Is_Active: true,
      Created_At: '2025-01-01'
    }
  ];

  return {
    users,
    properties,
    units,
    landlords,
    tenants,
    tenantIDProofs,
    bookings,
    leases,
    landlordPayments,
    rentTransactions,
    depositTransactions,
    utilityBills,
    utilitySplits,
    utilityCatalog,
    collections,
    excessPayments,
    refunds,
    moveIns,
    moveOuts,
    coa: DEFAULT_COA,
    journalHeaders,
    journalLines,
    accountingPeriods,
    auditLogs
  };
}

class StorageService {
  private data: ERPDataStore;
  private listeners: (() => void)[] = [];

  constructor() {
    this.data = this.load();
  }

  private load(): ERPDataStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial dataset:', e);
    }
    const initial = getInitialData();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: ERPDataStore) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  public save() {
    this.saveDirect(this.data);
    this.listeners.forEach(fn => fn());
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  public resetToDefault() {
    this.data = getInitialData();
    this.save();
  }

  public getRawData(): ERPDataStore {
    return this.data;
  }

  // Getters
  public getUsers() { return this.data.users; }
  public getProperties() { return this.data.properties; }
  public getUnits() { return this.data.units; }
  public getLandlords() { return this.data.landlords; }
  public getTenants() { return this.data.tenants; }
  public getTenantIDProofs() { return this.data.tenantIDProofs; }
  public getBookings() { return this.data.bookings; }
  public getLeases() { return this.data.leases; }
  public getLandlordPayments() { return this.data.landlordPayments; }
  public getRentTransactions() { return this.data.rentTransactions; }
  public getDepositTransactions() { return this.data.depositTransactions; }
  public getUtilityBills() { return this.data.utilityBills; }
  public getMasterUtilityBills() { return this.data.utilityBills; }
  public getUtilitySplits() { return this.data.utilitySplits; }
  public getUtilityCatalog() { return this.data.utilityCatalog || []; }
  public getCollections() { return this.data.collections; }
  public getExcessPayments() { return this.data.excessPayments; }
  public getRefunds() { return this.data.refunds; }
  public getMoveIns() { return this.data.moveIns; }
  public getMoveOuts() { return this.data.moveOuts; }
  public getCOA() { return this.data.coa; }
  public getJournalHeaders() { return this.data.journalHeaders; }
  public getJournalLines() { return this.data.journalLines; }
  public getAccountingPeriods() { return this.data.accountingPeriods; }
  public getAuditLogs() { return this.data.auditLogs; }

  // Setters / Appenders with Audit Logging
  public logAudit(userEmail: string, action: AuditEntry['Action'], module: string, recordId: string, afterState?: any) {
    const entry: AuditEntry = {
      Audit_ID: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      Timestamp: new Date().toISOString(),
      User_Email: userEmail || 'system@dreamdwell.com',
      Action: action,
      Module: module,
      Record_ID: recordId,
      After_JSON: afterState ? JSON.stringify(afterState) : undefined,
      IP_or_Source: 'Web ERP Client'
    };
    this.data.auditLogs.unshift(entry);
    this.save();
  }

  public addProperty(prop: Property, userEmail: string) {
    this.data.properties.unshift(prop);
    this.logAudit(userEmail, 'CREATE', 'Properties', prop.Property_ID, prop);
  }

  public updateProperty(prop: Property, userEmail: string) {
    const idx = this.data.properties.findIndex(p => p.Property_ID === prop.Property_ID);
    if (idx >= 0) {
      this.data.properties[idx] = prop;
      this.logAudit(userEmail, 'UPDATE', 'Properties', prop.Property_ID, prop);
    }
  }

  public deleteProperty(propertyId: string, userEmail: string) {
    this.data.properties = this.data.properties.filter(p => p.Property_ID !== propertyId);
    this.logAudit(userEmail, 'DELETE', 'Properties', propertyId);
  }

  public addUnit(unit: Unit, userEmail: string) {
    this.data.units.unshift(unit);
    this.logAudit(userEmail, 'CREATE', 'Units', unit.Unit_ID, unit);
  }

  public updateUnit(unit: Unit, userEmail: string) {
    const idx = this.data.units.findIndex(u => u.Unit_ID === unit.Unit_ID);
    if (idx >= 0) {
      this.data.units[idx] = unit;
      this.logAudit(userEmail, 'UPDATE', 'Units', unit.Unit_ID, unit);
    }
  }

  public deleteUnit(unitId: string, userEmail: string) {
    this.data.units = this.data.units.filter(u => u.Unit_ID !== unitId);
    this.logAudit(userEmail, 'DELETE', 'Units', unitId);
  }

  public addTenant(tenant: Tenant, userEmail: string) {
    this.data.tenants.unshift(tenant);
    this.logAudit(userEmail, 'CREATE', 'Tenants', tenant.Tenant_ID, tenant);
  }

  public updateTenant(tenant: Tenant, userEmail: string) {
    const idx = this.data.tenants.findIndex(t => t.Tenant_ID === tenant.Tenant_ID);
    if (idx >= 0) {
      this.data.tenants[idx] = tenant;
      this.logAudit(userEmail, 'UPDATE', 'Tenants', tenant.Tenant_ID, tenant);
    }
  }

  public deleteTenant(tenantId: string, userEmail: string) {
    this.data.tenants = this.data.tenants.filter(t => t.Tenant_ID !== tenantId);
    this.logAudit(userEmail, 'DELETE', 'Tenants', tenantId);
  }

  public addTenantIDProof(proof: TenantIDProof, userEmail: string) {
    this.data.tenantIDProofs.unshift(proof);
    this.logAudit(userEmail, 'CREATE', 'TenantIDProof', proof.ID_Proof_ID, proof);
  }

  public deleteTenantIDProof(proofId: string, userEmail: string) {
    this.data.tenantIDProofs = this.data.tenantIDProofs.filter(p => p.ID_Proof_ID !== proofId);
    this.logAudit(userEmail, 'DELETE', 'TenantIDProof', proofId);
  }

  public addLandlord(landlord: Landlord, userEmail: string) {
    this.data.landlords.unshift(landlord);
    this.logAudit(userEmail, 'CREATE', 'Landlords', landlord.Landlord_ID, landlord);
  }

  public updateLandlord(landlord: Landlord, userEmail: string) {
    const idx = this.data.landlords.findIndex(l => l.Landlord_ID === landlord.Landlord_ID);
    if (idx >= 0) {
      this.data.landlords[idx] = landlord;
      this.logAudit(userEmail, 'UPDATE', 'Landlords', landlord.Landlord_ID, landlord);
    }
  }

  public deleteLandlord(landlordId: string, userEmail: string) {
    this.data.landlords = this.data.landlords.filter(l => l.Landlord_ID !== landlordId);
    this.logAudit(userEmail, 'DELETE', 'Landlords', landlordId);
  }

  public addBooking(booking: Booking, userEmail: string) {
    this.data.bookings.unshift(booking);
    this.logAudit(userEmail, 'CREATE', 'Bookings', booking.Booking_ID, booking);
  }

  public updateBooking(booking: Booking, userEmail: string) {
    const idx = this.data.bookings.findIndex(b => b.Booking_ID === booking.Booking_ID);
    if (idx >= 0) {
      this.data.bookings[idx] = booking;
      this.logAudit(userEmail, 'UPDATE', 'Bookings', booking.Booking_ID, booking);
    }
  }

  public deleteBooking(bookingId: string, userEmail: string) {
    this.data.bookings = this.data.bookings.filter(b => b.Booking_ID !== bookingId);
    this.logAudit(userEmail, 'DELETE', 'Bookings', bookingId);
  }

  public addLease(lease: Lease, userEmail: string) {
    this.data.leases.unshift(lease);
    // Update Unit status
    const uIdx = this.data.units.findIndex(u => u.Unit_ID === lease.Unit_ID);
    if (uIdx >= 0) this.data.units[uIdx].Current_Status = 'Occupied';
    // Update Tenant status
    const tIdx = this.data.tenants.findIndex(t => t.Tenant_ID === lease.Tenant_ID);
    if (tIdx >= 0) {
      this.data.tenants[tIdx].Status = 'Active';
      this.data.tenants[tIdx].Current_Property_ID = lease.Property_ID;
      this.data.tenants[tIdx].Current_Unit_ID = lease.Unit_ID;
    }
    this.logAudit(userEmail, 'CREATE', 'Leases', lease.Lease_ID, lease);
  }

  public updateLease(lease: Lease, userEmail: string) {
    const idx = this.data.leases.findIndex(l => l.Lease_ID === lease.Lease_ID);
    if (idx >= 0) {
      this.data.leases[idx] = lease;
      this.logAudit(userEmail, 'UPDATE', 'Leases', lease.Lease_ID, lease);
    }
  }

  public deleteLease(leaseId: string, userEmail: string) {
    this.data.leases = this.data.leases.filter(l => l.Lease_ID !== leaseId);
    this.logAudit(userEmail, 'DELETE', 'Leases', leaseId);
  }

  public addLandlordPayment(payment: LandlordPayment, userEmail: string) {
    this.data.landlordPayments.unshift(payment);
    this.logAudit(userEmail, 'CREATE', 'LandlordPayments', payment.Landlord_Pay_ID, payment);
  }

  public updateLandlordPayment(payment: LandlordPayment, userEmail: string) {
    const idx = this.data.landlordPayments.findIndex(p => p.Landlord_Pay_ID === payment.Landlord_Pay_ID);
    if (idx >= 0) {
      this.data.landlordPayments[idx] = payment;
      this.logAudit(userEmail, 'UPDATE', 'LandlordPayments', payment.Landlord_Pay_ID, payment);
    }
  }

  public deleteLandlordPayment(paymentId: string, userEmail: string) {
    this.data.landlordPayments = this.data.landlordPayments.filter(p => p.Landlord_Pay_ID !== paymentId);
    this.logAudit(userEmail, 'DELETE', 'LandlordPayments', paymentId);
  }

  public addRentTransaction(txn: RentTransaction, userEmail: string) {
    this.data.rentTransactions.unshift(txn);
    this.logAudit(userEmail, 'CREATE', 'Rent', txn.Rent_Txn_ID, txn);
  }

  public updateRentTransaction(txn: RentTransaction, userEmail: string) {
    const idx = this.data.rentTransactions.findIndex(r => r.Rent_Txn_ID === txn.Rent_Txn_ID);
    if (idx >= 0) {
      this.data.rentTransactions[idx] = txn;
      this.logAudit(userEmail, 'UPDATE', 'Rent', txn.Rent_Txn_ID, txn);
    }
  }

  public deleteRentTransaction(txnId: string, userEmail: string) {
    this.data.rentTransactions = this.data.rentTransactions.filter(r => r.Rent_Txn_ID !== txnId);
    this.logAudit(userEmail, 'DELETE', 'Rent', txnId);
  }

  public addDepositTransaction(txn: DepositTransaction, userEmail: string) {
    this.data.depositTransactions.unshift(txn);
    this.logAudit(userEmail, 'CREATE', 'Deposits', txn.Deposit_Txn_ID, txn);
  }

  public updateDepositTransaction(txn: DepositTransaction, userEmail: string) {
    const idx = this.data.depositTransactions.findIndex(d => d.Deposit_Txn_ID === txn.Deposit_Txn_ID);
    if (idx >= 0) {
      this.data.depositTransactions[idx] = txn;
      this.logAudit(userEmail, 'UPDATE', 'Deposits', txn.Deposit_Txn_ID, txn);
    }
  }

  public deleteDepositTransaction(txnId: string, userEmail: string) {
    this.data.depositTransactions = this.data.depositTransactions.filter(d => d.Deposit_Txn_ID !== txnId);
    this.logAudit(userEmail, 'DELETE', 'Deposits', txnId);
  }

  public addUtilityBill(bill: UtilityBill, userEmail: string) {
    this.data.utilityBills.unshift(bill);
    this.logAudit(userEmail, 'CREATE', 'UtilityBills', bill.Utility_Bill_ID, bill);
  }

  public updateUtilityBill(bill: UtilityBill, userEmail: string) {
    const idx = this.data.utilityBills.findIndex(b => b.Utility_Bill_ID === bill.Utility_Bill_ID);
    if (idx >= 0) {
      this.data.utilityBills[idx] = bill;
      this.logAudit(userEmail, 'UPDATE', 'UtilityBills', bill.Utility_Bill_ID, bill);
    }
  }

  public updateMasterUtilityBill(bill: UtilityBill, userEmail: string) {
    this.updateUtilityBill(bill, userEmail);
  }

  public deleteUtilityBill(billId: string, userEmail: string) {
    this.data.utilityBills = this.data.utilityBills.filter(b => b.Utility_Bill_ID !== billId);
    this.data.utilitySplits = this.data.utilitySplits.filter(s => s.Utility_Bill_ID !== billId);
    this.logAudit(userEmail, 'DELETE', 'UtilityBills', billId);
  }

  public deleteMasterUtilityBill(billId: string, userEmail: string) {
    this.deleteUtilityBill(billId, userEmail);
  }

  public addUtilitySplit(split: UtilitySplit, userEmail: string) {
    this.data.utilitySplits.unshift(split);
    this.logAudit(userEmail, 'CREATE', 'UtilitySplits', split.Split_ID, split);
  }

  public updateUtilitySplit(split: UtilitySplit, userEmail: string) {
    const idx = this.data.utilitySplits.findIndex(s => s.Split_ID === split.Split_ID);
    if (idx >= 0) {
      this.data.utilitySplits[idx] = split;
      this.logAudit(userEmail, 'UPDATE', 'UtilitySplits', split.Split_ID, split);
    }
  }

  public deleteUtilitySplit(splitId: string, userEmail: string) {
    this.data.utilitySplits = this.data.utilitySplits.filter(s => s.Split_ID !== splitId);
    this.logAudit(userEmail, 'DELETE', 'UtilitySplits', splitId);
  }

  public addUtilityCatalogItem(item: UtilityCatalogItem, userEmail: string) {
    if (!this.data.utilityCatalog) this.data.utilityCatalog = [];
    this.data.utilityCatalog.unshift(item);
    this.logAudit(userEmail, 'CREATE', 'UtilityCatalog', item.Utility_ID, item);
  }

  public updateUtilityCatalogItem(item: UtilityCatalogItem, userEmail: string) {
    if (!this.data.utilityCatalog) this.data.utilityCatalog = [];
    const idx = this.data.utilityCatalog.findIndex(u => u.Utility_ID === item.Utility_ID);
    if (idx >= 0) {
      this.data.utilityCatalog[idx] = item;
      this.logAudit(userEmail, 'UPDATE', 'UtilityCatalog', item.Utility_ID, item);
    }
  }

  public deleteUtilityCatalogItem(utilityId: string, userEmail: string) {
    if (!this.data.utilityCatalog) this.data.utilityCatalog = [];
    this.data.utilityCatalog = this.data.utilityCatalog.filter(u => u.Utility_ID !== utilityId);
    this.logAudit(userEmail, 'DELETE', 'UtilityCatalog', utilityId);
  }

  public addCollection(collection: CollectionRecord, userEmail: string) {
    this.data.collections.unshift(collection);
    this.logAudit(userEmail, 'CREATE', 'Collections', collection.Collection_ID, collection);
  }

  public updateCollection(collection: CollectionRecord, userEmail: string) {
    const idx = this.data.collections.findIndex(c => c.Collection_ID === collection.Collection_ID);
    if (idx >= 0) {
      this.data.collections[idx] = collection;
      this.logAudit(userEmail, 'UPDATE', 'Collections', collection.Collection_ID, collection);
    }
  }

  public deleteCollection(collectionId: string, userEmail: string) {
    this.data.collections = this.data.collections.filter(c => c.Collection_ID !== collectionId);
    this.logAudit(userEmail, 'DELETE', 'Collections', collectionId);
  }

  public addExcessPayment(excess: ExcessPayment, userEmail: string) {
    this.data.excessPayments.unshift(excess);
    this.logAudit(userEmail, 'CREATE', 'Excess', excess.Excess_ID, excess);
  }

  public updateExcessPayment(excess: ExcessPayment, userEmail: string) {
    const idx = this.data.excessPayments.findIndex(e => e.Excess_ID === excess.Excess_ID);
    if (idx >= 0) {
      this.data.excessPayments[idx] = excess;
      this.logAudit(userEmail, 'UPDATE', 'Excess', excess.Excess_ID, excess);
    }
  }

  public deleteExcessPayment(excessId: string, userEmail: string) {
    this.data.excessPayments = this.data.excessPayments.filter(e => e.Excess_ID !== excessId);
    this.logAudit(userEmail, 'DELETE', 'Excess', excessId);
  }

  public addRefund(refund: RefundRecord, userEmail: string) {
    this.data.refunds.unshift(refund);
    this.logAudit(userEmail, 'CREATE', 'Refunds', refund.Refund_ID, refund);
  }

  public updateRefund(refund: RefundRecord, userEmail: string) {
    const idx = this.data.refunds.findIndex(r => r.Refund_ID === refund.Refund_ID);
    if (idx >= 0) {
      this.data.refunds[idx] = refund;
      this.logAudit(userEmail, 'UPDATE', 'Refunds', refund.Refund_ID, refund);
    }
  }

  public deleteRefund(refundId: string, userEmail: string) {
    this.data.refunds = this.data.refunds.filter(r => r.Refund_ID !== refundId);
    this.logAudit(userEmail, 'DELETE', 'Refunds', refundId);
  }

  public addMoveIn(moveIn: MoveInRecord, userEmail: string) {
    this.data.moveIns.unshift(moveIn);
    const uIdx = this.data.units.findIndex(u => u.Unit_ID === moveIn.Unit_ID);
    if (uIdx >= 0) this.data.units[uIdx].Current_Status = 'Occupied';
    this.logAudit(userEmail, 'CREATE', 'MoveIn', moveIn.MoveIn_ID, moveIn);
  }

  public updateMoveIn(moveIn: MoveInRecord, userEmail: string) {
    const idx = this.data.moveIns.findIndex(m => m.MoveIn_ID === moveIn.MoveIn_ID);
    if (idx >= 0) {
      this.data.moveIns[idx] = moveIn;
      this.logAudit(userEmail, 'UPDATE', 'MoveIn', moveIn.MoveIn_ID, moveIn);
    }
  }

  public deleteMoveIn(moveInId: string, userEmail: string) {
    this.data.moveIns = this.data.moveIns.filter(m => m.MoveIn_ID !== moveInId);
    this.logAudit(userEmail, 'DELETE', 'MoveIn', moveInId);
  }

  public addMoveOut(moveOut: MoveOutRecord, userEmail: string) {
    this.data.moveOuts.unshift(moveOut);
    const lIdx = this.data.leases.findIndex(l => l.Lease_ID === moveOut.Lease_ID);
    if (lIdx >= 0) this.data.leases[lIdx].Status = 'Ended';
    const uIdx = this.data.units.findIndex(u => u.Unit_ID === moveOut.Unit_ID);
    if (uIdx >= 0) this.data.units[uIdx].Current_Status = 'Vacant';
    const tIdx = this.data.tenants.findIndex(t => t.Tenant_ID === moveOut.Tenant_ID);
    if (tIdx >= 0) {
      this.data.tenants[tIdx].Status = 'Inactive';
      this.data.tenants[tIdx].Current_Property_ID = undefined;
      this.data.tenants[tIdx].Current_Unit_ID = undefined;
    }
    this.logAudit(userEmail, 'CREATE', 'MoveOut', moveOut.MoveOut_ID, moveOut);
  }

  public updateMoveOut(moveOut: MoveOutRecord, userEmail: string) {
    const idx = this.data.moveOuts.findIndex(m => m.MoveOut_ID === moveOut.MoveOut_ID);
    if (idx >= 0) {
      this.data.moveOuts[idx] = moveOut;
      this.logAudit(userEmail, 'UPDATE', 'MoveOut', moveOut.MoveOut_ID, moveOut);
    }
  }

  public deleteMoveOut(moveOutId: string, userEmail: string) {
    this.data.moveOuts = this.data.moveOuts.filter(m => m.MoveOut_ID !== moveOutId);
    this.logAudit(userEmail, 'DELETE', 'MoveOut', moveOutId);
  }

  public postJournal(header: JournalHeader, lines: JournalLine[], userEmail: string) {
    this.data.journalHeaders.unshift(header);
    lines.forEach(l => this.data.journalLines.unshift(l));
    this.logAudit(userEmail, 'POST', 'Journal', header.Journal_ID, { header, lines });
  }

  public deleteJournal(journalId: string, userEmail: string) {
    this.data.journalHeaders = this.data.journalHeaders.filter(j => j.Journal_ID !== journalId);
    this.data.journalLines = this.data.journalLines.filter(l => l.Journal_ID !== journalId);
    this.logAudit(userEmail, 'DELETE', 'Journal', journalId);
  }

  public addCOA(account: ChartOfAccount, userEmail: string) {
    this.data.coa.push(account);
    this.logAudit(userEmail, 'CREATE', 'COA', account.Account_Code, account);
  }

  public updateCOA(account: ChartOfAccount, userEmail: string) {
    const idx = this.data.coa.findIndex(a => a.Account_Code === account.Account_Code);
    if (idx >= 0) {
      this.data.coa[idx] = account;
      this.logAudit(userEmail, 'UPDATE', 'COA', account.Account_Code, account);
    }
  }

  public deleteCOA(accountCode: string, userEmail: string) {
    this.data.coa = this.data.coa.filter(a => a.Account_Code !== accountCode);
    this.logAudit(userEmail, 'DELETE', 'COA', accountCode);
  }

  public addUser(user: User, userEmail: string) {
    this.data.users.push(user);
    this.logAudit(userEmail, 'CREATE', 'Users', user.User_ID, user);
  }

  public updateUser(user: User, userEmail: string) {
    const idx = this.data.users.findIndex(u => u.User_ID === user.User_ID);
    if (idx >= 0) {
      this.data.users[idx] = user;
      this.logAudit(userEmail, 'UPDATE', 'Users', user.User_ID, user);
    }
  }

  public deleteUser(userId: string, userEmail: string) {
    this.data.users = this.data.users.filter(u => u.User_ID !== userId);
    this.logAudit(userEmail, 'DELETE', 'Users', userId);
  }

  public updateUserTabs(userId: string, tabs: string[], userEmail: string) {
    const idx = this.data.users.findIndex(u => u.User_ID === userId);
    if (idx >= 0) {
      this.data.users[idx].Assigned_Tabs = tabs;
      this.logAudit(userEmail, 'UPDATE', 'UserTabAccess', userId, tabs);
    }
  }
}

export const storage = new StorageService();
