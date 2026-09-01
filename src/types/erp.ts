export type Role = 'Admin' | 'Finance' | 'Operations';

export type CanadianProvince = 'ON' | 'BC' | 'AB' | 'QC' | 'MB' | 'SK' | 'NS' | 'NB' | 'NL' | 'PE' | 'NT' | 'YT' | 'NU';

export interface CanadianTaxConfig {
  province: CanadianProvince;
  name: string;
  taxType: string;
  depositRule: string;
  rentIncreaseGuideline: string;
  gstRate: number;
  pstRate: number;
  hstRate: number;
  qstRate: number;
  totalTaxRate: number;
}

export const CANADIAN_PROVINCE_TAX: Record<CanadianProvince, CanadianTaxConfig> = {
  ON: {
    province: 'ON',
    name: 'Ontario',
    taxType: '13% HST',
    depositRule: "Last Month's Rent (LMR) only; Damage deposits prohibited under RTA.",
    rentIncreaseGuideline: '2.5% max guideline (2025/2026), with 90 days N1 notice.',
    gstRate: 0,
    pstRate: 0,
    hstRate: 0.13,
    qstRate: 0,
    totalTaxRate: 0.13
  },
  BC: {
    province: 'BC',
    name: 'British Columbia',
    taxType: '5% GST + 7% PST',
    depositRule: 'Security deposit max 50% of 1 month rent + optional 50% pet deposit.',
    rentIncreaseGuideline: '3.0% max guideline with 3 full months notice.',
    gstRate: 0.05,
    pstRate: 0.07,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.12
  },
  AB: {
    province: 'AB',
    name: 'Alberta',
    taxType: '5% GST',
    depositRule: 'Security deposit max 1 month rent; must be held in interest-bearing trust.',
    rentIncreaseGuideline: 'No statutory percentage cap; max 1 increase per 365 days.',
    gstRate: 0.05,
    pstRate: 0,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.05
  },
  QC: {
    province: 'QC',
    name: 'Quebec',
    taxType: '5% GST + 9.975% QST',
    depositRule: 'Security deposits prohibited under TAL; first month rent only at signing.',
    rentIncreaseGuideline: 'TAL annual grid calculation (approx 2.3% - 4.0%).',
    gstRate: 0.05,
    pstRate: 0,
    hstRate: 0,
    qstRate: 0.09975,
    totalTaxRate: 0.14975
  },
  MB: {
    province: 'MB',
    name: 'Manitoba',
    taxType: '5% GST + 7% PST',
    depositRule: 'Rent deposit max 50% of 1 month rent; pet deposit max 1 month.',
    rentIncreaseGuideline: 'RTB annual guideline (approx 3.0%).',
    gstRate: 0.05,
    pstRate: 0.07,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.12
  },
  SK: {
    province: 'SK',
    name: 'Saskatchewan',
    taxType: '5% GST + 6% PST',
    depositRule: 'Security deposit max 1 month rent; split payment allowed (50% upfront).',
    rentIncreaseGuideline: 'No percentage cap; 12 months minimum interval with notice.',
    gstRate: 0.05,
    pstRate: 0.06,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.11
  },
  NS: {
    province: 'NS',
    name: 'Nova Scotia',
    taxType: '15% HST',
    depositRule: 'Security deposit max 50% of 1 month rent.',
    rentIncreaseGuideline: '5.0% statutory rent cap (through 2025/2026).',
    gstRate: 0,
    pstRate: 0,
    hstRate: 0.15,
    qstRate: 0,
    totalTaxRate: 0.15
  },
  NB: {
    province: 'NB',
    name: 'New Brunswick',
    taxType: '15% HST',
    depositRule: 'Security deposit max 1 month rent; must be remitted to Residential Tenancies Tribunal.',
    rentIncreaseGuideline: 'CPI-indexed annual guideline; 6 months notice required.',
    gstRate: 0,
    pstRate: 0,
    hstRate: 0.15,
    qstRate: 0,
    totalTaxRate: 0.15
  },
  NL: {
    province: 'NL',
    name: 'Newfoundland and Labrador',
    taxType: '15% HST',
    depositRule: 'Security deposit max 75% of 1 month rent (monthly tenancy).',
    rentIncreaseGuideline: 'Max 1 increase per 12-month period with 6 months notice.',
    gstRate: 0,
    pstRate: 0,
    hstRate: 0.15,
    qstRate: 0,
    totalTaxRate: 0.15
  },
  PE: {
    province: 'PE',
    name: 'Prince Edward Island',
    taxType: '15% HST',
    depositRule: 'Security deposit max 1 month rent; held in trust.',
    rentIncreaseGuideline: 'IRAC approved annual percentage (approx 2.3% - 3.0%).',
    gstRate: 0,
    pstRate: 0,
    hstRate: 0.15,
    qstRate: 0,
    totalTaxRate: 0.15
  },
  NT: {
    province: 'NT',
    name: 'Northwest Territories',
    taxType: '5% GST',
    depositRule: 'Security deposit max 1 month rent; 50% upfront, remainder in 3 months.',
    rentIncreaseGuideline: 'Max 1 increase per 12 months with 3 months notice.',
    gstRate: 0.05,
    pstRate: 0,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.05
  },
  YT: {
    province: 'YT',
    name: 'Yukon',
    taxType: '5% GST',
    depositRule: 'Security deposit max 1 month rent.',
    rentIncreaseGuideline: 'Tied to Yukon CPI with 3 months notice.',
    gstRate: 0.05,
    pstRate: 0,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.05
  },
  NU: {
    province: 'NU',
    name: 'Nunavut',
    taxType: '5% GST',
    depositRule: 'Security deposit max 1 month rent.',
    rentIncreaseGuideline: 'Max 1 increase per 12 months.',
    gstRate: 0.05,
    pstRate: 0,
    hstRate: 0,
    qstRate: 0,
    totalTaxRate: 0.05
  },
};

export type TenantIdType = 'Driver License' | 'Passport' | 'Provincial Photo ID' | 'PR Card' | 'Work Permit' | 'National ID' | 'Other';

export interface TenantIDProof {
  ID_Proof_ID: string;
  Tenant_ID: string;
  ID_Type: TenantIdType;
  ID_Number: string;
  Issue_Date: string;
  Expiry_Date: string;
  File_URL: string;
  Verified: boolean;
  Created_Date: string;
}

export interface User {
  User_ID: string;
  Email: string;
  Full_Name: string;
  Role: Role;
  Is_Active: boolean;
  Created_At: string;
  Last_Login?: string;
  Assigned_Tabs?: string[];
  Password?: string;
  Phone?: string;
  TwoFactorSecret?: string;
  TwoFactorEnabled?: boolean;
  TwoFactorMethod?: 'TOTP_AUTHENTICATOR' | 'EMAIL_OTP';
  EmergencyBackupCode?: string;
}

export type UtilityCategory = 'Electricity' | 'Natural Gas' | 'Water & Sewage' | 'Internet & Telecom' | 'Waste Management' | 'Heating Oil' | 'Other';

export interface UtilityCatalogItem {
  Utility_ID: string;
  Utility_Name: string;
  Category: UtilityCategory;
  Default_Vendor: string;
  Default_GL_Account: string;
  Description?: string;
  Is_Active: boolean;
  Created_At: string;
}

export type UtilityType = string;

export type PropertyDivisionType =
  | 'None'
  | 'Parent_Building'
  | 'Main_Floor'
  | 'Basement_Suite'
  | 'Upper_Floor'
  | 'Laneway_House'
  | 'Custom_Division'
  | 'Full Property'
  | 'Main Floor'
  | 'Basement Suite'
  | 'Upper Floor / Penthouse'
  | 'Garden / Laneway Suite'
  | 'Commercial Unit'
  | 'Custom Suite';

export interface Property {
  Property_ID: string;
  Property_Name: string;
  Address: string;
  City: string;
  Province: CanadianProvince;
  Postal_Code: string;
  Landlord_ID: string;
  Property_Status?: 'Active' | 'Inactive';
  Active?: boolean;
  Country?: string;
  Master_Rent_Amount: number;
  Notes?: string;
  Created_At: string;
  Parent_Property_ID?: string;
  Division_Type?: PropertyDivisionType;
  Meter_Tag?: string;
}

export interface Unit {
  Unit_ID: string;
  Property_ID: string;
  Unit_Number_Name?: string;
  Unit_Number?: string;
  Unit_Type?: string;
  Floor_Plan?: string;
  Target_Rent?: number;
  Monthly_Rent?: number;
  Current_Status: 'Vacant' | 'Occupied' | 'Maintenance' | 'Inactive';
  Bedrooms: number;
  Bathrooms: number;
  Square_Feet?: number;
  Notes?: string;
  Created_At?: string;
}


export interface Landlord {
  Landlord_ID: string;
  Full_Name: string;
  Email: string;
  Phone: string;
  Address: string;
  Payment_Method: 'EFT / Direct Deposit' | 'Bank Transfer' | 'Cheque' | 'Interac e-Transfer';
  Bank_Reference: string;
  Status: 'Active' | 'Inactive';
  Notes?: string;
}

export interface Tenant {
  Tenant_ID: string;
  Full_Name: string;
  Email: string;
  Phone: string;
  Emergency_Contact: string;
  Status: 'Prospect' | 'Active' | 'Inactive';
  Current_Property_ID?: string;
  Current_Unit_ID?: string;
  Created_At: string;
  Notes?: string;
}

export interface Booking {
  Booking_ID: string;
  Applicant_Name: string;
  Email: string;
  Phone: string;
  Property_ID: string;
  Unit_ID: string;
  Booking_Date: string;
  Expected_Move_In: string;
  Quoted_Rent: number;
  Deposit_Required: number;
  Status: 'Pending' | 'Confirmed' | 'Cancelled';
  Notes?: string;
  Created_By: string;
  Created_At: string;
}

export interface Lease {
  Lease_ID: string;
  Tenant_ID: string;
  Unit_ID: string;
  Property_ID: string;
  Lease_Start: string;
  Lease_End: string;
  Monthly_Rent: number;
  Deposit_Required: number;
  Deposit_Received: number;
  Last_Month_Rent: number;
  Status: 'Active' | 'Ended' | 'Draft';
  Drive_Folder_URL?: string;
  Notes?: string;
  Created_At: string;
}

export interface LandlordPayment {
  Landlord_Pay_ID: string;
  Property_ID: string;
  Landlord_ID: string;
  Period: string; // YYYY-MM
  Rent_Amount: number;
  Deductions: number;
  Net_Amount: number;
  Net_Payout_Amount?: number;
  Status: 'Pending' | 'Approved' | 'Paid' | 'Posted';
  Payment_Date: string;
  Journal_Ref_ID?: string;
  Notes?: string;
  Created_Date: string;
  Created_By: string;
}

export interface RentTransaction {
  Rent_Txn_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Period_Month: string; // YYYY-MM
  Due_Date: string;
  Amount_Billed: number;
  Amount_Paid: number;
  Balance: number;
  Payment_Date?: string;
  Payment_Method?: string;
  Reference?: string;
  Status: 'Unpaid' | 'Partial' | 'Paid';
  Journal_Ref_ID?: string;
  Created_By: string;
  Created_At: string;
}

export interface DepositTransaction {
  Deposit_Txn_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Txn_Type: 'Charge' | 'Payment';
  Due_Amount: number;
  Paid_Amount: number;
  Refund_Amount: number;
  Balance: number;
  Txn_Date: string;
  Status: 'Receivable' | 'Partial' | 'Received' | 'Refunded' | 'Settled';
  Journal_Ref_ID?: string;
  Reference?: string;
  Created_By: string;
}

export interface UtilityBill {
  Utility_Bill_ID: string;
  Property_ID: string;
  Parent_Property_ID?: string;
  Utility_ID: string;
  Utility_Type?: string;
  Bill_Date: string;
  Due_Date: string;
  Vendor: string;
  Provider_Name?: string;
  Bill_Period?: string;
  Master_Amount: number;
  Total_Amount?: number;
  Bill_Reference: string;
  Status: 'Open' | 'Allocated' | 'Paid';
  Notes?: string;
  Created_By: string;
}

export type MasterUtilityBill = UtilityBill;


export interface UtilitySplit {
  Split_ID: string;
  Utility_Bill_ID: string;
  Utility_Name: string;
  Property_ID: string;
  Unit_ID: string;
  Tenant_ID: string;
  Allocated_Amount: number;
  Percentage_Share?: number;
  Amount_Paid: number;
  Balance: number;
  Payment_Date?: string;
  Status: 'Unpaid' | 'Partial' | 'Paid';
  Payment_Method?: string;
  Deposit_Offset_Txn_ID?: string;
  Is_Past_Tenant?: boolean;
  Journal_Ref_ID?: string;
  Notes?: string;
  Created_By: string;
}

export interface CollectionRecord {
  Collection_ID: string;
  Collection_Date?: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Collection_Type?: 'Rent' | 'Deposit' | 'Utility' | 'Other';
  Action_Type?: 'Phone Call & Reminder' | 'Formal Written Demand Notice' | 'Statutory N4/Eviction Notice Served' | 'Agreed Payment Plan' | 'Sent to Collections Agency' | string;
  Action_Date?: string;
  Rent_Txn_ID?: string;
  Amount?: number;
  Outstanding_Amount?: number;
  Payment_Method?: string;
  Reference?: string;
  Applied_To?: string;
  Status?: 'In Progress' | 'Promised Payment' | 'Resolved' | 'Legal Action' | string;
  Next_Follow_Up?: string;
  Notes?: string;
  Journal_Ref_ID?: string;
  Created_By: string;
  Created_At?: string;
}

export interface ExcessPayment {
  Excess_ID: string;
  Collection_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Payment_Date: string;
  Excess_Amount: number;
  Resolution_Status: 'Unresolved' | 'Applied' | 'Refunded';
  Resolution_Type?: string;
  Resolution_Date?: string;
  Notes?: string;
  Journal_Ref_ID?: string;
}

export interface RefundRecord {
  Refund_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID?: string;
  Refund_Type: 'Deposit Refund' | 'Excess Payment Refund' | 'Overpayment' | 'Deposit Adjustment';
  Amount: number;
  Refund_Date: string;
  Payment_Method: string;
  Status: 'Pending' | 'Paid';
  Reason: string;
  Journal_Ref_ID?: string;
  Created_By: string;
}

export interface MoveInRecord {
  MoveIn_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  MoveIn_Date?: string;
  Move_In_Date?: string;
  Meter_Reading?: string;
  Condition_Notes?: string;
  Keys_Provided?: number;
  Keys_Given?: number;
  Inspection_Passed: boolean;
  Notes?: string;
  Created_By: string;
  Created_At?: string;
}

export interface MoveOutRecord {
  MoveOut_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  MoveOut_Date: string;
  Damage_Amount: number;
  Deposit_Refund: number;
  Final_Rent?: number;
  Final_Utility?: number;
  Other_Adjustment?: number;
  Inspection_Notes?: string;
  Status: 'Pending' | 'Completed' | 'Settled';
  Journal_Ref_ID?: string;
  Created_By: string;
  Created_At?: string;
}


export interface ChartOfAccount {
  Account_Code: string;
  Account_Name: string;
  Account_Type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  Account_Group: string;
  Normal_Balance: 'Debit' | 'Credit';
  Is_Control_Account: boolean;
  Is_Active: boolean;
}

export interface JournalHeader {
  Journal_ID: string;
  Date: string;
  Description: string;
  Reference_Type: string;
  Reference_ID: string;
  Created_By: string;
  Status: 'POSTED' | 'DRAFT';
  Period_ID: string;
  Created_At: string;
}

export interface JournalLine {
  Line_ID: string;
  Journal_ID: string;
  Account_Code: string;
  Property_ID?: string;
  Unit_ID?: string;
  Tenant_ID?: string;
  Debit_Amount: number;
  Credit_Amount: number;
  Memo?: string;
}

export interface AccountingPeriod {
  Period_ID: string;
  Period_Name: string;
  Start_Date: string;
  End_Date: string;
  Status: 'OPEN' | 'Closed';
  Closed_By?: string;
  Closed_At?: string;
}

export interface AuditEntry {
  Audit_ID: string;
  Timestamp: string;
  User_Email: string;
  Action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'GENERATE' | 'POST' | 'LOGIN' | 'LOGOUT';
  Module: string;
  Record_ID: string;
  Before_JSON?: string;
  After_JSON?: string;
  IP_or_Source?: string;
}
