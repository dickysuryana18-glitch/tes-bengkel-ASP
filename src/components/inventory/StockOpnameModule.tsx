import { useState } from 'react';
import { 
  ClipboardCheck, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  Search, Plus, Check, RefreshCw, FileText, ArrowRight, ShieldCheck, MapPin
} from 'lucide-react';
import { StockOpnameSession, StockOpnameItem, ExtendedPart } from '../../types/inventory';
import { toast } from 'sonner';

interface StockOpnameModuleProps {
  sessions: StockOpnameSession[];
  parts: ExtendedPart[];
  onApplyOpnameAdjustments: (sessionId: string, updatedItems: StockOpnameItem[]) => void;
  onCreateSession: (newSession: StockOpnameSession) => void;
}

export function StockOpnameModule({
  sessions,
  parts,
  onApplyOpnameAdjustments,
  onCreateSession
}: StockOpnameModuleProps) {
  const [selectedSession, setSelectedSession] = useState<StockOpnameSession>(sessions[0] || null);
  const [blindCount, setBlindCount] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'VARIANCE_ONLY' | 'MATCHED_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState<StockOpnameItem[]>(selectedSession?.items || []);

  const handleCountChange = (partId: number, valStr: string) => {
    const countedVal = valStr === '' ? null : parseInt(valStr);
    const updated = localItems.map(item => {
      if (item.partId === partId) {
        const counted = countedVal;
        const variance = counted !== null ? counted - item.systemQty : 0;
        const varianceVal = variance * item.unitCost;
        return {
          ...item,
          countedQty: counted,
          varianceQty: variance,
          varianceValueRp: varianceVal,
          varianceReason: variance === 0 ? 'TIDAK_ADA_SELISIH' : (item.varianceReason || 'SALAH_CATAT')
        };
      }
      return item;
    });
    setLocalItems(updated);
  };

  const handleReasonChange = (partId: number, reason: any) => {
    setLocalItems(localItems.map(item => 
      item.partId === partId ? { ...item, varianceReason: reason } : item
    ));
  };

  const filteredItems = localItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.binLocation.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterMode === 'VARIANCE_ONLY') {
      return matchesSearch && item.countedQty !== null && item.varianceQty !== 0;
    }
    if (filterMode === 'MATCHED_ONLY') {
      return matchesSearch && item.countedQty !== null && item.varianceQty === 0;
    }
    return matchesSearch;
  });

  const totalCounted = localItems.filter(i => i.countedQty !== null).length;
  const itemsWithVariance = localItems.filter(i => i.countedQty !== null && i.varianceQty !== 0);
  const netVarianceValue = localItems.reduce((sum, i) => sum + (i.countedQty !== null ? i.varianceValueRp : 0), 0);

  const handleSaveAndPostAdjustment = () => {
    if (!selectedSession) return;
    if (totalCounted < localItems.length) {
      toast.warning(`Ada ${localItems.length - totalCounted} item yang belum diinput hasil fisiknya!`);
    }

    onApplyOpnameAdjustments(selectedSession.id, localItems);
    toast.success('Hasil Stock Opname telah direkonsiliasi dan stok gudang disesuaikan!');
  };

  const handleCreateNewSession = () => {
    const newItems: StockOpnameItem[] = parts.map(p => ({
      partId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      binLocation: p.binLocation,
      systemQty: p.stockQuantity,
      countedQty: null,
      varianceQty: 0,
      unitCost: p.unitCost,
      varianceValueRp: 0,
      adjustmentStatus: 'PENDING_AUDIT'
    }));

    const newSession: StockOpnameSession = {
      id: `opname-${Date.now()}`,
      sessionCode: `OPNAME-2026-${new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title: `Stock Opname Periodik - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
      startDate: new Date().toISOString().split('T')[0],
      status: 'IN_PROGRESS',
      blindCountMode: true,
      conductedBy: 'Gunawan Prasetyo (Gudang)',
      totalItemsCounted: 0,
      totalItemsWithVariance: 0,
      totalNetVarianceValueRp: 0,
      items: newItems
    };

    onCreateSession(newSession);
    setSelectedSession(newSession);
    setLocalItems(newItems);
    toast.success(`Sesi Stock Opname ${newSession.sessionCode} berhasil dimulai!`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Overview Card */}
      <div className="bg-[#1E293B] border border-slate-800 p-4 sm:p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-indigo-400">{selectedSession?.sessionCode}</span>
            <span className="text-slate-600">•</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
              {selectedSession?.status}
            </span>
          </div>
          <h3 className="text-base font-bold text-white">{selectedSession?.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Petugas PIC: <strong className="text-slate-300">{selectedSession?.conductedBy}</strong> • Tanggal: {selectedSession?.startDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Blind Count Mode Toggle */}
          <button
            onClick={() => setBlindCount(!blindCount)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              blindCount 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {blindCount ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            Blind Count: {blindCount ? 'AKTIF' : 'NONAKTIF'}
          </button>

          <button
            onClick={handleCreateNewSession}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Sesi Baru
          </button>

          <button
            onClick={handleSaveAndPostAdjustment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Posting Stok
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progres Hitung Fisik</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono">{totalCounted} / {localItems.length}</span>
            <span className="text-xs text-indigo-400 font-bold">
              ({Math.round((totalCounted / (localItems.length || 1)) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Cocok (Akurat)</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {localItems.filter(i => i.countedQty !== null && i.varianceQty === 0).length} SKU
          </p>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU Selisih Fisik</p>
          <p className="text-2xl font-bold text-rose-400 font-mono mt-1">
            {itemsWithVariance.length} SKU
          </p>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nominal Net Selisih (Rp)</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${netVarianceValue < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            Rp {netVarianceValue.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-[#0F172A]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Cari SKU, Nama Part, atau Rak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0 max-w-full">
            {(['ALL', 'VARIANCE_ONLY', 'MATCHED_ONLY'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  filterMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'ALL' ? 'Semua Item' : mode === 'VARIANCE_ONLY' ? 'Hanya Selisih' : 'Hanya Cocok'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead className="bg-[#0F172A]/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-bold">SKU / Nama Part</th>
                <th className="px-4 py-3 font-bold text-center">Lokasi Rak</th>
                {!blindCount && <th className="px-4 py-3 font-bold text-center">Stok Sistem</th>}
                <th className="px-4 py-3 font-bold text-center w-32">Hitung Fisik</th>
                <th className="px-4 py-3 font-bold text-center">Selisih</th>
                <th className="px-4 py-3 font-bold">Alasan Selisih</th>
                <th className="px-4 py-3 font-bold text-right">Nilai Selisih (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredItems.map(item => {
                const isCounted = item.countedQty !== null;
                const hasVariance = isCounted && item.varianceQty !== 0;

                return (
                  <tr key={item.partId} className={`hover:bg-slate-800/30 ${hasVariance ? 'bg-rose-950/10' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-indigo-400 text-[11px]">{item.sku}</p>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.category}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {item.binLocation}
                      </span>
                    </td>
                    {!blindCount && (
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-300">
                        {item.systemQty}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.countedQty !== null ? item.countedQty : ''}
                        onChange={(e) => handleCountChange(item.partId, e.target.value)}
                        placeholder="Hitung..."
                        className="w-24 bg-[#0F172A] border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {isCounted ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.varianceQty === 0 
                            ? 'text-emerald-400' 
                            : item.varianceQty < 0 
                            ? 'text-rose-400 bg-rose-500/10' 
                            : 'text-blue-400 bg-blue-500/10'
                        }`}>
                          {item.varianceQty > 0 ? `+${item.varianceQty}` : item.varianceQty}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasVariance ? (
                        <select
                          value={item.varianceReason || 'SALAH_CATAT'}
                          onChange={(e) => handleReasonChange(item.partId, e.target.value)}
                          className="bg-[#0F172A] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                        >
                          <option value="RUSAK_PECAH">Barang Rusak / Pecah</option>
                          <option value="SALAH_CATAT">Kesalahan Catat Masuk/Keluar</option>
                          <option value="HILANG_SELISIH">Hilang / Selisih Belum Ditemukan</option>
                          <option value="KADALUWARSA">Kadaluwarsa / Menggumpal</option>
                        </select>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Sesuai</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {isCounted ? (
                        <span className={item.varianceValueRp < 0 ? 'text-rose-400' : item.varianceValueRp > 0 ? 'text-blue-400' : 'text-slate-500'}>
                          Rp {item.varianceValueRp.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
