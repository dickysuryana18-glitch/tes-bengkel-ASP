import { useState, type FormEvent } from 'react';
import { 
  Search, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, 
  Filter, Settings, FileText, Package, MapPin, Printer, QrCode,
  Tag, Layers, ShieldCheck, Check, Sparkles, X, SlidersHorizontal
} from 'lucide-react';
import { ExtendedPart } from '../../types/inventory';
import { toast } from 'sonner';

interface InventoryCatalogProps {
  parts: ExtendedPart[];
  onStockMovement: (type: 'IN' | 'OUT', part: ExtendedPart, qty: number, spkOrPo: string, notes: string) => void;
  onAddNewPart: (newPart: ExtendedPart) => void;
  onOpenBarcodeModal: (part?: ExtendedPart, mode?: 'SCAN' | 'INTAKE' | 'ALLOCATION' | 'RELOCATE' | 'PRINT_LABEL') => void;
}

export function InventoryCatalog({
  parts,
  onStockMovement,
  onAddNewPart,
  onOpenBarcodeModal
}: InventoryCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeModal, setActiveModal] = useState<'in' | 'out' | null>(null);
  const [selectedPart, setSelectedPart] = useState<ExtendedPart | null>(null);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);

  // Form states for In/Out
  const [qty, setQty] = useState('');
  const [refId, setRefId] = useState('');
  const [notes, setNotes] = useState('');

  // Add Part Form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ExtendedPart['category']>('Body Part');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newStock, setNewStock] = useState('5');
  const [newMinStock, setNewMinStock] = useState('2');
  const [newUnit, setNewUnit] = useState('Pcs');
  const [newUnitCost, setNewUnitCost] = useState('500000');
  const [newUnitPrice, setNewUnitPrice] = useState('750000');
  const [newBinLocation, setNewBinLocation] = useState('RAK-A1-01');
  const [newSupplier, setNewSupplier] = useState('Toyota Astra Parts');
  const [newBrandCompat, setNewBrandCompat] = useState('Toyota');

  const [supplierFilter, setSupplierFilter] = useState('ALL');

  const categories = ['ALL', 'Body Part', 'Paint & Chemical', 'Consumable', 'Electrical', 'Underbody & Engine', 'Glass & Trim'];
  const uniqueSuppliers = ['ALL', ...Array.from(new Set(parts.map(p => p.supplierName))).filter(Boolean).sort()];

  const filteredParts = parts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.binLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSupplier = supplierFilter === 'ALL' || p.supplierName === supplierFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'LOW_STOCK') {
      matchesStatus = p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0;
    } else if (statusFilter === 'OUT_OF_STOCK') {
      matchesStatus = p.stockQuantity === 0;
    } else if (statusFilter === 'SAFE') {
      matchesStatus = p.stockQuantity > p.minStockLevel;
    }

    return matchesSearch && matchesCat && matchesSupplier && matchesStatus;
  });

  const handleStockAction = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    const amount = parseInt(qty);
    if (isNaN(amount) || amount <= 0) return;

    if (activeModal === 'out') {
      if (!refId.trim()) {
        toast.error("Nomor SPK / Work Order WAJIB diisi untuk pengeluaran barang (Zero Leakage Rule)!");
        return;
      }
      if (amount > selectedPart.stockQuantity) {
        toast.error("Stok tidak mencukupi untuk pengeluaran ini!");
        return;
      }
    }

    onStockMovement(activeModal === 'in' ? 'IN' : 'OUT', selectedPart, amount, refId, notes);
    closeModal();
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedPart(null);
    setQty('');
    setRefId('');
    setNotes('');
  };

  const openModal = (type: 'in' | 'out', part: ExtendedPart) => {
    setActiveModal(type);
    setSelectedPart(part);
    if (type === 'out') {
      setRefId('SPK-2026-0875'); // Suggested default
    } else {
      setRefId('PO-2026-0812');
    }
  };

  const handleCreateNewPart = (e: FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) {
      toast.error('SKU dan Nama Part wajib diisi!');
      return;
    }

    const newPart: ExtendedPart = {
      id: Date.now(),
      sku: newSku.toUpperCase().trim(),
      barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`,
      name: newName.trim(),
      category: newCategory,
      subCategory: newSubCategory || undefined,
      compatibleBrands: [newBrandCompat],
      stockQuantity: parseInt(newStock) || 0,
      reservedQuantity: 0,
      minStockLevel: parseInt(newMinStock) || 1,
      maxStockLevel: (parseInt(newMinStock) || 1) * 4,
      unit: newUnit,
      unitCost: parseInt(newUnitCost) || 0,
      unitPrice: parseInt(newUnitPrice) || 0,
      binLocation: newBinLocation.toUpperCase().trim(),
      supplierName: newSupplier,
      supplierLeadDays: 2,
      lastStockOpnameDate: new Date().toISOString().split('T')[0],
      lastMovementDate: new Date().toISOString().split('T')[0],
      status: parseInt(newStock) <= parseInt(newMinStock) ? 'LOW_STOCK' : 'SAFE',
      abcClass: parseInt(newUnitCost) > 1000000 ? 'A' : parseInt(newUnitCost) > 200000 ? 'B' : 'C'
    };

    onAddNewPart(newPart);
    setIsAddPartModalOpen(false);
    toast.success(`Part ${newPart.sku} berhasil ditambahkan ke katalog gudang!`);
  };

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full">
      
      {/* Top Filter and Search Bar */}
      <div className="bg-[#1E293B] border border-slate-800 p-4 rounded-xl flex flex-col gap-4 shrink-0 shadow-xl w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari SKU, Nama Part, Supplier, Rak, Barcode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => onOpenBarcodeModal(undefined, 'SCAN')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              Scan Barcode
            </button>

            <button 
              onClick={() => setIsAddPartModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah SKU Baru
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {uniqueSuppliers.map(supplier => (
                <option key={supplier} value={supplier}>
                  {supplier === 'ALL' ? 'Semua Supplier' : supplier}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Parts Table */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col shadow-xl min-w-0 w-full">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead className="sticky top-0 bg-[#0F172A]/90 backdrop-blur-sm z-10">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  SKU & Info Part
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-center">
                  Lokasi Rak
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-center">
                  Kategori / Brand
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-center">
                  Stok Fisik (Min)
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">
                  HPP Satuan
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">
                  Harga Jual SPK
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 text-right">
                  Aksi & Label
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredParts.map(part => {
                const isLowStock = part.stockQuantity <= part.minStockLevel && part.stockQuantity > 0;
                const isOutOfStock = part.stockQuantity === 0;

                return (
                  <tr key={part.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">{part.sku}</span>
                        <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[9px] font-mono border border-slate-700">
                          {part.abcClass}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5">{part.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Barcode: {part.barcode}</p>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-indigo-300">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {part.binLocation}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-medium border border-slate-700 block mb-1">
                        {part.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {part.compatibleBrands.join(', ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`text-sm font-bold font-mono ${
                          isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-slate-200'
                        }`}>
                          {part.stockQuantity} {part.unit}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">({part.minStockLevel})</span>
                        {isOutOfStock && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        {isLowStock && !isOutOfStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right text-xs font-medium text-slate-400 font-mono">
                      Rp {part.unitCost.toLocaleString('id-ID')}
                    </td>

                    <td className="px-4 py-3.5 text-right text-xs font-bold text-emerald-400 font-mono">
                      Rp {part.unitPrice.toLocaleString('id-ID')}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenBarcodeModal(part, 'SCAN')}
                          title="Scan & Inspeksi Barcode Part"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500 hover:text-indigo-400"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenBarcodeModal(part, 'PRINT_LABEL')}
                          title="Cetak Label Zebra"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => openModal('in', part)}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-1 transition-colors border border-emerald-500/20 text-xs font-bold"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          IN
                        </button>
                        <button 
                          type="button"
                          onClick={() => openModal('out', part)}
                          disabled={isOutOfStock}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg flex items-center gap-1 transition-colors border border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          OUT
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs">
                    Tidak ada parts yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK IN / OUT MODAL WITH STRICT SPK VALIDATION */}
      {activeModal && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-4 border-b flex justify-between items-center ${
              activeModal === 'in' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeModal === 'in' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  {activeModal === 'in' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {activeModal === 'in' ? 'Stock In (Penerimaan PO / Supplier)' : 'Stock Out (Pengeluaran Unit SPK)'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Mutasi Fisik Gudang</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAction} className="p-5 space-y-4">
              <div className="p-3 bg-[#1E293B] border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-indigo-400">{selectedPart.sku}</span>
                  <span className="text-[11px] font-mono text-slate-400">Rak: {selectedPart.binLocation}</span>
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-1">{selectedPart.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Stok saat ini: <strong className="text-white font-mono">{selectedPart.stockQuantity} {selectedPart.unit}</strong>
                </p>
              </div>

              {activeModal === 'out' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    Nomor SPK / Work Order
                    <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    placeholder="Contoh: SPK-2026-0850"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors font-mono"
                  />
                  <p className="text-[10px] text-red-400/90 font-medium">
                    Aturan Zero Leakage: Stock Out WAJIB terikat dengan Work Order / SPK aktif.
                  </p>
                </div>
              )}

              {activeModal === 'in' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Nomor PO / Faktur Pembelian (Opsional)
                  </label>
                  <input 
                    type="text" 
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    placeholder="Contoh: PO-2026-0812"
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Jumlah ({selectedPart.unit}) {activeModal === 'in' ? 'Masuk' : 'Keluar'}
                </label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max={activeModal === 'out' ? selectedPart.stockQuantity : undefined}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Catatan / Keterangan
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors shadow-lg ${
                    activeModal === 'in' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                  }`}
                >
                  Konfirmasi {activeModal === 'in' ? 'IN' : 'OUT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW PART MODAL */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Tambah SKU & Part Baru Gudang</h3>
                  <p className="text-xs text-slate-400">Master Data Inventory Bengkel Pro</p>
                </div>
              </div>
              <button onClick={() => setIsAddPartModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPart} className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Kode SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BPR-RR-XPANDER"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Lokasi Rak / Bin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RAK-A2-04"
                    value={newBinLocation}
                    onChange={(e) => setNewBinLocation(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nama Part / Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bumper Belakang Mitsubishi Xpander Cross"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Kategori Material
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Body Part">Body Part</option>
                    <option value="Paint & Chemical">Paint & Chemical</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Underbody & Engine">Underbody & Engine</option>
                    <option value="Glass & Trim">Glass & Trim</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Brand Kompatibilitas
                  </label>
                  <input
                    type="text"
                    placeholder="Toyota, Honda, Universal..."
                    value={newBrandCompat}
                    onChange={(e) => setNewBrandCompat(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white text-center font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Min. Stok Buffer
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white text-center font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Satuan Unit
                  </label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Pcs, Set, Liter, Gram..."
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    HPP Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Harga Jual SPK (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Supplier Utama
                </label>
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Simpan Part Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
