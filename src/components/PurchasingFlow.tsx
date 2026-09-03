import { useState } from 'react';
import { 
  ShoppingCart, Search, Package, Plus, CheckCircle2, 
  XCircle, Truck, FileText, ClipboardList, Clock, Info, ShieldCheck,
  AlertTriangle, Bell, BellRing, Mail, Send, Sparkles, Check, Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface POItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Ordered' | 'Received';
  items: POItem[];
  notes?: string;
}

interface LowStockAlertItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  recommendedReorderQty: number;
  unit: string;
  vendor: string;
  estUnitPrice: number;
  urgency: 'CRITICAL' | 'WARNING';
}

const INITIAL_LOW_STOCK_ITEMS: LowStockAlertItem[] = [
  {
    id: 'ls-1',
    sku: 'PNT-THN-PU',
    name: 'Thinner PU Extra Slow (Nippon)',
    currentStock: 2,
    minThreshold: 10,
    recommendedReorderQty: 25,
    unit: 'Liter',
    vendor: 'CV Warna Agung (Nippon)',
    estUnitPrice: 85000,
    urgency: 'CRITICAL'
  },
  {
    id: 'ls-2',
    sku: 'PNT-CLR-HS',
    name: 'Clear Coat HS Polyurethane',
    currentStock: 4,
    minThreshold: 12,
    recommendedReorderQty: 20,
    unit: 'Kaleng',
    vendor: 'CV Warna Agung (Nippon)',
    estUnitPrice: 250000,
    urgency: 'CRITICAL'
  },
  {
    id: 'ls-3',
    sku: 'FLT-TYT-001',
    name: 'Oil Filter Avanza / Veloz Dual VVT-i',
    currentStock: 6,
    minThreshold: 15,
    recommendedReorderQty: 40,
    unit: 'Pcs',
    vendor: 'Toyota Astra Parts',
    estUnitPrice: 35000,
    urgency: 'WARNING'
  },
  {
    id: 'ls-4',
    sku: 'PAD-BRK-CRV',
    name: 'Brake Pad Depan Honda CR-V Turbo',
    currentStock: 1,
    minThreshold: 4,
    recommendedReorderQty: 8,
    unit: 'Set',
    vendor: 'PT Honda Prospect Parts',
    estUnitPrice: 650000,
    urgency: 'CRITICAL'
  }
];

const MOCK_POS: PurchaseOrder[] = [
  {
    id: 'po1',
    poNumber: 'PO-2310-088',
    vendorName: 'PT Honda Prospect Parts',
    orderDate: '12 Oct 2023',
    status: 'Pending Approval',
    notes: 'Urgent untuk unit B 1234 ABC',
    items: [
      { id: 'i1', sku: 'BPR-CRV-22', name: 'Bumper Depan Honda CR-V 2022', qty: 1, unitPrice: 2000000 },
      { id: 'i2', sku: 'HDLP-CRV-22', name: 'Headlamp Kanan CR-V 2022', qty: 1, unitPrice: 3500000 }
    ]
  },
  {
    id: 'po2',
    poNumber: 'PO-2310-087',
    vendorName: 'CV Warna Agung (Nippon)',
    orderDate: '11 Oct 2023',
    status: 'Ordered',
    items: [
      { id: 'i3', sku: 'PNT-CLR-HS', name: 'Clear Coat HS Nippon Paint', qty: 10, unitPrice: 250000 },
      { id: 'i4', sku: 'PNT-THN-PU', name: 'Thinner PU Extra Slow', qty: 20, unitPrice: 85000 }
    ]
  },
  {
    id: 'po3',
    poNumber: 'PO-2310-085',
    vendorName: 'Toyota Astra Parts',
    orderDate: '10 Oct 2023',
    status: 'Received',
    items: [
      { id: 'i5', sku: 'OIL-TMO-10W40', name: 'TMO 10W-40 Synthetic 4L', qty: 24, unitPrice: 320000 },
      { id: 'i6', sku: 'FLT-TYT-001', name: 'Oil Filter Avanza/Xenia', qty: 50, unitPrice: 35000 }
    ]
  }
];

export function PurchasingFlow() {
  const [pos, setPos] = useState<PurchaseOrder[]>(MOCK_POS);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(MOCK_POS[0]);
  const [search, setSearch] = useState('');
  const [lowStockItems, setLowStockItems] = useState<LowStockAlertItem[]>(INITIAL_LOW_STOCK_ITEMS);
  const [showLowStockModal, setShowLowStockModal] = useState<boolean>(false);
  const [emailAlertEnabled, setEmailAlertEnabled] = useState<boolean>(true);
  const [pushAlertEnabled, setPushAlertEnabled] = useState<boolean>(true);
  const [managerEmail, setManagerEmail] = useState<string>('manager.bengkel@autocare.id');
  const [isDispatchingNotification, setIsDispatchingNotification] = useState<boolean>(false);

  const filteredPOs = pos.filter(po => 
    po.poNumber.toLowerCase().includes(search.toLowerCase()) || 
    po.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (newStatus: PurchaseOrder['status']) => {
    if (!selectedPO) return;

    const updatedPO = { ...selectedPO, status: newStatus };
    setPos(prev => prev.map(p => p.id === selectedPO.id ? updatedPO : p));
    setSelectedPO(updatedPO);
    toast.success(`Status PO diperbarui menjadi ${newStatus}`);
  };

  const handleTriggerManualAlert = () => {
    setIsDispatchingNotification(true);
    setTimeout(() => {
      setIsDispatchingNotification(false);
      toast.success("Notifikasi Stok Kritis Berhasil Dikirim", {
        description: `Alert dikirim ke ${managerEmail} & ${pushAlertEnabled ? 'Web Push Workshop Manager' : 'Sistem'}.`
      });
    }, 800);
  };

  const handleAutoCreatePOFromAlert = (item: LowStockAlertItem) => {
    const newPoId = `po-${Date.now()}`;
    const generatedPoNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    
    const newPO: PurchaseOrder = {
      id: newPoId,
      poNumber: generatedPoNumber,
      vendorName: item.vendor,
      orderDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Pending Approval',
      notes: `[AUTO-GENERATED RESTOCK ALERT] Stok sisa ${item.currentStock} ${item.unit} (Batas minimum: ${item.minThreshold}).`,
      items: [
        {
          id: `item-${Date.now()}`,
          sku: item.sku,
          name: item.name,
          qty: item.recommendedReorderQty,
          unitPrice: item.estUnitPrice
        }
      ]
    };

    setPos([newPO, ...pos]);
    setSelectedPO(newPO);
    setShowLowStockModal(false);
    toast.success(`Draft PO ${generatedPoNumber} Berhasil Dibuat!`, {
      description: `Menunggu persetujuan Workshop Manager untuk ${item.name}.`
    });
  };

  const getSubtotal = (items: POItem[]) => items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-slate-500/20 text-slate-400 font-bold border border-slate-500/30 uppercase tracking-widest">Draft</span>;
      case 'Pending Approval':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 uppercase tracking-widest">Wait Approval</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 uppercase tracking-widest">Approved</span>;
      case 'Ordered':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 uppercase tracking-widest">Ordered</span>;
      case 'Received':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 uppercase tracking-widest">Received</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Purchasing & PO Management
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">Inventory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola Purchase Order, persetujuan pengadaan, dan otomatisasi peringatan stok menipis</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Low Stock Alert Bell Button */}
          <button 
            onClick={() => setShowLowStockModal(true)}
            className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-lg transition-all flex items-center gap-2 relative shadow-lg shadow-rose-500/5"
          >
            <BellRing className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>{lowStockItems.length} Stok Kritis</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1"></span>
          </button>

          <button 
            onClick={() => {
              const newPoId = `po-${Date.now()}`;
              const generatedPoNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
              const manualPO: PurchaseOrder = {
                id: newPoId,
                poNumber: generatedPoNumber,
                vendorName: 'Supplier Umum / Mitra Workshop',
                orderDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: 'Draft',
                items: [
                  { id: `i-${Date.now()}`, sku: 'GEN-PART-01', name: 'Fast Moving Part Baru', qty: 5, unitPrice: 150000 }
                ]
              };
              setPos([manualPO, ...pos]);
              setSelectedPO(manualPO);
              toast.success(`Draft PO ${generatedPoNumber} Dibuat`);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Buat PO Baru
          </button>
        </div>
      </div>

      {/* Automated Low-Stock Reorder Threshold Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="mb-4 bg-rose-950/30 border border-rose-800/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-200">
                Peringatan Ambang Batas Stok (Reorder Point Threshold): <span className="text-white font-semibold">{lowStockItems.length} Material Kritis</span>
              </p>
              <p className="text-[11px] text-rose-300/80">
                Material cat & fast-moving parts mendekati batas minimum. Segera buat PO sebelum menghambat proses oven & mekanik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTriggerManualAlert}
              disabled={isDispatchingNotification}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              {isDispatchingNotification ? 'Mengirim...' : 'Kirim Alert Manager'}
            </button>
            <button
              onClick={() => setShowLowStockModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors shadow-sm"
            >
              Review Stok Kritis
            </button>
          </div>
        </div>
      )}

      {/* Main Two Pane Layout */}
      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* LEFT PANE: PO List */}
        <div className="w-96 flex flex-col bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Daftar Purchase Order</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{filteredPOs.length} Dokumen</span>
            </div>
            <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-indigo-500 transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari PO, Vendor..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-300 placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {filteredPOs.map(po => {
              const isSelected = selectedPO?.id === po.id;
              const subtotal = getSubtotal(po.items);

              return (
                <div 
                  key={po.id}
                  onClick={() => setSelectedPO(po)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                      : 'bg-[#0F172A] border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-mono font-bold text-indigo-400 tracking-tight uppercase">
                      {po.poNumber}
                    </span>
                    {getStatusBadge(po.status)}
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-slate-200 font-bold truncate">{po.vendorName}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {po.orderDate}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
                    <span className="text-[10px] text-slate-500 font-medium">{po.items.length} Items</span>
                    <span className="text-sm font-bold text-white font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
            
            {filteredPOs.length === 0 && (
              <div className="text-center p-6 text-slate-500 text-sm">
                Tidak ada PO yang ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: PO Details */}
        <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          {selectedPO ? (
            <>
              {/* Header Info */}
              <div className="p-6 border-b border-slate-800 bg-[#0F172A]/80 flex justify-between items-start shrink-0">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    selectedPO.status === 'Received' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : selectedPO.status === 'Ordered' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : selectedPO.status === 'Approved' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  }`}>
                    {selectedPO.status === 'Received' ? <CheckCircle2 className="w-6 h-6" /> 
                    : selectedPO.status === 'Ordered' ? <Truck className="w-6 h-6" /> 
                    : <ShoppingCart className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-mono font-bold text-white uppercase">{selectedPO.poNumber}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-slate-300">
                        {selectedPO.vendorName}
                      </span>
                      <span className="text-sm font-medium text-slate-400 flex items-center gap-1 border-l border-slate-700 pl-3">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedPO.orderDate}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                   {getStatusBadge(selectedPO.status)}
                   <button 
                    onClick={() => toast.info(`Mencetak Dokumen ${selectedPO.poNumber}`, { description: "Format PO siap di-download / print." })}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors border border-slate-700 rounded px-2 py-1 bg-slate-800 font-semibold"
                   >
                     <FileText className="w-3 h-3" /> Cetak PO
                   </button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">
                
                {selectedPO.notes && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p><span className="font-bold text-slate-200">Catatan Internal / Trigger:</span> {selectedPO.notes}</p>
                  </div>
                )}

                {/* Items Table */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-500" />
                    Item Pesanan
                  </h3>
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-[#0F172A]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-700">
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase w-32">SKU</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Nama Part / Barang</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase text-center w-24">Qty</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase text-right w-32">Harga Satuan</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase text-right w-32">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedPO.items.map(item => (
                          <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono text-slate-400">{item.sku}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-slate-200">{item.name}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-white font-mono font-bold bg-slate-800/30">{item.qty}</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-300 font-mono">Rp {(item.unitPrice).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-indigo-400 font-mono">Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-800/50 border-t border-slate-700">
                        <tr>
                          <td colSpan={3}></td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">Total Estimasi:</td>
                          <td className="px-4 py-3 text-right font-bold text-white font-mono text-lg">Rp {getSubtotal(selectedPO.items).toLocaleString('id-ID')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-5 border-t border-slate-800 bg-[#0F172A]/90 shrink-0">
                <div className="flex justify-between items-center max-w-full">
                  
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Sistem Otomatis Terhubung dengan Gudang & Stock Ledger
                  </div>

                  <div className="flex gap-3">
                    {selectedPO.status === 'Draft' && (
                      <button 
                        onClick={() => handleStatusChange('Pending Approval')}
                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Ajukan Approval ke Manager
                      </button>
                    )}

                    {selectedPO.status === 'Pending Approval' && (
                      <button 
                        onClick={() => handleStatusChange('Approved')}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Approve PO (Manager)
                      </button>
                    )}

                    {selectedPO.status === 'Approved' && (
                      <button 
                        onClick={() => handleStatusChange('Ordered')}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Tandai Sedang Dikirim Vendor
                      </button>
                    )}

                    {selectedPO.status === 'Ordered' && (
                      <button 
                        onClick={() => handleStatusChange('Received')}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Terima & Masukkan ke Stok Gudang
                      </button>
                    )}

                    {selectedPO.status === 'Received' && (
                      <div className="px-4 py-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Barang Telah Masuk Gudang & Stock Ledger Updated
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
              <ShoppingCart className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm font-medium">Pilih Purchase Order (PO) untuk melihat detail dan melakukan persetujuan.</p>
            </div>
          )}
        </div>

      </div>

      {/* LOW STOCK REORDER THRESHOLD & NOTIFICATION MODAL */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pusat Peringatan Stok Kritis & Auto-Reorder</h3>
                  <p className="text-xs text-slate-400">Barang yang menyentuh batas minimum pemesanan ulang (Reorder Threshold)</p>
                </div>
              </div>

              <button 
                onClick={() => setShowLowStockModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Notification Channel Configuration */}
            <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailAlertEnabled} 
                    onChange={(e) => setEmailAlertEnabled(e.target.checked)} 
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Email Notifikasi: <span className="font-mono text-indigo-300">{managerEmail}</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={pushAlertEnabled} 
                    onChange={(e) => setPushAlertEnabled(e.target.checked)} 
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  Web Push Alert
                </label>
              </div>

              <button
                onClick={handleTriggerManualAlert}
                disabled={isDispatchingNotification}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                {isDispatchingNotification ? 'Mengirim...' : 'Kirim Alert Sekarang'}
              </button>
            </div>

            {/* List of Low Stock Items */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              {lowStockItems.map(item => (
                <div 
                  key={item.id}
                  className="p-4 bg-[#0F172A] border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-400 font-bold">{item.sku}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        item.urgency === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.urgency === 'CRITICAL' ? 'Sangat Kritis' : 'Mendekati Limit'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">Vendor: <span className="text-slate-300">{item.vendor}</span></p>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Stok Saat Ini / Min</p>
                      <p className="text-sm font-bold font-mono text-rose-400">
                        {item.currentStock} <span className="text-xs text-slate-400">/ {item.minThreshold} {item.unit}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleAutoCreatePOFromAlert(item)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      1-Click Buat PO (+{item.recommendedReorderQty} {item.unit})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#0F172A] flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Ambang batas dapat disesuaikan pada Master Data Gudang.
              </span>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
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
