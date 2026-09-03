import { useState, useEffect, type FormEvent } from 'react';
import { 
  Search, Receipt, CreditCard, Banknote, Printer, 
  CheckCircle2, XCircle, AlertCircle, FileText, Download,
  Car, User, Calendar, Camera, Sparkles, Plus, Eye,
  Tag, Building2, Trash2, ArrowUpRight, Filter, ShieldCheck,
  Check, ArrowRight, Layers, Paperclip, ExternalLink, RefreshCw, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ReceiptDocumentScannerModal, 
  type ScannedExpenseData, 
  type ScannedExpenseItem 
} from './ReceiptDocumentScannerModal';
import { 
  getStoredWorkOrders, 
  saveWorkOrdersToStorage, 
  WorkOrderItem,
  addAuditLogEntry 
} from '../data/spkDatabase';

interface InvoiceItem {
  id: string;
  type: 'jasa' | 'part';
  description: string;
  qty: number;
  unitPrice: number;
  partCode?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  woNumber: string;
  plate: string;
  customerName: string;
  customerType: string;
  dateReady: string;
  items: InvoiceItem[];
  status: 'Unpaid' | 'Paid';
  paymentMethod?: string;
  paymentDate?: string;
  attachedReceipts?: string[]; // IDs of attached scanned expense receipts
}

const INITIAL_EXPENSES: ScannedExpenseData[] = [
  {
    id: 'EXP-88912',
    vendorName: 'PT Sumber Rezeki Motor Partsindo',
    invoiceNumber: 'INV-SP-90182',
    transactionDate: '2026-08-25',
    category: 'Sparepart & Komponen',
    paymentMethod: 'Transfer Bank BCA',
    subtotal: 2450000,
    tax: 269500,
    grandTotal: 2719500,
    linkedSpkNumber: 'SPK-2026-0881',
    linkedPlateNumber: 'B 1982 SSY',
    confidenceScore: 98,
    scannedAt: '25 Agu 2026, 14:10',
    scannedBy: 'Ahmad Mekanik (Body)',
    status: 'Verified',
    notes: 'Bumper Depan Original OEM terpasang.',
    items: [
      { id: 'it-1', itemName: 'Bumper Depan OEM', qty: 1, unit: 'Pcs', unitPrice: 2450000, subtotal: 2450000, partCode: '71101-TLA-A00' }
    ]
  },
  {
    id: 'EXP-88905',
    vendorName: 'Toko Cat & Thinner Auto Color Express',
    invoiceNumber: 'STRUK-CAT-4491',
    transactionDate: '2026-08-24',
    category: 'Bahan Cat & Thinner',
    paymentMethod: 'Tunai / Cash',
    subtotal: 750000,
    tax: 0,
    grandTotal: 750000,
    linkedSpkNumber: 'SPK-2026-0881',
    linkedPlateNumber: 'B 1982 SSY',
    confidenceScore: 97,
    scannedAt: '24 Agu 2026, 11:35',
    scannedBy: 'Budi Painter (Cat)',
    status: 'Verified',
    notes: 'Clear Coat Sikkens Autoclear Plus HS & Thinner PU untuk panel bumper depan.',
    items: [
      { id: 'it-2', itemName: 'Clear Coat Sikkens Autoclear Plus HS (1L)', qty: 1, unit: 'Kaleng', unitPrice: 450000, subtotal: 450000, partCode: 'SKN-CLR-HS' },
      { id: 'it-3', itemName: 'Thinner PU Slow Refinish (3L)', qty: 1, unit: 'Kaleng', unitPrice: 300000, subtotal: 300000, partCode: 'THN-PU-SLW' }
    ]
  },
  {
    id: 'EXP-88890',
    vendorName: 'Bengkel Bubut & Press Presisi Jaya',
    invoiceNumber: 'KWT-PRS-881',
    transactionDate: '2026-08-23',
    category: 'Sublet / Pihak Ketiga',
    paymentMethod: 'Tunai / Cash',
    subtotal: 600000,
    tax: 0,
    grandTotal: 600000,
    linkedSpkNumber: 'SPK-2026-0850',
    linkedPlateNumber: 'D 1209 XYZ',
    confidenceScore: 95,
    scannedAt: '23 Agu 2026, 16:45',
    scannedBy: 'Dedi Foreman',
    status: 'Verified',
    notes: 'Press tulang pintu dan engsel pintu belakang kanan.',
    items: [
      { id: 'it-4', itemName: 'Press Sasis & Engsel Pintu Belakang Kanan', qty: 1, unit: 'Paket', unitPrice: 600000, subtotal: 600000, partCode: 'SUB-PRS-PNTU' }
    ]
  }
];

function buildInvoicesFromWorkOrders(workOrders: WorkOrderItem[]): Invoice[] {
  return workOrders.map((order, idx) => {
    const isPaid = order.status === 'INVOICED' || order.status === 'SELESAI';
    const invNum = `INV-${order.spkNumber.replace('SPK-', '')}`;
    
    return {
      id: `inv-${order.id}`,
      invoiceNumber: invNum,
      woNumber: order.spkNumber,
      plate: order.vehicle.plate,
      customerName: order.customer.name,
      customerType: order.customer.type,
      dateReady: order.targetDeliveryDate || 'Hari ini',
      status: isPaid ? 'Paid' : 'Unpaid',
      paymentMethod: isPaid ? 'Transfer Bank BCA' : undefined,
      paymentDate: isPaid ? (order.updatedAt || 'Hari ini, 10:00') : undefined,
      attachedReceipts: idx === 0 ? ['EXP-88912', 'EXP-88905'] : idx === 1 ? ['EXP-88890'] : [],
      items: order.lineItems && order.lineItems.length > 0 ? order.lineItems.map(li => ({
        id: li.id,
        type: li.type,
        description: li.description,
        qty: li.qty,
        unitPrice: li.unitPrice,
        partCode: li.partCode
      })) : [
        { id: 'default-1', type: 'jasa', description: 'Jasa Perbaikan Body & Cat Oven', qty: 1, unitPrice: order.subtotal || 1500000 }
      ]
    };
  });
}

export function InvoicePaymentFlow() {
  const [activeMainTab, setActiveMainTab] = useState<'invoices' | 'expenses'>('invoices');
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(() => getStoredWorkOrders());
  const [invoices, setInvoices] = useState<Invoice[]>(() => buildInvoicesFromWorkOrders(getStoredWorkOrders()));
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(() => {
    const initial = buildInvoicesFromWorkOrders(getStoredWorkOrders());
    return initial[0] || null;
  });
  const [expenses, setExpenses] = useState<ScannedExpenseData[]>(INITIAL_EXPENSES);
  const [selectedExpense, setSelectedExpense] = useState<ScannedExpenseData | null>(null);
  const [search, setSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  // Document Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetSpk, setScannerTargetSpk] = useState<string | undefined>(undefined);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  // Sync with cross-module updates
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WorkOrderItem[]>;
      const orders = (customEvent.detail && Array.isArray(customEvent.detail))
        ? customEvent.detail 
        : getStoredWorkOrders();
      setWorkOrders(orders);
      const newInvoices = buildInvoicesFromWorkOrders(orders);
      setInvoices(newInvoices);
      if (selectedInvoice) {
        const found = newInvoices.find(inv => inv.id === selectedInvoice.id || inv.woNumber === selectedInvoice.woNumber);
        if (found) setSelectedInvoice(found);
      }
    };

    window.addEventListener('autocare_workorders_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('autocare_workorders_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [selectedInvoice]);

  // Active SPK list for scanner allocation
  const activeSpkList = workOrders.map(order => ({
    spkNumber: order.spkNumber,
    plateNumber: order.vehicle.plate,
    customerName: `${order.vehicle.brand} ${order.vehicle.model} (${order.customer.name})`
  })).concat([
    { spkNumber: 'OVERHEAD', plateNumber: 'BENGKEL-OPS', customerName: 'Biaya Umum Workshop (Non-SPK)' }
  ]);

  const filteredInvoices = invoices.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.customerName.toLowerCase().includes(search.toLowerCase()) ||
    v.woNumber.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      exp.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (exp.linkedSpkNumber && exp.linkedSpkNumber.toLowerCase().includes(search.toLowerCase())) ||
      (exp.linkedPlateNumber && exp.linkedPlateNumber.toLowerCase().includes(search.toLowerCase()));
    
    if (expenseCategoryFilter === 'ALL') return matchesSearch;
    return matchesSearch && exp.category === expenseCategoryFilter;
  });

  // Handle New Scanned Expense Saved from Scanner Modal
  const handleSaveScannedExpense = (newExpense: ScannedExpenseData) => {
    setExpenses(prev => [newExpense, ...prev]);

    // If the scanned expense was linked to an active invoice/WO, link it
    if (newExpense.linkedSpkNumber) {
      setInvoices(prev => prev.map(inv => {
        if (inv.woNumber === newExpense.linkedSpkNumber) {
          const currentReceipts = inv.attachedReceipts || [];
          return {
            ...inv,
            attachedReceipts: [...currentReceipts, newExpense.id]
          };
        }
        return inv;
      }));

      // If currently viewing that invoice, update local state
      if (selectedInvoice && selectedInvoice.woNumber === newExpense.linkedSpkNumber) {
        setSelectedInvoice(prev => prev ? {
          ...prev,
          attachedReceipts: [...(prev.attachedReceipts || []), newExpense.id]
        } : null);
      }
    }
  };

  // Add Item from Scanned Receipt directly to Invoice Items
  const handleAppendReceiptToInvoice = (expense: ScannedExpenseData) => {
    if (!selectedInvoice) return;
    
    const newItems: InvoiceItem[] = expense.items.map((it, idx) => ({
      id: `scanned-${Date.now()}-${idx}`,
      type: 'part',
      description: `${it.itemName} (${expense.vendorName})`,
      qty: it.qty,
      unitPrice: it.unitPrice,
      partCode: it.partCode
    }));

    const updatedInvoice = {
      ...selectedInvoice,
      items: [...selectedInvoice.items, ...newItems]
    };

    setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? updatedInvoice : inv));
    setSelectedInvoice(updatedInvoice);
    toast.success(`${newItems.length} item dari struk ${expense.invoiceNumber} berhasil ditambahkan ke tagihan pelanggan!`);
  };

  const handlePayment = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    if (selectedInvoice.status === 'Paid') {
      toast.error("Invoice ini sudah lunas!");
      return;
    }

    const subtotal = selectedInvoice.items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const grandTotal = subtotal + (subtotal * 0.11);
    const paid = parseFloat(amountPaid.replace(/[^0-9.-]+/g,""));
    
    if (paid < grandTotal) {
      toast.warning("Pembayaran kurang dari total tagihan (Partial Payment belum didukung di demo ini).");
      return;
    }

    if (!paymentMethod) {
      toast.warning("Silakan pilih metode pembayaran.");
      return;
    }

    // Update invoice status locally
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const updatedInvoice = {
      ...selectedInvoice,
      status: 'Paid' as const,
      paymentMethod,
      paymentDate: nowStr
    };

    setInvoices(prev => prev.map(inv => 
      inv.id === selectedInvoice.id ? updatedInvoice : inv
    ));
    setSelectedInvoice(updatedInvoice);

    // Sync with persistent Work Order database
    const currentOrders = getStoredWorkOrders();
    const targetIdx = currentOrders.findIndex(o => o.spkNumber === selectedInvoice.woNumber || `inv-${o.id}` === selectedInvoice.id);
    if (targetIdx >= 0) {
      const order = currentOrders[targetIdx];
      currentOrders[targetIdx] = {
        ...order,
        status: 'SELESAI',
        kanbanStage: 'ready',
        detailedStage: 'Siap Ambil',
        progressPercent: 100,
        history: [
          ...(order.history || []),
          {
            stage: `Pembayaran Lunas (${paymentMethod})`,
            date: nowStr,
            status: 'completed',
            note: `Invoice ${selectedInvoice.invoiceNumber} senilai Rp ${grandTotal.toLocaleString('id-ID')} lunas. ${notes ? `Catatan: ${notes}` : ''}`,
            actor: 'Finance Officer'
          }
        ],
        updatedAt: nowStr
      };
      saveWorkOrdersToStorage(currentOrders);

      addAuditLogEntry({
        user: 'Finance Officer',
        role: 'Finance',
        action: 'APPROVE',
        module: 'Finance & Invoicing',
        targetId: selectedInvoice.invoiceNumber,
        details: `Pelunasan Invoice ${selectedInvoice.invoiceNumber} (SPK: ${order.spkNumber}) via ${paymentMethod} sebesar Rp ${grandTotal.toLocaleString('id-ID')}`
      });
    }
    
    toast.success(`Pembayaran untuk Invoice ${selectedInvoice.invoiceNumber} BERHASIL diproses!`);
    
    // Reset Form
    setPaymentMethod('');
    setAmountPaid('');
    setNotes('');
  };

  // Helper to calculate totals
  const getSubtotal = (items: InvoiceItem[]) => items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const getPPN = (subtotal: number) => subtotal * 0.11;
  const getGrandTotal = (subtotal: number, ppn: number) => subtotal + ppn;

  // Attached receipts for current invoice
  const currentInvoiceReceipts = expenses.filter(exp => 
    selectedInvoice && (
      (selectedInvoice.attachedReceipts && selectedInvoice.attachedReceipts.includes(exp.id)) ||
      exp.linkedSpkNumber === selectedInvoice.woNumber
    )
  );

  const totalAttachedCOGS = currentInvoiceReceipts.reduce((acc, r) => acc + r.grandTotal, 0);

  // Total expenses statistics
  const totalScannedExpenseSum = expenses.reduce((acc, e) => acc + e.grandTotal, 0);
  const totalSpkAllocatedSum = expenses.filter(e => e.linkedSpkNumber && e.linkedSpkNumber !== 'OVERHEAD').reduce((acc, e) => acc + e.grandTotal, 0);

  return (
    <div id="invoice-payment-flow-module" className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Header with Module Title & Global Scanner Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Invoice, Kasir & Scanner Nota
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">
              Finance & Gudang
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Penerbitan tagihan pelanggan, pembayaran kasir, dan scan OCR nota pengeluaran mekanik/vendor
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setScannerTargetSpk(selectedInvoice ? selectedInvoice.woNumber : undefined);
              setIsScannerOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Scan Struk / Nota (OCR)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 shrink-0">
        <button
          onClick={() => setActiveMainTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeMainTab === 'invoices'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-[#1E293B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tagihan Pelanggan ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeMainTab === 'expenses'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-[#1E293B] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Struk Biaya & Vendor OCR ({expenses.length})</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
            Rp {(totalScannedExpenseSum / 1000000).toFixed(1)}Jt
          </span>
        </button>
      </div>

      {/* VIEW 1: CUSTOMER INVOICES & BILLING */}
      {activeMainTab === 'invoices' && (
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
          
          {/* LEFT PANE: Invoice List */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0 max-h-60 md:max-h-none">
            <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Daftar Tagihan SPK</h3>
              <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-indigo-500 transition-colors">
                <Search className="w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Cari Nopol, Nama, Invoice..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-300 placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {filteredInvoices.map(invoice => {
                const isSelected = selectedInvoice?.id === invoice.id;
                const subtotal = getSubtotal(invoice.items);
                const total = getGrandTotal(subtotal, getPPN(subtotal));
                const receiptCount = (invoice.attachedReceipts || []).length;

                return (
                  <div 
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                        : 'bg-[#0F172A] border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-mono font-bold text-indigo-400 tracking-tight uppercase">
                        {invoice.invoiceNumber}
                      </span>
                      {invoice.status === 'Unpaid' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 uppercase">Belum Lunas</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 uppercase">Lunas</span>
                      )}
                    </div>
                    
                    <div className="space-y-1 mb-2.5">
                      <p className="text-xs text-slate-200 font-bold uppercase">{invoice.plate}</p>
                      <p className="text-xs text-slate-400 truncate">{invoice.customerName}</p>
                    </div>

                    {receiptCount > 0 && (
                      <div className="mb-2.5 flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit font-medium">
                        <Paperclip className="w-3 h-3" />
                        <span>{receiptCount} Struk OCR Terlampir</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-slate-800 flex justify-between items-end">
                      <span className="text-[10px] text-slate-500 font-medium">Total Tagihan</span>
                      <span className="text-sm font-bold text-white font-mono">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )
              })}
              
              {filteredInvoices.length === 0 && (
                <div className="text-center p-6 text-slate-500 text-sm">
                  Tidak ada tagihan yang ditemukan.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Invoice Detail & Payment & Attached Receipts */}
          <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
            {selectedInvoice ? (
              <>
                {/* Header Info */}
                <div className="p-5 border-b border-slate-800 bg-[#0F172A]/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex gap-3.5 items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      selectedInvoice.status === 'Paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-mono font-bold text-white uppercase">{selectedInvoice.invoiceNumber}</h2>
                      <div className="flex items-center gap-2.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-indigo-300 border border-slate-700 uppercase tracking-widest font-mono font-bold">
                          {selectedInvoice.woNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {selectedInvoice.dateReady}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setScannerTargetSpk(selectedInvoice.woNumber);
                        setIsScannerOpen(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-lg transition-colors border border-indigo-500/30 flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Scan Struk SPK Ini</span>
                    </button>
                    <button 
                      onClick={() => toast.success(`Mencetak invoice ${selectedInvoice.invoiceNumber}...`)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar flex flex-col lg:flex-row gap-6">
                  
                  {/* Left Column: Invoice Breakdown & Attached Vendor Receipts */}
                  <div className="flex-1 space-y-6">
                    
                    {/* Customer Info Box */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-[#0F172A] border border-slate-700/50 rounded-xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <User className="w-3 h-3" /> Kepada Pelanggan
                        </p>
                        <p className="text-sm font-bold text-slate-200">{selectedInvoice.customerName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedInvoice.customerType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Car className="w-3 h-3" /> Nomor Polisi Unit
                        </p>
                        <p className="text-sm font-bold text-slate-200 uppercase font-mono">{selectedInvoice.plate}</p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Rincian Tagihan Pelanggan
                      </h3>
                      <div className="border border-slate-700 rounded-xl overflow-hidden bg-[#0F172A]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Deskripsi</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-center">Qty</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-right">Harga</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {selectedInvoice.items.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-slate-300 font-medium">{item.description}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] uppercase tracking-widest font-bold ${item.type === 'jasa' ? 'text-cyan-400' : 'text-indigo-400'}`}>
                                      {item.type}
                                    </span>
                                    {item.partCode && (
                                      <span className="text-[9px] font-mono text-slate-500">
                                        Code: {item.partCode}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-slate-300 font-mono">{item.qty}</td>
                                <td className="px-4 py-3 text-sm text-right text-slate-300 font-mono">{(item.unitPrice).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-slate-200 font-mono">{(item.qty * item.unitPrice).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Attached Vendor Receipts Section (COGS / Direct Expense Audit) */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            Struk Vendor & Nota Pembelian Terkait SPK Ini ({currentInvoiceReceipts.length})
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Total Biaya Vendor: Rp {totalAttachedCOGS.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {currentInvoiceReceipts.length === 0 ? (
                        <div className="p-4 bg-[#0F172A] border border-dashed border-slate-700 rounded-xl text-center">
                          <p className="text-xs text-slate-400">Belum ada struk vendor atau nota pembelian yang dipindai untuk SPK ini.</p>
                          <button
                            onClick={() => {
                              setScannerTargetSpk(selectedInvoice.woNumber);
                              setIsScannerOpen(true);
                            }}
                            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 underline"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Scan Nota Pembelian Cat/Part Sekarang</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {currentInvoiceReceipts.map(receipt => (
                            <div 
                              key={receipt.id}
                              className="p-3.5 bg-[#0F172A] border border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                  <Receipt className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-white font-mono">{receipt.invoiceNumber}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                                      {receipt.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {receipt.transactionDate}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 font-medium mt-0.5">{receipt.vendorName}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{receipt.notes}</p>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                                <span className="text-sm font-bold text-emerald-400 font-mono">
                                  Rp {receipt.grandTotal.toLocaleString('id-ID')}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedExpense(receipt)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Lihat Detail</span>
                                  </button>
                                  <button
                                    onClick={() => handleAppendReceiptToInvoice(receipt)}
                                    className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[10px] font-bold rounded border border-indigo-500/30 flex items-center gap-1"
                                    title="Tambahkan ke Tagihan Pelanggan"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Tambahkan ke Tagihan</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Payment Summary Panel */}
                  <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl overflow-hidden shadow-xl sticky top-0">
                      
                      {/* Calculation Summary */}
                      <div className="p-5 border-b border-slate-700 bg-slate-800/20 font-mono">
                        {(() => {
                          const sub = getSubtotal(selectedInvoice.items);
                          const tax = getPPN(sub);
                          const gt = getGrandTotal(sub, tax);

                          return (
                            <>
                              <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-slate-400 font-sans">Subtotal</span>
                                <span className="text-slate-200">Rp {sub.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mb-4">
                                <span className="text-slate-400 font-sans">PPN (11%)</span>
                                <span className="text-slate-200">Rp {tax.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between items-end border-t border-slate-700 pt-3 border-dashed">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Grand Total</span>
                                <span className={`text-xl font-bold ${selectedInvoice.status === 'Paid' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                  Rp {gt.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Action Form */}
                      <div className="p-5">
                        {selectedInvoice.status === 'Paid' ? (
                          <div className="space-y-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">LUNAS</h4>
                              <p className="text-xs text-slate-400 mt-1 font-mono">
                                {selectedInvoice.paymentDate}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Metode Pembayaran</p>
                              <p className="text-sm font-medium text-slate-200">{selectedInvoice.paymentMethod}</p>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Metode Pembayaran
                              </label>
                              <select 
                                required
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors appearance-none"
                              >
                                <option value="">Pilih Metode...</option>
                                <option value="Tunai / Cash">Tunai / Cash</option>
                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                <option value="EDC / Kartu Kredit">EDC / Kartu Kredit</option>
                                <option value="Klaim Asuransi">Klaim Asuransi (Direct)</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Nominal Diterima
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-slate-500 text-sm font-mono">Rp</span>
                                <input 
                                  type="text" 
                                  required
                                  value={amountPaid}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    if(val) {
                                      setAmountPaid(parseInt(val, 10).toLocaleString('id-ID'));
                                    } else {
                                      setAmountPaid('');
                                    }
                                  }}
                                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors font-mono"
                                  placeholder="0"
                                />
                              </div>
                              <div className="flex justify-end mt-1">
                                 <button 
                                   type="button"
                                   onClick={() => {
                                     const sub = getSubtotal(selectedInvoice.items);
                                     const gt = getGrandTotal(sub, getPPN(sub));
                                     setAmountPaid(gt.toLocaleString('id-ID'));
                                   }}
                                   className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest underline decoration-indigo-400/30"
                                 >
                                   Isi Sesuai Tagihan
                                 </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Catatan (Opsional)
                              </label>
                              <input 
                                type="text" 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="Referensi transfer / kas..."
                              />
                            </div>

                            <button 
                              type="submit"
                              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                              <Banknote className="w-4 h-4" />
                              <span>Proses Pembayaran</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
                <Receipt className="w-16 h-16 text-slate-700 mb-4" />
                <p className="text-sm font-medium">Pilih tagihan dari daftar untuk melihat detail dan melakukan pembayaran.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: SCANNED EXPENSE RECEIPTS & VENDOR OCR AUDIT */}
      {activeMainTab === 'expenses' && (
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          
          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Struk Terpindai</span>
                <p className="text-xl font-bold text-white font-mono mt-1">{expenses.length} Nota</p>
                <span className="text-[10px] text-emerald-400">100% Terverifikasi OCR</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pengeluaran Bengkel</span>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">Rp {totalScannedExpenseSum.toLocaleString('id-ID')}</p>
                <span className="text-[10px] text-slate-400">Dari Toko Cat, Part & Sublet</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Beban SPK Terkunci (COGS)</span>
                <p className="text-xl font-bold text-indigo-300 font-mono mt-1">Rp {totalSpkAllocatedSum.toLocaleString('id-ID')}</p>
                <span className="text-[10px] text-indigo-400">Zero Stock Leakage Active</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rata-rata Akurasi AI OCR</span>
                <p className="text-xl font-bold text-cyan-400 font-mono mt-1">97.3%</p>
                <span className="text-[10px] text-cyan-300">Gemini Vision Multi-Model</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-indigo-500 w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari Vendor, No Struk, SPK, Nopol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none w-full ml-2"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
              {['ALL', 'Bahan Cat & Thinner', 'Sparepart & Komponen', 'Sublet / Pihak Ketiga', 'BBM & Operasional Unit'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setExpenseCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    expenseCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scanned Receipts Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No. Struk & Tanggal</th>
                  <th className="px-4 py-3">Vendor / Toko</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Alokasi SPK / Nopol</th>
                  <th className="px-4 py-3">Rincian Item</th>
                  <th className="px-4 py-3 text-right">Total Nominal</th>
                  <th className="px-4 py-3 text-center">Status & OCR</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-indigo-300">{expense.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{expense.transactionDate}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{expense.vendorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {expense.id}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {expense.category}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white">{expense.linkedSpkNumber || 'OVERHEAD'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{expense.linkedPlateNumber || '-'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">
                        {expense.items.length} Item ({expense.items.map(i => i.itemName).slice(0, 1).join(', ')}{expense.items.length > 1 ? '...' : ''})
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{expense.notes}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      Rp {expense.grandTotal.toLocaleString('id-ID')}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{expense.confidenceScore}% OCR</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedExpense(expense)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Lihat Detail & Preview Struk"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setExpenses(prev => prev.filter(e => e.id !== expense.id));
                            toast.info(`Struk ${expense.invoiceNumber} dihapus.`);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                          title="Hapus Struk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      Tidak ada data struk pengeluaran yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODAL: DOCUMENT SCANNER & OCR WORKFLOW */}
      <ReceiptDocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaveExpense={handleSaveScannedExpense}
        activeSpkList={activeSpkList}
        defaultSpkNumber={scannerTargetSpk}
      />

      {/* DETAIL MODAL: PREVIEW SINGLE SCANNED EXPENSE */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedExpense.invoiceNumber}</h3>
                  <p className="text-xs text-slate-400">{selectedExpense.vendorName} • {selectedExpense.transactionDate}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#0F172A] p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Kategori</span>
                <p className="text-slate-200 font-semibold mt-0.5">{selectedExpense.category}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Alokasi SPK</span>
                <p className="text-indigo-400 font-mono font-bold mt-0.5">
                  {selectedExpense.linkedSpkNumber} ({selectedExpense.linkedPlateNumber})
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Metode Bayar</span>
                <p className="text-slate-200 mt-0.5">{selectedExpense.paymentMethod}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Petugas Pemindai</span>
                <p className="text-slate-200 mt-0.5">{selectedExpense.scannedBy}</p>
              </div>
            </div>

            {/* Item Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Item Struk Terekstrak</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0F172A]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131D33] text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-2 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Harga</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedExpense.items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2">
                          <div>{it.itemName}</div>
                          {it.partCode && <div className="text-[9px] text-indigo-400 font-mono">{it.partCode}</div>}
                        </td>
                        <td className="px-2 py-2 text-center font-mono">{it.qty} {it.unit}</td>
                        <td className="px-3 py-2 text-right font-mono">Rp {it.unitPrice.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-white">Rp {it.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-[#0F172A] border border-slate-800 rounded-xl font-mono text-sm">
              <span className="text-slate-400 font-sans text-xs">Total Pengeluaran:</span>
              <span className="font-bold text-emerald-400 text-base">
                Rp {selectedExpense.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedExpense(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
