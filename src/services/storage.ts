import {
  Property, Unit, Landlord, Tenant, TenantIDProof, Booking, Lease,
  LandlordPayment, RentTransaction, DepositTransaction, UtilityBill, UtilitySplit,
  CollectionRecord, ExcessPayment, RefundRecord, MoveInRecord, MoveOutRecord,
  ChartOfAccount, JournalHeader, JournalLine, AccountingPeriod, User, AuditEntry,
  UtilityCatalogItem, ParkingSpot, BedroomAllocation, UnitSpace,
  RoomOccupant, IndividualExpenseCharge
} from '../types/erp';

export const DEFAULT_COA: ChartOfAccount[] = [
  { Account_Code: '1000', Account_Name: 'Cash on Hand', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1010', Account_Name: 'Operating Bank (TD / RBC)', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1020', Account_Name: 'Savings / Deposit Account', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1100', Account_Name: 'Accounts Receivable - Rent', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1110', Account_Name: 'Accounts Receivable - Utilities', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1120', Account_Name: 'Security Deposit Receivable', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1125', Account_Name: 'Last Month Rent (LMR) Receivable', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1200', Account_Name: 'Prepaid Expenses & Insurance', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '1300', Account_Name: 'Property Maintenance Inventory', Account_Type: 'Asset', Account_Group: 'Current Assets', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '1500', Account_Name: 'Property Improvements & CapEx', Account_Type: 'Asset', Account_Group: 'Fixed Assets', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '2000', Account_Name: 'Accounts Payable - Vendors', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2100', Account_Name: 'Landlord Payable (Net Rent Payouts)', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2200', Account_Name: 'Tenant Security Deposits Held Liability', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2210', Account_Name: 'Last Month Rent (LMR) Held Liability', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2300', Account_Name: 'Unearned Revenue / Excess Payments', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '2400', Account_Name: 'GST / HST Payable (Commercial/Ops)', Account_Type: 'Liability', Account_Group: 'Current Liabilities', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '3000', Account_Name: 'Owner Capital & Equity', Account_Type: 'Equity', Account_Group: 'Capital', Normal_Balance: 'Credit', Is_Control_Account: false, Is_Active: true },
  { Account_Code: '3100', Account_Name: 'Retained Earnings', Account_Type: 'Equity', Account_Group: 'Retained Earnings', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '4000', Account_Name: 'Gross Rent Revenue', Account_Type: 'Revenue', Account_Group: 'Operating Revenue', Normal_Balance: 'Credit', Is_Control_Account: true, Is_Active: true },
  { Account_Code: '4005', Account_Name: 'Rent Discounts & Concessions', Account_Type: 'Revenue', Account_Group: 'Operating Revenue', Normal_Balance: 'Debit', Is_Control_Account: false, Is_Active: true },
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

export const DEFAULT_USERS: User[] = [
  {
    User_ID: 'USR-MASTER-ADMIN',
    Email: 'rahulrajanmdm@gmail.com',
    Full_Name: 'Rahul Rajan (Master Admin)',
    Role: 'Admin',
    Is_Active: true,
    Password: 'admin',
    Phone: '(416) 555-0100',
    Created_At: '2025-01-01',
    Last_Login: new Date().toISOString(),
    TwoFactorSecret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
    EmergencyBackupCode: '8492-3105',
    TwoFactorEnabled: true,
    TwoFactorMethod: 'EMAIL_OTP',
    Assigned_Tabs: [...ALL_ERP_TABS]
  }
];

export const DEMO_SAMPLE_USERS: User[] = [
  {
    User_ID: 'USR-MASTER-ADMIN',
    Email: 'rahulrajanmdm@gmail.com',
    Full_Name: 'Rahul Rajan (Master Admin)',
    Role: 'Admin',
    Is_Active: true,
    Password: 'admin',
    Phone: '(416) 555-0100',
    Created_At: '2025-01-01',
    Last_Login: new Date().toISOString(),
    TwoFactorSecret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
    EmergencyBackupCode: '8492-3105',
    TwoFactorEnabled: true,
    TwoFactorMethod: 'EMAIL_OTP',
    Assigned_Tabs: [...ALL_ERP_TABS]
  },
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
    TwoFactorSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
    EmergencyBackupCode: '9182-4752',
    TwoFactorEnabled: true,
    TwoFactorMethod: 'EMAIL_OTP',
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
    TwoFactorSecret: 'IFBEGRCJJVIVCRSFIFBEGRCJJVIVCRSF',
    EmergencyBackupCode: '6201-9483',
    TwoFactorEnabled: true,
    TwoFactorMethod: 'EMAIL_OTP',
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
    TwoFactorSecret: 'KVKFKRCPNZQUYMLXKVKFKRCPNZQUYMLX',
    EmergencyBackupCode: '3719-5820',
    TwoFactorEnabled: true,
    TwoFactorMethod: 'EMAIL_OTP',
    Assigned_Tabs: ['Dashboard', 'CollectionsBoard', 'Properties', 'Units', 'Landlords', 'Tenants', 'Bookings', 'Leases', 'MoveIn', 'MoveOut']
  }
];

export const DEFAULT_UTILITY_CATALOG: UtilityCatalogItem[] = [
  {
    Utility_ID: 'UTL-ENBRIDGE',
    Utility_Name: 'Enbridge (Natural Gas)',
    Category: 'Natural Gas',
    Default_Vendor: 'Enbridge Gas Inc.',
    Default_GL_Account: '5010',
    Description: 'Central radiator heating, furnace, and natural gas pipeline billing',
    Is_Active: true,
    Created_At: '2025-01-01'
  },
  {
    Utility_ID: 'UTL-ALECTRA',
    Utility_Name: 'Alectra (Electricity / Hydro)',
    Category: 'Electricity',
    Default_Vendor: 'Alectra Utilities Corporation',
    Default_GL_Account: '5010',
    Description: 'Alectra electric grid power and residential hydro consumption',
    Is_Active: true,
    Created_At: '2025-01-01'
  },
  {
    Utility_ID: 'UTL-HOTWATER',
    Utility_Name: 'Hot Water Tank Rental',
    Category: 'Hot Water Tank',
    Default_Vendor: 'Reliance Home Comfort / Enercare',
    Default_GL_Account: '5010',
    Description: 'Hot water heater tank rental, maintenance, and gas/electric heating unit lease',
    Is_Active: true,
    Created_At: '2025-01-01'
  },
  {
    Utility_ID: 'UTL-WATER',
    Utility_Name: 'Municipal Water & Sewage',
    Category: 'Water & Sewage',
    Default_Vendor: 'City / Municipal Water Department',
    Default_GL_Account: '5010',
    Description: 'Quarterly municipal metered water supply, stormwater, and wastewater services',
    Is_Active: true,
    Created_At: '2025-01-01'
  },
  {
    Utility_ID: 'UTL-WIFI',
    Utility_Name: 'WiFi / High-Speed Internet',
    Category: 'Internet & Telecom',
    Default_Vendor: 'Rogers / Bell / Telus / Cogeco',
    Default_GL_Account: '5200',
    Description: 'High-speed wireless broadband WiFi and fiber optic internet network',
    Is_Active: true,
    Created_At: '2025-01-01'
  },
  {
    Utility_ID: 'UTL-001',
    Utility_Name: 'Hydro / Electricity (General)',
    Category: 'Electricity',
    Default_Vendor: 'Toronto Hydro / Hydro One / BC Hydro',
    Default_GL_Account: '5010',
    Description: 'Standard residential & commercial power and electrical consumption',
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

export const DEFAULT_ACCOUNTING_PERIODS: AccountingPeriod[] = [
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

export interface ERPDataStore {
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

const STORAGE_KEY = 'dreamdwell_lease_erp_prod_v5';
const LEGACY_STORAGE_KEY = 'canadian_lease_erp_prod_v5';
const AUTH_SESSION_KEY = 'dreamdwell_lease_erp_auth_v5';
const LEGACY_AUTH_SESSION_KEY = 'canadian_lease_erp_auth_v5';

export function getCleanProductionData(): ERPDataStore {
  return {
    users: [...DEFAULT_USERS],
    properties: [],
    units: [],
    landlords: [],
    tenants: [],
    tenantIDProofs: [],
    bookings: [],
    leases: [],
    landlordPayments: [],
    rentTransactions: [],
    depositTransactions: [],
    utilityBills: [],
    utilitySplits: [],
    utilityCatalog: [...DEFAULT_UTILITY_CATALOG],
    collections: [],
    excessPayments: [],
    refunds: [],
    moveIns: [],
    moveOuts: [],
    coa: [...DEFAULT_COA],
    journalHeaders: [],
    journalLines: [],
    accountingPeriods: [...DEFAULT_ACCOUNTING_PERIODS],
    auditLogs: [
      {
        Audit_ID: 'AUD-INIT-001',
        Timestamp: new Date().toISOString(),
        User_Email: 'admin@dreamdwell.com',
        Action: 'CREATE',
        Module: 'System',
        Record_ID: 'CLEAN_WORKSPACE_INIT',
        After_JSON: '{"status":"Clean Production Workspace Initialized - Ready for Real Client Data"}'
      }
    ]
  };
}

export function getSampleDemoData(): ERPDataStore {
  const users: User[] = [...DEFAULT_USERS];

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
      Bank_Reference: 'TD Bank Transit #90123 Acct #5839201',
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
      Property_Name: '148 Spruce Street',
      Address: '148 Spruce Street',
      City: 'Toronto',
      Province: 'ON',
      Postal_Code: 'M5A 2J5',
      Landlord_ID: 'LAND-001',
      Property_Status: 'Active',
      Master_Rent_Amount: 4000,
      Has_Divisions: true,
      Division_Structure: 'Main_And_Basement',
      Default_Main_Share_Pct: 60,
      Default_Basement_Share_Pct: 40,
      Meter_Tag: 'Shared Gas & Hydro Meter #148',
      Total_Parking_Spots: 3,
      Parking_Spots: [
        { Spot_ID: 'PRK-501', Spot_Number_Name: 'Driveway Left (Spot 1)', Spot_Type: 'Driveway', Monthly_Fee: 0, Status: 'Assigned', Assigned_Tenant_ID: 'TEN-006', Assigned_Tenant_Name: 'Lucas Vance', Assigned_Unit_ID: 'UNIT-501', Vehicle_Plate: 'BXYZ 491', Notes: 'Allocated to Main Floor tenant' },
        { Spot_ID: 'PRK-502', Spot_Number_Name: 'Driveway Right (Spot 2)', Spot_Type: 'Driveway', Monthly_Fee: 0, Status: 'Available', Notes: 'Shared driveway spot' },
        { Spot_ID: 'PRK-503', Spot_Number_Name: 'Rear Garage Stall A', Spot_Type: 'Garage', Monthly_Fee: 75, Status: 'Available', Notes: 'Secure enclosed garage spot' }
      ],
      Notes: 'Victorian home divided into Main Floor & Basement Suite. Single unified property with master rent of $4,000 paid to landlord on full property.',
      Created_At: '2025-02-01'
    }
  ];

  const units: Unit[] = [
    { Unit_ID: 'UNIT-101', Property_ID: 'PROP-001', Unit_Number_Name: 'Suite 101', Unit_Type: '1BR + Den', Target_Rent: 2250, Current_Status: 'Occupied', Bedrooms: 1, Bathrooms: 1, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: true, Dens_Count: 1, Den_Details: 'Private study den with French doors', Utilities_Included: true, Included_Utilities: ['Hydro / Electricity', 'Heat / Natural Gas', 'Municipal Water & Sewage'], Utility_Billing_Type: 'All-Inclusive', Notes: 'Renovated quartz kitchen, balcony facing South.' },
    { Unit_ID: 'UNIT-102', Property_ID: 'PROP-001', Unit_Number_Name: 'Suite 102', Unit_Type: '2BR / 2BA', Target_Rent: 2850, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 2, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: false, Dens_Count: 0, Utilities_Included: false, Utility_Billing_Type: 'Tenant Metered', Notes: 'Corner unit with in-suite laundry.' },
    { Unit_ID: 'UNIT-103', Property_ID: 'PROP-001', Unit_Number_Name: 'Suite 103', Unit_Type: 'Studio Deluxe', Target_Rent: 1750, Current_Status: 'Vacant', Bedrooms: 0, Bathrooms: 1, Kitchens: 1, Kitchen_Type: 'Kitchenette', Has_Den: false, Dens_Count: 0, Utilities_Included: true, Included_Utilities: ['Hydro / Electricity', 'Water & Sewage'], Utility_Billing_Type: 'All-Inclusive', Notes: 'Freshly painted, available for immediate lease.' },
    { Unit_ID: 'UNIT-201', Property_ID: 'PROP-002', Unit_Number_Name: 'Suite 2405', Unit_Type: '2BR Luxury Suite', Target_Rent: 3600, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 2, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: true, Dens_Count: 1, Den_Details: 'Lakeview office den', Utilities_Included: false, Utility_Billing_Type: 'Tenant Metered', Notes: 'Lake Ontario view, 1 underground parking stall.' },
    { Unit_ID: 'UNIT-202', Property_ID: 'PROP-002', Unit_Number_Name: 'Penthouse 02', Unit_Type: '3BR Executive Penthouse', Target_Rent: 5400, Current_Status: 'Vacant', Bedrooms: 3, Bathrooms: 3, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: true, Dens_Count: 2, Den_Details: 'Double executive den / library suite', Utilities_Included: true, Included_Utilities: ['Hydro / Electricity', 'Heat / Natural Gas', 'Municipal Water & Sewage', 'High-Speed Internet / Fiber'], Utility_Billing_Type: 'All-Inclusive', Notes: 'Wrap-around terrace, private elevator access.' },
    { Unit_ID: 'UNIT-301', Property_ID: 'PROP-003', Unit_Number_Name: 'Suite 408', Unit_Type: '1BR West End', Target_Rent: 2400, Current_Status: 'Occupied', Bedrooms: 1, Bathrooms: 1, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: false, Dens_Count: 0, Utilities_Included: true, Included_Utilities: ['Heat / Natural Gas', 'Water & Sewage'], Utility_Billing_Type: 'All-Inclusive', Notes: 'Minutes to Stanley Park and English Bay.' },
    { Unit_ID: 'UNIT-302', Property_ID: 'PROP-003', Unit_Number_Name: 'Suite 602', Unit_Type: '2BR Penthouse', Target_Rent: 3950, Current_Status: 'Maintenance', Bedrooms: 2, Bathrooms: 2, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: false, Dens_Count: 0, Utilities_Included: false, Utility_Billing_Type: 'Tenant Metered', Notes: 'Bathroom regrouting and heat pump servicing in progress.' },
    { Unit_ID: 'UNIT-401', Property_ID: 'PROP-004', Unit_Number_Name: 'Appartement 3A', Unit_Type: '2BR Plateau Loft', Target_Rent: 2100, Current_Status: 'Occupied', Bedrooms: 2, Bathrooms: 1, Kitchens: 1, Kitchen_Type: 'Full Kitchen', Has_Den: true, Dens_Count: 1, Den_Details: 'Heritage brick artist den/studio', Utilities_Included: true, Included_Utilities: ['Heat / Natural Gas', 'Water & Sewage'], Utility_Billing_Type: 'All-Inclusive', Notes: 'High ceilings, exposed brick, original hardwood.' },
    {
      Unit_ID: 'UNIT-501',
      Property_ID: 'PROP-005',
      Unit_Number_Name: 'Main Floor (6 Spaces)',
      Unit_Type: 'Main Floor Multi-Space Suite',
      Division_Level: 'Main Floor',
      Target_Rent: 3900,
      Full_Room_Rent: 3600,
      Allow_Full_Room_Lease: true,
      Current_Status: 'Occupied',
      Bedrooms: 3,
      Bathrooms: 2,
      Kitchens: 1,
      Kitchen_Type: 'Full Kitchen',
      Has_Den: true,
      Dens_Count: 1,
      Den_Details: 'South-facing private work den / sunroom',
      Utilities_Included: true,
      Included_Utilities: ['Hydro / Electricity', 'Heat / Natural Gas', 'Municipal Water & Sewage', 'High-Speed Internet / Fiber'],
      Utility_Billing_Type: 'All-Inclusive',
      Square_Feet: 1500,
      Utility_Share_Percentage: 60,
      Spaces_Count: 6,
      Bedrooms_List: [
        {
          Bedroom_ID: 'BR-M1',
          Bedroom_Name: 'Room 1 (Front Bedroom)',
          Allocation_Mode: 'Sharing',
          Full_Room_Rent: 1200,
          Sharing_Spaces_Count: 2,
          Sharing_Rent_Per_Space: 650,
          Ensuite_Bath: false,
          Notes: 'Two sharing bed spaces or 1 individual full bedroom.'
        },
        {
          Bedroom_ID: 'BR-M2',
          Bedroom_Name: 'Room 2 (Center Bedroom)',
          Allocation_Mode: 'Sharing',
          Full_Room_Rent: 1100,
          Sharing_Spaces_Count: 2,
          Sharing_Rent_Per_Space: 600,
          Ensuite_Bath: false,
          Notes: 'Two sharing bed spaces or 1 individual full bedroom.'
        },
        {
          Bedroom_ID: 'BR-M3',
          Bedroom_Name: 'Room 3 (Master Bedroom)',
          Allocation_Mode: 'Sharing',
          Full_Room_Rent: 1300,
          Sharing_Spaces_Count: 2,
          Sharing_Rent_Per_Space: 700,
          Ensuite_Bath: true,
          Notes: 'Master ensuite with private bath. 2 sharing beds or 1 individual.'
        }
      ],
      Spaces: [
        { Space_ID: 'SPC-M1', Bedroom_ID: 'BR-M1', Bedroom_Name: 'Room 1 (Front Bedroom)', Space_Name: 'Room 1 - Bed A', Space_Type: 'Shared Room Bed', Target_Rent: 650, Full_Room_Rent: 1200, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Occupied', Tenant_ID: 'TEN-006', Tenant_Name: 'Lucas Vance' },
        { Space_ID: 'SPC-M2', Bedroom_ID: 'BR-M1', Bedroom_Name: 'Room 1 (Front Bedroom)', Space_Name: 'Room 1 - Bed B', Space_Type: 'Shared Room Bed', Target_Rent: 650, Full_Room_Rent: 1200, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
        { Space_ID: 'SPC-M3', Bedroom_ID: 'BR-M2', Bedroom_Name: 'Room 2 (Center Bedroom)', Space_Name: 'Room 2 - Bed A', Space_Type: 'Shared Room Bed', Target_Rent: 600, Full_Room_Rent: 1100, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
        { Space_ID: 'SPC-M4', Bedroom_ID: 'BR-M2', Bedroom_Name: 'Room 2 (Center Bedroom)', Space_Name: 'Room 2 - Bed B', Space_Type: 'Shared Room Bed', Target_Rent: 600, Full_Room_Rent: 1100, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
        { Space_ID: 'SPC-M5', Bedroom_ID: 'BR-M3', Bedroom_Name: 'Room 3 (Master Bedroom)', Space_Name: 'Room 3 - Master Bed A', Space_Type: 'Master Ensuite', Target_Rent: 700, Full_Room_Rent: 1300, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
        { Space_ID: 'SPC-M6', Bedroom_ID: 'BR-M3', Bedroom_Name: 'Room 3 (Master Bedroom)', Space_Name: 'Room 3 - Master Bed B', Space_Type: 'Master Ensuite', Target_Rent: 700, Full_Room_Rent: 1300, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' }
      ],
      Notes: 'Main floor configured with 6 spaces across 3 bedrooms + private den. Single occupants can lease a full room exclusively or share spaces. Rent is all-inclusive of utilities.'
    },
    {
      Unit_ID: 'UNIT-601',
      Property_ID: 'PROP-005',
      Unit_Number_Name: 'Basement Suite (3 Spaces)',
      Unit_Type: 'Basement Multi-Space Suite',
      Division_Level: 'Basement',
      Target_Rent: 1750,
      Full_Room_Rent: 1600,
      Allow_Full_Room_Lease: true,
      Current_Status: 'Occupied',
      Bedrooms: 2,
      Bathrooms: 1,
      Kitchens: 1,
      Kitchen_Type: 'Full Kitchen',
      Has_Den: false,
      Dens_Count: 0,
      Utilities_Included: true,
      Included_Utilities: ['Hydro / Electricity', 'Heat / Natural Gas', 'Municipal Water & Sewage', 'High-Speed Internet / Fiber'],
      Utility_Billing_Type: 'All-Inclusive',
      Square_Feet: 850,
      Utility_Share_Percentage: 40,
      Spaces_Count: 3,
      Spaces: [
        { Space_ID: 'SPC-B1', Space_Name: 'Basement Room 1 - Space A', Space_Type: 'Shared Room Bed', Target_Rent: 550, Full_Room_Rent: 1000, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Occupied', Tenant_ID: 'TEN-007', Tenant_Name: 'Emily Zhao' },
        { Space_ID: 'SPC-B2', Space_Name: 'Basement Room 1 - Space B', Space_Type: 'Shared Room Bed', Target_Rent: 550, Full_Room_Rent: 1000, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
        { Space_ID: 'SPC-B3', Space_Name: 'Basement Room 2 - Private Bedroom', Space_Type: 'Private Bedroom', Target_Rent: 650, Full_Room_Rent: 650, Occupancy_Mode: 'Fully Used (Private)', Utilities_Included: true, Current_Status: 'Vacant' }
      ],
      Notes: 'Basement suite configured with 3 spaces. Individual space rents ($550-$650/mo) or full suite rate of $1,600/mo inclusive of utilities.'
    }
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
      Full_Name: 'Lucas Vance',
      Email: 'lucas.vance@gmail.com',
      Phone: '(416) 555-0811',
      Emergency_Contact: 'Clara Vance - (416) 555-0812',
      Status: 'Active',
      Current_Property_ID: 'PROP-005',
      Current_Unit_ID: 'UNIT-501',
      Floor_Division: 'Main Floor',
      Created_At: '2025-02-01',
      Notes: 'Architect tenant tagged to Main Floor (60% utility share).'
    },
    {
      Tenant_ID: 'TEN-007',
      Full_Name: 'Emily Zhao',
      Email: 'emily.zhao@utoronto.ca',
      Phone: '(416) 555-0922',
      Emergency_Contact: 'Helen Zhao - (416) 555-0923',
      Status: 'Active',
      Current_Property_ID: 'PROP-005',
      Current_Unit_ID: 'UNIT-601',
      Floor_Division: 'Basement',
      Created_At: '2025-02-01',
      Notes: 'U of T graduate student tagged to Basement Suite (40% utility share).'
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
      Notes: 'Moved out July 31. Security deposit of $1,500 held for final utility reconciliations.'
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
      Notes: 'Application under credit review with Equifax.',
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
    },
    {
      Landlord_Pay_ID: 'LRDPAY-004',
      Property_ID: 'PROP-005',
      Landlord_ID: 'LAND-001',
      Period: '2025-07',
      Rent_Amount: 4000,
      Deductions: 320, // 8% management fee on full property
      Net_Amount: 3680,
      Status: 'Posted',
      Payment_Date: '2025-07-15',
      Notes: 'July full master property rent disbursement for 148 Spruce St (Main Floor & Basement).',
      Created_Date: '2025-07-15',
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
      Deposit_Type: 'Last Month Rent',
      Txn_Type: 'Payment',
      Due_Amount: 2250,
      Paid_Amount: 2250,
      Refund_Amount: 0,
      Balance: 0,
      Txn_Date: '2025-01-10',
      Status: 'Received',
      Journal_Ref_ID: 'JRN-DEP-01',
      Reference: 'CERT-CHQ-1092 - Last Month Rent',
      Created_By: 'admin@dreamdwell.com'
    },
    {
      Deposit_Txn_ID: 'DEP-002',
      Lease_ID: 'LEASE-002',
      Tenant_ID: 'TEN-002',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-102',
      Deposit_Type: 'Last Month Rent',
      Txn_Type: 'Payment',
      Due_Amount: 2850,
      Paid_Amount: 2850,
      Refund_Amount: 0,
      Balance: 0,
      Txn_Date: '2025-01-15',
      Status: 'Received',
      Journal_Ref_ID: 'JRN-DEP-02',
      Reference: 'EFT-DEPOSIT-201 - Last Month Rent',
      Created_By: 'admin@dreamdwell.com'
    },
    {
      Deposit_Txn_ID: 'DEP-003',
      Lease_ID: 'LEASE-001',
      Tenant_ID: 'TEN-001',
      Property_ID: 'PROP-001',
      Unit_ID: 'UNIT-101',
      Deposit_Type: 'Security Deposit',
      Txn_Type: 'Payment',
      Due_Amount: 250,
      Paid_Amount: 250,
      Refund_Amount: 0,
      Balance: 0,
      Txn_Date: '2025-01-10',
      Status: 'Received',
      Journal_Ref_ID: 'JRN-DEP-03',
      Reference: 'FOB-KEY-DEP-101 - Key & Fob Deposit',
      Created_By: 'admin@dreamdwell.com'
    },
    {
      Deposit_Txn_ID: 'DEP-004',
      Lease_ID: 'LEASE-004',
      Tenant_ID: 'TEN-004',
      Property_ID: 'PROP-003',
      Unit_ID: 'UNIT-301',
      Deposit_Type: 'Security Deposit',
      Txn_Type: 'Payment',
      Due_Amount: 1200,
      Paid_Amount: 600,
      Refund_Amount: 0,
      Balance: 600,
      Txn_Date: '2025-02-28',
      Status: 'Partial',
      Journal_Ref_ID: 'JRN-DEP-04',
      Reference: 'E-TRANSFER-PARTIAL - Key & Damage Deposit',
      Created_By: 'admin@dreamdwell.com'
    },
    {
      Deposit_Txn_ID: 'DEP-005',
      Lease_ID: 'LEASE-004',
      Tenant_ID: 'TEN-004',
      Property_ID: 'PROP-003',
      Unit_ID: 'UNIT-301',
      Deposit_Type: 'Last Month Rent',
      Txn_Type: 'Charge',
      Due_Amount: 1200,
      Paid_Amount: 0,
      Refund_Amount: 0,
      Balance: 1200,
      Txn_Date: '2025-02-01',
      Status: 'Receivable',
      Journal_Ref_ID: 'JRN-DEP-05',
      Reference: 'Initial Last Month Rent (LMR) Receivable',
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
    },
    {
      Utility_Bill_ID: 'UBILL-004',
      Property_ID: 'PROP-005',
      Utility_ID: 'UTL-001',
      Bill_Date: '2025-08-01',
      Due_Date: '2025-08-20',
      Vendor: 'Toronto Hydro Corporation',
      Master_Amount: 380.00,
      Bill_Reference: 'TH-SPRUCE-2025-08',
      Status: 'Allocated',
      Notes: 'Master hydro bill for 148 Spruce St divided between Main Floor (60%) and Basement Suite (40%).',
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
    },
    {
      Split_ID: 'USPL-003',
      Utility_Bill_ID: 'UBILL-004',
      Utility_Name: 'Hydro / Electricity',
      Property_ID: 'PROP-005',
      Unit_ID: 'UNIT-501',
      Tenant_ID: 'TEN-006',
      Division_Level: 'Main Floor',
      Percentage_Share: 60,
      Allocated_Amount: 228.00,
      Amount_Paid: 228.00,
      Balance: 0,
      Payment_Date: '2025-08-05',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-UTIL-03',
      Notes: 'Main floor 60% utility apportionment.',
      Created_By: 'priya.kapoor@dreamdwell.com'
    },
    {
      Split_ID: 'USPL-004',
      Utility_Bill_ID: 'UBILL-004',
      Utility_Name: 'Hydro / Electricity',
      Property_ID: 'PROP-005',
      Unit_ID: 'UNIT-601',
      Tenant_ID: 'TEN-007',
      Division_Level: 'Basement',
      Percentage_Share: 40,
      Allocated_Amount: 152.00,
      Amount_Paid: 152.00,
      Balance: 0,
      Payment_Date: '2025-08-06',
      Status: 'Paid',
      Journal_Ref_ID: 'JRN-UTIL-04',
      Notes: 'Basement suite 40% utility apportionment.',
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
    },
    {
      Journal_ID: 'JRN-EXP-SPRUCE-01',
      Date: '2025-08-03',
      Description: 'Main Floor Kitchen Plumbing & Faucet Repair',
      Reference_Type: 'Property_Expense',
      Reference_ID: 'EXP-SPRUCE-01',
      Created_By: 'admin@dreamdwell.com',
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: '2025-08-03'
    },
    {
      Journal_ID: 'JRN-EXP-SPRUCE-02',
      Date: '2025-08-05',
      Description: 'Basement Suite Sump Pump Service & Dehumidifier',
      Reference_Type: 'Property_Expense',
      Reference_ID: 'EXP-SPRUCE-02',
      Created_By: 'admin@dreamdwell.com',
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: '2025-08-05'
    },
    {
      Journal_ID: 'JRN-EXP-SPRUCE-03',
      Date: '2025-08-08',
      Description: 'Full Property Eavestrough & Roof Maintenance (Shared)',
      Reference_Type: 'Property_Expense',
      Reference_ID: 'EXP-SPRUCE-03',
      Created_By: 'admin@dreamdwell.com',
      Status: 'POSTED',
      Period_ID: 'PER-2025',
      Created_At: '2025-08-08'
    }
  ];

  const journalLines: JournalLine[] = [
    { Line_ID: 'JRN-INIT-01-1', Journal_ID: 'JRN-INIT-01', Account_Code: '1010', Debit_Amount: 150000, Credit_Amount: 0, Memo: 'Initial operating reserve' },
    { Line_ID: 'JRN-INIT-01-2', Journal_ID: 'JRN-INIT-01', Account_Code: '3000', Debit_Amount: 0, Credit_Amount: 150000, Memo: 'Owner initial capital' },
    { Line_ID: 'JRN-RNT-0801-1', Journal_ID: 'JRN-RNT-0801', Account_Code: '1010', Property_ID: 'PROP-001', Unit_ID: 'UNIT-101', Tenant_ID: 'TEN-001', Debit_Amount: 2250, Credit_Amount: 0, Memo: 'Rent received in bank' },
    { Line_ID: 'JRN-RNT-0801-2', Journal_ID: 'JRN-RNT-0801', Account_Code: '4000', Property_ID: 'PROP-001', Unit_ID: 'UNIT-101', Tenant_ID: 'TEN-001', Debit_Amount: 0, Credit_Amount: 2250, Memo: 'Gross residential rent revenue' },
    { Line_ID: 'JRN-LPAY-01-1', Journal_ID: 'JRN-LPAY-01', Account_Code: '5000', Property_ID: 'PROP-001', Debit_Amount: 5100, Credit_Amount: 0, Memo: 'Master lease cost' },
    { Line_ID: 'JRN-LPAY-01-2', Journal_ID: 'JRN-LPAY-01', Account_Code: '4020', Property_ID: 'PROP-001', Debit_Amount: 0, Credit_Amount: 408, Memo: 'Property management fee earned' },
    { Line_ID: 'JRN-LPAY-01-3', Journal_ID: 'JRN-LPAY-01', Account_Code: '1010', Property_ID: 'PROP-001', Debit_Amount: 0, Credit_Amount: 4692, Memo: 'EFT payment to Landlord' },
    { Line_ID: 'JRN-EXP-SPRUCE-01-1', Journal_ID: 'JRN-EXP-SPRUCE-01', Account_Code: '5020', Property_ID: 'PROP-005', Unit_ID: 'UNIT-501', Division_Level: 'Main Floor', Debit_Amount: 280, Credit_Amount: 0, Memo: 'Main floor faucet & drain repair' },
    { Line_ID: 'JRN-EXP-SPRUCE-01-2', Journal_ID: 'JRN-EXP-SPRUCE-01', Account_Code: '1010', Property_ID: 'PROP-005', Unit_ID: 'UNIT-501', Division_Level: 'Main Floor', Debit_Amount: 0, Credit_Amount: 280, Memo: 'Cheque payment to plumbing contractor' },
    { Line_ID: 'JRN-EXP-SPRUCE-02-1', Journal_ID: 'JRN-EXP-SPRUCE-02', Account_Code: '5020', Property_ID: 'PROP-005', Unit_ID: 'UNIT-601', Division_Level: 'Basement', Debit_Amount: 420, Credit_Amount: 0, Memo: 'Basement sump pump preventative servicing' },
    { Line_ID: 'JRN-EXP-SPRUCE-02-2', Journal_ID: 'JRN-EXP-SPRUCE-02', Account_Code: '1010', Property_ID: 'PROP-005', Unit_ID: 'UNIT-601', Division_Level: 'Basement', Debit_Amount: 0, Credit_Amount: 420, Memo: 'E-Transfer to basement maintenance specialist' },
    { Line_ID: 'JRN-EXP-SPRUCE-03-1', Journal_ID: 'JRN-EXP-SPRUCE-03', Account_Code: '5020', Property_ID: 'PROP-005', Division_Level: 'Entire Property', Debit_Amount: 600, Credit_Amount: 0, Memo: 'Shared full property roof & gutter maintenance' },
    { Line_ID: 'JRN-EXP-SPRUCE-03-2', Journal_ID: 'JRN-EXP-SPRUCE-03', Account_Code: '1010', Property_ID: 'PROP-005', Division_Level: 'Entire Property', Debit_Amount: 0, Credit_Amount: 600, Memo: 'Payment to roofing contractor' }
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
    utilityCatalog: [...DEFAULT_UTILITY_CATALOG],
    collections,
    excessPayments,
    refunds,
    moveIns,
    moveOuts,
    coa: [...DEFAULT_COA],
    journalHeaders,
    journalLines,
    accountingPeriods: [...DEFAULT_ACCOUNTING_PERIODS],
    auditLogs
  };
}

function getInitialData(): ERPDataStore {
  return getCleanProductionData();
}

class StorageService {
  private data: ERPDataStore;
  private listeners: (() => void)[] = [];
  private isSyncing: boolean = false;

  constructor() {
    this.data = this.load();
    this.syncFromServer();
  }

  public async syncFromServer(): Promise<boolean> {
    if (typeof window === 'undefined' || this.isSyncing) return false;
    try {
      this.isSyncing = true;
      const res = await fetch('/api/erp/data');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && serverData.users && Array.isArray(serverData.users)) {
          // Merge users so any user registered on another device/browser is present
          const localUsers = this.data.users || [];
          const userMap = new Map<string, User>();
          
          serverData.users.forEach((u: User) => {
            if (u && u.Email) userMap.set(u.Email.toLowerCase(), u);
          });
          localUsers.forEach(u => {
            if (u && u.Email && !userMap.has(u.Email.toLowerCase())) {
              userMap.set(u.Email.toLowerCase(), u);
            }
          });

          this.data.users = Array.from(userMap.values());
          
          // Merge properties, units, leases, tenants, etc if present
          if (serverData.properties && Array.isArray(serverData.properties) && serverData.properties.length > 0 && this.data.properties.length === 0) {
            this.data.properties = serverData.properties;
          }
          if (serverData.units && Array.isArray(serverData.units) && serverData.units.length > 0 && this.data.units.length === 0) {
            this.data.units = serverData.units;
          }
          if (serverData.leases && Array.isArray(serverData.leases) && serverData.leases.length > 0 && this.data.leases.length === 0) {
            this.data.leases = serverData.leases;
          }
          if (serverData.tenants && Array.isArray(serverData.tenants) && serverData.tenants.length > 0 && this.data.tenants.length === 0) {
            this.data.tenants = serverData.tenants;
          }
          if (serverData.landlords && Array.isArray(serverData.landlords) && serverData.landlords.length > 0 && this.data.landlords.length === 0) {
            this.data.landlords = serverData.landlords;
          }
          
          this.saveDirect(this.data);
          this.listeners.forEach(fn => fn());
          return true;
        }
      }
    } catch (e) {
      console.warn('[Storage] Server sync unavailable, using local cache:', e);
    } finally {
      this.isSyncing = false;
    }
    return false;
  }

  private load(): ERPDataStore {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed: ERPDataStore = JSON.parse(stored);
        this.migrateDividedProperties(parsed);
        this.deduplicateAndMigrateDeposits(parsed);
        this.migrateUtilityCatalog(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial dataset:', e);
    }
    const initial = getInitialData();
    this.saveDirect(initial);
    return initial;
  }

  private deduplicateAndMigrateDeposits(data: ERPDataStore) {
    if (!data) return;

    // 1. Ensure COA has 1120, 1125, 2200, 2210 separated
    if (data.coa && Array.isArray(data.coa)) {
      const coa = data.coa;
      const acc1120 = coa.find(a => a.Account_Code === '1120');
      if (acc1120) {
        acc1120.Account_Name = 'Security Deposit Receivable';
      }
      if (!coa.some(a => a.Account_Code === '1125')) {
        coa.push({
          Account_Code: '1125',
          Account_Name: 'Last Month Rent (LMR) Receivable',
          Account_Type: 'Asset',
          Account_Group: 'Current Assets',
          Normal_Balance: 'Debit',
          Is_Control_Account: true,
          Is_Active: true
        });
      }
      const acc2200 = coa.find(a => a.Account_Code === '2200');
      if (acc2200) {
        acc2200.Account_Name = 'Tenant Security Deposits Held Liability';
      }
      if (!coa.some(a => a.Account_Code === '2210')) {
        coa.push({
          Account_Code: '2210',
          Account_Name: 'Last Month Rent (LMR) Held Liability',
          Account_Type: 'Liability',
          Account_Group: 'Current Liabilities',
          Normal_Balance: 'Credit',
          Is_Control_Account: true,
          Is_Active: true
        });
      }
      if (!coa.some(a => a.Account_Code === '4005')) {
        coa.push({
          Account_Code: '4005',
          Account_Name: 'Rent Discounts & Concessions',
          Account_Type: 'Revenue',
          Account_Group: 'Operating Revenue',
          Normal_Balance: 'Debit',
          Is_Control_Account: false,
          Is_Active: true
        });
      }
    }

    const validLeaseIds = new Set((data.leases || []).map(l => l.Lease_ID));

    // 2. Deduplicate deposit transactions, scrub orphans of deleted leases, and assign Deposit_Type
    if (data.depositTransactions && Array.isArray(data.depositTransactions)) {
      const seenIds = new Set<string>();
      const seenChargeKeys = new Set<string>();
      const deduped: DepositTransaction[] = [];

      for (const d of data.depositTransactions) {
        if (!d || !d.Deposit_Txn_ID) continue;
        if (seenIds.has(d.Deposit_Txn_ID)) continue;

        // Auto-purge orphan deposits from deleted leases (e.g. DEP-LEASE-MTN74IDM)
        if (d.Lease_ID && !validLeaseIds.has(d.Lease_ID)) {
          continue; // Skip orphan
        }
        if (d.Deposit_Txn_ID.includes('LEASE-')) {
          const match = d.Deposit_Txn_ID.match(/LEASE-[A-Za-z0-9_-]+/);
          if (match && match[0] && !validLeaseIds.has(match[0])) {
            continue; // Skip orphan
          }
        }
        if (d.Reference && d.Reference.includes('LEASE-')) {
          const match = d.Reference.match(/LEASE-[A-Za-z0-9_-]+/);
          if (match && match[0] && !validLeaseIds.has(match[0]) && !d.Lease_ID) {
            continue; // Skip orphan
          }
        }

        // Assign Deposit_Type if missing
        if (!d.Deposit_Type) {
          const ref = (d.Reference || '').toLowerCase();
          const notes = (d.Notes || '').toLowerCase();
          if (ref.includes('lmr') || ref.includes('last month') || notes.includes('lmr') || notes.includes('last month')) {
            d.Deposit_Type = 'Last Month Rent';
          } else {
            d.Deposit_Type = 'Security Deposit';
          }
        }

        // Remove duplicate initial charges for the same lease & deposit type
        if (d.Txn_Type === 'Charge' && d.Lease_ID) {
          const chargeKey = `${d.Lease_ID}__${d.Deposit_Type}`;
          if (seenChargeKeys.has(chargeKey)) {
            continue; // Skip duplicate charge
          }
          seenChargeKeys.add(chargeKey);
        }

        seenIds.add(d.Deposit_Txn_ID);
        deduped.push(d);
      }

      data.depositTransactions = deduped;
    }

    // 3. Scrub orphaned rent transactions & ensure unique Rent_Txn_IDs
    if (data.rentTransactions && Array.isArray(data.rentTransactions)) {
      // Filter out invalid/orphaned
      const validRents = data.rentTransactions.filter(r => {
        if (!r || !r.Rent_Txn_ID) return false;
        if (r.Lease_ID && !validLeaseIds.has(r.Lease_ID)) return false;
        return true;
      });

      // Migrate any Rent_Txn_ID that was formatted with Unit_ID (e.g. RENT-YYYYMM-UNIT-XXXX) to use Lease_ID
      validRents.forEach(r => {
        if (r.Lease_ID && r.Unit_ID && r.Rent_Txn_ID.includes(`-${r.Unit_ID}`)) {
          const newId = `RENT-${(r.Period_Month || '').replace('-', '')}-${r.Lease_ID}`;
          const oldId = r.Rent_Txn_ID;
          r.Rent_Txn_ID = newId;
          // Update any collection that used oldId
          if (data.collections) {
            data.collections.forEach(c => {
              if (c.Rent_Txn_ID === oldId) c.Rent_Txn_ID = newId;
            });
          }
        }
      });

      // Deduplicate by Lease_ID + Period_Month (or Rent_Txn_ID)
      const dedupedRents: RentTransaction[] = [];
      const seenRentKeys = new Set<string>();
      const seenRentIds = new Set<string>();

      for (const r of validRents) {
        const leaseMonthKey = r.Lease_ID && r.Period_Month ? `${r.Lease_ID}_${r.Period_Month}` : r.Rent_Txn_ID;

        if (seenRentKeys.has(leaseMonthKey) || seenRentIds.has(r.Rent_Txn_ID)) {
          // Find existing and prefer the one with payments / newer state
          const existingIdx = dedupedRents.findIndex(
            x => (r.Lease_ID && x.Lease_ID === r.Lease_ID && x.Period_Month === r.Period_Month) || x.Rent_Txn_ID === r.Rent_Txn_ID
          );
          if (existingIdx >= 0) {
            const existing = dedupedRents[existingIdx];
            if ((r.Amount_Paid || 0) > (existing.Amount_Paid || 0)) {
              dedupedRents[existingIdx] = r;
            }
          }
          continue;
        }

        // Guarantee 100% unique Rent_Txn_ID
        let finalId = r.Rent_Txn_ID;
        let counter = 1;
        while (seenRentIds.has(finalId)) {
          finalId = `${r.Rent_Txn_ID}-${counter++}`;
        }
        r.Rent_Txn_ID = finalId;

        seenRentKeys.add(leaseMonthKey);
        seenRentIds.add(r.Rent_Txn_ID);
        dedupedRents.push(r);
      }

      data.rentTransactions = dedupedRents;
    }

    // 4. Scrub orphaned utility splits
    if (data.utilitySplits && Array.isArray(data.utilitySplits)) {
      data.utilitySplits = data.utilitySplits.filter(u => {
        if (!u || !u.Split_ID) return false;
        if (u.Lease_ID && !validLeaseIds.has(u.Lease_ID)) return false;
        return true;
      });
    }

    // 5. Reconcile all leases with accounting (Rent Billings, Arrears, Deposits & Security)
    this.reconcileLeasesWithAccounting(data);
  }

  public reconcileLeasesWithAccounting(data?: ERPDataStore, userEmail = 'system@dreamdwell.com') {
    const store = data || this.data;
    if (!store || !store.leases || !Array.isArray(store.leases)) return;
    if (!store.rentTransactions) store.rentTransactions = [];
    if (!store.depositTransactions) store.depositTransactions = [];
    if (!store.collections) store.collections = [];
    if (!store.journalHeaders) store.journalHeaders = [];
    if (!store.journalLines) store.journalLines = [];

    store.leases.forEach(lease => {
      if (!lease || !lease.Lease_ID) return;

      const targetSec = Math.round((lease.Deposit_Required ?? lease.Security_Deposit_Amount ?? lease.Security_Deposit ?? 0) * 100) / 100;
      const targetLMR = Math.round((lease.Last_Month_Rent ?? lease.Last_Month_Rent_Amount ?? 0) * 100) / 100;
      const monthlyRent = Math.round((lease.Monthly_Rent || 0) * 100) / 100;

      lease.Monthly_Rent = monthlyRent;
      lease.Deposit_Required = targetSec;
      lease.Security_Deposit_Amount = targetSec;
      lease.Security_Deposit = targetSec;
      lease.Last_Month_Rent = targetLMR;
      lease.Last_Month_Rent_Amount = targetLMR;

      // 1. Reconcile Rent Transactions & Arrears
      const leaseRentTxns = store.rentTransactions.filter(
        r => r.Lease_ID === lease.Lease_ID || (r.Rent_Txn_ID && r.Rent_Txn_ID.includes(lease.Lease_ID))
      );

      if (leaseRentTxns.length === 0 && (lease.Status === 'Active' || (lease.Status as string) === 'active')) {
        const firstMonth = (lease.Lease_Start || new Date().toISOString().slice(0, 10)).slice(0, 7);
        const rentId = `RENT-${firstMonth.replace('-', '')}-${lease.Lease_ID}`;
        store.rentTransactions.unshift({
          Rent_Txn_ID: rentId,
          Lease_ID: lease.Lease_ID,
          Tenant_ID: lease.Tenant_ID,
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Period_Month: firstMonth,
          Due_Date: lease.Lease_Start,
          Amount_Billed: monthlyRent,
          Amount_Paid: 0,
          Balance: monthlyRent,
          Status: 'Unpaid',
          Journal_Ref_ID: `JRN-LEASE-INIT-${lease.Lease_ID}`,
          Created_By: userEmail,
          Created_At: new Date().toISOString()
        });
      } else {
        leaseRentTxns.forEach(r => {
          r.Tenant_ID = lease.Tenant_ID;
          r.Property_ID = lease.Property_ID;
          r.Unit_ID = lease.Unit_ID;

          const netMonthly = Math.max(0, monthlyRent - (r.Discount_Amount || 0));
          if (r.Status === 'Unpaid' || (r.Amount_Paid || 0) === 0) {
            r.Amount_Billed = monthlyRent;
            r.Balance = netMonthly;
            r.Status = r.Balance <= 0 ? 'Paid' : 'Unpaid';
          } else if (r.Status === 'Partial' || (r.Amount_Paid || 0) < netMonthly) {
            r.Amount_Billed = monthlyRent;
            r.Balance = Math.max(0, Math.round((netMonthly - (r.Amount_Paid || 0)) * 100) / 100);
            r.Status = r.Balance <= 0 ? 'Paid' : 'Partial';
          }
        });
      }

      // 2. Reconcile Security Deposit
      const secCharge = store.depositTransactions.find(
        d => (d.Lease_ID === lease.Lease_ID || d.Deposit_Txn_ID === `DEP-SEC-${lease.Lease_ID}`) &&
             d.Deposit_Type === 'Security Deposit' &&
             (d.Txn_Type === 'Charge' || d.Status === 'Receivable' || d.Status === 'Partial' || !d.Paid_Amount)
      );

      if (secCharge) {
        secCharge.Tenant_ID = lease.Tenant_ID;
        secCharge.Property_ID = lease.Property_ID;
        secCharge.Unit_ID = lease.Unit_ID;
        if (targetSec === 0 && (secCharge.Paid_Amount || 0) === 0) {
          store.depositTransactions = store.depositTransactions.filter(d => d.Deposit_Txn_ID !== secCharge.Deposit_Txn_ID);
        } else {
          secCharge.Due_Amount = targetSec;
          secCharge.Balance = Math.max(0, Math.round((targetSec - (secCharge.Paid_Amount || 0)) * 100) / 100);
          secCharge.Status = secCharge.Balance <= 0 ? 'Received' : ((secCharge.Paid_Amount || 0) > 0 ? 'Partial' : 'Receivable');
        }
      } else if (targetSec > 0 && (lease.Status === 'Active' || (lease.Status as string) === 'active')) {
        store.depositTransactions.unshift({
          Deposit_Txn_ID: `DEP-SEC-${lease.Lease_ID}`,
          Lease_ID: lease.Lease_ID,
          Tenant_ID: lease.Tenant_ID,
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Deposit_Type: 'Security Deposit',
          Txn_Type: 'Charge',
          Due_Amount: targetSec,
          Paid_Amount: 0,
          Refund_Amount: 0,
          Balance: targetSec,
          Txn_Date: lease.Lease_Start,
          Status: 'Receivable',
          Journal_Ref_ID: `JRN-LEASE-INIT-${lease.Lease_ID}`,
          Reference: 'Security / Key Deposit Initial Charge',
          Notes: `Initial key/security deposit charge for lease ${lease.Lease_ID}`,
          Created_By: userEmail
        });
      }

      // 3. Reconcile Last Month Rent (LMR)
      const lmrCharge = store.depositTransactions.find(
        d => (d.Lease_ID === lease.Lease_ID || d.Deposit_Txn_ID === `DEP-LMR-${lease.Lease_ID}`) &&
             d.Deposit_Type === 'Last Month Rent' &&
             (d.Txn_Type === 'Charge' || d.Status === 'Receivable' || d.Status === 'Partial' || !d.Paid_Amount)
      );

      if (lmrCharge) {
        lmrCharge.Tenant_ID = lease.Tenant_ID;
        lmrCharge.Property_ID = lease.Property_ID;
        lmrCharge.Unit_ID = lease.Unit_ID;
        if (targetLMR === 0 && (lmrCharge.Paid_Amount || 0) === 0) {
          store.depositTransactions = store.depositTransactions.filter(d => d.Deposit_Txn_ID !== lmrCharge.Deposit_Txn_ID);
        } else {
          lmrCharge.Due_Amount = targetLMR;
          lmrCharge.Balance = Math.max(0, Math.round((targetLMR - (lmrCharge.Paid_Amount || 0)) * 100) / 100);
          lmrCharge.Status = lmrCharge.Balance <= 0 ? 'Received' : ((lmrCharge.Paid_Amount || 0) > 0 ? 'Partial' : 'Receivable');
        }
      } else if (targetLMR > 0 && (lease.Status === 'Active' || (lease.Status as string) === 'active')) {
        store.depositTransactions.unshift({
          Deposit_Txn_ID: `DEP-LMR-${lease.Lease_ID}`,
          Lease_ID: lease.Lease_ID,
          Tenant_ID: lease.Tenant_ID,
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Deposit_Type: 'Last Month Rent',
          Txn_Type: 'Charge',
          Due_Amount: targetLMR,
          Paid_Amount: 0,
          Refund_Amount: 0,
          Balance: targetLMR,
          Txn_Date: lease.Lease_Start,
          Status: 'Receivable',
          Journal_Ref_ID: `JRN-LEASE-INIT-${lease.Lease_ID}`,
          Reference: 'Last Month Rent (LMR) Initial Charge',
          Notes: `Initial last month rent charge for lease ${lease.Lease_ID}`,
          Created_By: userEmail
        });
      }

      // 4. Sync other deposit transactions for this lease
      store.depositTransactions.forEach(d => {
        if (d.Lease_ID === lease.Lease_ID || (d.Deposit_Txn_ID && d.Deposit_Txn_ID.includes(lease.Lease_ID))) {
          d.Tenant_ID = lease.Tenant_ID;
          d.Property_ID = lease.Property_ID;
          d.Unit_ID = lease.Unit_ID;
        }
      });

      // 5. Update lease.Deposit_Received from actual paid security deposit transactions
      const totalSecReceived = store.depositTransactions
        .filter(d => (d.Lease_ID === lease.Lease_ID || (d.Deposit_Txn_ID && d.Deposit_Txn_ID.includes(lease.Lease_ID))) &&
                     d.Deposit_Type === 'Security Deposit' &&
                     (d.Txn_Type === 'Payment' || d.Status === 'Received' || (d.Paid_Amount || 0) > 0))
        .reduce((sum, d) => sum + (d.Paid_Amount || 0), 0);
      lease.Deposit_Received = totalSecReceived;

      // 6. Sync Journal Entries
      const jHeader = store.journalHeaders.find(
        j => j.Journal_ID === `JRN-LEASE-INIT-${lease.Lease_ID}` || j.Reference_ID === lease.Lease_ID
      );
      if (jHeader) {
        jHeader.Date = lease.Lease_Start;
        store.journalLines.forEach(l => {
          if (l.Journal_ID === jHeader.Journal_ID) {
            l.Tenant_ID = lease.Tenant_ID;
            l.Property_ID = lease.Property_ID;
            l.Unit_ID = lease.Unit_ID;
            if (l.Account_Code === '1100') l.Debit_Amount = monthlyRent;
            if (l.Account_Code === '4000') l.Credit_Amount = monthlyRent;
            if (l.Account_Code === '1120') l.Debit_Amount = targetSec;
            if (l.Account_Code === '2200') l.Credit_Amount = targetSec;
            if (l.Account_Code === '1125') l.Debit_Amount = targetLMR;
            if (l.Account_Code === '2210') l.Credit_Amount = targetLMR;
          }
        });
      }
    });
  }

  private migrateUtilityCatalog(data: ERPDataStore) {
    if (!data) return;
    if (!data.utilityCatalog || !Array.isArray(data.utilityCatalog) || data.utilityCatalog.length === 0) {
      data.utilityCatalog = [...DEFAULT_UTILITY_CATALOG];
      return;
    }

    const cat = data.utilityCatalog;
    // Core Canadian utility providers & services:
    // ENBRIDGE, ALECTRA, HOT WATER, WATER, WIFI
    const coreUtilities: UtilityCatalogItem[] = [
      {
        Utility_ID: 'UTL-ENBRIDGE',
        Utility_Name: 'Enbridge (Natural Gas)',
        Category: 'Natural Gas',
        Default_Vendor: 'Enbridge Gas Inc.',
        Default_GL_Account: '5010',
        Description: 'Central radiator heating, furnace, and natural gas pipeline billing',
        Is_Active: true,
        Created_At: '2025-01-01'
      },
      {
        Utility_ID: 'UTL-ALECTRA',
        Utility_Name: 'Alectra (Electricity / Hydro)',
        Category: 'Electricity',
        Default_Vendor: 'Alectra Utilities Corporation',
        Default_GL_Account: '5010',
        Description: 'Alectra electric grid power and residential hydro consumption',
        Is_Active: true,
        Created_At: '2025-01-01'
      },
      {
        Utility_ID: 'UTL-HOTWATER',
        Utility_Name: 'Hot Water Tank Rental',
        Category: 'Hot Water Tank',
        Default_Vendor: 'Reliance Home Comfort / Enercare',
        Default_GL_Account: '5010',
        Description: 'Hot water heater tank rental, maintenance, and gas/electric heating unit lease',
        Is_Active: true,
        Created_At: '2025-01-01'
      },
      {
        Utility_ID: 'UTL-WATER',
        Utility_Name: 'Municipal Water & Sewage',
        Category: 'Water & Sewage',
        Default_Vendor: 'City / Municipal Water Department',
        Default_GL_Account: '5010',
        Description: 'Quarterly municipal metered water supply, stormwater, and wastewater services',
        Is_Active: true,
        Created_At: '2025-01-01'
      },
      {
        Utility_ID: 'UTL-WIFI',
        Utility_Name: 'WiFi / High-Speed Internet',
        Category: 'Internet & Telecom',
        Default_Vendor: 'Rogers / Bell / Telus / Cogeco',
        Default_GL_Account: '5200',
        Description: 'High-speed wireless broadband WiFi and fiber optic internet network',
        Is_Active: true,
        Created_At: '2025-01-01'
      }
    ];

    // Ensure core services exist
    coreUtilities.forEach(core => {
      const idx = cat.findIndex(c =>
        c.Utility_ID === core.Utility_ID ||
        (core.Utility_ID === 'UTL-ENBRIDGE' && (c.Utility_Name.toLowerCase().includes('enbridge') || c.Category === 'Natural Gas')) ||
        (core.Utility_ID === 'UTL-ALECTRA' && c.Utility_Name.toLowerCase().includes('alectra')) ||
        (core.Utility_ID === 'UTL-HOTWATER' && (c.Utility_Name.toLowerCase().includes('hot water') || c.Category === 'Hot Water Tank')) ||
        (core.Utility_ID === 'UTL-WIFI' && (c.Utility_Name.toLowerCase().includes('wifi') || c.Utility_Name.toLowerCase().includes('wi-fi') || c.Utility_Name.toLowerCase().includes('internet'))) ||
        (core.Utility_ID === 'UTL-WATER' && (c.Utility_Name.toLowerCase().includes('water') && !c.Utility_Name.toLowerCase().includes('hot')))
      );

      if (idx === -1) {
        cat.unshift(core);
      } else {
        cat[idx].Is_Active = true;
        if (!cat[idx].Default_Vendor) {
          cat[idx].Default_Vendor = core.Default_Vendor;
        }
      }
    });
  }

  private migrateDividedProperties(data: ERPDataStore) {
    if (!data || !data.properties) return;

    const prop6Index = data.properties.findIndex(p => p.Property_ID === 'PROP-006');
    const prop5 = data.properties.find(p => p.Property_ID === 'PROP-005');

    if (prop6Index !== -1 || (prop5 && !prop5.Has_Divisions)) {
      if (prop6Index !== -1) {
        data.properties.splice(prop6Index, 1);
      }
      if (prop5) {
        prop5.Property_Name = '148 Spruce Street';
        prop5.Address = '148 Spruce Street';
        prop5.Master_Rent_Amount = 4000;
        prop5.Has_Divisions = true;
        prop5.Division_Structure = 'Main_And_Basement';
        prop5.Default_Main_Share_Pct = 60;
        prop5.Default_Basement_Share_Pct = 40;
        delete prop5.Parent_Property_ID;
        delete prop5.Division_Type;
      }
    }

    // Ensure all properties have Parking_Spots initialized
    data.properties.forEach(p => {
      if (!p.Parking_Spots) {
        if (p.Property_ID === 'PROP-005') {
          p.Total_Parking_Spots = 3;
          p.Parking_Spots = [
            { Spot_ID: 'PRK-501', Spot_Number_Name: 'Driveway Left (Spot 1)', Spot_Type: 'Driveway', Monthly_Fee: 0, Status: 'Assigned', Assigned_Tenant_ID: 'TEN-006', Assigned_Tenant_Name: 'Lucas Vance', Assigned_Unit_ID: 'UNIT-501', Vehicle_Plate: 'BXYZ 491', Notes: 'Allocated to Main Floor tenant' },
            { Spot_ID: 'PRK-502', Spot_Number_Name: 'Driveway Right (Spot 2)', Spot_Type: 'Driveway', Monthly_Fee: 0, Status: 'Available', Notes: 'Shared driveway spot' },
            { Spot_ID: 'PRK-503', Spot_Number_Name: 'Rear Garage Stall A', Spot_Type: 'Garage', Monthly_Fee: 75, Status: 'Available', Notes: 'Secure enclosed garage spot' }
          ];
        } else if (p.Property_ID === 'PROP-001') {
          p.Total_Parking_Spots = 4;
          p.Parking_Spots = [
            { Spot_ID: 'PRK-101', Spot_Number_Name: 'Underground P1-04', Spot_Type: 'Underground', Monthly_Fee: 150, Status: 'Assigned', Assigned_Tenant_ID: 'TEN-001', Assigned_Tenant_Name: 'Sarah Jenkins', Assigned_Unit_ID: 'UNIT-101' },
            { Spot_ID: 'PRK-102', Spot_Number_Name: 'Underground P1-05', Spot_Type: 'Underground', Monthly_Fee: 150, Status: 'Assigned', Assigned_Tenant_ID: 'TEN-002', Assigned_Tenant_Name: 'David Chen', Assigned_Unit_ID: 'UNIT-102' },
            { Spot_ID: 'PRK-103', Spot_Number_Name: 'Underground P1-06', Spot_Type: 'Underground', Monthly_Fee: 150, Status: 'Available' },
            { Spot_ID: 'PRK-104', Spot_Number_Name: 'Visitor Stall V-1', Spot_Type: 'Surface', Monthly_Fee: 0, Status: 'Available' }
          ];
        } else {
          p.Total_Parking_Spots = p.Total_Parking_Spots || 0;
          p.Parking_Spots = [];
        }
      }
    });

    if (data.units) {
      data.units.forEach(u => {
        if (u.Property_ID === 'PROP-006') {
          u.Property_ID = 'PROP-005';
        }
        u.Kitchens = u.Kitchens ?? 1;
        u.Kitchen_Type = u.Kitchen_Type || 'Full Kitchen';
        if (u.Has_Den === undefined) u.Has_Den = (u.Unit_Type || u.Floor_Plan || '').toLowerCase().includes('den');
        if (u.Dens_Count === undefined) u.Dens_Count = u.Has_Den ? 1 : 0;
        if (u.Utilities_Included === undefined) u.Utilities_Included = false;
        if (!u.Utility_Billing_Type) u.Utility_Billing_Type = u.Utilities_Included ? 'All-Inclusive' : 'Tenant Metered';

        if (u.Unit_ID === 'UNIT-501') {
          u.Property_ID = 'PROP-005';
          u.Unit_Number_Name = 'Main Floor (6 Spaces)';
          u.Division_Level = 'Main Floor';
          u.Utility_Share_Percentage = 60;
          u.Square_Feet = 1500;
          u.Spaces_Count = 6;
          u.Full_Room_Rent = 3600;
          u.Allow_Full_Room_Lease = true;
          u.Kitchens = 1;
          u.Kitchen_Type = 'Full Kitchen';
          u.Has_Den = true;
          u.Dens_Count = 1;
          u.Den_Details = 'South-facing private work den / sunroom';
          u.Utilities_Included = true;
          u.Included_Utilities = ['Hydro / Electricity', 'Heat / Natural Gas', 'Municipal Water & Sewage', 'High-Speed Internet / Fiber'];
          u.Utility_Billing_Type = 'All-Inclusive';
          if (!u.Bedrooms_List || u.Bedrooms_List.length === 0) {
            u.Bedrooms_List = [
              {
                Bedroom_ID: 'BR-M1',
                Bedroom_Name: 'Room 1 (Front Bedroom)',
                Allocation_Mode: 'Sharing',
                Full_Room_Rent: 1200,
                Sharing_Spaces_Count: 2,
                Sharing_Rent_Per_Space: 650,
                Ensuite_Bath: false,
                Notes: 'Two sharing bed spaces or 1 individual full bedroom.'
              },
              {
                Bedroom_ID: 'BR-M2',
                Bedroom_Name: 'Room 2 (Center Bedroom)',
                Allocation_Mode: 'Sharing',
                Full_Room_Rent: 1100,
                Sharing_Spaces_Count: 2,
                Sharing_Rent_Per_Space: 600,
                Ensuite_Bath: false,
                Notes: 'Two sharing bed spaces or 1 individual full bedroom.'
              },
              {
                Bedroom_ID: 'BR-M3',
                Bedroom_Name: 'Room 3 (Master Bedroom)',
                Allocation_Mode: 'Sharing',
                Full_Room_Rent: 1300,
                Sharing_Spaces_Count: 2,
                Sharing_Rent_Per_Space: 700,
                Ensuite_Bath: true,
                Notes: 'Master ensuite with private bath. 2 sharing beds or 1 individual.'
              }
            ];
          }
          if (!u.Spaces || u.Spaces.length === 0) {
            u.Spaces = [
              { Space_ID: 'SPC-M1', Bedroom_ID: 'BR-M1', Bedroom_Name: 'Room 1 (Front Bedroom)', Space_Name: 'Room 1 - Bed A', Space_Type: 'Shared Room Bed', Target_Rent: 650, Full_Room_Rent: 1200, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Occupied', Tenant_ID: 'TEN-006', Tenant_Name: 'Lucas Vance' },
              { Space_ID: 'SPC-M2', Bedroom_ID: 'BR-M1', Bedroom_Name: 'Room 1 (Front Bedroom)', Space_Name: 'Room 1 - Bed B', Space_Type: 'Shared Room Bed', Target_Rent: 650, Full_Room_Rent: 1200, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
              { Space_ID: 'SPC-M3', Bedroom_ID: 'BR-M2', Bedroom_Name: 'Room 2 (Center Bedroom)', Space_Name: 'Room 2 - Bed A', Space_Type: 'Shared Room Bed', Target_Rent: 600, Full_Room_Rent: 1100, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
              { Space_ID: 'SPC-M4', Bedroom_ID: 'BR-M2', Bedroom_Name: 'Room 2 (Center Bedroom)', Space_Name: 'Room 2 - Bed B', Space_Type: 'Shared Room Bed', Target_Rent: 600, Full_Room_Rent: 1100, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
              { Space_ID: 'SPC-M5', Bedroom_ID: 'BR-M3', Bedroom_Name: 'Room 3 (Master Bedroom)', Space_Name: 'Room 3 - Master Bed A', Space_Type: 'Master Ensuite', Target_Rent: 700, Full_Room_Rent: 1300, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
              { Space_ID: 'SPC-M6', Bedroom_ID: 'BR-M3', Bedroom_Name: 'Room 3 (Master Bedroom)', Space_Name: 'Room 3 - Master Bed B', Space_Type: 'Master Ensuite', Target_Rent: 700, Full_Room_Rent: 1300, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' }
            ];
          }
        } else if (u.Unit_ID === 'UNIT-601') {
          u.Property_ID = 'PROP-005';
          u.Unit_Number_Name = 'Basement Suite (3 Spaces)';
          u.Division_Level = 'Basement';
          u.Utility_Share_Percentage = 40;
          u.Square_Feet = 850;
          u.Spaces_Count = 3;
          u.Full_Room_Rent = 1600;
          u.Allow_Full_Room_Lease = true;
          u.Kitchens = 1;
          u.Kitchen_Type = 'Full Kitchen';
          u.Has_Den = false;
          u.Dens_Count = 0;
          u.Utilities_Included = true;
          u.Included_Utilities = ['Hydro / Electricity', 'Heat / Natural Gas', 'Municipal Water & Sewage', 'High-Speed Internet / Fiber'];
          u.Utility_Billing_Type = 'All-Inclusive';
          if (!u.Bedrooms_List || u.Bedrooms_List.length === 0) {
            u.Bedrooms_List = [
              {
                Bedroom_ID: 'BR-B1',
                Bedroom_Name: 'Basement Room 1',
                Allocation_Mode: 'Sharing',
                Full_Room_Rent: 1000,
                Sharing_Spaces_Count: 2,
                Sharing_Rent_Per_Space: 550,
                Ensuite_Bath: false,
                Notes: 'Two sharing bed spaces or $1,000 full room.'
              },
              {
                Bedroom_ID: 'BR-B2',
                Bedroom_Name: 'Basement Room 2',
                Allocation_Mode: 'Fully Used',
                Full_Room_Rent: 650,
                Sharing_Spaces_Count: 1,
                Sharing_Rent_Per_Space: 650,
                Ensuite_Bath: false,
                Notes: 'Single private room.'
              }
            ];
          }
          if (!u.Spaces || u.Spaces.length === 0) {
            u.Spaces = [
              { Space_ID: 'SPC-B1', Bedroom_ID: 'BR-B1', Bedroom_Name: 'Basement Room 1', Space_Name: 'Basement Room 1 - Bed A', Space_Type: 'Shared Room Bed', Target_Rent: 550, Full_Room_Rent: 1000, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Occupied', Tenant_ID: 'TEN-007', Tenant_Name: 'Emily Zhao' },
              { Space_ID: 'SPC-B2', Bedroom_ID: 'BR-B1', Bedroom_Name: 'Basement Room 1', Space_Name: 'Basement Room 1 - Bed B', Space_Type: 'Shared Room Bed', Target_Rent: 550, Full_Room_Rent: 1000, Occupancy_Mode: 'Shared', Utilities_Included: true, Current_Status: 'Vacant' },
              { Space_ID: 'SPC-B3', Bedroom_ID: 'BR-B2', Bedroom_Name: 'Basement Room 2', Space_Name: 'Basement Room 2 - Private Bedroom', Space_Type: 'Private Bedroom', Target_Rent: 650, Full_Room_Rent: 650, Occupancy_Mode: 'Fully Used (Private)', Utilities_Included: true, Current_Status: 'Vacant' }
            ];
          }
        }
      });
    }

    if (data.tenants) {
      data.tenants.forEach(t => {
        if (t.Current_Property_ID === 'PROP-006') {
          t.Current_Property_ID = 'PROP-005';
        }
        if (t.Tenant_ID === 'TEN-006') {
          t.Full_Name = 'Lucas Vance';
          t.Current_Property_ID = 'PROP-005';
          t.Current_Unit_ID = 'UNIT-501';
          t.Floor_Division = 'Main Floor';
        } else if (t.Tenant_ID === 'TEN-007') {
          t.Full_Name = 'Emily Zhao';
          t.Current_Property_ID = 'PROP-005';
          t.Current_Unit_ID = 'UNIT-601';
          t.Floor_Division = 'Basement';
        }
      });
    }

    if (data.leases) {
      data.leases.forEach(l => {
        if (l.Property_ID === 'PROP-006') {
          l.Property_ID = 'PROP-005';
        }
      });
      // Filter out buggy auto-generated LEASE-006 and LEASE-007 records
      data.leases = data.leases.filter(l => l.Lease_ID !== 'LEASE-006' && l.Lease_ID !== 'LEASE-007');
    }

    if (data.utilityBills) {
      data.utilityBills.forEach(b => {
        if (b.Property_ID === 'PROP-006') b.Property_ID = 'PROP-005';
      });
    }
    if (data.utilitySplits) {
      data.utilitySplits.forEach(s => {
        if (s.Property_ID === 'PROP-006') s.Property_ID = 'PROP-005';
        if (s.Unit_ID === 'UNIT-501' && !s.Division_Level) s.Division_Level = 'Main Floor';
        if (s.Unit_ID === 'UNIT-601' && !s.Division_Level) s.Division_Level = 'Basement';
      });
    }
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
    
    // Async background sync to central server
    if (typeof window !== 'undefined') {
      fetch('/api/erp/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      }).catch(err => console.warn('[Storage] Background server backup failed:', err));
    }
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  public resetToDefault() {
    this.data = getCleanProductionData();
    this.save();
  }

  public resetToCleanSlate(userEmail: string = 'admin@dreamdwell.com') {
    this.data = getCleanProductionData();
    this.logAudit(userEmail, 'DELETE', 'System', 'RESET_CLEAN_SLATE', { message: 'Database reset to empty clean production state.' });
    this.save();
  }

  public purgeAllSampleData(userEmail: string = 'admin@dreamdwell.com') {
    this.data.properties = [];
    this.data.units = [];
    this.data.landlords = [];
    this.data.tenants = [];
    this.data.tenantIDProofs = [];
    this.data.bookings = [];
    this.data.leases = [];
    this.data.landlordPayments = [];
    this.data.rentTransactions = [];
    this.data.depositTransactions = [];
    this.data.utilityBills = [];
    this.data.utilitySplits = [];
    this.data.collections = [];
    this.data.excessPayments = [];
    this.data.refunds = [];
    this.data.moveIns = [];
    this.data.moveOuts = [];
    this.data.journalHeaders = [];
    this.data.journalLines = [];
    this.logAudit(userEmail, 'DELETE', 'System', 'PURGE_ALL_DATA', { message: 'All operational records purged. Clean production state.' });
    this.save();
  }

  public clearEntireDatabase(userEmail: string = 'admin@dreamdwell.com') {
    this.purgeAllSampleData(userEmail);
  }

  public cleanOrphanRecords(userEmail: string = 'admin@dreamdwell.com'): {
    removedDepositsCount: number;
    removedRentTxnsCount: number;
    removedSplitsCount: number;
    syncedUnitsCount: number;
  } {
    const validLeaseIds = new Set(this.data.leases.map(l => l.Lease_ID));

    const initialDepCount = this.data.depositTransactions.length;
    this.data.depositTransactions = this.data.depositTransactions.filter(d => {
      if (!d) return false;
      // If deposit is tied to a specific lease ID, ensure the lease exists
      if (d.Lease_ID && !validLeaseIds.has(d.Lease_ID)) {
        return false;
      }
      // Check if Deposit_Txn_ID embeds a deleted lease ID (e.g. DEP-LEASE-MTN74IDM)
      if (d.Deposit_Txn_ID && d.Deposit_Txn_ID.includes('LEASE-')) {
        const match = d.Deposit_Txn_ID.match(/LEASE-[A-Za-z0-9_-]+/);
        if (match && match[0] && !validLeaseIds.has(match[0])) {
          return false;
        }
      }
      // Check if Reference embeds a deleted lease ID
      if (d.Reference && d.Reference.includes('LEASE-')) {
        const match = d.Reference.match(/LEASE-[A-Za-z0-9_-]+/);
        if (match && match[0] && !validLeaseIds.has(match[0]) && !d.Lease_ID) {
          return false;
        }
      }
      return true;
    });
    const removedDepositsCount = initialDepCount - this.data.depositTransactions.length;

    const initialRentCount = this.data.rentTransactions.length;
    this.data.rentTransactions = this.data.rentTransactions.filter(r => {
      if (!r || !r.Rent_Txn_ID) return false;
      if (r.Lease_ID && !validLeaseIds.has(r.Lease_ID)) return false;
      return true;
    });
    const removedRentTxnsCount = initialRentCount - this.data.rentTransactions.length;

    const initialSplitsCount = this.data.utilitySplits.length;
    this.data.utilitySplits = this.data.utilitySplits.filter(u => {
      if (!u || !u.Split_ID) return false;
      if (u.Lease_ID && !validLeaseIds.has(u.Lease_ID)) return false;
      return true;
    });
    const removedSplitsCount = initialSplitsCount - this.data.utilitySplits.length;

    const syncedUnitsCount = this.syncAllUnitStatuses();

    if (removedDepositsCount > 0 || removedRentTxnsCount > 0 || removedSplitsCount > 0 || syncedUnitsCount > 0) {
      this.logAudit(userEmail, 'UPDATE', 'System', 'ORPHAN_CLEANUP', {
        removedDepositsCount,
        removedRentTxnsCount,
        removedSplitsCount,
        syncedUnitsCount
      });
      this.save();
    }

    return {
      removedDepositsCount,
      removedRentTxnsCount,
      removedSplitsCount,
      syncedUnitsCount
    };
  }

  public syncAllUnitStatuses(): number {
    let synced = 0;
    const activeLeases = this.data.leases.filter(l => l.Status === 'Active' || (l.Status as string) === 'active');
    const tenantMap = new Map(this.data.tenants.map(t => [t.Tenant_ID, t.Full_Name]));

    this.data.units.forEach(unit => {
      if (unit.Current_Status === 'Inactive' || unit.Current_Status === 'Maintenance') {
        return;
      }
      const unitLeases = activeLeases.filter(l => l.Unit_ID === unit.Unit_ID);

      if (unitLeases.length === 0) {
        // No active leases for this unit
        if (unit.Spaces && Array.isArray(unit.Spaces)) {
          unit.Spaces.forEach(sp => {
            sp.Current_Status = 'Vacant';
            sp.Tenant_ID = undefined;
            sp.Tenant_Name = undefined;
          });
        }
        if (unit.Current_Status !== 'Vacant') {
          unit.Current_Status = 'Vacant';
          synced++;
        }
      } else {
        // Active lease(s) exist
        const hasWholeUnitLease = unitLeases.some(l => !l.Space_ID && !l.Bedroom_ID && !l.Is_Full_Bedroom);

        if (hasWholeUnitLease) {
          const mainLease = unitLeases.find(l => !l.Space_ID && !l.Bedroom_ID && !l.Is_Full_Bedroom)!;
          if (unit.Spaces && Array.isArray(unit.Spaces)) {
            unit.Spaces.forEach(sp => {
              sp.Current_Status = 'Occupied';
              sp.Tenant_ID = mainLease.Tenant_ID;
              sp.Tenant_Name = tenantMap.get(mainLease.Tenant_ID) || 'Active Tenant';
            });
          }
          if (unit.Current_Status !== 'Occupied') {
            unit.Current_Status = 'Occupied';
            synced++;
          }
        } else if (unit.Spaces && Array.isArray(unit.Spaces) && unit.Spaces.length > 0) {
          // Room / Space based
          unit.Spaces.forEach(sp => {
            const matchingLease = unitLeases.find(l => 
              l.Space_ID === sp.Space_ID || 
              (l.Is_Full_Bedroom && (l.Bedroom_ID === sp.Bedroom_ID || l.Bedroom_Name === sp.Bedroom_Name)) ||
              (l.Space_Name && sp.Space_Name && l.Space_Name.toLowerCase() === sp.Space_Name.toLowerCase())
            );
            if (matchingLease) {
              sp.Current_Status = 'Occupied';
              sp.Tenant_ID = matchingLease.Tenant_ID;
              sp.Tenant_Name = tenantMap.get(matchingLease.Tenant_ID) || 'Active Tenant';
            } else {
              sp.Current_Status = 'Vacant';
              sp.Tenant_ID = undefined;
              sp.Tenant_Name = undefined;
            }
          });

          const hasVacant = unit.Spaces.some(sp => sp.Current_Status === 'Vacant');
          const newStatus = hasVacant ? 'Vacant' : 'Occupied';
          if (unit.Current_Status !== newStatus) {
            unit.Current_Status = newStatus;
            synced++;
          }
        } else {
          if (unit.Current_Status !== 'Occupied') {
            unit.Current_Status = 'Occupied';
            synced++;
          }
        }
      }
    });

    return synced;
  }

  public loadSampleDemoData(userEmail: string = 'admin@dreamdwell.com') {
    const demo = getSampleDemoData();
    this.data = {
      ...demo,
      users: this.data.users && this.data.users.length > 0 ? this.data.users : demo.users
    };
    this.logAudit(userEmail, 'CREATE', 'System', 'LOAD_DEMO_DATA', { message: 'Loaded sample demo portfolio dataset.' });
    this.save();
  }

  public hasSampleData(): boolean {
    return this.data.properties.length > 0 || this.data.tenants.length > 0 || this.data.leases.length > 0;
  }

  public exportToJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importFromJSON(jsonStr: string, userEmail: string = 'admin@dreamdwell.com'): boolean {
    try {
      const parsed = JSON.parse(jsonStr) as ERPDataStore;
      if (!parsed.users || !parsed.properties) {
        throw new Error('Invalid ERP Data Store schema');
      }
      this.data = parsed;
      this.logAudit(userEmail, 'CREATE', 'System', 'IMPORT_DATABASE', { timestamp: new Date().toISOString() });
      this.save();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  public getRawData(): ERPDataStore {
    return this.data;
  }

  public applyCloudData(cloudData: ERPDataStore) {
    if (!cloudData || !Array.isArray(cloudData.properties)) return;
    this.migrateDividedProperties(cloudData);
    this.deduplicateAndMigrateDeposits(cloudData);
    this.migrateUtilityCatalog(cloudData);
    this.data = cloudData;
    this.saveDirect(this.data);
    this.listeners.forEach(fn => fn());
  }

  // Authentication Session Management
  public getAuthenticatedSession(): User | null {
    try {
      const stored = sessionStorage.getItem(AUTH_SESSION_KEY) || 
        localStorage.getItem(AUTH_SESSION_KEY) || 
        sessionStorage.getItem(LEGACY_AUTH_SESSION_KEY) || 
        localStorage.getItem(LEGACY_AUTH_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = this.data.users.find(u =>
          (parsed.User_ID && u.User_ID === parsed.User_ID) ||
          (parsed.Email && u.Email.toLowerCase() === parsed.Email.toLowerCase())
        );
        if (found && found.Is_Active) {
          return found;
        }
      }
    } catch (e) {
      console.warn('Error retrieving authenticated session:', e);
    }
    return null;
  }

  public setAuthenticatedSession(user: User | null, rememberMe: boolean = false) {
    try {
      if (user) {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
        if (rememberMe) {
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      } else {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (e) {
      console.warn('Error saving session:', e);
    }
  }

  public logout(userEmail?: string) {
    if (userEmail) {
      this.logAudit(userEmail, 'LOGOUT', 'Authentication', 'SESSION_TERMINATED', { timestamp: new Date().toISOString() });
    }
    this.setAuthenticatedSession(null);
  }

  public registerOrUpdateUser(userData: {
    Email: string;
    Full_Name: string;
    Password: string;
    Role?: User['Role'];
    Phone?: string;
  }): User {
    const emailLower = userData.Email.trim().toLowerCase();
    const existingIdx = this.data.users.findIndex(u => u.Email.toLowerCase() === emailLower);

    if (existingIdx >= 0) {
      const updated: User = {
        ...this.data.users[existingIdx],
        Full_Name: userData.Full_Name || this.data.users[existingIdx].Full_Name,
        Password: userData.Password,
        Role: userData.Role || this.data.users[existingIdx].Role,
        Phone: userData.Phone || this.data.users[existingIdx].Phone,
        Is_Active: true,
        Last_Login: new Date().toISOString()
      };
      this.data.users[existingIdx] = updated;
      this.logAudit(updated.Email, 'UPDATE', 'Users', updated.User_ID, { action: 'Updated user credentials/password' });
      this.save();
      return updated;
    } else {
      const newUser: User = {
        User_ID: 'USR-' + Date.now().toString().slice(-6),
        Email: userData.Email.trim(),
        Full_Name: userData.Full_Name || userData.Email.split('@')[0],
        Password: userData.Password,
        Role: userData.Role || 'Admin',
        Phone: userData.Phone || '',
        Is_Active: true,
        Created_At: new Date().toISOString().slice(0, 10),
        Last_Login: new Date().toISOString(),
        Assigned_Tabs: [...ALL_ERP_TABS]
      };
      this.data.users.push(newUser);
      this.logAudit(newUser.Email, 'CREATE', 'Users', newUser.User_ID, { action: 'Registered new user account' });
      this.save();
      return newUser;
    }
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
  public getChartOfAccounts() { return this.data.coa; }
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

  public updatePropertyParkingSpots(propertyId: string, spots: ParkingSpot[], userEmail: string = 'admin@dreamdwell.com') {
    const prop = this.data.properties.find(p => p.Property_ID === propertyId);
    if (prop) {
      prop.Parking_Spots = spots;
      prop.Total_Parking_Spots = spots.length;
      this.logAudit(userEmail, 'UPDATE', 'Properties', propertyId, { parkingSpotsCount: spots.length });
      this.save();
    }
  }

  public assignParkingSpot(propertyId: string, spotId: string, tenantId?: string, vehiclePlate?: string, userEmail: string = 'admin@dreamdwell.com') {
    const prop = this.data.properties.find(p => p.Property_ID === propertyId);
    if (!prop || !prop.Parking_Spots) return;
    const spot = prop.Parking_Spots.find(s => s.Spot_ID === spotId);
    if (!spot) return;

    // If previously assigned to another tenant, clear that tenant's parking reference
    if (spot.Assigned_Tenant_ID && spot.Assigned_Tenant_ID !== tenantId) {
      const prevTenant = this.data.tenants.find(t => t.Tenant_ID === spot.Assigned_Tenant_ID);
      if (prevTenant) {
        prevTenant.Assigned_Parking_Spot_ID = undefined;
        prevTenant.Assigned_Parking_Spot_Name = undefined;
        prevTenant.Parking_Monthly_Fee = undefined;
      }
    }

    if (tenantId) {
      const tenant = this.data.tenants.find(t => t.Tenant_ID === tenantId);
      spot.Status = 'Assigned';
      spot.Assigned_Tenant_ID = tenantId;
      spot.Assigned_Tenant_Name = tenant?.Full_Name;
      spot.Assigned_Unit_ID = tenant?.Current_Unit_ID;
      if (vehiclePlate !== undefined) spot.Vehicle_Plate = vehiclePlate;

      if (tenant) {
        tenant.Assigned_Parking_Spot_ID = spot.Spot_ID;
        tenant.Assigned_Parking_Spot_Name = spot.Spot_Number_Name;
        tenant.Parking_Monthly_Fee = spot.Monthly_Fee;
      }
    } else {
      spot.Status = 'Available';
      spot.Assigned_Tenant_ID = undefined;
      spot.Assigned_Tenant_Name = undefined;
      spot.Assigned_Unit_ID = undefined;
      spot.Vehicle_Plate = undefined;
    }

    this.logAudit(userEmail, 'UPDATE', 'Properties', propertyId, { action: 'ASSIGN_PARKING', spotId, tenantId });
    this.save();
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
      this.save();
    }
  }

  public deriveUnitSpacesFromBedrooms(unit: { Unit_ID: string; Bedrooms_List?: BedroomAllocation[]; Spaces?: UnitSpace[]; Utilities_Included?: boolean }): UnitSpace[] {
    if (!unit.Bedrooms_List || unit.Bedrooms_List.length === 0) {
      return unit.Spaces || [];
    }
    const existingSpaces = unit.Spaces || [];
    const newSpaces: UnitSpace[] = [];

    unit.Bedrooms_List.forEach((br, bIdx) => {
      if (br.Allocation_Mode === 'Fully Used') {
        const existingForBr = existingSpaces.find(s => s.Bedroom_ID === br.Bedroom_ID || s.Space_Name.startsWith(br.Bedroom_Name));
        newSpaces.push({
          Space_ID: existingForBr?.Space_ID || `SPC-${unit.Unit_ID.replace('UNIT-', '')}-BR${bIdx + 1}-FULL`,
          Space_Name: `${br.Bedroom_Name} (Full Bedroom - Individual)`,
          Bedroom_ID: br.Bedroom_ID,
          Bedroom_Name: br.Bedroom_Name,
          Space_Type: br.Ensuite_Bath ? 'Master Ensuite' : 'Private Bedroom',
          Target_Rent: br.Full_Room_Rent,
          Full_Room_Rent: br.Full_Room_Rent,
          Occupancy_Mode: 'Fully Used (Private)',
          Utilities_Included: unit.Utilities_Included,
          Current_Status: existingForBr?.Current_Status || 'Vacant',
          Tenant_ID: existingForBr?.Tenant_ID,
          Tenant_Name: existingForBr?.Tenant_Name,
          Notes: br.Notes || 'Leased fully to single tenant'
        });
      } else {
        const spacesCount = br.Sharing_Spaces_Count || 2;
        for (let i = 0; i < spacesCount; i++) {
          const spaceSuffix = String.fromCharCode(65 + i); // 'A', 'B', etc.
          const existingSp = existingSpaces.find(s =>
            (s.Bedroom_ID === br.Bedroom_ID && s.Space_Name.includes(spaceSuffix)) ||
            s.Space_Name === `${br.Bedroom_Name} - Bed ${spaceSuffix}` ||
            s.Space_Name === `${br.Bedroom_Name} - Space ${spaceSuffix}` ||
            s.Space_Name === `${br.Bedroom_Name} - Master Bed ${spaceSuffix}` ||
            s.Space_Name === `${br.Bedroom_Name} - Master Space ${spaceSuffix}`
          );
          newSpaces.push({
            Space_ID: existingSp?.Space_ID || `SPC-${unit.Unit_ID.replace('UNIT-', '')}-BR${bIdx + 1}-${spaceSuffix}`,
            Space_Name: `${br.Bedroom_Name} - Bed ${spaceSuffix}`,
            Bedroom_ID: br.Bedroom_ID,
            Bedroom_Name: br.Bedroom_Name,
            Space_Type: br.Ensuite_Bath ? 'Master Ensuite' : 'Shared Room Bed',
            Target_Rent: br.Sharing_Rent_Per_Space,
            Full_Room_Rent: br.Full_Room_Rent,
            Occupancy_Mode: 'Shared',
            Utilities_Included: unit.Utilities_Included,
            Current_Status: existingSp?.Current_Status || 'Vacant',
            Tenant_ID: existingSp?.Tenant_ID,
            Tenant_Name: existingSp?.Tenant_Name,
            Notes: br.Notes || `Sharing bed ${spaceSuffix}`
          });
        }
      }
    });

    return newSpaces;
  }

  public toggleBedroomAllocationMode(unitId: string, bedroomId: string, userEmail: string): Unit | undefined {
    const unit = this.data.units.find(u => u.Unit_ID === unitId);
    if (!unit || !unit.Bedrooms_List) return undefined;
    const br = unit.Bedrooms_List.find(b => b.Bedroom_ID === bedroomId);
    if (!br) return undefined;

    const newMode: 'Fully Used' | 'Sharing' = br.Allocation_Mode === 'Sharing' ? 'Fully Used' : 'Sharing';
    br.Allocation_Mode = newMode;

    unit.Spaces = this.deriveUnitSpacesFromBedrooms(unit);
    unit.Spaces_Count = unit.Spaces.length;
    unit.Target_Rent = unit.Spaces.reduce((sum, s) => sum + (s.Target_Rent || 0), 0);
    unit.Monthly_Rent = unit.Target_Rent;

    this.logAudit(userEmail, 'UPDATE', 'Units', unit.Unit_ID, {
      action: 'TOGGLE_BEDROOM_ALLOCATION',
      bedroomId,
      bedroomName: br.Bedroom_Name,
      newMode
    });
    this.save();
    return unit;
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
      const oldLease = this.data.leases[idx];

      const targetSec = Math.round((lease.Deposit_Required ?? lease.Security_Deposit_Amount ?? lease.Security_Deposit ?? 0) * 100) / 100;
      const targetLMR = Math.round((lease.Last_Month_Rent ?? lease.Last_Month_Rent_Amount ?? 0) * 100) / 100;
      const monthlyRent = Math.round((lease.Monthly_Rent || 0) * 100) / 100;

      lease.Monthly_Rent = monthlyRent;
      lease.Deposit_Required = targetSec;
      lease.Security_Deposit_Amount = targetSec;
      lease.Security_Deposit = targetSec;
      lease.Last_Month_Rent = targetLMR;
      lease.Last_Month_Rent_Amount = targetLMR;

      this.data.leases[idx] = lease;

      const tenantChanged = oldLease.Tenant_ID !== lease.Tenant_ID;
      const propertyChanged = oldLease.Property_ID !== lease.Property_ID;
      const unitChanged = oldLease.Unit_ID !== lease.Unit_ID;
      const startDateChanged = oldLease.Lease_Start !== lease.Lease_Start;
      const rentChanged = oldLease.Monthly_Rent !== lease.Monthly_Rent;

      // 1. Cascade update related deposit transactions
      let hasSecCharge = false;
      let hasLmrCharge = false;

      this.data.depositTransactions.forEach(d => {
        if (d.Lease_ID === lease.Lease_ID || (d.Deposit_Txn_ID && d.Deposit_Txn_ID.includes(lease.Lease_ID))) {
          d.Lease_ID = lease.Lease_ID;
          if (tenantChanged) d.Tenant_ID = lease.Tenant_ID;
          if (propertyChanged) d.Property_ID = lease.Property_ID;
          if (unitChanged) d.Unit_ID = lease.Unit_ID;

          // If Security Deposit charge
          if (d.Deposit_Type === 'Security Deposit' && (d.Txn_Type === 'Charge' || d.Status === 'Receivable' || d.Status === 'Partial' || !d.Paid_Amount)) {
            hasSecCharge = true;
            d.Due_Amount = targetSec;
            d.Balance = Math.max(0, Math.round((targetSec - (d.Paid_Amount || 0)) * 100) / 100);
            d.Status = d.Balance <= 0 ? 'Received' : ((d.Paid_Amount || 0) > 0 ? 'Partial' : 'Receivable');
            if ((d.Paid_Amount || 0) === 0 && startDateChanged) {
              d.Txn_Date = lease.Lease_Start;
            }
          }

          // If LMR charge
          if (d.Deposit_Type === 'Last Month Rent' && (d.Txn_Type === 'Charge' || d.Status === 'Receivable' || d.Status === 'Partial' || !d.Paid_Amount)) {
            hasLmrCharge = true;
            d.Due_Amount = targetLMR;
            d.Balance = Math.max(0, Math.round((targetLMR - (d.Paid_Amount || 0)) * 100) / 100);
            d.Status = d.Balance <= 0 ? 'Received' : ((d.Paid_Amount || 0) > 0 ? 'Partial' : 'Receivable');
            if ((d.Paid_Amount || 0) === 0 && startDateChanged) {
              d.Txn_Date = lease.Lease_Start;
            }
          }
        }
      });

      // If Security Deposit requirement was removed and charge is completely unpaid, purge it
      if (targetSec === 0) {
        this.data.depositTransactions = this.data.depositTransactions.filter(
          d => !((d.Lease_ID === lease.Lease_ID || d.Deposit_Txn_ID === `DEP-SEC-${lease.Lease_ID}`) &&
                 d.Deposit_Type === 'Security Deposit' &&
                 (d.Paid_Amount || 0) === 0)
        );
      } else if (!hasSecCharge && (lease.Status === 'Active' || (lease.Status as string) === 'active')) {
        // Charge was missing but now required: create it
        this.data.depositTransactions.unshift({
          Deposit_Txn_ID: `DEP-SEC-${lease.Lease_ID}`,
          Lease_ID: lease.Lease_ID,
          Tenant_ID: lease.Tenant_ID,
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Deposit_Type: 'Security Deposit',
          Txn_Type: 'Charge',
          Due_Amount: targetSec,
          Paid_Amount: 0,
          Refund_Amount: 0,
          Balance: targetSec,
          Txn_Date: lease.Lease_Start,
          Status: 'Receivable',
          Journal_Ref_ID: `JRN-LEASE-INIT-${lease.Lease_ID}`,
          Reference: 'Security / Key Deposit Initial Charge',
          Notes: `Initial key/security deposit charge for lease ${lease.Lease_ID}`,
          Created_By: userEmail
        });
      }

      // If LMR requirement was removed and charge is completely unpaid, purge it
      if (targetLMR === 0) {
        this.data.depositTransactions = this.data.depositTransactions.filter(
          d => !((d.Lease_ID === lease.Lease_ID || d.Deposit_Txn_ID === `DEP-LMR-${lease.Lease_ID}`) &&
                 d.Deposit_Type === 'Last Month Rent' &&
                 (d.Paid_Amount || 0) === 0)
        );
      } else if (!hasLmrCharge && (lease.Status === 'Active' || (lease.Status as string) === 'active')) {
        // Charge was missing but now required: create it
        this.data.depositTransactions.unshift({
          Deposit_Txn_ID: `DEP-LMR-${lease.Lease_ID}`,
          Lease_ID: lease.Lease_ID,
          Tenant_ID: lease.Tenant_ID,
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Deposit_Type: 'Last Month Rent',
          Txn_Type: 'Charge',
          Due_Amount: targetLMR,
          Paid_Amount: 0,
          Refund_Amount: 0,
          Balance: targetLMR,
          Txn_Date: lease.Lease_Start,
          Status: 'Receivable',
          Journal_Ref_ID: `JRN-LEASE-INIT-${lease.Lease_ID}`,
          Reference: 'Last Month Rent (LMR) Initial Charge',
          Notes: `Initial last month rent charge for lease ${lease.Lease_ID}`,
          Created_By: userEmail
        });
      }

      // Recalculate lease.Deposit_Received from held payments
      const totalSecReceived = this.data.depositTransactions
        .filter(d => (d.Lease_ID === lease.Lease_ID || (d.Deposit_Txn_ID && d.Deposit_Txn_ID.includes(lease.Lease_ID))) &&
                     d.Deposit_Type === 'Security Deposit' &&
                     (d.Txn_Type === 'Payment' || d.Status === 'Received' || (d.Paid_Amount || 0) > 0))
        .reduce((sum, d) => sum + (d.Paid_Amount || 0), 0);
      lease.Deposit_Received = totalSecReceived;

      // 2. Cascade update related rent transactions & arrears
      const matchingRentTxns = this.data.rentTransactions.filter(
        r => r.Lease_ID === lease.Lease_ID || (r.Rent_Txn_ID && r.Rent_Txn_ID.includes(lease.Lease_ID))
      );

      if (matchingRentTxns.length === 0 && (lease.Status === 'Active' || (lease.Status as string) === 'active')) {
        // Rent transaction missing: create initial rent billing
        const firstMonthStr = (lease.Lease_Start || new Date().toISOString().slice(0, 10)).slice(0, 7);
        const rentTxnId = `RENT-${firstMonthStr.replace('-', '')}-${lease.Lease_ID}`;
        this.data.rentTransactions.unshift({
          Rent_Txn_ID: rentTxnId,
          Lease_ID: lease.Lease_ID,
          Tenant_ID: lease.Tenant_ID,
          Property_ID: lease.Property_ID,
          Unit_ID: lease.Unit_ID,
          Period_Month: firstMonthStr,
          Due_Date: lease.Lease_Start,
          Amount_Billed: monthlyRent,
          Amount_Paid: 0,
          Balance: monthlyRent,
          Status: 'Unpaid',
          Journal_Ref_ID: `JRN-LEASE-INIT-${lease.Lease_ID}`,
          Created_By: userEmail,
          Created_At: new Date().toISOString()
        });
      } else {
        matchingRentTxns.forEach(r => {
          if (tenantChanged) r.Tenant_ID = lease.Tenant_ID;
          if (propertyChanged) r.Property_ID = lease.Property_ID;
          if (unitChanged) r.Unit_ID = lease.Unit_ID;

          if (rentChanged) {
            // Update rent billing amount and recalculate balance (arrears) taking any discount into account
            const netMonthly = Math.max(0, monthlyRent - (r.Discount_Amount || 0));
            if (r.Status === 'Unpaid' || (r.Amount_Paid || 0) === 0) {
              r.Amount_Billed = monthlyRent;
              r.Balance = netMonthly;
              r.Status = r.Balance <= 0 ? 'Paid' : 'Unpaid';
            } else if (r.Status === 'Partial' || (r.Amount_Paid || 0) < netMonthly) {
              r.Amount_Billed = monthlyRent;
              r.Balance = Math.max(0, Math.round((netMonthly - (r.Amount_Paid || 0)) * 100) / 100);
              r.Status = r.Balance <= 0 ? 'Paid' : 'Partial';
            } else if (r.Status === 'Paid' && netMonthly > (r.Amount_Paid || 0)) {
              // Upward rent revision generates arrears for the delta
              r.Amount_Billed = monthlyRent;
              r.Balance = Math.max(0, Math.round((netMonthly - (r.Amount_Paid || 0)) * 100) / 100);
              r.Status = 'Partial';
            }
          }

          if (startDateChanged && (r.Amount_Paid || 0) === 0) {
            const oldStartMonth = (oldLease.Lease_Start || '').slice(0, 7);
            if (r.Due_Date === oldLease.Lease_Start || r.Period_Month === oldStartMonth || r.Rent_Txn_ID.includes(oldStartMonth.replace('-', ''))) {
              r.Period_Month = (lease.Lease_Start || '').slice(0, 7);
              r.Due_Date = lease.Lease_Start;
            }
          }
        });
      }

      // 3. Cascade update related collections records
      if (this.data.collections && Array.isArray(this.data.collections)) {
        this.data.collections.forEach(c => {
          const matchRent = matchingRentTxns.some(r => r.Rent_Txn_ID === c.Rent_Txn_ID);
          const matchTenant = c.Tenant_ID === oldLease.Tenant_ID;
          if (matchRent || matchTenant) {
            if (tenantChanged) c.Tenant_ID = lease.Tenant_ID;
            if (propertyChanged) c.Property_ID = lease.Property_ID;
            if (unitChanged) c.Unit_ID = lease.Unit_ID;
          }
        });
      }

      // 4. Cascade update related utility splits
      this.data.utilitySplits.forEach(u => {
        if (u.Lease_ID === lease.Lease_ID) {
          if (tenantChanged) u.Tenant_ID = lease.Tenant_ID;
          if (unitChanged) u.Unit_ID = lease.Unit_ID;
        }
      });

      // 5. Cascade update initial inception journal entry (GL 1100, 4000, 1120, 2200, 1125, 2210)
      const jHeader = this.data.journalHeaders.find(
        j => j.Journal_ID === `JRN-LEASE-INIT-${lease.Lease_ID}` || j.Reference_ID === lease.Lease_ID
      );
      if (jHeader) {
        jHeader.Date = lease.Lease_Start;
        jHeader.Description = `Lease Inception — ${lease.Lease_ID} (${lease.Unit_ID}${lease.Space_Name ? ` - ${lease.Space_Name}` : lease.Is_Full_Room ? ' - Full Room' : ''})`;
        this.data.journalLines.forEach(l => {
          if (l.Journal_ID === jHeader.Journal_ID) {
            l.Tenant_ID = lease.Tenant_ID;
            l.Property_ID = lease.Property_ID;
            l.Unit_ID = lease.Unit_ID;
            if (l.Account_Code === '1100') l.Debit_Amount = monthlyRent;
            if (l.Account_Code === '4000') l.Credit_Amount = monthlyRent;
            if (l.Account_Code === '1120') l.Debit_Amount = targetSec;
            if (l.Account_Code === '2200') l.Credit_Amount = targetSec;
            if (l.Account_Code === '1125') l.Debit_Amount = targetLMR;
            if (l.Account_Code === '2210') l.Credit_Amount = targetLMR;
          }
        });
      }

      // 6. Update tenant status and property links
      const tIdx = this.data.tenants.findIndex(t => t.Tenant_ID === lease.Tenant_ID);
      if (tIdx >= 0) {
        this.data.tenants[tIdx].Status = 'Active';
        this.data.tenants[tIdx].Current_Property_ID = lease.Property_ID;
        this.data.tenants[tIdx].Current_Unit_ID = lease.Unit_ID;
      }

      // 7. Full synchronization of accounting reconciliation and unit statuses
      this.reconcileLeasesWithAccounting(this.data, userEmail);
      this.syncAllUnitStatuses();
      this.logAudit(userEmail, 'UPDATE', 'Leases', lease.Lease_ID, lease);
      this.save();
    }
  }

  public addIndividualExpenseCharge(leaseId: string, charge: IndividualExpenseCharge, userEmail: string = 'admin@dreamdwell.com') {
    const lease = this.data.leases.find(l => l.Lease_ID === leaseId);
    if (lease) {
      if (!lease.Individual_Expenses) lease.Individual_Expenses = [];
      lease.Individual_Expenses.unshift(charge);
      this.logAudit(userEmail, 'CREATE', 'IndividualExpenses', charge.Charge_ID, charge);
      this.save();
    }
  }

  public updateIndividualExpenseCharge(leaseId: string, charge: IndividualExpenseCharge, userEmail: string = 'admin@dreamdwell.com') {
    const lease = this.data.leases.find(l => l.Lease_ID === leaseId);
    if (lease && lease.Individual_Expenses) {
      const idx = lease.Individual_Expenses.findIndex(c => c.Charge_ID === charge.Charge_ID);
      if (idx >= 0) {
        lease.Individual_Expenses[idx] = charge;
        this.logAudit(userEmail, 'UPDATE', 'IndividualExpenses', charge.Charge_ID, charge);
        this.save();
      }
    }
  }

  public recordIndividualExpensePayment(
    leaseId: string,
    chargeId: string,
    paidAmount: number,
    paymentMethod: string,
    reference?: string,
    userEmail: string = 'admin@dreamdwell.com'
  ) {
    const lease = this.data.leases.find(l => l.Lease_ID === leaseId);
    if (!lease || !lease.Individual_Expenses) return;
    const charge = lease.Individual_Expenses.find(c => c.Charge_ID === chargeId);
    if (!charge) return;

    const newPaid = Math.round(((charge.Amount_Paid || 0) + paidAmount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((charge.Amount - newPaid) * 100) / 100);

    charge.Amount_Paid = newPaid;
    charge.Balance = newBalance;
    charge.Status = newBalance <= 0 ? 'Paid' : 'Partial';
    charge.Payment_Date = new Date().toISOString().slice(0, 10);
    charge.Payment_Method = paymentMethod;
    if (reference) charge.Reference = reference;

    this.logAudit(userEmail, 'UPDATE', 'IndividualExpenses', chargeId, {
      action: 'PAYMENT',
      paidAmount,
      balance: newBalance,
      status: charge.Status
    });
    this.save();
  }

  public deleteIndividualExpenseCharge(leaseId: string, chargeId: string, userEmail: string = 'admin@dreamdwell.com') {
    const lease = this.data.leases.find(l => l.Lease_ID === leaseId);
    if (lease && lease.Individual_Expenses) {
      lease.Individual_Expenses = lease.Individual_Expenses.filter(c => c.Charge_ID !== chargeId);
      this.logAudit(userEmail, 'DELETE', 'IndividualExpenses', chargeId);
      this.save();
    }
  }

  public deleteLease(leaseId: string, userEmail: string) {
    const targetLease = this.data.leases.find(l => l.Lease_ID === leaseId);
    this.data.leases = this.data.leases.filter(l => l.Lease_ID !== leaseId);
    
    // 1. Cascade remove associated rent transactions
    this.data.rentTransactions = this.data.rentTransactions.filter(r => 
      r.Lease_ID !== leaseId && !r.Rent_Txn_ID?.includes(leaseId)
    );

    // 2. Cascade remove associated deposit transactions (handles both Lease_ID and ID embedded like DEP-LEASE-MTN74IDM)
    this.data.depositTransactions = this.data.depositTransactions.filter(d => 
      d.Lease_ID !== leaseId && 
      !d.Deposit_Txn_ID.includes(leaseId) &&
      !(d.Reference && d.Reference.includes(leaseId))
    );

    // 3. Cascade remove associated utility splits
    this.data.utilitySplits = this.data.utilitySplits.filter(u => u.Lease_ID !== leaseId);

    // 4. Cascade remove associated move-in / move-out records
    this.data.moveIns = this.data.moveIns.filter(m => m.Lease_ID !== leaseId);
    this.data.moveOuts = this.data.moveOuts.filter(m => m.Lease_ID !== leaseId);

    if (targetLease) {
      // 5. Free assigned spaces in the unit
      const unit = this.data.units.find(u => u.Unit_ID === targetLease.Unit_ID);
      if (unit && unit.Spaces && Array.isArray(unit.Spaces)) {
        unit.Spaces.forEach(sp => {
          if (sp.Tenant_ID === targetLease.Tenant_ID || (targetLease.Space_ID && sp.Space_ID === targetLease.Space_ID)) {
            sp.Current_Status = 'Vacant';
            sp.Tenant_ID = undefined;
            sp.Tenant_Name = undefined;
          }
        });
      }

      // 6. Check if tenant has other active leases
      const allOccupantTenantIds = [targetLease.Tenant_ID];
      if (targetLease.Occupants) {
        targetLease.Occupants.forEach(o => {
          if (o.Occupant_ID && !allOccupantTenantIds.includes(o.Occupant_ID)) {
            allOccupantTenantIds.push(o.Occupant_ID);
          }
        });
      }

      allOccupantTenantIds.forEach(tid => {
        const remainingLeases = this.data.leases.filter(
          l => (l.Tenant_ID === tid || l.Occupants?.some(o => o.Occupant_ID === tid)) && (l.Status === 'Active' || (l.Status as string) === 'active')
        );
        if (remainingLeases.length === 0) {
          const tIdx = this.data.tenants.findIndex(t => t.Tenant_ID === tid);
          if (tIdx >= 0) {
            this.data.tenants[tIdx].Current_Property_ID = undefined;
            this.data.tenants[tIdx].Current_Unit_ID = undefined;
            this.data.tenants[tIdx].Current_Space_Name = undefined;
            this.data.tenants[tIdx].Status = 'Inactive';
          }
        }
      });
    }

    // 7. Re-sync all unit occupancy statuses
    this.syncAllUnitStatuses();

    // 8. Scrub any lingering orphaned records
    this.cleanOrphanRecords(userEmail);

    this.logAudit(userEmail, 'DELETE', 'Leases', leaseId);
    this.save();
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
    const existingIdx = this.data.rentTransactions.findIndex(
      r => r.Rent_Txn_ID === txn.Rent_Txn_ID || (r.Lease_ID === txn.Lease_ID && r.Period_Month === txn.Period_Month)
    );
    if (existingIdx >= 0) {
      this.data.rentTransactions[existingIdx] = txn;
      this.logAudit(userEmail, 'UPDATE', 'Rent', txn.Rent_Txn_ID, txn);
    } else {
      this.data.rentTransactions.unshift(txn);
      this.logAudit(userEmail, 'CREATE', 'Rent', txn.Rent_Txn_ID, txn);
    }
    this.save();
  }

  public updateRentTransaction(txn: RentTransaction, userEmail: string) {
    const idx = this.data.rentTransactions.findIndex(r => r.Rent_Txn_ID === txn.Rent_Txn_ID);
    if (idx >= 0) {
      this.data.rentTransactions[idx] = txn;
      this.logAudit(userEmail, 'UPDATE', 'Rent', txn.Rent_Txn_ID, txn);
      this.save();
    }
  }

  public deleteRentTransaction(txnId: string, userEmail: string) {
    this.data.rentTransactions = this.data.rentTransactions.filter(r => r.Rent_Txn_ID !== txnId);
    this.logAudit(userEmail, 'DELETE', 'Rent', txnId);
    this.save();
  }

  public syncLeaseDepositReceived(leaseId: string) {
    const lease = this.data.leases.find(l => l.Lease_ID === leaseId);
    if (!lease) return;
    const totalSecReceived = this.data.depositTransactions
      .filter(d => (d.Lease_ID === leaseId || (d.Deposit_Txn_ID && d.Deposit_Txn_ID.includes(leaseId))) &&
                   d.Deposit_Type === 'Security Deposit' &&
                   (d.Txn_Type === 'Payment' || d.Status === 'Received' || (d.Paid_Amount || 0) > 0))
      .reduce((sum, d) => sum + (d.Paid_Amount || 0), 0);
    lease.Deposit_Received = totalSecReceived;
  }

  public addDepositTransaction(txn: DepositTransaction, userEmail: string) {
    const existingIdx = this.data.depositTransactions.findIndex(d => d.Deposit_Txn_ID === txn.Deposit_Txn_ID);
    if (existingIdx >= 0) {
      this.data.depositTransactions[existingIdx] = txn;
      this.logAudit(userEmail, 'UPDATE', 'Deposits', txn.Deposit_Txn_ID, txn);
    } else {
      // Idempotency: if a Charge for this exact lease and Deposit_Type already exists, update rather than duplicate
      if (txn.Txn_Type === 'Charge' && txn.Lease_ID) {
        const dupChargeIdx = this.data.depositTransactions.findIndex(
          d => d.Lease_ID === txn.Lease_ID && d.Deposit_Type === txn.Deposit_Type && d.Txn_Type === 'Charge'
        );
        if (dupChargeIdx >= 0) {
          this.data.depositTransactions[dupChargeIdx] = txn;
          this.logAudit(userEmail, 'UPDATE', 'Deposits', txn.Deposit_Txn_ID, txn);
          this.syncLeaseDepositReceived(txn.Lease_ID);
          this.save();
          return;
        }
      }
      this.data.depositTransactions.unshift(txn);
      this.logAudit(userEmail, 'CREATE', 'Deposits', txn.Deposit_Txn_ID, txn);
    }
    if (txn.Lease_ID) {
      this.syncLeaseDepositReceived(txn.Lease_ID);
    }
    this.save();
  }

  public updateDepositTransaction(txn: DepositTransaction, userEmail: string) {
    const idx = this.data.depositTransactions.findIndex(d => d.Deposit_Txn_ID === txn.Deposit_Txn_ID);
    if (idx >= 0) {
      this.data.depositTransactions[idx] = txn;
      this.logAudit(userEmail, 'UPDATE', 'Deposits', txn.Deposit_Txn_ID, txn);
      if (txn.Lease_ID) {
        this.syncLeaseDepositReceived(txn.Lease_ID);
      }
      this.save();
    }
  }

  public deleteDepositTransaction(txnId: string, userEmail: string) {
    const txn = this.data.depositTransactions.find(d => d.Deposit_Txn_ID === txnId);
    const leaseId = txn?.Lease_ID;
    this.data.depositTransactions = this.data.depositTransactions.filter(d => d.Deposit_Txn_ID !== txnId);
    this.logAudit(userEmail, 'DELETE', 'Deposits', txnId);
    if (leaseId) {
      this.syncLeaseDepositReceived(leaseId);
    }
    this.save();
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

  public ensureCoreCanadianUtilities(userEmail: string) {
    this.migrateUtilityCatalog(this.data);
    this.saveDirect(this.data);
    this.logAudit(userEmail, 'UPDATE', 'UtilityCatalog', 'ENSURE_CORE_CANADIAN_UTILITIES');
    this.listeners.forEach(fn => fn());
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
      
      // If current session is this user, refresh stored session
      const currentSession = this.getAuthenticatedSession();
      if (currentSession && currentSession.User_ID === user.User_ID) {
        this.setAuthenticatedSession(user);
      }
      this.save();
    }
  }

  public updateUser2FaEmail(userIdOrEmail: string, newOtpEmail: string, updatePrimary: boolean = false, adminAuditEmail: string = 'System'): User | null {
    const cleanEmail = newOtpEmail.trim();
    const identLower = userIdOrEmail.trim().toLowerCase();
    const idx = this.data.users.findIndex(u => u.User_ID.toLowerCase() === identLower || u.Email.toLowerCase() === identLower);
    if (idx >= 0) {
      const oldOtpEmail = this.data.users[idx].TwoFactorOtpEmail || this.data.users[idx].Email;
      this.data.users[idx].TwoFactorOtpEmail = cleanEmail;
      if (updatePrimary) {
        this.data.users[idx].Email = cleanEmail;
      }
      this.logAudit(adminAuditEmail, 'UPDATE', 'Users', this.data.users[idx].User_ID, {
        action: 'UPDATE_2FA_EMAIL',
        oldOtpEmail,
        newOtpEmail: cleanEmail,
        updatePrimary
      });
      
      // Also update authenticated session if this is the active user
      const currentSession = this.getAuthenticatedSession();
      if (currentSession && (currentSession.User_ID === this.data.users[idx].User_ID || currentSession.Email.toLowerCase() === identLower)) {
        this.setAuthenticatedSession(this.data.users[idx]);
      }
      
      this.save();
      
      // Async sync with server
      if (typeof window !== 'undefined') {
        fetch('/api/auth/update-otp-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: userIdOrEmail,
            newOtpEmail: cleanEmail,
            updatePrimaryEmail: updatePrimary
          })
        }).catch(err => console.warn('Failed to sync OTP email to server API:', err));
      }
      return this.data.users[idx];
    }
    return null;
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
