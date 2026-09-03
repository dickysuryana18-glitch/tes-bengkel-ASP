import { useState, type FormEvent } from 'react';
import { 
  FileText, Plus, CheckCircle2, Clock, AlertTriangle, 
  Search, ShieldAlert, ArrowRight, UserCheck, PackageCheck, 
  RotateCcw, Printer, Check, X, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { MaterialRequisition, ExtendedPart } from '../../types/inventory';
import { toast } from 'sonner';

interface MaterialRequisitionFlowProps {
  requisitions: MaterialRequisition[];
  parts: ExtendedPart[];
  onIssueRequisition: (reqId: string) => void;
  onApproveRequisition: (reqId: string, foremanName: string) => void;
  onCreateRequisition: (newReq: MaterialRequisition) => void;
  onReturnItems: (reqId: string, returnedItems: { itemId: string; returnQty: number; reason: string }[]) => void;
}

export function MaterialRequisitionFlow({
  requisitions,
  parts,
  onIssueRequisition,
  onApproveRequisition,
  onCreateRequisition,
  onReturnItems
}: MaterialRequisitionFlowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING_APPROVAL' | 'READY_PICKING' | 'ISSUED' | 'COMPLETED'>('ALL');
  const [selectedReq, setSelectedReq] = useState<MaterialRequisition | null>(requisitions[0] || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // New Requisition Form State
  const [newSpkNumber, setNewSpkNumber] = useState('SPK-2026-0875');
  const [newPlateNumber, setNewPlateNumber] = useState('B 2341 TZA');
  const [newVehicleModel, setNewVehicleModel] = useState('Honda CR-V Turbo Prestige 2022');
  const [newStage, setNewStage] = useState('Cat Oven & Dempul');
  const [newMechanic, setNewMechanic] = useState('Rudi Hartono (Painter)');
  const [newNotes, setNewNotes] = useState('');
  const [selectedItemsForNewReq, setSelectedItemsForNewReq] = useState<{ partId: number; qty: number }[]>([
    { partId: 4, qty: 1 },
    { partId: 9, qty: 2 }
  ]);

  // Return items form state
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('Sisa pengerjaan panel tidak terpakai');

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = 
      req.requisitionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.spkNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedByMechanic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItemToNewReq = () => {
    setSelectedItemsForNewReq([...selectedItemsForNewReq, { partId: parts[0]?.id || 1, qty: 1 }]);
  };

  const handleRemoveItemFromNewReq = (index: number) => {
    setSelectedItemsForNewReq(selectedItemsForNewReq.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newSpkNumber.trim() || !newPlateNumber.trim()) {
      toast.error('Nomor SPK & Plat Nomor wajib diisi!');
      return;
    }
    if (selectedItemsForNewReq.length === 0) {
      toast.error('Pilih minimal 1 part / material yang diminta!');
      return;
    }

    const items = selectedItemsForNewReq.map((item, idx) => {
      const p = parts.find(x => x.id === item.partId) || parts[0];
      return {
        id: `item-${Date.now()}-${idx}`,
        partId: p.id,
        sku: p.sku,
        name: p.name,
        requestedQty: item.qty,
        issuedQty: 0,
        returnedQty: 0,
        unit: p.unit,
        unitCost: p.unitCost,
        unitPrice: p.unitPrice,
        status: 'PENDING' as const
      };
    });

    const totalVal = items.reduce((sum, it) => sum + (it.requestedQty * it.unitPrice), 0);

    const newReq: MaterialRequisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      spkNumber: newSpkNumber,
      plateNumber: newPlateNumber,
      vehicleModel: newVehicleModel,
      damageStage: newStage,
      requestedByMechanic: newMechanic,
      foremanApproval: {
        isApproved: false
      },
      status: 'WAITING_APPROVAL',
      items,
      totalValue: totalVal,
      notes: newNotes,
      createdAt: new Date().toISOString()
    };

    onCreateRequisition(newReq);
    setSelectedReq(newReq);
    setIsCreateModalOpen(false);
    toast.success(`Bon Permintaan ${newReq.requisitionNumber} berhasil dibuat dan menunggu approval Foreman!`);
  };

  const handleConfirmReturn = () => {
    if (!selectedReq) return;
    const itemsToReturn = Object.entries(returnQuantities)
      .map(([itemId, qty]) => ({ itemId, qty: Number(qty) }))
      .filter(entry => entry.qty > 0)
      .map(entry => ({
        itemId: entry.itemId,
        returnQty: entry.qty,
        reason: returnReason
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Tentukan jumlah part / sisa bahan yang dikembalikan!');
      return;
    }

    onReturnItems(selectedReq.id, itemsToReturn);
    setIsReturnModalOpen(false);
    toast.success('Pengembalian material berhasil dicatat & stok bertambah kembali!');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Zero Leakage Rule Notice Header */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              SOP Zero Stock Leakage & Mandatory SPK-Linked Material Requisition
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono">
                ENFORCED
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap pengeluaran part, cat, thinner, dan bahan dempul <strong>WAJIB</strong> terikat nomor SPK aktif dan ditandatangani digital oleh Foreman sebelum Gudang mengeluarkan barang.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Bon Permintaan Part
        </button>
      </div>

      {/* Filter and Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        
        {/* LEFT COLUMN: LIST OF REQUISITIONS (5 cols) */}
        <div className="lg:col-span-5 bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Cari Bon, SPK, Plat, atau Mekanik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 w-full max-w-full">
              {(['ALL', 'WAITING_APPROVAL', 'READY_PICKING', 'ISSUED', 'COMPLETED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List Scroll */}
          <div className="divide-y divide-slate-800/80">
            {filteredRequisitions.map(req => {
              const isSelected = selectedReq?.id === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {req.requisitionNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      req.status === 'ISSUED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : req.status === 'READY_PICKING'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : req.status === 'WAITING_APPROVAL'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white font-semibold">
                    <span>{req.plateNumber}</span>
                    <span className="text-slate-400 font-mono font-normal text-[11px]">{req.spkNumber}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 truncate">{req.vehicleModel}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      {req.requestedByMechanic}
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                      Rp {req.totalValue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredRequisitions.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada bon permintaan material yang cocok.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REQUISITION DETAILS & ISSUANCE / RETURN ACTION (7 cols) */}
        <div className="lg:col-span-7 bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col shadow-xl">
          {selectedReq ? (
            <div className="flex flex-col">
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A]/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-400">{selectedReq.requisitionNumber}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{selectedReq.spkNumber}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {selectedReq.plateNumber} - {selectedReq.vehicleModel}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tahap Produksi: <strong className="text-slate-300">{selectedReq.damageStage}</strong></p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedReq.status === 'WAITING_APPROVAL' && (
                    <button
                      onClick={() => onApproveRequisition(selectedReq.id, 'Ahmad Fauzi (Foreman Body)')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve (Foreman)
                    </button>
                  )}

                  {selectedReq.status === 'READY_PICKING' && (
                    <button
                      onClick={() => onIssueRequisition(selectedReq.id)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Keluarkan Barang (Gudang)
                    </button>
                  )}

                  {selectedReq.status === 'ISSUED' && (
                    <button
                      onClick={() => setIsReturnModalOpen(true)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retur Sisa / Copotan
                    </button>
                  )}
                </div>
              </div>

              {/* Status Flow Indicator */}
              <div className="px-4 sm:px-5 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-4 text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    selectedReq.foremanApproval.isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedReq.foremanApproval.isApproved ? '✓' : '1'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Approval Foreman</p>
                    <p className="text-[10px] text-slate-500">
                      {selectedReq.foremanApproval.isApproved 
                        ? `Disetujui oleh ${selectedReq.foremanApproval.approvedBy}` 
                        : 'Menunggu tanda tangan digital'}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    selectedReq.status === 'ISSUED' || selectedReq.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedReq.status === 'ISSUED' || selectedReq.status === 'COMPLETED' ? '✓' : '2'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Pengeluaran Gudang</p>
                    <p className="text-[10px] text-slate-500">
                      {selectedReq.warehouseIssuedBy 
                        ? `Dikeluarkan oleh ${selectedReq.warehouseIssuedBy}` 
                        : 'Menunggu picking barang'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Part & Material Diminta:
                </h4>

                <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                    <thead className="bg-[#0F172A]/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2.5 font-bold">SKU / Nama Material</th>
                        <th className="px-3.5 py-2.5 font-bold text-center">Diminta</th>
                        <th className="px-3.5 py-2.5 font-bold text-center">Keluar</th>
                        <th className="px-3.5 py-2.5 font-bold text-center">Retur</th>
                        <th className="px-3.5 py-2.5 font-bold text-right">Harga Jual SPK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {selectedReq.items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="px-3.5 py-2.5">
                            <p className="font-mono font-bold text-indigo-400 text-[11px]">{item.sku}</p>
                            <p className="font-semibold text-slate-200">{item.name}</p>
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-bold">
                            {item.requestedQty} {item.unit}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-bold text-emerald-400">
                            {item.issuedQty} {item.unit}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-bold text-amber-400">
                            {item.returnedQty} {item.unit}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold">
                            Rp {(item.requestedQty * item.unitPrice).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#0F172A]/60 font-bold border-t border-slate-800">
                      <tr>
                        <td colSpan={4} className="px-3.5 py-2.5 text-right text-slate-400">Total Nilai Material:</td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 text-sm">
                          Rp {selectedReq.totalValue.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedReq.notes && (
                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-300">
                    <p className="font-bold text-slate-400 mb-1">Catatan Permintaan:</p>
                    <p>{selectedReq.notes}</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500 text-sm">
              Pilih salah satu bon permintaan di sebelah kiri untuk melihat rincian & aksi.
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW REQUISITION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Buat Bon Permintaan Part & Material SPK</h3>
                  <p className="text-xs text-slate-400">Pengambilan Resmi Gudang Mekanik</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nomor SPK Aktif *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpkNumber}
                    onChange={(e) => setNewSpkNumber(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Plat Nomor Kendaraan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlateNumber}
                    onChange={(e) => setNewPlateNumber(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Model Mobil
                  </label>
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Mekanik / Painter Pemohon
                  </label>
                  <input
                    type="text"
                    value={newMechanic}
                    onChange={(e) => setNewMechanic(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Item Part / Material yang Diminta:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemToNewReq}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedItemsForNewReq.map((item, idx) => {
                    const p = parts.find(x => x.id === item.partId) || parts[0];
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-[#1E293B] p-2.5 rounded-lg border border-slate-700">
                        <div className="flex-1">
                          <select
                            value={item.partId}
                            onChange={(e) => {
                              const newPartId = Number(e.target.value);
                              const updated = [...selectedItemsForNewReq];
                              updated[idx].partId = newPartId;
                              setSelectedItemsForNewReq(updated);
                            }}
                            className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          >
                            {parts.map(pt => (
                              <option key={pt.id} value={pt.id}>
                                [{pt.sku}] {pt.name} (Stok: {pt.stockQuantity} {pt.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              const updated = [...selectedItemsForNewReq];
                              updated[idx].qty = val;
                              setSelectedItemsForNewReq(updated);
                            }}
                            className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white text-center font-mono"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-10">{p?.unit}</span>
                        {selectedItemsForNewReq.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromNewReq(idx)}
                            className="p-1 text-slate-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="Keterangan peruntukan panel atau alasan permintaan..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Kirim Bon ke Foreman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN ITEMS MODAL */}
      {isReturnModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Retur Sisa Material / Copotan Part</h3>
                  <p className="text-xs text-slate-400">{selectedReq.requisitionNumber} ({selectedReq.spkNumber})</p>
                </div>
              </div>
              <button onClick={() => setIsReturnModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Masukkan jumlah material sisa atau part copotan yang dikembalikan ke rak gudang untuk mengembalikan stok:
              </p>

              <div className="space-y-3">
                {selectedReq.items.map(item => (
                  <div key={item.id} className="p-3 bg-[#1E293B] border border-slate-700 rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-xs text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-400">Dikeluarkan: {item.issuedQty} {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={item.issuedQty}
                        value={returnQuantities[item.id] || 0}
                        onChange={(e) => setReturnQuantities({
                          ...returnQuantities,
                          [item.id]: Math.max(0, parseInt(e.target.value) || 0)
                        })}
                        className="w-16 bg-[#0F172A] border border-slate-700 rounded px-2 py-1 text-xs text-white text-center font-mono"
                      />
                      <span className="text-xs text-slate-400 font-mono">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Alasan Pengembalian:
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Konfirmasi Retur ke Gudang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
