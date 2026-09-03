import { useState } from 'react';
import { 
  Palette, Scale, Sparkles, CheckCircle2, AlertTriangle, 
  Plus, History, Droplet, ArrowRight, RefreshCw, FileText, Check
} from 'lucide-react';
import { PaintColorFormula, PaintMixingLog, ExtendedPart } from '../../types/inventory';
import { toast } from 'sonner';

interface PaintMixingModuleProps {
  formulas: PaintColorFormula[];
  mixingLogs: PaintMixingLog[];
  parts: ExtendedPart[];
  onCompleteMixing: (log: PaintMixingLog) => void;
}

export function PaintMixingModule({
  formulas,
  mixingLogs,
  parts,
  onCompleteMixing
}: PaintMixingModuleProps) {
  const [selectedFormula, setSelectedFormula] = useState<PaintColorFormula>(formulas[0] || null);
  const [spkNumber, setSpkNumber] = useState('SPK-2026-0875');
  const [plateNumber, setPlateNumber] = useState('B 2341 TZA');
  const [vehicleModel, setVehicleModel] = useState('Honda CR-V Turbo Prestige 2022');
  const [panelCount, setPanelCount] = useState(2);
  const [panelNames, setPanelNames] = useState('Pintu Depan Kanan, Fender Depan Kanan');
  const [targetGrams, setTargetGrams] = useState(450); // ~225g per panel
  const [painterName, setPainterName] = useState('Rudi Hartono (Master Painter)');
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'HISTORY' | 'FORMULAS'>('CALCULATOR');
  const [formulaSearch, setFormulaSearch] = useState('');

  // Filtered formulas
  const filteredFormulas = formulas.filter(f => 
    f.colorCode.toLowerCase().includes(formulaSearch.toLowerCase()) ||
    f.colorName.toLowerCase().includes(formulaSearch.toLowerCase()) ||
    f.carBrand.toLowerCase().includes(formulaSearch.toLowerCase()) ||
    f.paintSystem.toLowerCase().includes(formulaSearch.toLowerCase())
  );

  // Calculate required grams for each toner based on formula percentage ratio
  const calculatedToners = selectedFormula ? selectedFormula.toners.map(t => {
    const requiredGrams = Math.round((t.percentageRatio / 100) * targetGrams * 10) / 10;
    const tonerPart = parts.find(p => p.sku === t.tonerSku);
    const availableGrams = tonerPart ? tonerPart.stockQuantity : 0;
    const isShortage = availableGrams < requiredGrams;

    return {
      ...t,
      requiredGrams,
      availableGrams,
      isShortage,
      lineCostRp: Math.round(requiredGrams * t.unitCostPerGram)
    };
  }) : [];

  const totalRawPaintCost = calculatedToners.reduce((sum, t) => sum + t.lineCostRp, 0);
  const calculatedThinnerGrams = Math.round(targetGrams * ((selectedFormula?.recommendedThinnerRatioPercent || 50) / 100));
  const calculatedHardenerGrams = Math.round(targetGrams * ((selectedFormula?.recommendedHardenerRatioPercent || 20) / 100));
  const totalSprayMixGrams = targetGrams + calculatedThinnerGrams + calculatedHardenerGrams;
  const costPerPanel = panelCount > 0 ? Math.round(totalRawPaintCost / panelCount) : totalRawPaintCost;

  const hasAnyShortage = calculatedToners.some(t => t.isShortage);

  const handleStartAndExecuteMix = () => {
    if (!selectedFormula) return;
    if (hasAnyShortage) {
      toast.error('Gagal Mixing: Stok toner di gudang tidak mencukupi!');
      return;
    }

    const newLog: PaintMixingLog = {
      id: `mix-${Date.now()}`,
      mixLogNumber: `MIX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      spkNumber,
      plateNumber,
      vehicleModel,
      colorCode: selectedFormula.colorCode,
      colorName: selectedFormula.colorName,
      panelCount,
      panelDescriptions: panelNames.split(',').map(s => s.trim()),
      targetGrams,
      actualGramsProduced: targetGrams + 5,
      leftoverGrams: 20,
      wastePercentage: 4.4,
      mixedByPainter: painterName,
      supervisorCheckedBy: 'Budi Santoso (Foreman Paint)',
      totalCostRp: totalRawPaintCost,
      costPerPanelRp: costPerPanel,
      tonerDeductions: calculatedToners.map(t => ({
        tonerSku: t.tonerSku,
        tonerName: t.tonerName,
        gramsDeducted: t.requiredGrams,
        costRp: t.lineCostRp
      })),
      createdAt: new Date().toISOString()
    };

    onCompleteMixing(newLog);
    toast.success(`Mixing Cat ${selectedFormula.colorCode} selesai! Stok toner gudang telah dipotong otomatis.`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1E293B] border border-slate-800 p-3.5 rounded-xl shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Laboratorium Cat & Paint Mixing Room</h3>
            <p className="text-xs text-slate-400">Timbangan Digital Gram Presisi & Database Formula OEM Pabrikan</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto custom-scrollbar shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'CALCULATOR' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Timbangan & Mixing SPK
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Log Batch ({mixingLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('FORMULAS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'FORMULAS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Database Formula OEM ({formulas.length})
          </button>
        </div>
      </div>

      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          
          {/* LEFT: JOB & FORMULA SELECTOR (5 cols) */}
          <div className="lg:col-span-5 bg-[#1E293B] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              1. Pilih Formula OEM & Data SPK
            </h4>

            {/* Formula Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Kode Warna OEM / Formula Mobil</label>
              <select
                value={selectedFormula?.id || ''}
                onChange={(e) => {
                  const f = formulas.find(x => x.id === e.target.value);
                  if (f) setSelectedFormula(f);
                }}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {formulas.map(f => (
                  <option key={f.id} value={f.id}>
                    [{f.carBrand}] {f.colorCode} - {f.colorName} ({f.paintSystem})
                  </option>
                ))}
              </select>
            </div>

            {/* SPK Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400">Nomor SPK</label>
                <input
                  type="text"
                  value={spkNumber}
                  onChange={(e) => setSpkNumber(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400">Plat Nomor</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400">Model Kendaraan</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            {/* Target Weight & Panel Estimation */}
            <div className="p-4 bg-[#0F172A]/70 border border-slate-700/80 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-300">Jumlah Panel yang Dicat</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setPanelCount(n);
                        setTargetGrams(n * 225); // standard ~225g per panel basecoat
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        panelCount === n
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400">Deskripsi Panel</label>
                <input
                  type="text"
                  value={panelNames}
                  onChange={(e) => setPanelNames(e.target.value)}
                  placeholder="Contoh: Kap Mesin, Pintu Kanan..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Target Berat Cat Basecoat</label>
                  <span className="text-xs font-mono font-bold text-indigo-400">{targetGrams} Gram</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="25"
                  value={targetGrams}
                  onChange={(e) => setTargetGrams(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>100g (Touch Up)</span>
                  <span>450g (2 Panel)</span>
                  <span>1500g (Siram Total)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400">Master Painter Penanggung Jawab</label>
              <input
                type="text"
                value={painterName}
                onChange={(e) => setPainterName(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* RIGHT: LIVE SCALE & TONER RATIOS BREAKDOWN (7 cols) */}
          <div className="lg:col-span-7 bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col shadow-xl">
            {/* Header Scale Display */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A]/80 flex items-center justify-between shrink-0 gap-3">
              <div className="truncate">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {selectedFormula?.carBrand} • {selectedFormula?.colorCode}
                </span>
                <h3 className="text-base font-bold text-white truncate">{selectedFormula?.colorName}</h3>
                <p className="text-xs text-slate-400 truncate">{selectedFormula?.paintSystem}</p>
              </div>

              {/* Digital Scale LED Emulation */}
              <div className="bg-black border-2 border-emerald-500/40 rounded-xl px-3 sm:px-4 py-2 text-right shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                <p className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-wider">Digital Scale Tare</p>
                <p className="text-xl sm:text-2xl font-mono font-black text-emerald-400 tracking-wider">
                  {targetGrams}.0 <span className="text-xs font-normal text-emerald-500">g</span>
                </p>
              </div>
            </div>

            {/* Formula Toner Table */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Komposisi Takaran Toner Gram Presisi:
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Total Toners: {calculatedToners.length} jenis
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                  <thead className="bg-[#0F172A]/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5 font-bold">Toner Cat / Pigment</th>
                      <th className="px-3.5 py-2.5 font-bold text-center">Rasio %</th>
                      <th className="px-3.5 py-2.5 font-bold text-center">Takaran (g)</th>
                      <th className="px-3.5 py-2.5 font-bold text-center">Stok Gudang</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">Biaya Bahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {calculatedToners.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3.5 py-2.5">
                          <p className="font-mono font-bold text-indigo-400 text-[11px]">{t.tonerSku}</p>
                          <p className="font-semibold text-slate-200">{t.tonerName}</p>
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-bold font-mono text-slate-400">
                          {t.percentageRatio}%
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono font-bold text-emerald-400 text-sm">
                          {t.requiredGrams} g
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-mono">
                          <span className={t.isShortage ? 'text-red-400 font-bold' : 'text-slate-300'}>
                            {t.availableGrams} g
                          </span>
                          {t.isShortage && (
                            <span className="block text-[9px] text-red-400 font-sans">Kurang!</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold">
                          Rp {t.lineCostRp.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Solvent & Hardener Aux Mixing ratios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Thinner PU Extra Slow</p>
                      <p className="text-[10px] text-slate-400">Rasio {selectedFormula?.recommendedThinnerRatioPercent}%</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-blue-400">+{calculatedThinnerGrams} g</span>
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Hardener 2K PU</p>
                      <p className="text-[10px] text-slate-400">Rasio {selectedFormula?.recommendedHardenerRatioPercent}%</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-purple-400">+{calculatedHardenerGrams} g</span>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
                <div>
                  <p className="text-[10px] text-slate-400">Total Siap Semprot</p>
                  <p className="text-sm font-bold text-white font-mono">{totalSprayMixGrams} Gram</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Total HPP Cat Base</p>
                  <p className="text-sm font-bold text-emerald-400 font-mono">Rp {totalRawPaintCost.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">HPP Rata-rata per Panel</p>
                  <p className="text-sm font-bold text-indigo-300 font-mono">Rp {costPerPanel.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-slate-800 bg-[#0F172A]/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-slate-400 text-center sm:text-left">
                Pencampuran otomatis memotong stok toner dan mencatat kartu mutasi SPK.
              </p>
              <button
                onClick={handleStartAndExecuteMix}
                disabled={hasAnyShortage}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Selesaikan Mixing & Potong Stok Gudang
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/60 flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Riwayat Batch Mixing Cat & Analisis Efisiensi Panel
            </h4>
            <span className="text-xs text-slate-400">Total Batch: {mixingLogs.length}</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="bg-[#0F172A]/90 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-bold">No. Batch / SPK</th>
                  <th className="px-4 py-3 font-bold">Kendaraan & Formula</th>
                  <th className="px-4 py-3 font-bold text-center">Panel & Gram</th>
                  <th className="px-4 py-3 font-bold text-center">Waste %</th>
                  <th className="px-4 py-3 font-bold">Painter</th>
                  <th className="px-4 py-3 font-bold text-right">Biaya / Panel</th>
                  <th className="px-4 py-3 font-bold text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {mixingLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-indigo-400 text-[11px]">{log.mixLogNumber}</p>
                      <p className="font-mono text-emerald-400 text-[10px]">{log.spkNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{log.plateNumber} ({log.vehicleModel})</p>
                      <p className="text-slate-400 text-[10px]">
                        [{log.colorCode}] {log.colorName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-300">
                        {log.panelCount} Panel
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.actualGramsProduced} g</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        log.wastePercentage <= 5 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.wastePercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{log.mixedByPainter}</p>
                      <p className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-300 font-semibold">
                      Rp {log.costPerPanelRp.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">
                      Rp {log.totalCostRp.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'FORMULAS' && (
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Katalog Formula Warna Standar OEM Pabrikan
              </h4>
              <p className="text-xs text-slate-400">Database kode warna Honda, Toyota, Mitsubishi, Daihatsu, Hyundai, Suzuki</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari kode warna, merek..."
                value={formulaSearch}
                onChange={(e) => setFormulaSearch(e.target.value)}
                className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFormulas.map(f => (
              <div key={f.id} className="p-4 bg-[#0F172A] border border-slate-700/80 rounded-xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-bold font-mono">
                    {f.carBrand}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">Code: {f.colorCode}</span>
                </div>

                <h4 className="text-sm font-bold text-white">{f.colorName}</h4>
                <p className="text-xs text-slate-400">{f.paintSystem}</p>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Toner Ratios:</p>
                  {f.toners.map((t, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                      <span>{t.tonerName}</span>
                      <span className="font-mono font-bold text-indigo-400">{t.percentageRatio}%</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFormula(f);
                      setActiveTab('CALCULATOR');
                      toast.success(`Formula OEM [${f.colorCode}] ${f.colorName} dimuat ke timbangan mixing!`);
                    }}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 flex items-center gap-1 transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Gunakan Formula Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
