"use client";

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Menu, X, Search, DollarSign, UserPlus, FileText } from 'lucide-react';

// --- Supabase Client Initialization ---
// Step 1: Install the SDK: npm install @supabase/supabase-js
// Step 2: Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY 
//         are set in your project's .env.local file.

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Hum yahan process.env se values utha rahe hain.
// Agar yeh values set nahi hongi, to yeh fallback URL use karega (jo ke kaam nahi karegi).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'REPLACE_WITH_YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';

// Initialize the REAL Supabase Client (This replaces the entire mock block)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// --- End of Supabase Client Initialization ---


// --- TypeScript Interfaces ---
interface GuarantorDetails {
  name: string; father_name: string; phone: string; cnic: string; address: string;
}

interface VehicleSummary {
    id: string; item_name: string; monthly_installment: number; remaining_loan: number; installment_plan: string; next_due_date: string; created_at: string;
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

interface BalanceResultType {
    name: string;
    vehicle: string;
    installmentAmount: number;
    nextDueDate: string;
    paidCount: number;
    remainingCount: number;
    isOverdue: boolean;
    daysOverdue: number;
}

// Corrected type definition for the shared onChange handler
type FormChangeHandler = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

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

interface GuarantorFieldsProps {
  number: 1 | 2;
  formState: RegisterFormState; 
  handleChange: FormChangeHandler;
}

interface MenuButtonProps {
  icon: React.ComponentType<any>;
  label: string;
  menuKey: string;
}

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
// --- End of TypeScript Interfaces ---


// --- Urdu Labels for UI/UX --- 
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
  }
};

// =========================================================================
//                  HELPER COMPONENTS (UI elements)
// =========================================================================

const FormField: React.FC<FormFieldProps> = ({ label, name, type = 'text', value, onChange, placeholder, isRequired = true, isTextArea = false, isReadonly = false, children }) => (
  <div className="flex flex-col mb-6">
    <label className={`text-right block mb-2 font-bold ${isReadonly ? 'text-slate-500' : 'text-slate-800'} text-lg md:text-xl`}>
      {label}
      {isRequired && <span className="text-red-500 mr-1">*</span>}
    </label>
    {isTextArea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange as any} // Cast needed for flexibility with FormChangeHandler
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
        onChange={onChange as any} // Cast needed for flexibility with FormChangeHandler
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
//                             MAIN APP COMPONENT
// =========================================================================

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string>('register');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
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
    setMessage({ text: '', type: '' });

    type SupabaseCustomerResult = {
        id: string; customer_name: string; account_number: string;
        vehicles: VehicleSummary[] | null; // Note: Supabase returns an array for joins/relationships
    } | null;

    // Select customer details AND related vehicles. We assume a customer has at most one active vehicle for simplicity here.
    const { data, error } = await supabase
        .from('customers')
        .select(`id, customer_name, account_number, vehicles (id, item_name, monthly_installment, remaining_loan, installment_plan, next_due_date, created_at)`)
        .eq('account_number', accountNumber)
        .limit(1)
        .single();
    
    setLoading(false);

    if (error && (error as any).code !== 'PGRST116') { // PGRST116 is 'No rows found'
        console.error("Supabase Error:", error);
        showMessage(URDU_LABELS.general.error + " تلاش میں غلطی.", 'error');
    } else if (data) {
        const typedData = data as SupabaseCustomerResult;
        // Extract the single (most recent/active) vehicle if present
        const activeVehicle = typedData?.vehicles?.length ? typedData.vehicles[typedData.vehicles.length - 1] : null; 
        
        if (typedData && typedData.id && typedData.customer_name && typedData.account_number) {
          setFetchedCustomer({
            id: typedData.id,
            customer_name: typedData.customer_name,
            account_number: typedData.account_number,
            vehicles: activeVehicle
          });
        }
        
        if (activeVehicle && activeVehicle.id && activeMenu === 'installmentPay') {
            
            // Find latest installment payment record for this vehicle
            type InstallmentData = { payment_date: string; paid_count: number; remaining_balance: number }[];
            const { data: installmentData, error: instError } = await supabase
                .from('installments')
                .select('payment_date, paid_count, remaining_balance')
                .eq('vehicle_id', activeVehicle.id)
                .order('payment_date', { ascending: false })
                .limit(1);

            const lastPayment = (installmentData as InstallmentData)?.[0];

            // If no installment record is found, use initial vehicle data
            setInstallmentPayDetail({
                name: typedData?.customer_name || '',
                vehicle_id: activeVehicle.id,
                vehicle_name: activeVehicle.item_name,
                plan: activeVehicle.installment_plan,
                monthly_installment: activeVehicle.monthly_installment,
                // Use remaining_loan from last payment, otherwise use initial loan from vehicle record
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

      // Calculate next due date (1 month after the transaction date)
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
        advance_payment: advance,
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
      // Only record an installment if an advance was paid. If advance is 0, paid_count is 0.
      const paidCount = advance > 0 ? 1 : 0; 
      
      const installmentData = {
          vehicle_id: vehicleId,
          payment_date: date,
          amount_paid: advance,
          paid_count: paidCount, 
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
    
    // Increment paid count only if amount paid is greater than or equal to the monthly installment
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
    // If a full installment was paid, advance the next due date by one month
    const newDueDate = (amount >= monthly_installment) 
        ? new Date(nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 1)).toISOString().substring(0, 10)
        : next_due_date; // Keep the same date if full installment wasn't paid or if this is a partial payment

    
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
        // Re-run search to update the details displayed on the screen
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
    
    // Step 1: Find Vehicle (and related Customer name)
    // We search the 'vehicles' table using either registration_number or customer_id (accountNumber)
    let query = supabase
        .from('vehicles')
        .select(`*, customer:customer_id(customer_name)`)
        .limit(1);
        
    if (searchType === 'accountNumber') {
        // First, find the customer_id based on account_number
        const { data: customerData, error: cError } = await supabase
            .from('customers')
            .select('id')
            .eq('account_number', searchKey)
            .limit(1)
            .single();
            
        if (cError || !customerData) {
            showMessage(URDU_LABELS.general.notFound, 'error');
            setLoading(false);
            return;
        }
        
        query = query.eq('customer_id', customerData.id);
        
    } else {
        query = query.eq('registration_number', searchKey);
    }
    
    type VehicleDataResult = VehicleSummary & { customer: { customer_name: string } } | null;
    
    const { data: vehicleDataRaw, error: vError } = await query.single();
    
    const vehicleData = vehicleDataRaw as VehicleDataResult;

    if (vError || !vehicleData || !vehicleData.customer) {
        showMessage(URDU_LABELS.general.notFound, 'error');
        setLoading(false);
        return;
    }
    
    type LatestInstallmentResult = { paid_count: number; remaining_balance: number; payment_date: string } | null;

    // Step 2: Find latest installment record for accurate count and balance
    const { data: latestInstRaw, error: iError } = await supabase
        .from('installments')
        .select(`paid_count, remaining_balance, payment_date`)
        .eq('vehicle_id', vehicleData.id)
        .order('payment_date', { ascending: false })
        .limit(1)
        .single();
    
    const latestInst = latestInstRaw as LatestInstallmentResult;
        
    const planLength = vehicleData.installment_plan === '12 Months' ? 12 : 24;
    
    let paidCount = 0;
    let remainingLoan = vehicleData.remaining_loan;
    let nextDueDate = vehicleData.next_due_date;
    
    if (latestInst) {
        paidCount = latestInst.paid_count;
        remainingLoan = latestInst.remaining_balance;
    }
    
    // Calculate remaining count based on the plan length
    const remainingCount = planLength - paidCount;
    
    const today = new Date();
    const nextDueDateObj = new Date(nextDueDate);
    
    // Set time to midnight for accurate day calculation
    today.setHours(0, 0, 0, 0);
    nextDueDateObj.setHours(0, 0, 0, 0);
    
    const daysOverdue = Math.floor((today.getTime() - nextDueDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if remaining loan is greater than 0 AND the due date is in the past
    const isOverdue = daysOverdue > 0 && remainingLoan > 0;
    
    setBalanceResult({
        name: vehicleData.customer.customer_name,
        vehicle: vehicleData.item_name,
        installmentAmount: vehicleData.monthly_installment,
        nextDueDate: nextDueDate,
        paidCount: paidCount,
        remainingCount: remainingCount < 0 ? 0 : remainingCount,
        isOverdue: isOverdue && remainingCount > 0, // Only overdue if installments are still remaining
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
    });

    setLoading(false);
  };

  // =========================================================================
  //                             FORM RENDERERS 
  // =========================================================================

  const RenderRegisterUser: React.FC = () => {
    const handleChange: FormChangeHandler = (e) => {
      setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    };

    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          صارف رجسٹر کریں
        </h2>
        <form onSubmit={handleRegisterSubmit}>
          {/* Main Customer Details */}
          <h3 className="text-3xl font-extrabold text-slate-700 mb-6">خریدار کی تفصیلات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField label={URDU_LABELS.fields.accountNumber} name="accountNumber" value={registerForm.accountNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.customerName} name="customerName" value={registerForm.customerName} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.fatherName} name="fatherName" value={registerForm.fatherName} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.phone} name="phone" type="tel" value={registerForm.phone} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.cnic} name="cnic" value={registerForm.cnic} onChange={handleChange} />
            <div className="md:col-span-2">
                <FormField label={URDU_LABELS.fields.address} name="address" isTextArea value={registerForm.address} onChange={handleChange} />
            </div>
          </div>

          {/* Guarantor 1 */}
          <GuarantorFields number={1} formState={registerForm} handleChange={handleChange} />

          {/* Guarantor 2 */}
          <GuarantorFields number={2} formState={registerForm} handleChange={handleChange} />

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

  const RenderPayment: React.FC = () => {
    const handleChange: FormChangeHandler = (e) => {
      let value: string | number = e.target.value;
      if (e.target.name === 'totalAmount' || e.target.name === 'advance') {
        value = parseFloat(value) || 0;
      }
      setPaymentForm({ ...paymentForm, [e.target.name]: value as any });
    };

    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          Payment فارم
        </h2>
        <form onSubmit={handlePaymentSubmit}>
          {/* Account Search and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="md:col-span-2">
              <FormField
                label={URDU_LABELS.fields.accountNumber}
                name="accountNumber"
                value={paymentForm.accountNumber}
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
            <FormField label={URDU_LABELS.fields.date} name="date" type="date" value={paymentForm.date} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.totalAmount} name="totalAmount" type="number" value={paymentForm.totalAmount} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.advance} name="advance" type="number" value={paymentForm.advance} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.monthlyInstallment} name="monthlyInstallment" type="text" value={paymentForm.monthlyInstallment.toLocaleString('en-US')} isReadonly isRequired={false} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.remainingAuto} name="remainingAuto" type="text" value={paymentForm.remainingAuto.toLocaleString('en-US')} isReadonly isRequired={false} onChange={handleChange} />
            
            <div className="flex flex-col mb-6">
                <label className="text-right block mb-2 font-bold text-slate-800 text-lg md:text-xl">
                    {URDU_LABELS.fields.installmentPlan}
                    <span className="text-red-500 mr-1">*</span>
                </label>
                <select
                    name="installmentPlan"
                    value={paymentForm.installmentPlan}
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
            <FormField label={URDU_LABELS.fields.itemName} name="itemName" value={paymentForm.itemName} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.model} name="model" value={paymentForm.model} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.registrationNumber} name="registrationNumber" value={paymentForm.registrationNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.engineNumber} name="engineNumber" value={paymentForm.engineNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.chassisNumber} name="chassisNumber" value={paymentForm.chassisNumber} onChange={handleChange} />
            <FormField label={URDU_LABELS.fields.color} name="color" value={paymentForm.color} onChange={handleChange} />
            <div className="md:col-span-2">
              <FormField label={URDU_LABELS.fields.insuranceDocs} name="insuranceDocs" isTextArea value={paymentForm.insuranceDocs} onChange={handleChange} isRequired={false} />
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
  
  const RenderInstallmentPay: React.FC = () => {
    const handleChange: FormChangeHandler = (e) => {
      let value: string | number = e.target.value;
      if (e.target.name === 'installmentAmount') {
        value = parseFloat(value) || 0;
      }
      setInstallmentPayForm({ ...installmentPayForm, [e.target.name]: value as any });
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
                value={installmentPayForm.accountNumber}
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

        {installmentPayDetail && (
          <div className="border-4 border-green-400 p-6 rounded-2xl bg-green-50 shadow-lg">
            <h3 className="text-3xl font-extrabold text-green-800 mb-6 border-b pb-2">خریدار اور قسط کی تفصیلات</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xl">
              <p className='font-bold text-green-900'>نام: <span className='font-normal mr-2'>{installmentPayDetail.name}</span></p>
              <p className='font-bold text-green-900'>گاڑی: <span className='font-normal mr-2'>{installmentPayDetail.vehicle_name}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.fields.currentPlan}: <span className='font-normal mr-2'>{installmentPayDetail.plan}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.fields.monthlyInstallment} (مقررہ): <span className='font-normal mr-2'>{installmentPayDetail.monthly_installment.toLocaleString('en-US')}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.general.paid}: <span className='font-normal mr-2'>{installmentPayDetail.paid_count}</span></p>
              <p className='font-bold text-green-900'>{URDU_LABELS.general.remaining}: <span className='font-normal mr-2'>{installmentPayDetail.remaining_loan.toLocaleString('en-US')}</span></p>
            </div>
            
            <form onSubmit={handleInstallmentPaySubmit} className="mt-8 pt-4 border-t-2 border-green-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <FormField
                  label={URDU_LABELS.fields.installmentAmount}
                  name="installmentAmount"
                  type="number"
                  value={installmentPayForm.installmentAmount}
                  onChange={handleChange}
                  placeholder="قسط کی رقم درج کریں"
                />
                <FormField
                  label={URDU_LABELS.fields.paymentDate}
                  name="paymentDate"
                  type="date"
                  value={installmentPayForm.paymentDate}
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

  const RenderCheckBalance: React.FC = () => {
    const handleChange: FormChangeHandler = (e) => {
      // Handle the case where the target is a select element for searchType
      if (e.target.name === 'searchType') {
          setCheckBalanceForm({ ...checkBalanceForm, [e.target.name]: e.target.value as 'accountNumber' | 'registrationNumber' });
      } else {
          // Handle the case where the target is an input element for searchKey
          setCheckBalanceForm({ ...checkBalanceForm, [e.target.name]: e.target.value });
      }
    };

    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto" dir="rtl">
        <h2 className="text-5xl font-extrabold text-center text-amber-700 mb-8 pb-4 border-b-4 border-amber-200">
          Check Balance
        </h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleCheckBalance(); }}>
          <div className="flex flex-col mb-4">
              <label className="text-right block mb-2 font-bold text-slate-800 text-xl">
                  تلاش کا طریقہ
              </label>
              <select
                  name="searchType"
                  value={checkBalanceForm.searchType}
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
                label={checkBalanceForm.searchType === 'accountNumber' ? URDU_LABELS.fields.accountNumber : URDU_LABELS.fields.registrationNumber}
                name="searchKey"
                value={checkBalanceForm.searchKey}
                onChange={handleChange}
                placeholder={checkBalanceForm.searchType === 'accountNumber' ? "اکاؤنٹ نمبر درج کریں" : "رجسٹریشن نمبر درج کریں"}
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

        {balanceResult && (
          <div className={`p-6 rounded-2xl shadow-xl border-4 ${balanceResult.isOverdue ? 'bg-red-100 border-red-500' : 'bg-green-50 border-green-400'}`}>
            <h3 className={`text-3xl font-extrabold mb-6 pb-2 border-b ${balanceResult.isOverdue ? 'text-red-800 border-red-300' : 'text-green-800 border-green-300'}`}>
              بیلنس رپورٹ: **{balanceResult.name}**
            </h3>

            {balanceResult.isOverdue && (
              <div className="mb-6 p-4 bg-red-600 text-white font-extrabold text-xl text-center rounded-xl shadow-lg animate-pulse">
                {URDU_LABELS.general.overdueWarning}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xl">
              <p className='font-bold'>{URDU_LABELS.fields.monthlyInstallment} (مقررہ): <span className='font-normal mr-2 text-slate-700'>{balanceResult.installmentAmount.toLocaleString('en-US')}</span></p>
              <p className='font-bold'>{URDU_LABELS.general.dueDate}: <span className='font-normal mr-2 text-slate-700'>{balanceResult.nextDueDate}</span></p>
              <p className='font-bold text-2xl text-green-700'>{URDU_LABELS.general.paid}: <span className='font-extrabold mr-2'>{balanceResult.paidCount}</span></p>
              <p className='font-bold text-2xl text-red-700'>{URDU_LABELS.general.remaining}: <span className='font-extrabold mr-2'>{balanceResult.remainingCount}</span></p>
              <p className='font-bold'>{URDU_LABELS.fields.itemName}: <span className='font-normal mr-2 text-slate-700'>{balanceResult.vehicle}</span></p>
              {balanceResult.isOverdue && <p className='font-bold text-red-700'>تاخیر: <span className='font-extrabold mr-2'>{balanceResult.daysOverdue} دن</span></p>}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // =========================================================================
  //                             MAIN LAYOUT
  // =========================================================================
  
  const Sidebar: React.FC = () => (
    <div className={`fixed top-0 right-0 h-full bg-slate-800 text-white w-64 p-6 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:static lg:h-auto lg:w-full lg:p-4 lg:shadow-xl`} dir="rtl">
      <div className="lg:hidden text-left mb-6">
        <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:text-red-400">
          <X size={28} />
        </button>
      </div>
      <nav className="space-y-4 pt-10 lg:pt-0">
        <MenuButton icon={UserPlus} label={URDU_LABELS.menu.register} menuKey="register" />
        <MenuButton icon={DollarSign} label={URDU_LABELS.menu.payment} menuKey="payment" />
        <MenuButton icon={FileText} label={URDU_LABELS.menu.installmentPay} menuKey="installmentPay" />
        <MenuButton icon={Search} label={URDU_LABELS.menu.checkBalance} menuKey="checkBalance" />
      </nav>
      {/* User ID display (placeholder for auth) */}
       <div className="mt-8 text-xs text-slate-400 border-t border-slate-700 pt-4">
        <p className='mb-1'>User ID (Placeholder):</p>
        <p className="break-all font-mono">
          user-sarhadi-admin-01
        </p>
      </div>
    </div>
  );

  const MenuButton: React.FC<MenuButtonProps> = ({ icon: Icon, label, menuKey }) => (
    <button
      onClick={() => { 
        setActiveMenu(menuKey); 
        setIsSidebarOpen(false); 
        setMessage({ text: '', type: '' });
        setFetchedCustomer(null);
        setBalanceResult(null);
        setInstallmentPayDetail(null);
      }}
      className={`flex items-center space-x-4 space-x-reverse w-full text-right p-3 rounded-xl transition duration-200 text-xl font-bold ${activeMenu === menuKey ? 'bg-amber-500 text-slate-900 shadow-lg' : 'hover:bg-slate-700 text-white'}`}
    >
      <Icon size={24} className="ml-2" />
      <span>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'register':
        return <RenderRegisterUser />;
      case 'payment':
        return <RenderPayment />;
      case 'installmentPay':
        return <RenderInstallmentPay />;
      case 'checkBalance':
        return <RenderCheckBalance />;
      default:
        return <RenderRegisterUser />;
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-inter">
      {/* Global Message Box */}
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
            <Sidebar />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        <div className={`fixed inset-y-0 right-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
          <Sidebar />
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