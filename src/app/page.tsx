"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Menu, X, Search, DollarSign, UserPlus, FileText, CheckCircle, Clock, LogIn, LogOut } from 'lucide-react'; // Added LogOut icon
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Initialization ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'REPLACE_WITH_YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';

// Initialize the REAL Supabase Client 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- End of Supabase Client Initialization ---

// =========================================================================
//                  TYPE DEFINITIONS (Interfaces)
// =========================================================================

interface VehicleSummary {
    id: string; item_name: string; monthly_installment: number; remaining_loan: number; installment_plan: string; next_due_date: string; created_at: string; total_amount: number; advance_payment: number;
}

interface CustomerType {
  id: string;
  customer_name: string;
  account_number: string;
  vehicles?: VehicleSummary | null;
}

interface InstallmentPayDetailType {
  name: string;
  vehicle_id: string;
  vehicle_name: string;
  plan: string;
  monthly_installment: number;
  remaining_loan: number;
  paid_count: number;
  next_due_date: string;
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
    totalAdvance: number; 
    remainingLoan: number; 
    // Next payment details
    installmentAmount: number;
    nextDueDate: string;
    paidCount: number;
    remainingCount: number;
    isOverdue: boolean;
    daysOverdue: number;
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
    register: "صارف رجسٹر کریں",
    payment: "Payment",
    installmentPay: "Installment Pay",
    checkBalance: "Check Balance",
  },
  general: {
    save: "محفوظ کریں",
    search: "تلاش کریں",
    due: "بقایا قسط",
    paid: "ادا شدہ قسطیں",
    remaining: "بقیہ رقم",
    dueDate: "آخری مقررہ تاریخ",
    overdueWarning: "🚨 براہ کرم قسط فوراً ادا کریں! (30 دن سے زیادہ کی تاخیر)",
    success: "کامیاب! ڈیٹا محفوظ کر لیا گیا ہے۔",
    error: "غلطی: ڈیٹا محفوظ نہیں ہو سکا۔",
    notFound: "معذرت، کوئی ریکارڈ نہیں ملا۔",
    history: "قسطوں کی تاریخ (History)",
    advance: "ایڈوانس",
    bakaya: "بقایا قرض",
    logout: "لاگ آؤٹ", // Added Urdu label for Logout
  },
  fields: {
    accountNumber: "اکاؤنٹ نمبر",
    customerName: "خریدار کا نام",
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
  }
};

// =========================================================================
//                  HELPER COMPONENTS (UI elements)
// =========================================================================

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: FormChangeHandler;
  placeholder?: string;
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
        value={value}
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
                <MenuButton icon={DollarSign} label={URDU_LABELS.menu.payment} menuKey="payment" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
                <MenuButton icon={FileText} label={URDU_LABELS.menu.installmentPay} menuKey="installmentPay" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
                <MenuButton icon={Search} label={URDU_LABELS.menu.checkBalance} menuKey="checkBalance" activeMenu={activeMenu} setActiveMenu={handleMenuClick} resetUIState={resetUIState} />
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
}

const RenderRegisterUser: React.FC<RenderRegisterUserProps> = ({ formState, setFormState, handleSubmit, loading }) => {
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-2xl p-4 rounded-xl transition duration-300 shadow-lg mt-4 disabled:bg-slate-500"
          >
            {loading ? 'محفوظ ہو رہا ہے...' : URDU_LABELS.general.save}
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
        value = parseFloat(value as string) || 0;
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
            <FormField label={URDU_LABELS.fields.totalAmount} name="totalAmount" type="number" value={formState.totalAmount} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.advance} name="advance" type="number" value={formState.advance} onChange={handleChange} />
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xl">
              <p className='font-bold text-green-900'>نام: <span className='font-normal mr-2'>{payDetail.name}</span></p>
              <p className='font-bold text-green-900'>گاڑی: <span className='font-normal mr-2'>{payDetail.vehicle_name}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.fields.currentPlan}: <span className='font-normal mr-2'>{payDetail.plan}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.fields.monthlyInstallment} (مقررہ): <span className='font-normal mr-2'>{payDetail.monthly_installment.toLocaleString('en-US')}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.general.paid}: <span className='font-normal mr-2'>{payDetail.paid_count}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.general.remaining}: <span className='font-normal mr-2'>{payDetail.remaining_loan.toLocaleString('en-US')}</span></p>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-8 pt-4 border-t-2 border-green-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <FormField
                  label={URDU_LABELS.fields.installmentAmount}
                  name="installmentAmount"
                  type="number"
                  value={searchForm.installmentAmount}
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
                    disabled={loading}
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
//                  NEW COMPONENT: Installment History List (Tree View)
// =========================================================================

interface InstallmentHistoryTreeProps {
    history: InstallmentHistory[];
}

const InstallmentHistoryTree: React.FC<InstallmentHistoryTreeProps> = ({ history }) => {
    if (history.length === 0) {
        return <p className="text-center text-slate-500 text-xl font-medium mt-6">کوئی قسط کی تاریخ نہیں ملی۔</p>;
    }
    
    // Sort oldest first for a true 'timeline' view
    const sortedHistory = [...history].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());

    return (
        <div className="relative border-r-4 border-slate-300 pr-8 mt-6 pb-2" dir="rtl">
            <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-center">
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
                        {/* Circle marker on the timeline */}
                        <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${borderColor} border-4 ${bgColor}`}>
                            <Icon size={14} className={titleColor} />
                        </div>

                        {/* Payment Card */}
                        <div className={`p-4 rounded-xl shadow-lg transition duration-300 hover:shadow-xl ${bgColor} border-r-4 ${borderColor}`}>
                            <div className="flex justify-between items-start border-b pb-2 mb-2">
                                <h4 className={`text-xl font-extrabold ${titleColor}`}>{titleText}</h4>
                                <p className="text-sm font-medium text-slate-500 flex items-center">
                                    <Clock size={16} className="ml-1" />
                                    {new Date(record.payment_date).toLocaleDateString('ur-PK', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-lg">
                                <p className="font-bold text-slate-700">
                                    {URDU_LABELS.fields.amountPaid}: <span className="font-extrabold text-2xl text-green-700 mr-2">{record.amount_paid.toLocaleString('en-US')}</span>
                                </p>
                                <p className="font-bold text-slate-700 text-left">
                                    {URDU_LABELS.fields.remainingAfter}: <span className="font-medium text-slate-600 mr-2">{record.remaining_balance.toLocaleString('en-US')}</span>
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
            <div className={`p-6 rounded-2xl shadow-xl border-4 ${balanceResult.isOverdue ? 'bg-red-100 border-red-500' : 'bg-blue-50 border-blue-400'} mb-8`}>
                <h3 className={`text-3xl font-extrabold mb-4 pb-2 border-b-2 ${balanceResult.isOverdue ? 'text-red-800 border-red-300' : 'text-blue-800 border-blue-300'}`}>
                    خریدار کا نام: **{balanceResult.name}**
                </h3>
                <h4 className='text-2xl font-bold text-slate-700 mb-4'>گاڑی: **{balanceResult.vehicle}**</h4>

                {balanceResult.isOverdue && (
                  <div className="mb-6 p-4 bg-red-600 text-white font-extrabold text-xl text-center rounded-xl shadow-lg animate-pulse">
                    {URDU_LABELS.general.overdueWarning}
                    <p className="mt-1 text-2xl">تاخیر: **{balanceResult.daysOverdue} دن**</p>
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
                        <p className='text-lg font-bold text-green-700'>{URDU_LABELS.fields.monthlyInstallment} (Next)</p>
                        <p className='text-3xl font-extrabold text-green-900 mt-1'>{balanceResult.installmentAmount.toLocaleString('en-US')}</p>
                        <p className='text-sm font-medium text-slate-500 mt-1'>{URDU_LABELS.general.dueDate}: {balanceResult.nextDueDate}</p>
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

    // FIX: Removed unused type alias SupabaseCustomerResult (Warning 1)
    
    const { data, error } = await supabase
        .from('customers')
        .select(`id, customer_name, account_number, vehicles (id, item_name, monthly_installment, remaining_loan, installment_plan, next_due_date, created_at, advance_payment)`)
        .eq('account_number', accountNumber)
        .limit(1)
        .single();
    
    setLoading(false);

    if (error && (error as any).code !== 'PGRST116') {
        console.error("Supabase Error:", error);
        showMessage(URDU_LABELS.general.error + " تلاش میں غلطی.", 'error');
    } else if (data) {
        // FIX: Replaced casting with `any` as a quick fix for the removed type alias
        const typedData = data as any; 
        const activeVehicle = typedData?.vehicles?.sort((a: VehicleSummary, b: VehicleSummary) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
        
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
            // FIX: Renamed instError to _instError to silence unused variable warning (Warning 2)
            const { data: installmentData, error: _instError } = await supabase 
                .from('installments')
                .select('payment_date, paid_count, remaining_balance')
                .eq('vehicle_id', activeVehicle.id)
                .order('payment_date', { ascending: false })
                .limit(1);

            const lastPayment = (installmentData as InstallmentData)?.[0];

            setInstallmentPayDetail({
                name: typedData?.customer_name || '',
                vehicle_id: activeVehicle.id,
                vehicle_name: activeVehicle.item_name,
                plan: activeVehicle.installment_plan,
                monthly_installment: activeVehicle.monthly_installment,
                remaining_loan: lastPayment ? lastPayment.remaining_balance : activeVehicle.remaining_loan, 
                paid_count: lastPayment ? lastPayment.paid_count : 0,
                next_due_date: activeVehicle.next_due_date,
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
        remaining_loan: remainingAuto,
        monthly_installment: monthlyInstallment,
        installment_plan: installmentPlan,
        next_due_date: newDueDate,
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
      const paidCount = advance > 0 ? 0 : 0; // Advance payment should ideally be count 0, first installment is count 1.
      
      // We insert the advance payment record first.
      if (advance > 0) {
        const installmentData = {
            vehicle_id: vehicleId,
            payment_date: date,
            amount_paid: advance,
            paid_count: 0, // 0 for advance payment
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
    
    if (!installmentPayDetail) {
        showMessage("پہلے اکاؤنٹ نمبر تلاش کریں!", 'error');
        setLoading(false);
        return;
    }
    
    const { installmentAmount, paymentDate } = installmentPayForm;
    const { vehicle_id, remaining_loan, monthly_installment, paid_count, next_due_date } = installmentPayDetail;
    
    const amount = installmentAmount;
    const remaining = remaining_loan - amount;
    
    // Increment paid count by 1 only if the payment covers the monthly installment amount
    const newPaidCount = paid_count + (amount >= monthly_installment ? 1 : 0);
    
    // 1. قسط کا ریکارڈ محفوظ کریں (Insert into 'installments' table)
    const installmentRecord = {
        vehicle_id: vehicle_id,
        payment_date: paymentDate,
        amount_paid: amount,
        paid_count: newPaidCount,
        remaining_balance: remaining,
    };
    
    const { error: installmentError } = await supabase
        .from('installments')
        .insert([installmentRecord]);
        
    if (installmentError) {
        console.error("Supabase Installment Payment Error:", installmentError);
        showMessage(URDU_LABELS.general.error + " قسط محفوظ نہیں ہو سکی۔", 'error');
        setLoading(false);
        return;
    }
    
    // 2. Vehicle کے ریکارڈ کو اپ ڈیٹ کریں (Update 'vehicles' table)
    const nextDueDateObj = new Date(next_due_date);
    const newDueDate = (amount >= monthly_installment) 
        ? new Date(nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 1)).toISOString().substring(0, 10)
        : next_due_date;

    
    const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({
            remaining_loan: remaining,
            next_due_date: newDueDate,
        })
        .eq('id', vehicle_id);
        
    if (vehicleUpdateError) {
        console.error("Supabase Vehicle Update Error:", vehicleUpdateError);
        showMessage(URDU_LABELS.general.error + " گاڑی کا ریکارڈ اپ ڈیٹ نہیں ہو سکا۔", 'error');
    } else {
        showMessage(URDU_LABELS.general.success + " قسط کی ادائیگی محفوظ ہو گئی!", 'success');
        handleSearchCustomer(installmentPayForm.accountNumber);
        setInstallmentPayForm(prev => ({ ...prev, installmentAmount: 0 }));
    }
    
    setLoading(false);
  };

  const handleCheckBalance = async () => {
    setLoading(true);
    setBalanceResult(null);
    setMessage({ text: '', type: '' });
    
    const { searchKey, searchType } = checkBalanceForm;
    
    let customerId: string | null = null;
    
    // Step 1: Find Customer ID if searching by Account Number
    if (searchType === 'accountNumber') {
        // FIX: Renamed cError to _cError to silence unused variable warning (Warning 3)
        const { data: customerData, error: _cError } = await supabase
            .from('customers')
            .select('id')
            .eq('account_number', searchKey)
            .limit(1)
            .single();
            
        // FIX: Updated usage of cError to _cError
        if (_cError || !customerData) {
            showMessage(URDU_LABELS.general.notFound, 'error');
            setLoading(false);
            return;
        }
        customerId = customerData.id;
    }
    
    // Step 2: Find Vehicle Data
    let query = supabase
        .from('vehicles')
        .select(`*, customer:customer_id(customer_name)`)
        .order('created_at', { ascending: false }) // Get the latest vehicle
        .limit(1);

    if (customerId) {
        query = query.eq('customer_id', customerId);
    } else {
        query = query.eq('registration_number', searchKey);
    }
    
    type VehicleDataResult = (VehicleSummary & { customer: { customer_name: string } }) | null;
    
    const { data: vehicleDataRaw, error: vError } = await query.single();
    const vehicleData = vehicleDataRaw as VehicleDataResult;

    if (vError || !vehicleData || !vehicleData.customer) {
        showMessage(URDU_LABELS.general.notFound, 'error');
        setLoading(false);
        return;
    }
    
    // Step 3: Fetch all installment history
    type AllInstallmentsResult = InstallmentHistory[] | null;
    
    // FIX: Renamed iError to _iError to silence unused variable warning (Warning 4)
    const { data: installmentHistoryRaw, error: _iError } = await supabase 
        .from('installments')
        .select(`id, payment_date, amount_paid, paid_count, remaining_balance`)
        .eq('vehicle_id', vehicleData.id)
        .order('payment_date', { ascending: true }); // Order by date for the history list
    
    const history = (installmentHistoryRaw as AllInstallmentsResult) || [];
    
    // Step 4: Determine current status (using the latest record for balance and count)
    const latestInst = history.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
    
    const planLength = vehicleData.installment_plan === '12 Months' ? 12 : 24;
    
    let paidCount = latestInst?.paid_count || 0;
    // FIX: Changed 'let' to 'const' to fix Error 1
    const remainingLoan = latestInst?.remaining_balance || vehicleData.remaining_loan; 
    // FIX: Changed 'let' to 'const' to fix Error 2
    const nextDueDate = vehicleData.next_due_date;
    
    // Recalculate paid count if advance payment was recorded as count 0
    if (history.length > 0) {
        // Count all records where paid_count > 0, which are the monthly installments.
        paidCount = history.filter(h => h.paid_count > 0).length;
    }
    
    const remainingCount = planLength - paidCount;
    
    const today = new Date();
    const nextDueDateObj = new Date(nextDueDate);
    
    today.setHours(0, 0, 0, 0);
    nextDueDateObj.setHours(0, 0, 0, 0);
    
    const daysOverdue = Math.floor((today.getTime() - nextDueDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const isOverdue = daysOverdue > 0 && remainingLoan > 0;
    
    setBalanceResult({
        name: vehicleData.customer.customer_name,
        vehicle: vehicleData.item_name,
        totalAdvance: vehicleData.advance_payment,
        remainingLoan: remainingLoan,
        installmentAmount: vehicleData.monthly_installment,
        nextDueDate: nextDueDate,
        paidCount: paidCount,
        remainingCount: remainingCount < 0 ? 0 : remainingCount,
        isOverdue: isOverdue && remainingCount > 0,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
        history: history,
    });

    setLoading(false);
  };
  
  // =========================================================================
  //                             CONTENT RENDERER
  // =========================================================================

  const renderContent = () => {
    switch (activeMenu) {
      case 'register':
        return <RenderRegisterUser 
                    formState={registerForm} 
                    setFormState={setRegisterForm} 
                    handleSubmit={handleRegisterSubmit} 
                    loading={loading} 
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
      default:
        return <RenderRegisterUser 
                    formState={registerForm} 
                    setFormState={setRegisterForm} 
                    handleSubmit={handleRegisterSubmit} 
                    loading={loading} 
                />;
    }
  };

  // --- CONDITIONAL RENDERING ---
  if (!isAuthenticated) {
      return (
          <LoginScreen handleLogin={handleLogin} message={message} />
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
                loggedInUsername={loggedInUsername} // Pass logged-in username
                handleLogout={handleLogout} // Pass logout function
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
                loggedInUsername={loggedInUsername} // Pass logged-in username
                handleLogout={handleLogout} // Pass logout function
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
