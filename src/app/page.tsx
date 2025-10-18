"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, useMemo, useRef } from 'react';
import { Menu, X, Search, DollarSign, UserPlus, FileText, CheckCircle, Clock, LogIn, LogOut, Printer, ListOrdered } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import * as ReactDOMServer from 'react-dom/server'; 

// --- Supabase Client Initialization ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'REPLACE_WITH_YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';

// Initialize the REAL Supabase Client 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- End of Supabase Client Initialization ---

// =========================================================================
//                  TYPE DEFINITIONS (Interfaces)
// =========================================================================

interface GuarantorDetails {
    name: string; father_name: string; phone: string; cnic: string; address: string;
}

interface VehicleSummary {
    id: string; item_name: string; monthly_installment: number; remaining_loan: number; installment_plan: string; next_due_date: string | null; created_at: string; total_amount: number; advance_payment: number; registration_number: string;
}

interface CustomerType {
  id: string;
  customer_name: string;
  account_number: string;
  vehicles?: VehicleSummary | null;
}

// New type for All Records Table
interface CustomerRecord {
    id: string;
    account_number: string;
    customer_name: string;
    vehicle_name: string;
    remaining_loan: number;
    total_paid?: number;
    paid_count?: number;
    remaining_count?: number;
    monthly_installment?: number;
    created_at: string;
}


// New type for Full Details View
interface FullCustomerDetails {
    id: string;
    account_number: string;
    customer_name: string;
    father_name: string;
    phone: string;
    cnic: string;
    address: string;
    guarantor1_details: GuarantorDetails;
    guarantor2_details: GuarantorDetails;
    vehicle: VehicleSummary & {
        engine_number: string;
        chassis_number: string;
        model: string;
        color: string;
        insurance_docs: string;
    };
    history: InstallmentHistory[];
    totalPaidCount: number;
    remainingCount: number;
    totalPaidAmount: number;
    totalInstallmentAmount: number;
    planLength: number;
}

interface InstallmentPayDetailType {
  name: string;
  vehicle_id: string;
  vehicle_name: string;
  plan: string;
  monthly_installment: number;
  remaining_loan: number;
  paid_count: number;
  next_due_date: string | null; // Can be null if completed
  total_amount: number; // *UPDATED: Added total amount*
}

// New type for installment history records
interface InstallmentHistory {
    id: string;
    payment_date: string; // Date of payment (YYYY-MM-DD)
    amount_paid: number; // Amount paid in this installment
    paid_count: number; // Installment number (0 for advance, 1, 2, 3...)
    remaining_balance: number; // Balance remaining after this payment
}

// Updated BalanceResultType
interface BalanceResultType {
    name: string;
    vehicle: string;
    // Summary fields
    totalAmount: number; // *UPDATED: Added total amount*
    totalAdvance: number;
      totalPaid?: number; 
    remainingLoan: number; 
    // Next payment details
    installmentAmount: number;
    nextDueDate: string | null;
    paidCount: number;
    remainingCount: number;
    isOverdue: boolean;
    daysOverdue: number;
    isCompleted: boolean; // NEW: Added completion flag
    // History
    history: InstallmentHistory[];
}

type FormChangeHandler = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

interface MessageState {
  text: string;
  type: 'success' | 'error' | '';
}

type RegisterFormState = {
    accountNumber: string; customerName: string; fatherName: string; phone: string; cnic: string; address: string;
    guarantor1Name: string; guarantor1FatherName: string; guarantor1Phone: string; guarantor1Cnic: string; guarantor1Address: string;
    guarantor2Name: string; guarantor2FatherName: string; guarantor2Phone: string; guarantor2Cnic: string; guarantor2Address: string;
}

type PaymentFormState = {
    accountNumber: string; date: string; totalAmount: number; monthlyInstallment: number; advance: number; remainingAuto: number; installmentPlan: string;
    itemName: string; engineNumber: string; chassisNumber: string; model: string; color: string; registrationNumber: string; insuranceDocs: string;
}

type InstallmentPayFormState = {
    accountNumber: string; installmentAmount: number; paymentDate: string;
}

type CheckBalanceFormState = {
    searchKey: string; searchType: 'accountNumber' | 'registrationNumber';
}

// =========================================================================
//                  URDU LABELS (Constants)
// =========================================================================
const URDU_LABELS = {
  appName: "نواب سرحدی آٹوز",
  tagline: "قسطوں پر گاڑیوں کے لین دین کا نظام",
  menu: {
    register: "Add Customer",
    payment: "Add Item &  Payment",
    installmentPay: "Installment Pay",
    checkBalance: "Check Balance",
    allRecords: "All Record", 
  },
  general: {
    save: "محفوظ کریں",
    search: "تلاش کریں",
    due: "بقایا قسط",
    paid: "ادا شدہ قسطیں",
    remaining: "بقیہ قسط",
    dueDate: "آخری مقررہ تاریخ",
    overdueWarning: "🚨 براہ کرم قسط فوراً ادا کریں! (30 دن سے زیادہ کی تاخیر)",
    success: "کامیاب! ڈیٹا محفوظ کر لیا گیا ہے۔",
    error: "غلطی: ڈیٹا محفوظ نہیں ہو سکا۔",
    notFound: "معذرت، کوئی ریکارڈ نہیں ملا۔",
    history: "قسطوں کی تاریخ (History)",
    advance: "ایڈوانس",
    bakaya: "بقایا قرض",
    logout: "لاگ آؤٹ", 
    allRecords: "تمام صارفین اور گاڑیوں کا ریکارڈ", 
    viewDetails: "تفصیلات دیکھیں", 
    print: "پرنٹ کریں", 
    close: "بند کریں", 
    totalPaid: "کل ادا شدہ رقم", 
    planLength: "کل قسطیں (Plann)", 
    loanComplete: "مبارک ہو! یہ قرض مکمل طور پر ادا ہو چکا ہے۔ مزید ادائیگی کی ضرورت نہیں۔", // NEW: Completion Message
    totalPurchase: "کل رقم (خریداری)", // *UPDATED: Added total purchase amount label*
  },
  fields: {
    accountNumber: "اکاؤنٹ نمبر",
    customerName: "  نام",
    fatherName: "والد کا نام",
    phone: "فون نمبر",
    address: "گھر کا پتہ",
    cnic: "شناختی کارڈ نمبر",
    guarantor1: "ضامن نمبر ۱",
    guarantor2: "ضامن نمبر ۲",
    date: "تاریخ",
    totalAmount: "کل رقم",
    monthlyInstallment: "ماہانہ قسط",
    advance: "ایڈوانس/پیشگی ادائیگی",
    remainingAuto: "بقیہ رقم (خودکار حساب)",
    installmentPlan: "قسط پلان",
    itemName: "آئٹم کا نام",
    engineNumber: "انجن نمبر",
    chassisNumber: "چیسس نمبر",
    model: "ماڈل",
    color: "رنگ",
    registrationNumber: "رجسٹریشن نمبر",
    insuranceDocs: "انشورنس/کاغذات",
    installmentAmount: "قسط کی رقم",
    paymentDate: "قسط کی تاریخ",
    currentPlan: "موجودہ پلان",
    installmentNo: "قسط نمبر",
    amountPaid: "ادا کی گئی رقم",
    remainingAfter: "بقایا (بعد از ادائیگی)",
    vehicleName: "گاڑی کا نام", 
    status: "حالت", 
    totalInstallment: "کل قسطیں", 
    totalLoan: "کل قرض", 
    recordDate: "ریکارڈ کی تاریخ", 
  }
};

// =========================================================================
//                  HELPER COMPONENTS (UI elements)
// =========================================================================

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number | null;
  onChange: FormChangeHandler;
  placeholder?: string;
  min?: string | number;
  isRequired?: boolean;
  isTextArea?: boolean;
  isReadonly?: boolean;
  children?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, name, type = 'text', value, onChange, placeholder, isRequired = true, isTextArea = false, isReadonly = false, children }) => (
  <div className="flex flex-col mb-6">
    <label className={`text-right block mb-2 font-bold ${isReadonly ? 'text-slate-500' : 'text-slate-800'} text-lg md:text-xl`}>
      {label}
      {isRequired && <span className="text-red-500 mr-1">*</span>}
    </label>
    {isTextArea ? (
      <textarea
        name={name}
        value={value as string}
        onChange={onChange as any}
        placeholder={placeholder || ''}
        required={isRequired}
        className="p-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 transition duration-150 text-base md:text-lg text-right h-24 font-inter bg-slate-50"
        dir="rtl"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value === null ? '' : value}
        onChange={onChange as any}
        placeholder={placeholder || ''}
        required={isRequired}
        readOnly={isReadonly}
        className={`p-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 transition duration-150 text-base md:text-lg text-right font-inter ${isReadonly ? 'bg-slate-200 text-slate-500' : 'bg-white'}`}
        dir="rtl"
      />
    )}
    {children}
  </div>
);

interface GuarantorFieldsProps {
  number: 1 | 2;
  formState: RegisterFormState; 
  handleChange: FormChangeHandler;
}

const GuarantorFields: React.FC<GuarantorFieldsProps> = ({ number, formState, handleChange }) => {
  const prefix = `guarantor${number}` as const;
  return (
    <div className="border border-slate-300 p-4 sm:p-6 rounded-xl bg-slate-50 mb-6 shadow-inner" dir="rtl">
      <h3 className="text-2xl font-extrabold text-amber-600 mb-4 text-center border-b pb-2">
        {URDU_LABELS.fields[`guarantor${number}`]}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <FormField label={URDU_LABELS.fields.customerName} name={`${prefix}Name`} value={formState[`${prefix}Name`]} onChange={handleChange} />
        <FormField label={URDU_LABELS.fields.fatherName} name={`${prefix}FatherName`} value={formState[`${prefix}FatherName`]} onChange={handleChange} />
        <FormField label={URDU_LABELS.fields.phone} name={`${prefix}Phone`} type="tel" value={formState[`${prefix}Phone`]} onChange={handleChange} />
        <FormField label={URDU_LABELS.fields.cnic} name={`${prefix}Cnic`} value={formState[`${prefix}Cnic`]} onChange={handleChange} />
        <div className="md:col-span-2">
          <FormField label={URDU_LABELS.fields.address} name={`${prefix}Address`} isTextArea value={formState[`${prefix}Address`]} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
};


// =========================================================================
//                  MENU AND SIDEBAR COMPONENTS
// =========================================================================

interface MenuButtonProps {
  icon: React.ComponentType<any>;
  label: string;
  menuKey: string;
  activeMenu: string;
  setActiveMenu: (key: string) => void;
  resetUIState: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon: Icon, label, menuKey, activeMenu, setActiveMenu, resetUIState }) => (
    <button
      onClick={() => { 
        setActiveMenu(menuKey); 
        resetUIState();
      }}
      className={`flex items-center space-x-4 space-x-reverse w-full text-right p-3 rounded-xl transition duration-200 text-xl font-bold ${activeMenu === menuKey ? 'bg-amber-500 text-slate-900 shadow-lg' : 'hover:bg-slate-700 text-white'}`}
    >
      <Icon size={24} className="ml-2" />
      <span>{label}</span>
    </button>
  );

// --- START: LOGOUT BUTTON COMPONENT ---

interface LogoutButtonProps {
    handleLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ handleLogout }) => (
    <button
      onClick={handleLogout}
      className="flex items-center space-x-4 space-x-reverse w-full text-right p-3 rounded-xl transition duration-200 text-xl font-bold bg-red-600 hover:bg-red-700 text-white mt-4"
    >
      <LogOut size={24} className="ml-2" />
      <span>{URDU_LABELS.general.logout}</span>
    </button>
);

// --- END: LOGOUT BUTTON COMPONENT ---

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    activeMenu: string;
    setActiveMenu: (key: string) => void;
    resetUIState: () => void;
    loggedInUsername: string; // Passed from App
    handleLogout: () => void; // Passed from App
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen, activeMenu, setActiveMenu, resetUIState, loggedInUsername, handleLogout }) => {
    
    const handleMenuClick = (menuKey: string) => {
        setActiveMenu(menuKey); 
        setIsSidebarOpen(false); 
        resetUIState();
    };

    return (
        <div className={`fixed top-0 right-0 h-full bg-slate-800 text-white w-64 p-6 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:h-auto lg:w-full lg:p-4 lg:shadow-xl`} dir="rtl">
            <div className="lg:hidden text-left mb-6">
                <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:text-red-400">
                    <X size={28} />
                </button>
            </div>
            <nav className="space-y-4 pt-10 lg:pt-0">
                <MenuButton icon={UserPlus} label={URDU_LABELS.menu.register} menuKey="register" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
                <MenuButton icon={FileText} label={URDU_LABELS.menu.installmentPay} menuKey="installmentPay" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
                <MenuButton icon={Search} label={URDU_LABELS.menu.checkBalance} menuKey="checkBalance" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
                {/* NEW: All Records Button */}
                <MenuButton icon={ListOrdered} label={URDU_LABELS.menu.allRecords} menuKey="allRecords" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
            </nav>
            
            {/* Logout Button in Sidebar */}
            <div className="mt-8 pt-4 border-t border-slate-700">
                <LogoutButton handleLogout={handleLogout} />
            </div>

            {/* User ID display */}
            <div className="mt-8 text-xs text-slate-400 border-t border-slate-700 pt-4">
                <p className='mb-1'>Logged in as:</p>
                <p className="break-all font-mono text-amber-300">
                {loggedInUsername}
                </p>
            </div>
        </div>
    );
};


// =========================================================================
//                  FORM COMPONENTS (Registration, Payment, Pay Installment)
// =========================================================================

interface RenderRegisterUserProps {
    formState: RegisterFormState;
    setFormState: React.Dispatch<React.SetStateAction<RegisterFormState>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    loading: boolean;
    handlePaymentClick: () => void; // ✅ Add this

}

const RenderRegisterUser: React.FC<RenderRegisterUserProps> = ({ formState, setFormState, handleSubmit, loading, handlePaymentClick }) => {
    const handleChange: FormChangeHandler = (e) => {
      setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          صارف رجسٹر کریں
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Main Customer Details */}
          <h3 className="text-3xl font-extrabold text-slate-700 mb-6">خریدار کی تفصیلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField label={URDU_LABELS.fields.accountNumber} name="accountNumber" value={formState.accountNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.customerName} name="customerName" value={formState.customerName} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.fatherName} name="fatherName" value={formState.fatherName} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.phone} name="phone" type="tel" value={formState.phone} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.cnic} name="cnic" value={formState.cnic} onChange={handleChange} />
            <div className="md:col-span-2">
                <FormField label={URDU_LABELS.fields.address} name="address" isTextArea value={formState.address} onChange={handleChange} />
            </div>
          </div>

          {/* Guarantor 1 */}
          <GuarantorFields number={1} formState={formState} handleChange={handleChange} />

          {/* Guarantor 2 */}
          <GuarantorFields number={2} formState={formState} handleChange={handleChange} />

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-2xl p-4 rounded-xl transition duration-300 shadow-lg mt-4 disabled:bg-slate-500"
          >
            {loading ? 'محفوظ ہو رہا ہے...' : URDU_LABELS.general.save}
          </button>

          {/* Payment Button below Save */}
          <button
            type="button"
            onClick={handlePaymentClick} // Sidebar کے payment button جیسا action
            className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-2xl p-4 rounded-xl transition duration-300 shadow-lg mt-2"
          >
            {URDU_LABELS.menu.payment} 💰
          </button>
        </form>
      </div>
    );
};

interface RenderPaymentProps {
    formState: PaymentFormState;
    setFormState: React.Dispatch<React.SetStateAction<PaymentFormState>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleSearchWrapper: () => void;
    loading: boolean;
    fetchedCustomer: CustomerType | null;
}

const RenderPayment: React.FC<RenderPaymentProps> = ({ formState, setFormState, handleSubmit, handleSearchWrapper, loading, fetchedCustomer }) => {
  const handleChange: FormChangeHandler = (e) => {
    let value: string | number = e.target.value;

    if (e.target.name === 'totalAmount' || e.target.name === 'advance') {
      value = e.target.value === '' ? '' : parseFloat(e.target.value);
    }

    setFormState({ ...formState, [e.target.name]: value as any });
  };


    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          Payment فارم
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Account Search and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="md:col-span-2">
              <FormField
                label={URDU_LABELS.fields.accountNumber}
                name="accountNumber"
                value={formState.accountNumber}
                onChange={handleChange}
                placeholder="اکاؤنٹ نمبر درج کریں"
              />
            </div>
            <div className="flex items-end mb-6 md:mb-0">
              <button
                type="button"
                onClick={handleSearchWrapper}
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold p-3 rounded-xl transition duration-300 flex items-center justify-center text-lg disabled:bg-slate-500"
              >
                <Search size={20} className="ml-2" />
                {loading ? 'تلاش ہو رہی ہے...' : URDU_LABELS.general.search}
              </button>
            </div>
            {fetchedCustomer && (
              <div className="md:col-span-3 p-3 bg-green-100 rounded-lg text-green-800 text-right font-bold text-xl">
                خریدار کا نام: **{fetchedCustomer.customer_name}**
              </div>
            )}
          </div>

          {/* Payment Details */}
          <h3 className="text-3xl font-extrabold text-slate-700 mb-6">مالی تفصیلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField label={URDU_LABELS.fields.date} name="date" type="date" value={formState.date} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.totalAmount} name="totalAmount" type="number" value={formState.totalAmount === 0 ? '' : formState.totalAmount} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.advance} name="advance" type="number" value={formState.advance === 0 ? '' : formState.advance} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.monthlyInstallment} name="monthlyInstallment" type="text" value={formState.monthlyInstallment.toLocaleString('en-US')} isReadonly isRequired={false} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.remainingAuto} name="remainingAuto" type="text" value={formState.remainingAuto.toLocaleString('en-US')} isReadonly isRequired={false} onChange={handleChange} />
            
            <div className="flex flex-col mb-6">
                <label className="text-right block mb-2 font-bold text-slate-800 text-lg md:text-xl">
                    {URDU_LABELS.fields.installmentPlan}
                    <span className="text-red-500 mr-1">*</span>
                </label>
                <select
                    name="installmentPlan"
                    value={formState.installmentPlan}
                    onChange={handleChange}
                    required
                    className="p-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 transition duration-150 text-base md:text-lg text-right font-inter bg-white"
                    dir="rtl"
                >
                    <option value="12 Months">۱۲ ماہ کا پلان</option>
                    <option value="24 Months">۲۴ ماہ کا پلان</option>
                </select>
            </div>
          </div>
          
          {/* Vehicle/Item Details */}
          <h3 className="text-3xl font-extrabold text-slate-700 mb-6 mt-8">گاڑی/آئٹم کی تفصیلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField label={URDU_LABELS.fields.itemName} name="itemName" value={formState.itemName} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.model} name="model" value={formState.model} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.registrationNumber} name="registrationNumber" value={formState.registrationNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.engineNumber} name="engineNumber" value={formState.engineNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.chassisNumber} name="chassisNumber" value={formState.chassisNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.color} name="color" value={formState.color} onChange={handleChange} />
            <div className="md:col-span-2">
              <FormField label={URDU_LABELS.fields.insuranceDocs} name="insuranceDocs" isTextArea value={formState.insuranceDocs} onChange={handleChange} isRequired={false} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !fetchedCustomer}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-2xl p-4 rounded-xl transition duration-300 shadow-lg mt-6 disabled:bg-slate-500"
          >
            {loading ? 'محفوظ ہو رہا ہے...' : URDU_LABELS.general.save}
          </button>
        </form>
      </div>
    );
};

interface RenderInstallmentPayProps {
    searchForm: InstallmentPayFormState;
    setSearchForm: React.Dispatch<React.SetStateAction<InstallmentPayFormState>>;
    handleSearchWrapper: () => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    loading: boolean;
    payDetail: InstallmentPayDetailType | null;
}

const RenderInstallmentPay: React.FC<RenderInstallmentPayProps> = ({ searchForm, setSearchForm, handleSearchWrapper, handleSubmit, loading, payDetail }) => {
    const handleChange: FormChangeHandler = (e) => {
      let value: string | number = e.target.value;
      if (e.target.name === 'installmentAmount') {
        value = parseFloat(value as string) || 0;
      }
      setSearchForm({ ...searchForm, [e.target.name]: value as any });
    };

    const isLoanCompleted = payDetail && payDetail.remaining_loan <= 0;


    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          Installment Pay
        </h2>
                  
            

        <form onSubmit={(e) => { e.preventDefault(); handleSearchWrapper(); }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="md:col-span-2">
              <FormField
                label={URDU_LABELS.fields.accountNumber}
                name="accountNumber"
                value={searchForm.accountNumber}
                onChange={handleChange}
                placeholder="اکاؤنٹ نمبر درج کریں"
              />
            </div>
            <div className="flex items-end mb-6 md:mb-0">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold p-3 rounded-xl transition duration-300 flex items-center justify-center text-lg disabled:bg-slate-500"
              >
                <Search size={20} className="ml-2" />
                {loading ? 'تلاش ہو رہی ہے...' : URDU_LABELS.general.search}
              </button>
            </div>
          </div>
        </form>

        {payDetail && (
          <div className="border-4 border-green-400 p-6 rounded-2xl bg-green-50 shadow-lg">
            <h3 className="text-3xl font-extrabold text-green-800 mb-6 border-b pb-2">خریدار اور قسط کی تفصیلات</h3>
            
            {/* NEW: Completion Message */}
            {isLoanCompleted && (
              <div className="mb-6 p-4 bg-green-600 text-white font-extrabold text-xl text-center rounded-xl shadow-lg">
                {URDU_LABELS.general.loanComplete}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xl">
              <p className='font-bold text-green-900'>نام: <span className='font-normal mr-2'>{payDetail.name}</span></p>
              <p className='font-bold text-green-900'>گاڑی: <span className='font-normal mr-2'>{payDetail.vehicle_name}</span></p>
              
              {/* *UPDATED: Added Total Purchase Amount* */}
              <p className='font-bold text-green-900'>{URDU_LABELS.general.totalPurchase}: <span className='font-normal mr-2 font-extrabold text-slate-800'>{payDetail.total_amount.toLocaleString('en-US')}</span></p>
              
              <p className='font-bold text-green-900'>{URDU_LABELS.fields.currentPlan}: <span className='font-normal mr-2'>{payDetail.plan}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.fields.monthlyInstallment} (مقررہ): <span className='font-normal mr-2'>{payDetail.monthly_installment.toLocaleString('en-US')}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.general.paid}: <span className='font-normal mr-2'>{payDetail.paid_count}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.general.bakaya}: <span className='font-normal mr-2 text-red-700 font-extrabold'>{payDetail.remaining_loan.toLocaleString('en-US')}</span></p>

            </div>
            

            <form onSubmit={handleSubmit} className="mt-8 pt-4 border-t-2 border-green-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <FormField
                label={URDU_LABELS.fields.installmentAmount}
                name="installmentAmount"
                type="number"
                min="1" // negative ya zero input block karega
                value={searchForm.installmentAmount || ''}
                onChange={handleChange}
                placeholder="قسط کی رقم درج کریں"
              />

                <FormField
                  label={URDU_LABELS.fields.paymentDate}
                  name="paymentDate"
                  type="date"
                  value={searchForm.paymentDate}
                  onChange={handleChange}
                />
                
                <div className="flex items-end mb-6">
                   <button
                    type="submit"
                    // Disable if loading OR loan is completed
                    disabled={loading || !!isLoanCompleted} 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-2xl p-4 rounded-xl transition duration-300 shadow-lg disabled:bg-slate-500"
                  >
                    {loading ? 'محفوظ ہو رہا ہے...' : URDU_LABELS.general.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    );
};


// =========================================================================
//                  Installment History List (Tree View)
// =========================================================================

interface InstallmentHistoryTreeProps {
    history: InstallmentHistory[];
    isPrintView?: boolean;
}

const InstallmentHistoryTree: React.FC<InstallmentHistoryTreeProps> = ({ history, isPrintView = false }) => {
    if (history.length === 0) {
        return <p className={`text-center ${isPrintView ? 'text-slate-700' : 'text-slate-500'} text-xl font-medium mt-6`}>کوئی قسط کی تاریخ نہیں ملی۔</p>;
    }
    
    // Sort oldest first for a true 'timeline' view
    const sortedHistory = [...history].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());

    return (
        <div className="relative border-r-4 border-slate-300 pr-8 mt-6 pb-2 print:border-r-2 print:border-slate-500" dir="rtl">
            <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-center print:hidden">
                {/* Vertical Line */}
                <div className="h-full w-1 bg-slate-300"></div>
            </div>
            
            {sortedHistory.map((record, index) => {
                // Paid count 0 usually indicates the initial advance/down payment
                const isAdvance = index === 0 && record.paid_count === 0 && record.amount_paid > 0;
                
                // Determine style based on payment type
                const bgColor = isAdvance ? 'bg-amber-100 border-amber-500' : (record.paid_count > 0 ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-400');
                const borderColor = isAdvance ? 'border-amber-600' : (record.paid_count > 0 ? 'border-green-600' : 'border-slate-600');
                const titleColor = isAdvance ? 'text-amber-800' : (record.paid_count > 0 ? 'text-green-800' : 'text-slate-800');
                const Icon = isAdvance ? DollarSign : CheckCircle;
                
                const titleText = isAdvance ? URDU_LABELS.general.advance + ' (پہلی ادائیگی)' : URDU_LABELS.fields.installmentNo + `: ${record.paid_count}`;

                return (
                    <div key={record.id} className="mb-8 relative pl-6">
                        {/* Circle marker on the timeline (hide in print) */}
                        <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${borderColor} border-4 ${bgColor} print:hidden`}>
                            <Icon size={14} className={titleColor} />
                        </div>

                        {/* Payment Card */}
                        <div className={`p-4 rounded-xl shadow-lg transition duration-300 hover:shadow-xl ${bgColor} border-r-4 ${borderColor} print:p-2 print:rounded-md print:shadow-none print:border print:border-slate-500 print:bg-white print:hover:shadow-none`}>
                            <div className="flex justify-between items-start border-b pb-2 mb-2 print:border-b-0 print:mb-1">
                                <h4 className={`text-xl font-extrabold ${titleColor} print:text-sm print:font-bold print:text-slate-800`}>{titleText}</h4>
                                <p className="text-sm font-medium text-slate-500 flex items-center print:text-xs print:text-slate-600">
                                    <Clock size={16} className="ml-1 print:hidden" />
                                    {new Date(record.payment_date).toLocaleDateString('ur-PK', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-lg print:text-xs">
                                <p className="font-bold text-slate-700 print:text-slate-800">
                                    {URDU_LABELS.fields.amountPaid}: <span className="font-extrabold text-2xl text-green-700 mr-2 print:text-sm print:text-green-700">{record.amount_paid.toLocaleString('en-US')}</span>
                                </p>
                                <p className="font-bold text-slate-700 text-left print:text-slate-800">
                                    {URDU_LABELS.fields.remainingAfter}: <span className="font-medium text-slate-600 mr-2 print:text-sm print:text-slate-600">{record.remaining_balance.toLocaleString('en-US')}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// =========================================================================
//                  UPDATED RenderCheckBalance COMPONENT
// =========================================================================

interface RenderCheckBalanceProps {
    formState: CheckBalanceFormState;
    setFormState: React.Dispatch<React.SetStateAction<CheckBalanceFormState>>;
    handleSubmit: () => Promise<void>;
    loading: boolean;
    balanceResult: BalanceResultType | null;
}

const RenderCheckBalance: React.FC<RenderCheckBalanceProps> = ({ formState, setFormState, handleSubmit, loading, balanceResult }) => {
    const handleChange: FormChangeHandler = (e) => {
      if (e.target.name === 'searchType') {
          setFormState({ ...formState, [e.target.name]: e.target.value as 'accountNumber' | 'registrationNumber' });
      } else {
          setFormState({ ...formState, [e.target.name]: e.target.value });
      }
    };

    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-5xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          بیلنس اور تاریخ چیک کریں
        </h2>
        
        {/* Search Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="flex flex-col mb-4">
              <label className="text-right block mb-2 font-bold text-slate-800 text-xl">
                  تلاش کا طریقہ
              </label>
              <select
                  name="searchType"
                  value={formState.searchType}
                  onChange={handleChange}
                  className="p-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 transition duration-150 text-lg text-right font-inter bg-white w-full"
                  dir="rtl"
              >
                  <option value="accountNumber">اکاؤنٹ نمبر سے تلاش کریں</option>
                  <option value="registrationNumber">رجسٹریشن نمبر سے تلاش کریں</option>
              </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="md:col-span-2">
              <FormField
                label={formState.searchType === 'accountNumber' ? URDU_LABELS.fields.accountNumber : URDU_LABELS.fields.registrationNumber}
                name="searchKey"
                value={formState.searchKey}
                onChange={handleChange}
                placeholder={formState.searchType === 'accountNumber' ? "اکاؤنٹ نمبر درج کریں" : "رجسٹریشن نمبر درج کریں"}
              />
            </div>
            <div className="flex items-end mb-6 md:mb-0">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold p-3 rounded-xl transition duration-300 flex items-center justify-center text-lg disabled:bg-slate-500"
              >
                <Search size={20} className="ml-2" />
                {loading ? 'تلاش ہو رہی ہے...' : URDU_LABELS.general.search}
              </button>
            </div>
          </div>
        </form>

        {/* Balance Result (Updated Summary Card) */}
        {balanceResult && (
          <div className="mt-8">
            {/* Customer Summary Card */}
            <div className={`p-6 rounded-2xl shadow-xl border-4 ${balanceResult.isCompleted ? 'bg-green-100 border-green-500' : (balanceResult.isOverdue ? 'bg-red-100 border-red-500' : 'bg-blue-50 border-blue-400')} mb-8`}>
                <h3 className={`text-3xl font-extrabold mb-4 pb-2 border-b-2 ${balanceResult.isCompleted ? 'text-green-800 border-green-300' : (balanceResult.isOverdue ? 'text-red-800 border-red-300' : 'text-blue-800 border-blue-300')}`}>
                    خریدار کا نام: **{balanceResult.name}**
                </h3>
                <h4 className='text-2xl font-bold text-slate-700 mb-4'>گاڑی: **{balanceResult.vehicle}**</h4>

                {/* *UPDATED: Added Total Purchase Amount Display* */}
                <div className="mb-6 p-4 bg-slate-200 text-slate-800 font-extrabold text-xl text-center rounded-xl shadow-inner">
                    {URDU_LABELS.general.totalPurchase}: <span className='text-2xl font-extrabold text-amber-700 ml-2'>{balanceResult.totalAmount.toLocaleString('en-US')}</span>
                </div>

                {/* NEW: Completion/Overdue/Next Due Message */}
                {balanceResult.isCompleted ? (
                    <div className="mb-6 p-4 bg-green-600 text-white font-extrabold text-xl text-center rounded-xl shadow-lg">
                        {URDU_LABELS.general.loanComplete}
                    </div>
                ) : balanceResult.isOverdue ? (
                  <div className="mb-6 p-4 bg-red-600 text-white font-extrabold text-xl text-center rounded-xl shadow-lg animate-pulse">
                    {URDU_LABELS.general.overdueWarning}
                    <p className="mt-1 text-2xl">تاخیر: **{balanceResult.daysOverdue} دن**</p>
                  </div>
                ) : (
                    <div className="mb-6 p-4 bg-blue-600 text-white font-extrabold text-xl text-center rounded-xl shadow-lg">
                        اگلی قسط کی مقررہ تاریخ: **{balanceResult.nextDueDate}**
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    {/* Advance Payment */}
                    <div className='p-3 bg-amber-100 rounded-xl shadow-inner'>
                        <p className='text-lg font-bold text-amber-700'>{URDU_LABELS.general.advance}</p>
                        <p className='text-4xl font-extrabold text-amber-900 mt-1'>{balanceResult.totalAdvance.toLocaleString('en-US')}</p>
                    </div>
                    {/* Remaining Loan */}
                    <div className='p-3 bg-red-100 rounded-xl shadow-inner'>
                        <p className='text-lg font-bold text-red-700'>{URDU_LABELS.general.bakaya}</p>
                        <p className='text-4xl font-extrabold text-red-900 mt-1'>{balanceResult.remainingLoan.toLocaleString('en-US')}</p>
                    </div>
                    {/* Next Installment Details */}
                    <div className='p-3 bg-green-100 rounded-xl shadow-inner'>
                        <p className='text-lg font-bold text-green-700'>{URDU_LABELS.fields.monthlyInstallment} (مقررہ)</p>
                        <p className='text-3xl font-extrabold text-green-900 mt-1'>{balanceResult.installmentAmount.toLocaleString('en-US')}</p>
                        <p className='text-sm font-medium text-slate-500 mt-1'>
                            {balanceResult.isCompleted ? 'قرض مکمل' : `${URDU_LABELS.general.dueDate}: ${balanceResult.nextDueDate}`}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-300 text-xl">
                    <p className='font-bold text-green-700'>{URDU_LABELS.general.paid}: <span className='font-extrabold mr-2 text-3xl'>{balanceResult.paidCount}</span></p>
                    <p className='font-bold text-red-700'>{URDU_LABELS.general.remaining}: <span className='font-extrabold mr-2 text-3xl'>{balanceResult.remainingCount}</span></p>
                </div>
            </div>
            
            {/* Installment History Section (Tree View Style) */}
            <div className="p-6 bg-slate-50 rounded-2xl shadow-inner border border-slate-200">
                <h3 className="text-4xl font-extrabold text-center text-slate-800 mb-8 pb-4 border-b-4 border-slate-300">
                    {URDU_LABELS.general.history}
                </h3>
                <InstallmentHistoryTree history={balanceResult.history} />
            </div>

          </div>
        )}
      </div>
    );
};


// =========================================================================
//                  NEW COMPONENT: PrintableDetailsView
// =========================================================================

interface PrintableDetailsViewProps {
    details: FullCustomerDetails;
    onClose: () => void;
}

const InfoRow: React.FC<{ label: string; value: string | number | null; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`p-2 border-b border-slate-200 print:border-slate-400 flex justify-between print:text-xs ${className}`}>
        <span className="font-bold text-slate-700 print:text-slate-800">{label}</span>
        <span className="font-medium text-slate-600 text-left print:text-slate-700">{value !== null ? value.toLocaleString('en-US') : 'N/A'}</span>
    </div>
);

const PrintableDetailsView: React.FC<PrintableDetailsViewProps> = ({ details, onClose }) => {
    
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (printRef.current) {
            // Use browser's built-in print functionality
            const printContent = printRef.current.outerHTML;
            const printWindow = window.open('', '_blank');
            if(printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>${details.customer_name} - ${details.account_number}</title>
                            <style>
                                @page { size: A4; margin: 15mm; }
                                body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
                                .print-container { padding: 10px; }
                                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                                h1 { font-size: 24px; margin: 0; }
                                h2 { font-size: 18px; margin-top: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                                .section { margin-bottom: 20px; }
                                .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                                .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                                .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #ccc; font-size: 12px; }
                                .info-row span:first-child { font-weight: bold; }
                                .history-timeline { border-right: 1px solid #ccc; padding-right: 15px; }
                                .history-item { margin-bottom: 10px; padding-right: 10px; border-right: 3px solid #666; position: relative; }
                                .history-item::before { content: ''; position: absolute; right: -5px; top: 0; width: 10px; height: 10px; background: #666; border-radius: 50%; }
                                .history-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 3px; margin-bottom: 5px;}
                                .history-details { display: flex; justify-content: space-between; font-size: 11px;}
                            </style>
                        </head>
                        <body>
                            ${printContent}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };
    
    // Total amounts for summary
    const totalPaidAmount = details.history.reduce((sum, rec) => sum + rec.amount_paid, 0);
    const planLength = details.vehicle.installment_plan === '12 Months' ? 12 : 24;
    const remainingCount = planLength - details.totalPaidCount;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:w-auto print:shadow-none print:rounded-none print:absolute print:inset-0 print:m-0" ref={printRef}>
                
                {/* Header and Controls */}
                <div className="p-4 sm:p-6 sticky top-0 bg-white border-b-4 border-amber-600 z-10 print:hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-4xl font-extrabold text-amber-700">ریکارڈ کی مکمل تفصیلات</h2>
                        <button 
                            onClick={onClose} 
                            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full font-bold transition flex items-center"
                        >
                            <X size={20} className="ml-2" />
                            {URDU_LABELS.general.close}
                        </button>
                    </div>
                    <button 
                        onClick={handlePrint} 
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold p-3 rounded-xl transition flex items-center justify-center text-xl"
                    >
                        <Printer size={24} className="ml-2" />
                        {URDU_LABELS.general.print}
                    </button>
                </div>
                
                {/* Printable Content Area */}
                <div className="p-4 sm:p-6 print-container" id="printable-content">
                    {/* Print Header (Only for Print) */}
                    <div className="hidden print:block header">
                        <h1 className="font-extrabold text-3xl">{URDU_LABELS.appName}</h1>
                        <p className="text-sm">{URDU_LABELS.tagline}</p>
                        <p className='mt-2 text-xl font-bold'>گاہک کا مکمل ریکارڈ</p>
                    </div>

                    {/* Customer Details */}
                    <div className="section">
                        <h2 className="text-3xl font-extrabold text-slate-700 mb-4 border-b-2 pb-1 print:text-lg print:border-b print:pb-0">خریدار کی تفصیلات</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-2">
                            <InfoRow label={URDU_LABELS.fields.accountNumber} value={details.account_number} />
                            <InfoRow label={URDU_LABELS.fields.customerName} value={details.customer_name} />
                            <InfoRow label={URDU_LABELS.fields.fatherName} value={details.father_name} />
                            <InfoRow label={URDU_LABELS.fields.phone} value={details.phone} />
                            <InfoRow label={URDU_LABELS.fields.cnic} value={details.cnic} />
                            <div className="md:col-span-2 print:col-span-3">
                                <InfoRow label={URDU_LABELS.fields.address} value={details.address} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Guarantor Details */}
                    <div className="section">
                        <h2 className="text-3xl font-extrabold text-slate-700 mb-4 border-b-2 pb-1 print:text-lg print:border-b print:pb-0">{URDU_LABELS.fields.guarantor1}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-2">
                            <InfoRow label={URDU_LABELS.fields.customerName} value={details.guarantor1_details.name} />
                            <InfoRow label={URDU_LABELS.fields.fatherName} value={details.guarantor1_details.father_name} />
                            <InfoRow label={URDU_LABELS.fields.phone} value={details.guarantor1_details.phone} />
                            <InfoRow label={URDU_LABELS.fields.cnic} value={details.guarantor1_details.cnic} />
                            <div className="md:col-span-2 print:col-span-3">
                                <InfoRow label={URDU_LABELS.fields.address} value={details.guarantor1_details.address} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="section">
                        <h2 className="text-3xl font-extrabold text-slate-700 mb-4 border-b-2 pb-1 print:text-lg print:border-b print:pb-0">{URDU_LABELS.fields.guarantor2}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-2">
                            <InfoRow label={URDU_LABELS.fields.customerName} value={details.guarantor2_details.name} />
                            <InfoRow label={URDU_LABELS.fields.fatherName} value={details.guarantor2_details.father_name} />
                            <InfoRow label={URDU_LABELS.fields.phone} value={details.guarantor2_details.phone} />
                            <InfoRow label={URDU_LABELS.fields.cnic} value={details.guarantor2_details.cnic} />
                            <div className="md:col-span-2 print:col-span-3">
                                <InfoRow label={URDU_LABELS.fields.address} value={details.guarantor2_details.address} />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="section">
                        <h2 className="text-3xl font-extrabold text-slate-700 mb-4 border-b-2 pb-1 print:text-lg print:border-b print:pb-0">گاڑی اور مالی تفصیلات</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-3 print:gap-2">
                            <InfoRow label={URDU_LABELS.fields.itemName} value={details.vehicle.item_name} />
                            <InfoRow label={URDU_LABELS.fields.model} value={details.vehicle.model} />
                            <InfoRow label={URDU_LABELS.fields.registrationNumber} value={details.vehicle.registration_number} />
                            <InfoRow label={URDU_LABELS.fields.engineNumber} value={details.vehicle.engine_number} />
                            <InfoRow label={URDU_LABELS.fields.chassisNumber} value={details.vehicle.chassis_number} />
                            <InfoRow label={URDU_LABELS.fields.color} value={details.vehicle.color} />
                            <InfoRow label={URDU_LABELS.fields.totalAmount} value={details.vehicle.total_amount} />
                            <InfoRow label={URDU_LABELS.fields.advance} value={details.vehicle.advance_payment} />
                            <InfoRow label={URDU_LABELS.fields.monthlyInstallment} value={details.vehicle.monthly_installment} />
                            <InfoRow label={URDU_LABELS.fields.installmentPlan} value={details.vehicle.installment_plan} />
                            <InfoRow label={URDU_LABELS.general.bakaya} value={details.vehicle.remaining_loan} className="font-extrabold text-red-700 print:text-red-800" />
                            <InfoRow label={URDU_LABELS.general.dueDate} value={details.vehicle.next_due_date} className="font-extrabold text-amber-700 print:text-amber-800" />
                        </div>
                    </div>
                    
                    {/* Payment Summary */}
                    <div className="section mt-6">
                        <h2 className="text-3xl font-extrabold text-green-700 mb-4 border-b-2 pb-1 print:text-lg print:border-b print:pb-0">مالی حساب</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                            <div className='p-3 bg-green-100 rounded-xl shadow-inner print:p-2 print:bg-slate-100 print:shadow-none print:border'>
                                <p className='text-lg font-bold text-green-700 print:text-sm print:text-slate-800'>{URDU_LABELS.general.totalPaid}</p>
                                <p className='text-3xl font-extrabold text-green-900 mt-1 print:text-xl print:font-bold print:text-green-700'>{totalPaidAmount.toLocaleString('en-US')}</p>
                            </div>
                            <div className='p-3 bg-blue-100 rounded-xl shadow-inner print:p-2 print:bg-slate-100 print:shadow-none print:border'>
                                <p className='text-lg font-bold text-blue-700 print:text-sm print:text-slate-800'>{URDU_LABELS.general.paid} ({URDU_LABELS.fields.totalInstallment})</p>
                                <p className='text-3xl font-extrabold text-blue-900 mt-1 print:text-xl print:font-bold print:text-blue-700'>{details.totalPaidCount} / {planLength}</p>
                            </div>
                            <div className='p-3 bg-red-100 rounded-xl shadow-inner print:p-2 print:bg-slate-100 print:shadow-none print:border'>
                                <p className='text-lg font-bold text-red-700 print:text-sm print:text-slate-800'>{URDU_LABELS.general.remaining} ({URDU_LABELS.fields.totalInstallment})</p>
                                <p className='text-3xl font-extrabold text-red-900 mt-1 print:text-xl print:font-bold print:text-red-700'>{remainingCount < 0 ? 0 : remainingCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Installment History */}
                    <div className="section mt-8">
                        <h2 className="text-3xl font-extrabold text-slate-700 mb-4 border-b-2 pb-1 print:text-lg print:border-b print:pb-0">{URDU_LABELS.general.history}</h2>
                        <InstallmentHistoryTree history={details.history} isPrintView={true} />
                    </div>
                </div>

            </div>
        </div>
    );
};

// =========================================================================
//                  UPDATED COMPONENT: RenderAllRecords (with Delete)
// =========================================================================

interface RenderAllRecordsProps {
  customerRecords: CustomerRecord[];
  loading: boolean;
  handleFetchAllCustomers: () => Promise<void>;
  handleViewDetails: (customerId: string) => Promise<void>;
}
const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
  alert(`${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${text}`);
};

const RenderAllRecords: React.FC<RenderAllRecordsProps> = ({
  customerRecords,
  loading,
  handleFetchAllCustomers,
  handleViewDetails,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null); // Track deleting record

  // ✅ DELETE FUNCTION
  const handleDeleteRecord = async (customerId: string) => {
    const confirmDelete = window.confirm("کیا آپ واقعی اس ریکارڈ کو حذف کرنا چاہتے ہیں؟");
    if (!confirmDelete) return;

    try {
      setDeleting(customerId);

      // 1️⃣ Delete related installments first (to avoid foreign key conflict)
      await supabase.from("installments").delete().eq("customer_id", customerId);

      // 2️⃣ Delete related vehicles
      await supabase.from("vehicles").delete().eq("customer_id", customerId);

      // 3️⃣ Delete main customer record
      const { error } = await supabase.from("customers").delete().eq("id", customerId);
      if (error) throw error;

      // 4️⃣ Update local state instantly
      showMessage("ریکارڈ کامیابی سے حذف ہو گیا ✅", "success");
      await handleFetchAllCustomers(); // refresh records
    } catch (error: any) {
      console.error("Delete Error:", error);
      showMessage("ریکارڈ حذف نہیں ہو سکا ❌", "error");
    } finally {
      setDeleting(null);
    }
  };

  // ✅ Filter logic
  const filteredRecords = useMemo(() => {
    let records = customerRecords;

    if (startDate && endDate) {
      records = records.filter((record) => {
        const recordDate = new Date(record.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return recordDate >= start && recordDate <= end;
      });
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      records = records.filter(
        (record) =>
          record.customer_name.toLowerCase().includes(lowerSearchTerm) ||
          record.account_number.toLowerCase().includes(lowerSearchTerm) ||
          record.vehicle_name.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return records;
  }, [customerRecords, startDate, endDate, searchTerm]);

  useEffect(() => {
    handleFetchAllCustomers();
  }, [handleFetchAllCustomers]);

  return (
    <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-7xl mx-auto" dir="rtl">
      <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
        {URDU_LABELS.general.allRecords}
      </h2>

      {/* Controls */}
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormField
            label="شروع کی تاریخ"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <FormField
            label="آخری تاریخ"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="flex items-end mb-6 md:mb-0">
            <button
              onClick={handleFetchAllCustomers}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold p-3 rounded-xl transition duration-300 flex items-center justify-center text-lg disabled:bg-slate-500"
            >
              <Clock size={20} className="ml-2" />
              {loading ? "ڈیٹا لوڈ ہو رہا ہے..." : "ڈیٹا دوبارہ لوڈ کریں"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <FormField
              label="نام، اکاؤنٹ یا گاڑی سے تلاش کریں"
              name="searchTerm"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="تلاش کی کلید درج کریں"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-300 rounded-xl shadow-lg">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="py-3 px-4 text-center text-xl font-bold border-l border-slate-700">
                {URDU_LABELS.fields.recordDate}
              </th>
              <th className="py-3 px-4 text-center text-xl font-bold border-l border-slate-700">
                {URDU_LABELS.fields.accountNumber}
              </th>
              <th className="py-3 px-4 text-right text-xl font-bold border-l border-slate-700">
                {URDU_LABELS.fields.customerName}
              </th>
              <th className="py-3 px-4 text-right text-xl font-bold border-l border-slate-700">
                {URDU_LABELS.fields.vehicleName}
              </th>
              <th className="py-3 px-4 text-center text-xl font-bold border-l border-slate-700">
                {URDU_LABELS.fields.remainingAuto} ({URDU_LABELS.fields.totalLoan})
              </th>
              <th className="py-3 px-4 text-center text-xl font-bold border-l border-slate-700">
                {URDU_LABELS.fields.status}
              </th>
              <th className="py-3 px-4 text-center text-xl font-bold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-2xl text-slate-500">
                  ڈیٹا لوڈ ہو رہا ہے...
                </td>
              </tr>
            )}

            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-2xl text-red-500">
                  {URDU_LABELS.general.notFound}
                </td>
              </tr>
            )}

            {filteredRecords.map((record, index) => (
              <tr
                key={record.id}
                className={`border-b border-slate-200 hover:bg-slate-50 transition duration-150 ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-100"
                }`}
              >
                <td className="py-3 px-4 text-center text-lg text-slate-600 border-l">
                  {new Date(record.created_at).toLocaleDateString("ur-PK")}
                </td>
                <td className="py-3 px-4 text-center text-lg font-bold text-amber-700 border-l">
                  {record.account_number}
                </td>
                <td className="py-3 px-4 text-right text-lg text-slate-800 font-medium border-l">
                  {record.customer_name}
                </td>
                <td className="py-3 px-4 text-right text-lg text-slate-800 font-medium border-l">
                  {record.vehicle_name}
                </td>
                <td className="py-3 px-4 text-center text-lg font-extrabold text-red-600 border-l">
                  {record.remaining_loan.toLocaleString("en-US")}
                </td>
                <td
                  className={`py-3 px-4 text-center text-lg font-bold border-l ${
                    record.remaining_loan <= 0 ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {record.remaining_loan <= 0 ? "ادا ہو گیا" : "جاری ہے"}
                </td>
                <td className="py-3 px-4 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => handleViewDetails(record.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    {URDU_LABELS.general.viewDetails}
                  </button>

                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    disabled={deleting === record.id}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-red-400"
                  >
                    {deleting === record.id ? "حذف ہو رہا ہے..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// =========================================================================
//                             LOGIN SCREEN
// =========================================================================

interface LoginScreenProps {
    handleLogin: (username: string, userpass: string) => void;
    message: MessageState;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ handleLogin, message }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleLogin(username, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
                <div className="text-center mb-8">
                    <LogIn size={48} className="text-amber-600 mx-auto mb-4" />
                    <h2 className="text-4xl font-extrabold text-amber-700">
                        {URDU_LABELS.appName}
                    </h2>
                    <p className="text-slate-500 mt-2">براہ کرم لاگ ان کریں۔</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="text-right block mb-2 font-bold text-slate-800 text-xl">
                            یوزر نیم (Username)
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="یوزر نیم درج کریں"
                            required
                            className="p-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 transition duration-150 text-base md:text-lg text-right font-inter bg-white w-full"
                            dir="rtl"
                        />
                    </div>
                    <div className="mb-8">
                        <label className="text-right block mb-2 font-bold text-slate-800 text-xl">
                            پاس ورڈ (Password)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="پاس ورڈ درج کریں"
                            required
                            className="p-3 border-2 border-slate-300 rounded-xl focus:border-amber-500 transition duration-150 text-base md:text-lg text-right font-inter bg-white w-full"
                            dir="rtl"
                        />
                    </div>
                    
                    {message.text && message.type === 'error' && (
                        <div className="p-3 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-bold">
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-2xl p-4 rounded-xl transition duration-300 shadow-lg"
                    >
                        لاگ ان
                    </button>
                </form>
            </div>
        </div>
    );
};


// =========================================================================
//                             MAIN APP COMPONENT (Logic)
// =========================================================================

const App: React.FC = () => {
  // --- AUTHENTICATION STATE AND LOGIC ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loggedInUsername, setLoggedInUsername] = useState<string>('');
  
  // Hardcoded credentials
  const CORRECT_USERNAME = 'zohan';
  const CORRECT_PASSWORD = '7575';

  const handleLogin = (username: string, password: string) => {
      setLoading(true);
      setMessage({ text: '', type: '' });

      if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
          setIsAuthenticated(true);
          setLoggedInUsername(username);
          showMessage(`خوش آمدید، ${username}!`, 'success');
      } else {
          showMessage("غلط یوزر نیم یا پاس ورڈ", 'error');
      }
      
      setLoading(false);
  };
  
  // --- START: LOGOUT LOGIC ---
  const handleLogout = () => {
      setIsAuthenticated(false);
      setLoggedInUsername('');
      setActiveMenu('register'); // Reset menu on logout
      resetUIState(); // Clear any fetched data/messages
      showMessage('کامیابی سے لاگ آؤٹ ہو گئے', 'success');
  };
  // --- END: LOGOUT LOGIC ---

  const [activeMenu, setActiveMenu] = useState<string>('register');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // Changed Message State to only handle success/error popups
  const [message, setMessage] = useState<MessageState>({ text: '', type: '' });
  
  const registerFormInitialState: RegisterFormState = {
      accountNumber: '', customerName: '', fatherName: '', phone: '', cnic: '', address: '',
      guarantor1Name: '', guarantor1FatherName: '', guarantor1Phone: '', guarantor1Cnic: '', guarantor1Address: '',
      guarantor2Name: '', guarantor2FatherName: '', guarantor2Phone: '', guarantor2Cnic: '', guarantor2Address: '',
  };
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(registerFormInitialState);

  const paymentFormInitialState: PaymentFormState = {
    accountNumber: '',
    date: new Date().toISOString().substring(0, 10),
    totalAmount: 0,
    monthlyInstallment: 0,
    advance: 0,
    remainingAuto: 0,
    installmentPlan: '24 Months', 
    itemName: '', engineNumber: '', chassisNumber: '', model: '', color: '', registrationNumber: '', insuranceDocs: '',
  };
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(paymentFormInitialState);

  const installmentPayFormInitialState: InstallmentPayFormState = { 
      accountNumber: '', 
      installmentAmount: 0, 
      paymentDate: new Date().toISOString().substring(0, 10) 
  };
  const [installmentPayForm, setInstallmentPayForm] = useState<InstallmentPayFormState>(installmentPayFormInitialState);
  
  const checkBalanceFormInitialState: CheckBalanceFormState = { 
      searchKey: '', 
      searchType: 'accountNumber' 
  };
  const [checkBalanceForm, setCheckBalanceForm] = useState<CheckBalanceFormState>(checkBalanceFormInitialState);

  // State for fetched data
  const [fetchedCustomer, setFetchedCustomer] = useState<CustomerType | null>(null);
  const [balanceResult, setBalanceResult] = useState<BalanceResultType | null>(null);
  const [installmentPayDetail, setInstallmentPayDetail] = useState<InstallmentPayDetailType | null>(null);
  
  // NEW: All Records State
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);
  const [fullDetails, setFullDetails] = useState<FullCustomerDetails | null>(null);

  // Utility function to show messages
  const showMessage = (text: string, type: 'success' | 'error' | '') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };
  
  // Resets non-form-related state (used when switching menus)
  const resetUIState = () => {
    setMessage({ text: '', type: '' });
    setFetchedCustomer(null);
    setBalanceResult(null);
    setInstallmentPayDetail(null);
    setCustomerRecords([]); 
    setFullDetails(null); 
  };
  
  // Auto-calculate remaining amount for Payment Form
  useEffect(() => {
    const total = paymentForm.totalAmount || 0;
    const advance = paymentForm.advance || 0;
    const remaining = total - advance;

    let monthlyInstallment = 0;
    if (paymentForm.installmentPlan === '12 Months') {
      monthlyInstallment = remaining / 12;
    } else if (paymentForm.installmentPlan === '24 Months') {
      monthlyInstallment = remaining / 24;
    }

    setPaymentForm(prev => ({ 
      ...prev, 
      remainingAuto: remaining,
      // Math.ceil is used to ensure the monthly installment covers the full remaining loan
      monthlyInstallment: Math.ceil(monthlyInstallment) || 0
    }));

  }, [paymentForm.totalAmount, paymentForm.advance, paymentForm.installmentPlan]);
  
  // =========================================================================
  //                             SUPABASE API CALLS (Data Logic)
  // =========================================================================

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const { 
        accountNumber, customerName, fatherName, phone, cnic, address,
        guarantor1Name, guarantor1FatherName, guarantor1Phone, guarantor1Cnic, guarantor1Address,
        guarantor2Name, guarantor2FatherName, guarantor2Phone, guarantor2Cnic, guarantor2Address,
    } = registerForm;

    // Group guarantor details into JSONB structure for Supabase
    const customerData = {
        account_number: accountNumber,
        customer_name: customerName,
        father_name: fatherName,
        phone,
        cnic,
        address,
        guarantor1_details: {
            name: guarantor1Name, father_name: guarantor1FatherName, phone: guarantor1Phone, cnic: guarantor1Cnic, address: guarantor1Address,
        },
        guarantor2_details: {
            name: guarantor2Name, father_name: guarantor2FatherName, phone: guarantor2Phone, cnic: guarantor2Cnic, address: guarantor2Address,
        },
    };

    // Inserting data into the 'customers' table
    const { error } = await supabase
        .from('customers')
        .insert([customerData]);

    if (error) {
        console.error("Supabase Error:", error);
        showMessage(URDU_LABELS.general.error + " " + (error as any).message, 'error');
    } else {
        showMessage(URDU_LABELS.general.success + " صارف رجسٹر ہو گیا!", 'success');
        setRegisterForm(registerFormInitialState);
    }
    setLoading(false);
  };
  
  const handleSearchCustomer = useCallback(async (accountNumber: string) => {
    setLoading(true);
    setFetchedCustomer(null);
    setInstallmentPayDetail(null);
    setMessage({ text: '', type: '' });

    type SupabaseCustomerResult = {
        id: string; customer_name: string; account_number: string;
        vehicles: VehicleSummary[] | null;
    } | null;

    // *UPDATED: Added total_amount to the vehicles select query*
    const { data, error } = await supabase
        .from('customers')
        .select(`id, customer_name, account_number, vehicles (id, item_name, monthly_installment, remaining_loan, installment_plan, next_due_date, created_at, advance_payment, total_amount)`)
        .eq('account_number', accountNumber)
        .limit(1)
        .single();
    
    setLoading(false);

    if (error && (error as any).code !== 'PGRST116') {
        console.error("Supabase Error:", error);
        showMessage(URDU_LABELS.general.error + " تلاش میں غلطی.", 'error');
    } else if (data) {
        const typedData = data as SupabaseCustomerResult;
        // Get the latest vehicle, but filter only non-completed vehicles first if possible
        const activeVehicle = typedData?.vehicles?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
        
        if (typedData && typedData.id && typedData.customer_name && typedData.account_number) {
          setFetchedCustomer({
            id: typedData.id,
            customer_name: typedData.customer_name,
            account_number: typedData.account_number,
            vehicles: activeVehicle
          });
        }
        
        if (activeVehicle && activeVehicle.id && activeMenu === 'installmentPay') {
            
            type InstallmentData = { payment_date: string; paid_count: number; remaining_balance: number }[];
            const { data: installmentData, error: _instError } = await supabase 
                .from('installments')
                .select('payment_date, paid_count, remaining_balance')
                .eq('vehicle_id', activeVehicle.id)
                .order('payment_date', { ascending: false })
                .limit(1);

            const lastPayment = (installmentData as InstallmentData)?.[0];
            
            // Check the most up-to-date remaining loan
            const latestRemainingLoan = lastPayment ? lastPayment.remaining_balance : activeVehicle.remaining_loan;

            setInstallmentPayDetail({
                name: typedData?.customer_name || '',
                vehicle_id: activeVehicle.id,
                vehicle_name: activeVehicle.item_name,
                plan: activeVehicle.installment_plan,
                monthly_installment: activeVehicle.monthly_installment,
                remaining_loan: latestRemainingLoan, 
                paid_count: lastPayment ? lastPayment.paid_count : 0,
                next_due_date: activeVehicle.next_due_date,
                total_amount: activeVehicle.total_amount, // *UPDATED: Set total amount*
            });
        } else if (activeMenu === 'installmentPay' && !activeVehicle) {
             showMessage("اس اکاؤنٹ سے کوئی گاڑی منسلک نہیں ہے۔", 'error');
             setInstallmentPayDetail(null);
        }
    } else {
        showMessage(URDU_LABELS.general.notFound, 'error');
    }
  }, [activeMenu]);

  // Handle Search for Customer (Wrapper for forms)
  const handleSearchWrapper = () => {
      if (activeMenu === 'payment') {
          handleSearchCustomer(paymentForm.accountNumber);
      } else if (activeMenu === 'installmentPay') {
          handleSearchCustomer(installmentPayForm.accountNumber);
      }
  };
  
 

  

  const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      if (!fetchedCustomer || !fetchedCustomer.id) {
          showMessage("پہلے اکاؤنٹ نمبر تلاش کریں اور یقینی بنائیں کہ صارف رجسٹرڈ ہے۔", 'error');
          setLoading(false);
          return;
      }
      
      const {
        totalAmount, advance, remainingAuto, monthlyInstallment, installmentPlan,
        itemName, engineNumber, chassisNumber, registrationNumber, date, model, color, insuranceDocs
      } = paymentForm;

      const nextDueDateObj = new Date(date);
      // Next due date for the first official installment is one month after the advance payment date.
      const newDueDate = new Date(nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 1)).toISOString().substring(0, 10);
      
      // 1. گاڑی کا ریکارڈ محفوظ کریں (Insert into 'vehicles' table)
      const vehicleData = {
        customer_id: fetchedCustomer.id,
        registration_number: registrationNumber,
        item_name: itemName,
        engine_number: engineNumber,
        chassis_number: chassisNumber,
        model: model,
        color: color,
        insurance_docs: insuranceDocs,
        total_amount: totalAmount,
        advance_payment: advance, // Save advance here
        remaining_loan: remainingAuto, // This is the starting loan after advance
        monthly_installment: monthlyInstallment,
        installment_plan: installmentPlan,
        next_due_date: remainingAuto > 0 ? newDueDate : null, // Set to null if loan is already 0
      };

      const { data: vehicleInsert, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select('id')
        .single();
        
      if (vehicleError || !(vehicleInsert as any)?.id) {
        console.error("Supabase Vehicle Error:", vehicleError);
        showMessage(URDU_LABELS.general.error + " گاڑی کا ڈیٹا محفوظ نہیں ہو سکا۔", 'error');
        setLoading(false);
        return;
      }
      
      const vehicleId = (vehicleInsert as any).id as string;
      
      // 2. ایڈوانس پیمنٹ کو پہلی قسط کے طور پر ریکارڈ کریں (Insert into 'installments' table)
      
      // We insert the advance payment record first.
      if (advance > 0 || remainingAuto <= 0) { // Always save an installment record if advance > 0 OR loan is 0 (fully paid)
        const installmentData = {
            vehicle_id: vehicleId,
            payment_date: date,
            amount_paid: advance,
            paid_count: remainingAuto <= 0 ? (installmentPlan === '12 Months' ? 12 : 24) : 0, // Set to max count if fully paid, otherwise 0
            remaining_balance: remainingAuto,
        };

        const { error: installmentError } = await supabase
            .from('installments')
            .insert([installmentData]);

        if (installmentError) {
            console.error("Supabase Installment Error:", installmentError);
            showMessage(URDU_LABELS.general.error + " ایڈوانس پیمنٹ محفوظ نہیں ہو سکی۔", 'error');
        } else {
            showMessage(URDU_LABELS.general.success + " ادائیگی اور گاڑی کا ڈیٹا محفوظ ہو گیا!", 'success');
            setPaymentForm(paymentFormInitialState);
            setFetchedCustomer(null);
        }
      } else {
          showMessage(URDU_LABELS.general.success + " گاڑی کا ڈیٹا محفوظ ہو گیا!", 'success');
          setPaymentForm(paymentFormInitialState);
          setFetchedCustomer(null);
      }
      
      setLoading(false);
  };
  
const handleInstallmentPaySubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage({ text: '', type: '' });

  try {
    if (!installmentPayDetail) {
      showMessage("پہلے اکاؤنٹ نمبر تلاش کریں!", 'error');
      setLoading(false);
      return;
    }

    const { installmentAmount, paymentDate } = installmentPayForm;
    const {
      vehicle_id,
      remaining_loan,
      monthly_installment,
      paid_count,
      next_due_date,
      plan,
    } = installmentPayDetail;

    const amount = Number(installmentAmount);
    if (isNaN(amount) || amount <= 0) {
      showMessage("ادائیگی کی رقم درست نہیں ہے۔", "error");
      setLoading(false);
      return;
    }

    // --- Plan Length ---
    const planLength = plan === "12 Months" ? 12 : 24;

    // --- Remaining Calculation ---
    let newRemaining = remaining_loan - amount;
    let overpay = 0;
    if (newRemaining < 0) {
      overpay = Math.abs(newRemaining);
      newRemaining = 0;
    }

    // --- Paid Count Calculation ---
    const installmentsCovered = Math.floor(amount / monthly_installment);
    let newPaidCount = Math.min(planLength, paid_count + installmentsCovered);

    // --- Due Date Calculation ---
    let newDueDate = next_due_date;
    if (next_due_date && newRemaining > 0) {
      const nextDate = new Date(next_due_date);
      nextDate.setMonth(nextDate.getMonth() + installmentsCovered);
      newDueDate = nextDate.toISOString().substring(0, 10);
    } else if (newRemaining === 0) {
      newDueDate = null; // loan complete
      newPaidCount = planLength;
    }

    // --- Insert Record ---
    const installmentRecord = {
      vehicle_id,
      payment_date: paymentDate,
      amount_paid: amount,
      paid_count: newPaidCount,
      remaining_balance: newRemaining,
    };

    const { error: installmentError } = await supabase
      .from("installments")
      .insert([installmentRecord]);
        
     if (installmentError) {
      console.error("Supabase Installment Payment Error:", installmentError);
      showMessage("ادائیگی محفوظ نہیں ہو سکی۔", "error");
      } else {
        showMessage(URDU_LABELS.general.success + " ادائیگی محفوظ  ہو سکی۔!", 'success');
     setLoading(false);
      return;
    }

    // --- Update Vehicle Loan ---
    const { error: vehicleUpdateError } = await supabase
      .from("vehicles")
      .update({
        remaining_loan: newRemaining,
        next_due_date: newDueDate,
      })
      .eq("id", vehicle_id);

    if (vehicleUpdateError) {
      console.error("Supabase Vehicle Update Error:", vehicleUpdateError);
      showMessage("گاڑی کا ریکارڈ اپ ڈیٹ نہیں ہو سکا۔", "error");
      setLoading(false);
      return;
    }


        // --- Popup / Toast Message ---
    if (newRemaining === 0) {
      alert("🎉 مبارک ہو! قرض مکمل طور پر ادا ہو گیا ہے!");
      showMessage("مبارک ہو! قرض مکمل طور پر ادا ہو گیا ہے!", "success");
    } else if (overpay > 0) {
      alert(
        `🎉 آپ نے ${overpay.toLocaleString()} روپے زیادہ ادا کیے ہیں۔ یہ رقم بطور ایڈوانس درج کی جائے گی۔`
      );
      showMessage("ادائیگی محفوظ ہو گئی! اضافی رقم بطور ایڈوانس محفوظ کی گئی۔", "success");
    } else {
      showMessage("قسط کی ادائیگی کامیابی سے محفوظ ہو گئی!", "success");
    }



    // --- Re-Fetch Updated Customer Detail ---
    await handleSearchCustomer(installmentPayForm.accountNumber);

    // --- Reset Form ---
    setInstallmentPayForm((prev) => ({ ...prev, installmentAmount: 0 }));

  } catch (err) {
    console.error("Payment Submit Error:", err);
    showMessage("کچھ غلطی ہو گئی، دوبارہ کوشش کریں۔", "error");
  }

  setLoading(false);
};


const handleCheckBalance = async () => {
  try {
    setLoading(true);
    setBalanceResult(null);
    setMessage({ text: '', type: '' });

    const { searchKey, searchType } = checkBalanceForm;
    let customerId: string | null = null;

    if (searchType === "accountNumber") {
      const { data: customerData, error: _cError } = await supabase
        .from("customers")
        .select("id")
        .eq("account_number", searchKey)
        .single();

      if (_cError || !customerData) {
        showMessage(URDU_LABELS.general.notFound, "error");
        setLoading(false);
        return;
      }

      customerId = customerData.id;
    }

    let query = supabase
      .from("vehicles")
      .select(`*, customer:customer_id(customer_name)`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (customerId) query = query.eq("customer_id", customerId);
    else query = query.eq("registration_number", searchKey);

    const { data: vehicleDataRaw, error: vError } = await query.single();
    const vehicleData = vehicleDataRaw as (VehicleSummary & { customer: { customer_name: string } }) | null;

    if (vError || !vehicleData || !vehicleData.customer) {
      showMessage(URDU_LABELS.general.notFound, "error");
      setLoading(false);
      return;
    }

    const { data: installmentHistoryRaw, error: _iError } = await supabase
      .from("installments")
      .select(`id, payment_date, amount_paid, paid_count, remaining_balance`)
      .eq("vehicle_id", vehicleData.id)
      .order("payment_date", { ascending: true });

    if (_iError) {
      showMessage("قسط کی تفصیل حاصل کرنے میں مسئلہ ہوا۔", "error");
      setLoading(false);
      return;
    }

    const history: InstallmentHistory[] = installmentHistoryRaw || [];

    const {
      remainingLoan,
      totalPaidAmount,
      totalPaidCount,
      remainingCount,
      planLength,
    } = calculateRemainingBalanceAndCounts(
      Number(vehicleData.total_amount),
      Number(vehicleData.advance_payment),
      vehicleData.installment_plan,
      history
    );

    // Safe date handling (avoid new Date(null) TypeScript error)
    let daysOverdue = 0;
    let isOverdue = false;
    const nextDueDate = vehicleData.next_due_date; // string | null

    if (nextDueDate && remainingLoan > 0) {
      const today = new Date();
      const nextDueDateObj = new Date(nextDueDate);
      today.setHours(0, 0, 0, 0);
      nextDueDateObj.setHours(0, 0, 0, 0);

      daysOverdue = Math.floor((today.getTime() - nextDueDateObj.getTime()) / (1000 * 60 * 60 * 24));
      isOverdue = daysOverdue > 0;
    } else {
      daysOverdue = 0;
      isOverdue = false;
    }

    const isCompleted = remainingLoan <= 0;

    setBalanceResult({
      name: vehicleData.customer.customer_name,
      vehicle: vehicleData.item_name,
      totalAmount: vehicleData.total_amount,
      totalAdvance: vehicleData.advance_payment,
      totalPaid: totalPaidAmount, // <-- ensure BalanceResultType includes this property
      remainingLoan,
      installmentAmount: vehicleData.monthly_installment,
      nextDueDate,
      paidCount: totalPaidCount,
      remainingCount: isCompleted ? 0 : remainingCount,
      isOverdue: isOverdue && !isCompleted,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
      isCompleted,
      history,
    });

    setLoading(false);
  } catch (err) {
    console.error(err);
    showMessage("کچھ غلط ہو گیا، دوبارہ کوشش کریں۔", "error");
    setLoading(false);
  }
};


// ✅ Helper — Accurate Remaining Loan Calculator
function calculateRemainingBalanceAndCounts(
  totalAmount: number,
  advancePayment: number,
  installmentPlan: string,
  historyList: InstallmentHistory[]
) {
  const planLength =
    installmentPlan?.includes("12") ? 12 : installmentPlan?.includes("24") ? 24 : 0;

  const totalPaidAmount = historyList.reduce(
    (sum, rec) => sum + (Number(rec.amount_paid) || 0),
    0
  );

  // 💡 Remaining loan = total - advance - all installments paid
  const remainingLoan = Math.max(totalAmount - totalPaidAmount, 0);

  const totalPaidCount = historyList.filter(
    (h) => Number(h.amount_paid) > 0
  ).length;

  const remainingCount = Math.max(planLength - totalPaidCount, 0);

  return { remainingLoan, totalPaidAmount, totalPaidCount, remainingCount, planLength };
}

// ✅ Fixed Function — Fetch All Records with Correct Remaining Balance
const handleFetchAllCustomers = useCallback(async () => {
    setLoading(true);
    setCustomerRecords([]);
    setMessage({ text: '', type: '' });

    try {
        // 1️⃣ Fetch all customers with their vehicles
        const { data: customersData, error: cError } = await supabase
            .from("customers")
            .select(`
                id, 
                account_number, 
                customer_name, 
                created_at,
                vehicles (
                    id,
                    item_name,
                    total_amount,
                    advance_payment,
                    installment_plan,
                    remaining_loan,
                    monthly_installment,
                    created_at
                )
            `)
            .order("created_at", { ascending: false });

        if (cError) throw cError;

        // 2️⃣ Prepare results array
        const updatedRecords: CustomerRecord[] = [];

        // 3️⃣ Loop through customers
        for (const customer of customersData || []) {
            const vehicles = customer.vehicles || [];
            if (vehicles.length === 0) continue;

            // Sort to get latest vehicle
            const latestVehicle = vehicles.sort(
                (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            // 4️⃣ Fetch Installment History
            const { data: historyRaw } = await supabase
                .from("installments")
                .select("amount_paid, paid_count, remaining_balance, payment_date")
                .eq("vehicle_id", latestVehicle.id)
                .order("payment_date", { ascending: true });

            const historyList: InstallmentHistory[] = (historyRaw || []) as InstallmentHistory[];

            // 5️⃣ Use shared balance calculation logic
            const { 
                remainingLoan, 
                totalPaidAmount, 
                totalPaidCount, 
                remainingCount 
            } = calculateRemainingBalanceAndCounts(
                latestVehicle.total_amount,
                latestVehicle.advance_payment,
                latestVehicle.installment_plan,
                historyList
            );

            // 6️⃣ Push record for display
            updatedRecords.push({
                id: customer.id,
                account_number: customer.account_number,
                customer_name: customer.customer_name,
                vehicle_name: latestVehicle.item_name,
                remaining_loan: remainingLoan, // ✅ Correct balance
                total_paid: totalPaidAmount, // ✅ NEW optional field
                paid_count: totalPaidCount,
                remaining_count: remainingCount,
                monthly_installment: latestVehicle.monthly_installment,
                created_at: customer.created_at
            });
        }

        // 7️⃣ Update State
        setCustomerRecords(updatedRecords);
        showMessage("تمام ریکارڈز کامیابی سے لوڈ ہو گئے ✅", "success");
    } catch (error: any) {
        console.error("Supabase All Customers Error:", error);
        showMessage(
            URDU_LABELS.general.error + " تمام ریکارڈز لوڈ نہیں ہو سکے۔",
            "error"
        );
    } finally {
        setLoading(false);
    }
}, []);

  
  // NEW: Fetch Full Details for Printable View
const handleFetchFullDetails = async (customerId: string) => {
  setLoading(true);
  setFullDetails(null);
  setMessage({ text: "", type: "" });

  try {
    // 1️⃣ Fetch Customer + Vehicle Details
    const { data: customerDataRaw, error: cError } = await supabase
      .from("customers")
      .select(`
        id, 
        account_number, 
        customer_name, 
        father_name, 
        phone, 
        cnic, 
        address,
        guarantor1_details, 
        guarantor2_details,
        vehicles (
          id, 
          item_name, 
          registration_number, 
          engine_number, 
          chassis_number, 
          model, 
          color, 
          insurance_docs,
          total_amount, 
          advance_payment, 
          remaining_loan, 
          monthly_installment, 
          installment_plan, 
          next_due_date, 
          created_at
        )
      `)
      .eq("id", customerId)
      .limit(1)
      .single();

    if (cError || !customerDataRaw) {
      console.error("Supabase Full Details Error:", cError);
      showMessage(URDU_LABELS.general.notFound, "error");
      setLoading(false);
      return;
    }

    // 2️⃣ Extract Latest Vehicle
    const customerData = customerDataRaw as any;
    const latestVehicle = customerData.vehicles?.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    if (!latestVehicle) {
      showMessage("گاڑی کا ریکارڈ نہیں ملا۔", "error");
      setLoading(false);
      return;
    }

    // 3️⃣ Fetch Installment History
    const { data: installmentHistoryRaw, error: iError } = await supabase
      .from("installments")
      .select("*")
      .eq("vehicle_id", latestVehicle.id)
      .order("payment_date", { ascending: true });

    if (iError) throw iError;

    const history: InstallmentHistory[] =
      (installmentHistoryRaw as InstallmentHistory[]) || [];

    // 4️⃣ Calculate Summary Data Using Common Function
    const {
      remainingLoan,
      totalPaidAmount,
      totalPaidCount,
      remainingCount,
      planLength,
    } = calculateRemainingBalanceAndCounts(
      latestVehicle.total_amount,
      latestVehicle.advance_payment,
      latestVehicle.installment_plan,
      history
    );

    // 5️⃣ Calculate Total Installment Amount (For Summary Display)
    const totalInstallmentAmount =
      (latestVehicle.monthly_installment || 0) * planLength;

    // 6️⃣ Build Full Details Object
    const fullDetails: FullCustomerDetails = {
      ...customerData,
      vehicle: latestVehicle,
      history: history,
      totalPaidCount,
      remainingCount,
      totalPaidAmount,
      totalInstallmentAmount,
      planLength,
      remainingLoan, // ✅ Added for print summary display
    };

    // 7️⃣ Update State
    setFullDetails(fullDetails);
    showMessage("تفصیلات کامیابی سے حاصل ہو گئیں ✅", "success");
  } catch (error: any) {
    console.error("Full Details Fetch Error:", error);
    showMessage(URDU_LABELS.general.error + " مکمل تفصیلات لوڈ نہیں ہو سکیں۔", "error");
  } finally {
    setLoading(false);
  }
};
 
  
  // =========================================================================
  //                             CONTENT RENDERER
  // =========================================================================
const handlePaymentClick = () => {
    setActiveMenu("payment"); // یا جو bhi payment view show کرنا ہو
};

  const renderContent = () => {
    switch (activeMenu) {
      case 'register':
        return <RenderRegisterUser 
                    formState={registerForm} 
                    setFormState={setRegisterForm} 
                    handleSubmit={handleRegisterSubmit} 
                    loading={loading} 
                     handlePaymentClick={handlePaymentClick} // ✅ Pass the function her
                />;
      case 'payment':
        return <RenderPayment 
                    formState={paymentForm} 
                    setFormState={setPaymentForm} 
                    handleSubmit={handlePaymentSubmit} 
                    handleSearchWrapper={handleSearchWrapper}
                    loading={loading}
                    fetchedCustomer={fetchedCustomer}
                />;
      case 'installmentPay':
        return <RenderInstallmentPay 
                    searchForm={installmentPayForm} 
                    setSearchForm={setInstallmentPayForm} 
                    handleSearchWrapper={handleSearchWrapper}
                    handleSubmit={handleInstallmentPaySubmit}
                    loading={loading}
                    payDetail={installmentPayDetail}
                />;
      case 'checkBalance':
        return <RenderCheckBalance 
                    formState={checkBalanceForm}
                    setFormState={setCheckBalanceForm}
                    handleSubmit={handleCheckBalance}
                    loading={loading}
                    balanceResult={balanceResult}
                />;
      case 'allRecords': 
        return <RenderAllRecords
                    customerRecords={customerRecords}
                    loading={loading}
                    handleFetchAllCustomers={handleFetchAllCustomers}
                    handleViewDetails={handleFetchFullDetails}
                />;
      default:
        return <RenderRegisterUser 
                    formState={registerForm} 
                    setFormState={setRegisterForm} 
                    handleSubmit={handleRegisterSubmit} 
                    loading={loading} 
                    
                    handlePaymentClick={handlePaymentClick} // ✅ Pass te function her
                />;
    }
  };

  // --- CONDITIONAL RENDERING ---
  if (!isAuthenticated) {
      return (
          <LoginScreen handleLogin={handleLogin} message={message} />
      );
  }
  
  if (fullDetails) {
      return (
          <PrintableDetailsView details={fullDetails} onClose={() => setFullDetails(null)} />
      );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-inter">
      {/* Global Message Box (Only for success/error popups) */}
      {message.text && (
          <div 
              className={`fixed top-4 right-1/2 translate-x-1/2 p-4 rounded-xl shadow-2xl z-50 text-white font-bold text-center w-64 md:w-80 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          >
              {message.text}
          </div>
      )}
      
      {/* Header for Mobile/Tablet */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg lg:hidden">
        <h1 className="text-3xl font-extrabold text-amber-500">
          {URDU_LABELS.appName}
        </h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-700 transition">
          <Menu size={30} />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-1/4">
          <div className="sticky top-0 h-screen bg-slate-900 p-6 shadow-2xl">
            <h1 className="text-4xl font-extrabold text-amber-500 mb-2 border-b-2 border-amber-300 pb-2 text-center">
              {URDU_LABELS.appName}
            </h1>
            <p className='text-slate-400 text-center text-sm mb-8'>{URDU_LABELS.tagline}</p>
            <Sidebar 
                isSidebarOpen={false} 
                setIsSidebarOpen={setIsSidebarOpen} 
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                resetUIState={resetUIState}
                loggedInUsername={loggedInUsername} 
                handleLogout={handleLogout} 
            />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        <div className={`fixed inset-y-0 right-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
          <Sidebar 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                resetUIState={resetUIState}
                loggedInUsername={loggedInUsername} 
                handleLogout={handleLogout} 
          />
        </div>

        {/* Main Form/View Area */}
        <main className="lg:w-3/4 p-4 md:p-8 flex-shrink-0 w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
