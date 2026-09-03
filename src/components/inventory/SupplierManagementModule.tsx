import { useState, useMemo, FormEvent } from 'react';
import { 
  Building2, Phone, Mail, MapPin, Clock, Star, AlertTriangle, 
  CheckCircle2, Plus, Search, Filter, ArrowUpRight, ShoppingCart, 
  ExternalLink, Edit, Trash2, Link as LinkIcon, Unlink, Package, 
  DollarSign, ShieldCheck, ChevronRight, X, Send, Copy, Printer,
  Sparkles, Check, FileText, RefreshCw, BarChart3, Truck
} from 'lucide-react';
import { ExtendedPart, Supplier, SupplierReorderDraft } from '../../types/inventory';
import { toast } from 'sonner';

interface SupplierManagementModuleProps {
  suppliers: Supplier[];
  parts: ExtendedPart[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onLinkPartToSupplier: (supplierId: string, partSku: string) => void;
  onUnlinkPartFromSupplier: (supplierId: string, partSku: string) => void;
  onTriggerReorder?: (reorderDraft: SupplierReorderDraft) => void;
}

export function SupplierManagementModule({
  suppliers,
  parts,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onLinkPartToSupplier,
  onUnlinkPartFromSupplier,
  onTriggerReorder
}: SupplierManagementModuleProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modals & Drawers
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<Supplier | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [activeReorderSupplier, setActiveReorderSupplier] = useState<Supplier | null>(null);
  const [reorderItems, setReorderItems] = useState<{
    partId: number;
    sku: string;
    name: string;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderQty: number;
    unit: string;
    unitCost: number;
    selected: boolean;
  }[]>([]);
  const [reorderNotes, setReorderNotes] = useState('');

  // Part Linking State within detail modal
  const [selectedPartToLink, setSelectedPartToLink] = useState<string>('');

  // Helper mapping: Supplier -> Linked Parts
  const supplierPartsMap = useMemo(() => {
    const map = new Map<string, ExtendedPart[]>();
    suppliers.forEach(sup => {
      // Find parts whose SKU is in linkedPartSkus OR whose supplierName matches
      const linked = parts.filter(p => 
        sup.linkedPartSkus.includes(p.sku) || 
        p.supplierName.toLowerCase() === sup.name.toLowerCase()
      );
      map.set(sup.id, linked);
    });
    return map;
  }, [suppliers, parts]);

  // Check how many linked parts need reordering per supplier
  const supplierLowStockMap = useMemo(() => {
    const map = new Map<string, ExtendedPart[]>();
    suppliers.forEach(sup => {
      const linked = supplierPartsMap.get(sup.id) || [];
      const low = linked.filter(p => p.stockQuantity <= p.minStockLevel);
      map.set(sup.id, low);
    });
    return map;
  }, [suppliers, supplierPartsMap]);

  // Overall Metrics
  const totalSuppliersCount = suppliers.length;
  const preferredSuppliersCount = suppliers.filter(s => s.status === 'PREFERRED').length;
  const avgLeadTime = (suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / (suppliers.length || 1)).toFixed(1);
  const suppliersWithLowStockCount = suppliers.filter(s => (supplierLowStockMap.get(s.id)?.length || 0) > 0).length;
  const avgOnTimeRate = (suppliers.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / (suppliers.length || 1)).toFixed(1);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(sup => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        sup.name.toLowerCase().includes(q) ||
        sup.code.toLowerCase().includes(q) ||
        sup.contactPerson.toLowerCase().includes(q) ||
        sup.city.toLowerCase().includes(q) ||
        sup.phone.includes(q) ||
        sup.linkedPartSkus.some(sku => sku.toLowerCase().includes(q));

      // Category
      const matchCategory = selectedCategory === 'ALL' || sup.category === selectedCategory;

      // Status
      const matchStatus = selectedStatus === 'ALL' || sup.status === selectedStatus;

      // Low Stock
      const lowParts = supplierLowStockMap.get(sup.id) || [];
      const matchLowStock = !filterLowStockOnly || lowParts.length > 0;

      return matchSearch && matchCategory && matchStatus && matchLowStock;
    });
  }, [suppliers, searchQuery, selectedCategory, selectedStatus, filterLowStockOnly, supplierLowStockMap]);

  // Open Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setIsAddEditModalOpen(true);
  };

  // Open Reorder Modal for a specific supplier
  const handleOpenReorderModal = (sup: Supplier) => {
    const linked = supplierPartsMap.get(sup.id) || [];
    // If no linked parts found, use all parts that match supplierName
    const items = linked.map(p => {
      const suggestedQty = Math.max(1, p.maxStockLevel - p.stockQuantity);
      const isCritical = p.stockQuantity <= p.minStockLevel;
      return {
        partId: p.id,
        sku: p.sku,
        name: p.name,
        currentStock: p.stockQuantity,
        minStockLevel: p.minStockLevel,
        maxStockLevel: p.maxStockLevel,
        reorderQty: suggestedQty,
        unit: p.unit,
        unitCost: p.unitCost,
        selected: isCritical || linked.length <= 3 // auto select if critical or small catalog
      };
    });

    setActiveReorderSupplier(sup);
    setReorderItems(items);
    setReorderNotes(`Reorder stok pengisian buffer gudang AutoCare ERP - Lead Time ${sup.leadTimeDays} Hari.`);
    setIsReorderModalOpen(true);
  };

  // Calculate reorder total
  const reorderTotalCost = useMemo(() => {
    return reorderItems
      .filter(it => it.selected)
      .reduce((sum, it) => sum + (it.reorderQty * it.unitCost), 0);
  }, [reorderItems]);

  const selectedReorderCount = reorderItems.filter(it => it.selected).length;

  // Submit Reorder to Purchasing Flow / Toast
  const handleSubmitReorderDraft = () => {
    if (!activeReorderSupplier) return;
    const selected = reorderItems.filter(it => it.selected && it.reorderQty > 0);
    if (selected.length === 0) {
      toast.error('Pilih minimal 1 item untuk dibuatkan reorder!');
      return;
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + activeReorderSupplier.leadTimeDays);

    const draft: SupplierReorderDraft = {
      supplierId: activeReorderSupplier.id,
      supplierName: activeReorderSupplier.name,
      items: selected.map(it => ({
        partId: it.partId,
        sku: it.sku,
        name: it.name,
        currentStock: it.currentStock,
        minStockLevel: it.minStockLevel,
        maxStockLevel: it.maxStockLevel,
        reorderQty: it.reorderQty,
        unit: it.unit,
        unitCost: it.unitCost,
        totalCost: it.reorderQty * it.unitCost
      })),
      totalEstimatedCost: reorderTotalCost,
      expectedDeliveryDate: deliveryDate.toISOString().split('T')[0],
      notes: reorderNotes
    };

    if (onTriggerReorder) {
      onTriggerReorder(draft);
    }

    toast.success(`Draft PO untuk ${activeReorderSupplier.name} (${selected.length} item) berhasil dikirim ke antrean Purchasing!`, {
      description: `Estimasi tiba: ${draft.expectedDeliveryDate} (${activeReorderSupplier.leadTimeDays} hari kerja).`
    });

    setIsReorderModalOpen(false);
  };

  // Copy WhatsApp PO Message
  const handleCopyWhatsAppPO = () => {
    if (!activeReorderSupplier) return;
    const selected = reorderItems.filter(it => it.selected && it.reorderQty > 0);
    
    let text = `*PURCHASE REORDER - BENGKEL PRO / AUTOCARE ERP*\n`;
    text += `Kepada: *${activeReorderSupplier.name}* (U.p. ${activeReorderSupplier.contactPerson})\n`;
    text += `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
    text += `Termin: ${activeReorderSupplier.paymentTerms}\n`;
    text += `Estimasi Lead Time: ${activeReorderSupplier.leadTimeDays} Hari Kerja\n\n`;
    text += `*Daftar Kebutuhan Part:*\n`;
    
    selected.forEach((item, idx) => {
      text += `${idx + 1}. [${item.sku}] ${item.name}\n   - Qty: *${item.reorderQty} ${item.unit}*\n   - Est. Harga: Rp ${item.unitCost.toLocaleString('id-ID')} / ${item.unit}\n   - Subtotal: Rp ${(item.reorderQty * item.unitCost).toLocaleString('id-ID')}\n`;
    });

    text += `\n*TOTAL ESTIMASI PO: Rp ${reorderTotalCost.toLocaleString('id-ID')}*\n`;
    text += `Catatan: ${reorderNotes}\n\n`;
    text += `Mohon konfirmasi ketersediaan stok & jadwal pengiriman. Terima kasih.`;

    navigator.clipboard.writeText(text);
    toast.success('Format Pesan WhatsApp PO berhasil disalin ke clipboard!');

    // Open WhatsApp Web/App if phone available
    const cleanPhone = activeReorderSupplier.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handle Form Save (Add/Edit)
  const handleSaveSupplier = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const code = (formData.get('code') as string) || `SUP-${Date.now().toString().slice(-4)}`;
    const name = formData.get('name') as string;
    const category = formData.get('category') as any;
    const contactPerson = formData.get('contactPerson') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const taxId = formData.get('taxId') as string;
    const paymentTerms = formData.get('paymentTerms') as any;
    const bankName = formData.get('bankName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const accountHolder = formData.get('accountHolder') as string;
    const leadTimeDays = parseInt(formData.get('leadTimeDays') as string, 10) || 3;
    const onTimeDeliveryRate = parseInt(formData.get('onTimeDeliveryRate') as string, 10) || 95;
    const qualityRating = parseFloat(formData.get('qualityRating') as string) || 4.8;
    const minOrderValueRp = parseInt(formData.get('minOrderValueRp') as string, 10) || 0;
    const status = formData.get('status') as any;
    const notes = formData.get('notes') as string;

    if (!name.trim()) {
      toast.error('Nama Supplier wajib diisi!');
      return;
    }

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        code,
        name,
        category,
        contactPerson,
        phone,
        email,
        address,
        city,
        taxId,
        paymentTerms,
        bankDetails: {
          bankName,
          accountNumber,
          accountHolder
        },
        leadTimeDays,
        onTimeDeliveryRate,
        qualityRating,
        minOrderValueRp,
        status,
        notes
      };
      onUpdateSupplier(updated);
      toast.success(`Data supplier ${name} berhasil diperbarui.`);
      if (selectedSupplierDetail?.id === updated.id) {
        setSelectedSupplierDetail(updated);
      }
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        code,
        name,
        category,
        contactPerson,
        phone,
        email,
        address,
        city,
        taxId,
        paymentTerms,
        bankDetails: {
          bankName,
          accountNumber,
          accountHolder
        },
        leadTimeDays,
        onTimeDeliveryRate,
        qualityRating,
        minOrderValueRp,
        status,
        notes,
        linkedPartSkus: [],
        createdDate: new Date().toISOString().split('T')[0]
      };
      onAddSupplier(newSup);
      toast.success(`Supplier baru ${name} (${code}) berhasil ditambahkan.`);
    }

    setIsAddEditModalOpen(false);
    setEditingSupplier(null);
  };

  // Link part from within drawer
  const handleLinkPart = (supplierId: string) => {
    if (!selectedPartToLink) {
      toast.error('Pilih part dari katalog terlebih dahulu!');
      return;
    }
    onLinkPartToSupplier(supplierId, selectedPartToLink);
    setSelectedPartToLink('');
    toast.success(`Part ${selectedPartToLink} berhasil ditautkan ke supplier.`);
  };

  return (
    <div className="flex flex-col bg-[#0F172A] text-slate-200">
      
      {/* Top Action & KPI Bar */}
      <div className="p-4 bg-[#1E293B]/80 border-b border-slate-800 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold font-mono">
                SUPPLIER & VENDOR DIRECTORY
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-bold">
                LEAD TIME & REORDER METRICS
              </span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Manajemen Supplier & Metrik Reorder Cepat
            </h3>
            <p className="text-xs text-slate-400">
              Database kontak vendor, katalog part tertaut, lead time pengiriman, kalkulasi safety stock & otomasi pembuatan PO
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                // Compile reorder for all suppliers with low stock
                if (suppliersWithLowStockCount === 0) {
                  toast.info('Semua part tertaut supplier saat ini dalam kondisi stok aman!');
                  return;
                }
                const firstLowSup = suppliers.find(s => (supplierLowStockMap.get(s.id)?.length || 0) > 0);
                if (firstLowSup) handleOpenReorderModal(firstLowSup);
              }}
              className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              title="Kompilasi Reorder untuk Supplier dengan Stok Kritis"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Reorder Cepat ({suppliersWithLowStockCount} Vendor Low Stock)</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Supplier Baru</span>
            </button>
          </div>
        </div>

        {/* Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          <div className="bg-[#0F172A]/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Supplier</span>
            </div>
            <p className="text-xl font-bold text-white font-mono">{totalSuppliersCount}</p>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-amber-400/80 mb-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Mitra Utama (Preferred)</span>
            </div>
            <p className="text-xl font-bold text-amber-400 font-mono">{preferredSuppliersCount} Mitra</p>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rata-rata Lead Time</span>
            </div>
            <p className="text-xl font-bold text-blue-400 font-mono">{avgLeadTime} Hari</p>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">On-Time Delivery</span>
            </div>
            <p className="text-xl font-bold text-emerald-400 font-mono">{avgOnTimeRate}%</p>
          </div>

          <div className="bg-[#0F172A]/70 border border-rose-500/30 rounded-xl p-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Perlu Reorder Segera</span>
            </div>
            <p className="text-xl font-bold text-rose-400 font-mono">
              {suppliersWithLowStockCount} Supplier
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#1E293B]/40 border-b border-slate-800 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama supplier, kode, PIC, kota, SKU..."
              className="w-full bg-[#0F172A] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0F172A] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="OEM Genuine Parts">OEM Genuine Parts</option>
            <option value="Paint & Chemicals">Paint & Chemicals</option>
            <option value="Fast Moving & Consumables">Fast Moving & Consumables</option>
            <option value="Oils & Lubricants">Oils & Lubricants</option>
            <option value="Body Panels & Glass">Body Panels & Glass</option>
            <option value="Tools & Equipment">Tools & Equipment</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0F172A] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PREFERRED">⭐ Preferred (Mitra Utama)</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
        </div>

        {/* Filter Pill & View Mode Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filterLowStockOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-[#0F172A] text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Hanya Low Stock Part ({suppliersWithLowStockCount})</span>
          </button>

          <div className="flex items-center bg-[#0F172A] border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                viewMode === 'CARDS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kartu
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                viewMode === 'TABLE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5">
        {filteredSuppliers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#1E293B]/40 rounded-2xl border border-slate-800">
            <Building2 className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-slate-300">Tidak ada supplier yang sesuai kriteria</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Coba sesuaikan kata kunci pencarian, filter kategori, atau tambahkan supplier baru ke sistem.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              + Tambah Supplier Baru
            </button>
          </div>
        ) : viewMode === 'CARDS' ? (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSuppliers.map((sup) => {
              const linked = supplierPartsMap.get(sup.id) || [];
              const lowStockLinked = supplierLowStockMap.get(sup.id) || [];
              const hasLowStock = lowStockLinked.length > 0;

              return (
                <div
                  key={sup.id}
                  className={`bg-[#1E293B] border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-600 shadow-xl relative overflow-hidden group ${
                    hasLowStock ? 'border-amber-500/40 bg-gradient-to-b from-[#1E293B] to-[#1E293B]/90' : 'border-slate-800'
                  }`}
                >
                  {/* Top Badges & Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 border border-slate-700 rounded text-[10px] font-mono font-bold">
                            {sup.code}
                          </span>
                          {sup.status === 'PREFERRED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              PREFERRED
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded text-[10px] font-medium">
                            {sup.category}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1.5 group-hover:text-indigo-400 transition-colors">
                          {sup.name}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          {sup.city || 'Indonesia'} &bull; PIC: <span className="text-slate-300 font-semibold">{sup.contactPerson}</span>
                        </p>
                      </div>

                      {/* Quality Rating */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-amber-400">{sup.qualityRating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Quick Strip */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-[#0F172A]/70 rounded-xl border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <a 
                          href={`https://wa.me/${sup.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:text-emerald-400 transition-colors truncate font-mono"
                          title="Chat WhatsApp"
                        >
                          {sup.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <a 
                          href={`mailto:${sup.email}`}
                          className="hover:text-blue-400 transition-colors truncate font-mono"
                          title="Kirim Email"
                        >
                          {sup.email}
                        </a>
                      </div>
                    </div>

                    {/* Lead Time & Fulfillment Metrics */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-800/80 my-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead Time</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className={`text-xs font-black font-mono ${
                            sup.leadTimeDays <= 2 ? 'text-emerald-400' : sup.leadTimeDays <= 4 ? 'text-blue-400' : 'text-amber-400'
                          }`}>
                            {sup.leadTimeDays} Hari
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">On-Time</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-black font-mono text-emerald-400">
                            {sup.onTimeDeliveryRate}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Termin</span>
                        <span className="text-[11px] font-bold text-slate-300 block truncate mt-0.5">
                          {sup.paymentTerms}
                        </span>
                      </div>
                    </div>

                    {/* Linked Parts Preview & Low Stock Alert */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          Part Tertaut ({linked.length})
                        </span>
                        {hasLowStock && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            {lowStockLinked.length} SKU Perlu Reorder
                          </span>
                        )}
                      </div>

                      {linked.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic">Belum ada part katalog yang ditautkan.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto custom-scrollbar">
                          {linked.slice(0, 4).map((p) => {
                            const isLow = p.stockQuantity <= p.minStockLevel;
                            return (
                              <span
                                key={p.id}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border flex items-center gap-1 ${
                                  isLow 
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 font-bold' 
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                                title={`${p.name} - Stok: ${p.stockQuantity} ${p.unit} (Min: ${p.minStockLevel})`}
                              >
                                {p.sku} ({p.stockQuantity} {p.unit})
                              </span>
                            );
                          })}
                          {linked.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                              +{linked.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(sup)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus supplier ${sup.name}?`)) {
                            onDeleteSupplier(sup.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Hapus Supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReorderModal(sup)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                          hasLowStock
                            ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>

                      <button
                        onClick={() => setSelectedSupplierDetail(sup)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT TABLE VIEW */
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[850px] text-left text-xs text-slate-300">
                <thead className="bg-[#0F172A] text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Kode & Supplier</th>
                    <th className="py-3 px-4">Kategori & Status</th>
                    <th className="py-3 px-4">Kontak PIC</th>
                    <th className="py-3 px-4">Lead Time</th>
                    <th className="py-3 px-4">On-Time</th>
                    <th className="py-3 px-4">Termin Bayar</th>
                    <th className="py-3 px-4">Part Tertaut</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSuppliers.map((sup) => {
                    const linked = supplierPartsMap.get(sup.id) || [];
                    const lowStockLinked = supplierLowStockMap.get(sup.id) || [];
                    const hasLowStock = lowStockLinked.length > 0;

                    return (
                      <tr key={sup.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-800 text-indigo-400 rounded">
                              {sup.code}
                            </span>
                            <span className="font-bold text-white">{sup.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{sup.city}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-[11px] text-slate-300">
                            {sup.category}
                          </span>
                          {sup.status === 'PREFERRED' && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                              ⭐ PREFERRED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200 block">{sup.contactPerson}</span>
                          <a 
                            href={`https://wa.me/${sup.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline font-mono text-[11px]"
                          >
                            {sup.phone}
                          </a>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={sup.leadTimeDays <= 2 ? 'text-emerald-400' : 'text-blue-400'}>
                            {sup.leadTimeDays} Hari
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                          {sup.onTimeDeliveryRate}%
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-300">{sup.paymentTerms}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{sup.bankDetails.bankName}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{linked.length} SKU</span>
                            {hasLowStock && (
                              <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                                ⚠️ {lowStockLinked.length} Low
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReorderModal(sup)}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Reorder</span>
                            </button>

                            <button
                              onClick={() => setSelectedSupplierDetail(sup)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: SUPPLIER DETAIL & LINKED PARTS MANAGEMENT */}
      {/* ========================================================================= */}
      {selectedSupplierDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0F172A] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 bg-[#1E293B] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold rounded">
                    {selectedSupplierDetail.code}
                  </span>
                  {selectedSupplierDetail.status === 'PREFERRED' && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      PREFERRED VENDOR
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
                    {selectedSupplierDetail.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1.5">
                  {selectedSupplierDetail.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Terdaftar sejak: {selectedSupplierDetail.createdDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditModal(selectedSupplierDetail);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  title="Edit Supplier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Performance & Lead Time Metrics Strip */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Metrik Performa & Lead Time Pengiriman
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Lead Time Pengiriman</span>
                    <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {selectedSupplierDetail.leadTimeDays} Hari Kerja
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Estimasi ROP = (Demand/Hari &times; {selectedSupplierDetail.leadTimeDays}) + Safety Stock
                    </span>
                  </div>

                  <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Tingkat Ketepatan (On-Time)</span>
                    <p className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                      {selectedSupplierDetail.onTimeDeliveryRate}%
                    </p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ width: `${selectedSupplierDetail.onTimeDeliveryRate}%` }} 
                      />
                    </div>
                  </div>

                  <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Evaluasi Kualitas (QC)</span>
                    <p className="text-lg font-bold font-mono text-amber-400 mt-0.5 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {selectedSupplierDetail.qualityRating} / 5.0
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Presisi part & kondisi kemasan
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Banking Information */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Informasi Kontak & Pembayaran (Finance)
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Person in Charge (PIC):</span>
                    <span className="font-bold text-white text-sm">{selectedSupplierDetail.contactPerson}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Termin Pembayaran:</span>
                    <span className="font-bold text-indigo-400">{selectedSupplierDetail.paymentTerms}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">WhatsApp / Telepon:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-200 font-bold">{selectedSupplierDetail.phone}</span>
                      <a
                        href={`https://wa.me/${selectedSupplierDetail.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded text-[10px] font-bold"
                      >
                        Chat WA
                      </a>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Email Pemesanan:</span>
                    <span className="font-mono text-slate-200">{selectedSupplierDetail.email}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-500 block">Alamat Gudang / Kantor:</span>
                    <span className="text-slate-300">{selectedSupplierDetail.address}, {selectedSupplierDetail.city}</span>
                  </div>

                  {selectedSupplierDetail.taxId && (
                    <div>
                      <span className="text-slate-500 block">NPWP Perusahaan:</span>
                      <span className="font-mono text-slate-300">{selectedSupplierDetail.taxId}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 block">Min. Order Value (MOQ):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Rp {selectedSupplierDetail.minOrderValueRp.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="col-span-2 bg-[#0F172A] p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Rekening Bank untuk Pembayaran PO:
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{selectedSupplierDetail.bankDetails.bankName}</span>
                        <span className="text-indigo-400 font-mono font-bold block text-sm">
                          {selectedSupplierDetail.bankDetails.accountNumber}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          a.n. {selectedSupplierDetail.bankDetails.accountHolder}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedSupplierDetail.bankDetails.accountNumber);
                          toast.success('Nomor rekening disalin ke clipboard!');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin No Rek</span>
                      </button>
                    </div>
                  </div>

                  {selectedSupplierDetail.notes && (
                    <div className="col-span-2 text-slate-400 text-xs italic bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      Catatan: {selectedSupplierDetail.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Inventory Parts List */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-400" />
                      Katalog Part Tertaut ke Supplier Ini ({supplierPartsMap.get(selectedSupplierDetail.id)?.length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Suku cadang dan material yang dipasok oleh vendor ini untuk reorder cepat
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenReorderModal(selectedSupplierDetail)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 shrink-0"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Buat Reorder Supplier Ini</span>
                  </button>
                </div>

                {/* Link new part dropdown selector */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-[#0F172A] rounded-xl border border-slate-800">
                  <select
                    value={selectedPartToLink}
                    onChange={(e) => setSelectedPartToLink(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      -- Pilih Part dari Katalog Gudang untuk Ditautkan --
                    </option>
                    {parts
                      .filter(p => !selectedSupplierDetail.linkedPartSkus.includes(p.sku))
                      .map(p => (
                        <option key={p.id} value={p.sku} className="bg-slate-900 text-white">
                          [{p.sku}] {p.name} - Rp {p.unitCost.toLocaleString('id-ID')}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleLinkPart(selectedSupplierDetail.id)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Tautkan Part</span>
                  </button>
                </div>

                {/* Linked Parts Table */}
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#0F172A] text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">SKU & Nama Part</th>
                        <th className="py-2.5 px-3">Stok / Buffer</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Harga HPP</th>
                        <th className="py-2.5 px-3">Rak</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(supplierPartsMap.get(selectedSupplierDetail.id) || []).map((p) => {
                        const isLow = p.stockQuantity <= p.minStockLevel;
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-indigo-400 font-bold block">{p.sku}</span>
                              <span className="text-slate-200 text-[11px] block">{p.name}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                                {p.stockQuantity} {p.unit}
                              </span>
                              <span className="text-[10px] text-slate-500 block">Min: {p.minStockLevel} | Max: {p.maxStockLevel}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {p.stockQuantity === 0 ? (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">KOSONG</span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">LOW STOCK</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">AMAN</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                              Rp {p.unitCost.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                              {p.binLocation}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Lepas tautan part ${p.sku} dari supplier ini?`)) {
                                    onUnlinkPartFromSupplier(selectedSupplierDetail.id, p.sku);
                                    toast.info(`Tautan part ${p.sku} dilepas.`);
                                  }
                                }}
                                className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition-colors"
                                title="Lepas Tautan Part"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(supplierPartsMap.get(selectedSupplierDetail.id) || []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                            Belum ada part yang tertaut. Pilih part di atas untuk menautkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-[#1E293B] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedSupplierDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Tutup
              </button>

              <button
                onClick={() => handleOpenReorderModal(selectedSupplierDetail)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Buat Draft Reorder PO ({selectedSupplierDetail.name})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FAST REORDER PO GENERATOR (ONE CLICK REORDER) */}
      {/* ========================================================================= */}
      {isReorderModalOpen && activeReorderSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-[#1E293B] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Reorder Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold font-mono">
                    FAST REORDER GENERATOR
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Lead Time: {activeReorderSupplier.leadTimeDays} Hari
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Draft Pemesanan Ulang: {activeReorderSupplier.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih part yang akan diorder, sesuaikan kuantitas pemesanan, dan kirimkan ke Purchasing atau via WhatsApp
                </p>
              </div>

              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reorder Item Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              
              <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Vendor Kontak & WhatsApp:</span>
                  <span className="font-bold text-white">{activeReorderSupplier.contactPerson} ({activeReorderSupplier.phone})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Termin Pembayaran:</span>
                  <span className="font-bold text-indigo-400">{activeReorderSupplier.paymentTerms}</span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0F172A]/50">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0F172A] text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">Pilih</th>
                      <th className="py-2.5 px-3">SKU & Nama Part</th>
                      <th className="py-2.5 px-3 text-center">Stok / Buffer</th>
                      <th className="py-2.5 px-3 text-center">Qty Reorder</th>
                      <th className="py-2.5 px-3 text-right">Harga HPP</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reorderItems.map((item, idx) => {
                      const isLow = item.currentStock <= item.minStockLevel;
                      return (
                        <tr key={item.partId} className={item.selected ? 'bg-indigo-950/20' : 'hover:bg-slate-800/30'}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setReorderItems(reorderItems.map((it, i) => i === idx ? { ...it, selected: checked } : it));
                              }}
                              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                            />
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono text-indigo-400 font-bold block">{item.sku}</span>
                            <span className="text-slate-200 font-medium block">{item.name}</span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono">
                            <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-300'}`}>
                              {item.currentStock} {item.unit}
                            </span>
                            <span className="text-[10px] text-slate-500 block">Min: {item.minStockLevel} | Max: {item.maxStockLevel}</span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={item.reorderQty}
                                disabled={!item.selected}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                  setReorderItems(reorderItems.map((it, i) => i === idx ? { ...it, reorderQty: val } : it));
                                }}
                                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                              />
                              <span className="text-[11px] text-slate-400">{item.unit}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            Rp {item.unitCost.toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            Rp {(item.reorderQty * item.unitCost).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Catatan Tambahan untuk PO:
                </label>
                <textarea
                  value={reorderNotes}
                  onChange={(e) => setReorderNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Catatan jadwal kirim, instruksi kemasan, no referensi..."
                />
              </div>
            </div>

            {/* Reorder Modal Footer */}
            <div className="p-5 border-t border-slate-800 bg-[#0F172A] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">Total Estimasi Nilai PO ({selectedReorderCount} Part Dipilih):</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  Rp {reorderTotalCost.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppPO}
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  title="Salin & Kirim via WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReorderDraft}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Kirim ke Modul Purchasing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SUPPLIER FORM */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#1E293B] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Tambah Supplier / Vendor Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lengkapi data profil vendor, kontak PIC, metrik lead time, dan nomor rekening perbankan
                </p>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSupplier} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kode Supplier (ID) *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={editingSupplier?.code || `SUP-NEW-${Date.now().toString().slice(-3)}`}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nama Perusahaan / Toko *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: PT Astra Otoparts Tbk"
                    defaultValue={editingSupplier?.name || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategori Pemasok *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingSupplier?.category || 'OEM Genuine Parts'}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OEM Genuine Parts">OEM Genuine Parts</option>
                    <option value="Paint & Chemicals">Paint & Chemicals</option>
                    <option value="Fast Moving & Consumables">Fast Moving & Consumables</option>
                    <option value="Oils & Lubricants">Oils & Lubricants</option>
                    <option value="Body Panels & Glass">Body Panels & Glass</option>
                    <option value="Tools & Equipment">Tools & Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Status Kemitraan *
                  </label>
                  <select
                    name="status"
                    defaultValue={editingSupplier?.status || 'ACTIVE'}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PREFERRED">⭐ Preferred (Mitra Utama)</option>
                    <option value="ACTIVE">Aktif (Reguler)</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Person in Charge (PIC)
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    placeholder="Contoh: Hendra Wijaya (Sales)"
                    defaultValue={editingSupplier?.contactPerson || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    No. WhatsApp / Telepon *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="+62 812-xxxx-xxxx"
                    defaultValue={editingSupplier?.phone || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Pemesanan
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="order@vendor.com"
                    defaultValue={editingSupplier?.email || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kota Asal Pengiriman
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Contoh: Jakarta Barat"
                    defaultValue={editingSupplier?.city || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Alamat Lengkap Kantor / Gudang Vendor
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Jl. Raya Kawasan Industri No. 12"
                    defaultValue={editingSupplier?.address || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    NPWP (Opsional)
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    placeholder="01.234.567.8-000.000"
                    defaultValue={editingSupplier?.taxId || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Termin Pembayaran *
                  </label>
                  <select
                    name="paymentTerms"
                    defaultValue={editingSupplier?.paymentTerms || 'TOP 30 Hari'}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cash / COD">Cash / COD</option>
                    <option value="TOP 14 Hari">TOP 14 Hari</option>
                    <option value="TOP 30 Hari">TOP 30 Hari</option>
                    <option value="TOP 45 Hari">TOP 45 Hari</option>
                    <option value="CBD">Cash Before Delivery (CBD)</option>
                  </select>
                </div>

                {/* Lead Time & Quality */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Lead Time Pengiriman (Hari) *
                  </label>
                  <input
                    type="number"
                    name="leadTimeDays"
                    min={1}
                    max={30}
                    required
                    defaultValue={editingSupplier?.leadTimeDays || 2}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    On-Time Delivery Rate (%)
                  </label>
                  <input
                    type="number"
                    name="onTimeDeliveryRate"
                    min={0}
                    max={100}
                    defaultValue={editingSupplier?.onTimeDeliveryRate || 95}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rating Kualitas (0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="qualityRating"
                    min={1}
                    max={5}
                    defaultValue={editingSupplier?.qualityRating || 4.8}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Min. Order Value (Rp)
                  </label>
                  <input
                    type="number"
                    name="minOrderValueRp"
                    min={0}
                    step={100000}
                    defaultValue={editingSupplier?.minOrderValueRp || 1000000}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Banking Section */}
                <div className="md:col-span-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    Rekening Bank Pembayaran Vendor
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nama Bank</label>
                      <input
                        type="text"
                        name="bankName"
                        placeholder="BCA / Mandiri / BRI"
                        defaultValue={editingSupplier?.bankDetails?.bankName || 'BCA'}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">No. Rekening</label>
                      <input
                        type="text"
                        name="accountNumber"
                        placeholder="123-456-7890"
                        defaultValue={editingSupplier?.bankDetails?.accountNumber || ''}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Atas Nama Rekening</label>
                      <input
                        type="text"
                        name="accountHolder"
                        placeholder="PT Vendor Indonesia"
                        defaultValue={editingSupplier?.bankDetails?.accountHolder || ''}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Catatan Khusus Vendor (Opsional)
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Syarat retur, diskon quantity, garansi..."
                    defaultValue={editingSupplier?.notes || ''}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  {editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
