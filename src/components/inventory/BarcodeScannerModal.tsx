import { useState, useEffect } from 'react';
import { 
  QrCode, Barcode, Printer, Camera, X, CheckCircle2, 
  Search, Package, MapPin, AlertCircle, RefreshCw, Layers,
  ArrowDownRight, ArrowUpRight, ShieldCheck, Tag, FileText,
  Truck, Calendar, User, Wrench, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { ExtendedPart } from '../../types/inventory';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { toast } from 'sonner';

export type ScannerModalMode = 'SCAN' | 'INTAKE' | 'ALLOCATION' | 'RELOCATE' | 'PRINT_LABEL';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: ExtendedPart[];
  onSelectPart?: (part: ExtendedPart) => void;
  onStockMovement?: (
    type: 'IN' | 'OUT', 
    part: ExtendedPart, 
    qty: number, 
    spkOrPo: string, 
    notes: string,
    extra?: { batchNumber?: string; expiryDate?: string; newBinLocation?: string }
  ) => void;
  mode?: ScannerModalMode;
  initialPart?: ExtendedPart | null;
  activeSpks?: Array<{
    spkNumber: string;
    plateNumber: string;
    vehicleModel: string;
    stage?: string;
  }>;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  parts,
  onSelectPart,
  onStockMovement,
  mode = 'SCAN',
  initialPart = null,
  activeSpks = [
    { spkNumber: 'SPK-2026-0850', plateNumber: 'B 1984 TYZ', vehicleModel: 'Innova Zenix Q Hybrid', stage: 'Dempul & Cat' },
    { spkNumber: 'SPK-2026-0875', plateNumber: 'B 2341 TZA', vehicleModel: 'Honda CR-V 1.5 Turbo', stage: 'Bongkar & Ketok' },
    { spkNumber: 'SPK-2026-0890', plateNumber: 'B 9088 UAX', vehicleModel: 'Mitsubishi Xpander Cross', stage: 'Pasang & Finishing' },
    { spkNumber: 'SPK-2026-0902', plateNumber: 'D 1455 AKL', vehicleModel: 'Toyota Fortuner GR-S', stage: 'Cat Oven' },
    { spkNumber: 'SPK-2026-0914', plateNumber: 'B 1120 SSN', vehicleModel: 'Hyundai Ioniq 5 EV', stage: 'Poles & QC' }
  ]
}: BarcodeScannerModalProps) {
  const [activeMode, setActiveMode] = useState<ScannerModalMode>(mode);
  const [selectedPart, setSelectedPart] = useState<ExtendedPart | null>(initialPart || parts[0] || null);
  const [scanInput, setScanInput] = useState('');
  const [scannedResult, setScannedResult] = useState<ExtendedPart | null>(initialPart || null);
  const [labelSize, setLabelSize] = useState<'50x30' | '70x40' | '100x50'>('70x40');
  const [isCameraActive, setIsCameraActive] = useState(true);

  // Inbound Stock Intake Form States
  const [intakeQty, setIntakeQty] = useState('1');
  const [intakePoNumber, setIntakePoNumber] = useState('PO-2026-0899');
  const [intakeSupplier, setIntakeSupplier] = useState('');
  const [intakeBatchNumber, setIntakeBatchNumber] = useState('');
  const [intakeExpiryDate, setIntakeExpiryDate] = useState('');
  const [intakeUnitCost, setIntakeUnitCost] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('Penerimaan stok masuk dari supplier via barcode scanner');

  // Part Allocation Form States (Zero Leakage SPK-bound)
  const [selectedSpk, setSelectedSpk] = useState(activeSpks[0]?.spkNumber || 'SPK-2026-0850');
  const [allocationQty, setAllocationQty] = useState('1');
  const [allocationStage, setAllocationStage] = useState('Ketok & Dempul');
  const [allocationMechanic, setAllocationMechanic] = useState('Agus Santoso (Mekanik)');
  const [allocationNotes, setAllocationNotes] = useState('Alokasi part penggantian panel SPK');

  // Bin Relocation State
  const [targetBinLocation, setTargetBinLocation] = useState('');

  // Continuous Scan Mode
  const [continuousScanMode, setContinuousScanMode] = useState(false);
  const [recentScanHistory, setRecentScanHistory] = useState<Array<{ code: string; partName: string; time: string }>>([]);

  // Reset when initialPart or mode prop changes
  useEffect(() => {
    if (initialPart) {
      setSelectedPart(initialPart);
      setScannedResult(initialPart);
      setIntakeUnitCost(String(initialPart.unitCost));
      setIntakeSupplier(initialPart.supplierName);
      setTargetBinLocation(initialPart.binLocation);
    }
  }, [initialPart]);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    if (scannedResult) {
      setIntakeUnitCost(String(scannedResult.unitCost));
      setIntakeSupplier(scannedResult.supplierName);
      setTargetBinLocation(scannedResult.binLocation);
    }
  }, [scannedResult]);

  if (!isOpen) return null;

  // Handle scanned barcode/QR code string from Camera or Search input
  const processDecodedBarcode = (codeString: string) => {
    const query = codeString.trim().toLowerCase();
    if (!query) return;

    // Check if it matches an SPK QR Code directly (e.g. SPK-2026-0850 or TRACK:...)
    const spkMatch = activeSpks.find(s => 
      s.spkNumber.toLowerCase() === query ||
      query.includes(s.spkNumber.toLowerCase()) ||
      s.plateNumber.toLowerCase().replace(/\s+/g, '') === query.replace(/\s+/g, '')
    );

    if (spkMatch && activeMode === 'ALLOCATION') {
      setSelectedSpk(spkMatch.spkNumber);
      toast.success(`SPK Terdeteksi: ${spkMatch.spkNumber} (${spkMatch.plateNumber})`);
      return;
    }

    // Find in parts inventory
    const found = parts.find(
      p => p.barcode.toLowerCase() === query || 
           p.sku.toLowerCase() === query ||
           p.name.toLowerCase().includes(query)
    );

    if (found) {
      setScannedResult(found);
      setSelectedPart(found);
      setIntakeUnitCost(String(found.unitCost));
      setIntakeSupplier(found.supplierName);
      setTargetBinLocation(found.binLocation);

      setRecentScanHistory(prev => [
        { code: found.barcode, partName: found.name, time: new Date().toLocaleTimeString('id-ID') },
        ...prev.slice(0, 4)
      ]);

      toast.success(`Part Ditemukan: [${found.sku}] ${found.name}`);
      if (onSelectPart) onSelectPart(found);

      // In continuous scan mode with auto intake
      if (continuousScanMode && activeMode === 'INTAKE' && onStockMovement) {
        onStockMovement('IN', found, 1, intakePoNumber, 'Quick continuous intake +1 via Camera Barcode');
      }
    } else {
      toast.error(`Barcode / SKU "${codeString}" tidak terdaftar di katalog suku cadang!`);
    }
  };

  // Execute Inbound Stock Intake
  const handleExecuteIntake = () => {
    if (!scannedResult) {
      toast.error('Scan atau pilih part terlebih dahulu!');
      return;
    }
    const qty = parseInt(intakeQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Jumlah kuantiti masuk harus lebih dari 0!');
      return;
    }
    if (!intakePoNumber.trim()) {
      toast.error('Nomor Surat Jalan / PO wajib diisi!');
      return;
    }

    if (onStockMovement) {
      onStockMovement(
        'IN',
        scannedResult,
        qty,
        intakePoNumber,
        intakeNotes || `Penerimaan barang dari ${intakeSupplier || scannedResult.supplierName}`,
        {
          batchNumber: intakeBatchNumber || undefined,
          expiryDate: intakeExpiryDate || undefined
        }
      );
      toast.success(`Stok Masuk Berhasil: +${qty} ${scannedResult.unit} untuk ${scannedResult.sku}`);
      onClose();
    } else {
      toast.success(`Stok intake tercatat: +${qty} ${scannedResult.unit}`);
      onClose();
    }
  };

  // Execute Part Allocation to Work Order (SPK)
  const handleExecuteAllocation = () => {
    if (!scannedResult) {
      toast.error('Scan atau pilih part terlebih dahulu!');
      return;
    }
    const qty = parseInt(allocationQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Jumlah alokasi harus lebih dari 0!');
      return;
    }
    if (!selectedSpk) {
      toast.error('Pilih nomor SPK tujuan alokasi!');
      return;
    }
    if (qty > scannedResult.stockQuantity) {
      toast.error(`Stok fisik tidak mencukupi! Tersedia: ${scannedResult.stockQuantity} ${scannedResult.unit}`);
      return;
    }

    const spkObj = activeSpks.find(s => s.spkNumber === selectedSpk);
    const spkInfo = spkObj ? `${spkObj.spkNumber} (${spkObj.plateNumber})` : selectedSpk;

    if (onStockMovement) {
      onStockMovement(
        'OUT',
        scannedResult,
        qty,
        selectedSpk,
        `Alokasi SPK ${spkInfo} - Tahap: ${allocationStage} - Mekanik: ${allocationMechanic}`
      );
      toast.success(`Part Berhasil Dialokasikan ke ${selectedSpk}: -${qty} ${scannedResult.unit}`);
      onClose();
    } else {
      toast.success(`Part dialokasikan ke ${selectedSpk}`);
      onClose();
    }
  };

  // Execute Bin Relocation
  const handleExecuteRelocation = () => {
    if (!scannedResult || !targetBinLocation.trim()) {
      toast.error('Tentukan lokasi rak baru!');
      return;
    }
    if (onStockMovement) {
      onStockMovement(
        'IN',
        scannedResult,
        0, // 0 quantity for location update
        'RELOKASI-RAK',
        `Pindah rak penyimpanan dari ${scannedResult.binLocation} ke ${targetBinLocation}`,
        { newBinLocation: targetBinLocation }
      );
    }
    scannedResult.binLocation = targetBinLocation;
    toast.success(`Lokasi rak [${scannedResult.sku}] diperbarui ke: ${targetBinLocation}`);
    onClose();
  };

  const handlePrint = () => {
    toast.success(`Mengirim label ${selectedPart?.sku} ke Thermal Printer Zebra/TSC...`);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-[#1E293B] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              {activeMode === 'PRINT_LABEL' ? (
                <Printer className="w-5 h-5" />
              ) : activeMode === 'INTAKE' ? (
                <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              ) : activeMode === 'ALLOCATION' ? (
                <ArrowUpRight className="w-5 h-5 text-amber-400" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>
                  {activeMode === 'SCAN' && 'Camera Barcode & QR Code Scanner'}
                  {activeMode === 'INTAKE' && 'Inbound Stock Intake (Penerimaan Barang)'}
                  {activeMode === 'ALLOCATION' && 'Part Allocation Tracking (Alokasi SPK)'}
                  {activeMode === 'RELOCATE' && 'Relokasi & Verifikasi Rak (Bin Transfer)'}
                  {activeMode === 'PRINT_LABEL' && 'Cetak Label Thermal Barcode (Zebra / TSC)'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  GUDANG PRO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pemindai barcode kamera & alokasi material bengkel zero leakage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveMode('SCAN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMode === 'SCAN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Part
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('INTAKE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMode === 'INTAKE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Inbound Intake
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('ALLOCATION')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMode === 'ALLOCATION' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Alokasi SPK
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('PRINT_LABEL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMode === 'PRINT_LABEL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Label
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (2-Column Responsive Layout) */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeMode !== 'PRINT_LABEL' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Real Camera Viewfinder & Manual Input (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Live Camera Scanner Component */}
                <CameraBarcodeScanner
                  isActive={isCameraActive}
                  onScanSuccess={processDecodedBarcode}
                />

                {/* Manual Barcode Search Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Input Manual Barcode / SKU / Nama Part:</span>
                    <span className="text-slate-500 font-mono text-[10px]">Tekan Enter untuk memproses</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            processDecodedBarcode(scanInput);
                          }
                        }}
                        placeholder="Contoh: 899100100101, BPR-FR-CRV22, atau Bumper..."
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => processDecodedBarcode(scanInput)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Cari
                    </button>
                  </div>
                </div>

                {/* Quick Simulation Barcode Chips */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Barcode Sampel Database Gudang (Klik untuk Tes):</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {parts.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setScanInput(p.barcode);
                          processDecodedBarcode(p.barcode);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all text-left ${
                          scannedResult?.id === p.id 
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold' 
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="text-slate-400 mr-1">[{p.sku}]</span>
                        <span>{p.barcode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Scans Strip */}
                {recentScanHistory.length > 0 && (
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Riwayat Pemindaian Terkini:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentScanHistory.map((h, i) => (
                        <div key={i} className="text-[10px] bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-300 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{h.code}</span>
                          <span className="text-slate-500">({h.time})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Scanned Result Card & Action Forms (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Result Card */}
                {scannedResult ? (
                  <div className="p-4 bg-[#1E293B] border border-indigo-500/30 rounded-2xl space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                        {scannedResult.sku}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Barcode: {scannedResult.barcode}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{scannedResult.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{scannedResult.category} &bull; {scannedResult.supplierName}</p>
                    </div>

                    {/* Stock Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500">Lokasi Rak</p>
                        <p className="font-bold text-indigo-300 flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          {scannedResult.binLocation}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Stok Fisik</p>
                        <p className="font-bold text-emerald-400 font-mono">
                          {scannedResult.stockQuantity} {scannedResult.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500">Alokasi SPK</p>
                        <p className="font-bold text-amber-400 font-mono">
                          {scannedResult.reservedQuantity} {scannedResult.unit}
                        </p>
                      </div>
                    </div>

                    {/* FORM SPECIFIC FOR EACH MODE */}
                    
                    {/* MODE 1: SCAN & VERIFY QUICK SHORTCUTS */}
                    {activeMode === 'SCAN' && (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveMode('INTAKE')}
                            className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                            Inbound Intake
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveMode('ALLOCATION')}
                            className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                            Alokasi ke SPK
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPart(scannedResult);
                            setActiveMode('PRINT_LABEL');
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak Label Thermal Zebra/TSC
                        </button>
                      </div>
                    )}

                    {/* MODE 2: INBOUND STOCK INTAKE */}
                    {activeMode === 'INTAKE' && (
                      <div className="pt-2 border-t border-slate-800 space-y-3">
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300">
                          <p className="font-semibold flex items-center gap-1">
                            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                            Form Penerimaan Barang (Goods Receipt)
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Qty Masuk ({scannedResult.unit}) *</label>
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                min="1"
                                value={intakeQty}
                                onChange={(e) => setIntakeQty(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">No. Surat Jalan / PO *</label>
                            <input
                              type="text"
                              value={intakePoNumber}
                              onChange={(e) => setIntakePoNumber(e.target.value)}
                              placeholder="PO-2026-XXXX"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs mt-1 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Quick Quantity Presets */}
                        <div className="flex gap-1.5">
                          <span className="text-[10px] text-slate-500 self-center">Preset:</span>
                          {[1, 5, 10, 20, 50].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setIntakeQty(String(val))}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] font-mono text-slate-300"
                            >
                              +{val}
                            </button>
                          ))}
                        </div>

                        {scannedResult.category === 'Paint & Chemical' && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">No. Batch / Lot</label>
                              <input
                                type="text"
                                value={intakeBatchNumber}
                                onChange={(e) => setIntakeBatchNumber(e.target.value)}
                                placeholder="LOT-2026-XX"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">Tanggal Expired</label>
                              <input
                                type="date"
                                value={intakeExpiryDate}
                                onChange={(e) => setIntakeExpiryDate(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs mt-1"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleExecuteIntake}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Simpan & Tambah Stok Masuk
                        </button>
                      </div>
                    )}

                    {/* MODE 3: PART ALLOCATION TO SPK */}
                    {activeMode === 'ALLOCATION' && (
                      <div className="pt-2 border-t border-slate-800 space-y-3">
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-300">
                          <p className="font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            Alokasi Part ke SPK (Zero Stock Leakage)
                          </p>
                        </div>

                        {/* SPK Target Selector */}
                        <div className="space-y-1 text-xs">
                          <label className="text-[10px] font-bold text-slate-400">Pilih Work Order / SPK Tujuan *</label>
                          <select
                            value={selectedSpk}
                            onChange={(e) => setSelectedSpk(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          >
                            {activeSpks.map(s => (
                              <option key={s.spkNumber} value={s.spkNumber}>
                                [{s.spkNumber}] {s.plateNumber} - {s.vehicleModel} ({s.stage})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Qty Alokasi ({scannedResult.unit}) *</label>
                            <input
                              type="number"
                              min="1"
                              max={scannedResult.stockQuantity}
                              value={allocationQty}
                              onChange={(e) => setAllocationQty(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500 mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Tahap Pengerjaan</label>
                            <select
                              value={allocationStage}
                              onChange={(e) => setAllocationStage(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs mt-1"
                            >
                              <option>Bongkar & Ketok</option>
                              <option>Las & Tarik Body</option>
                              <option>Dempul & Epoxy</option>
                              <option>Cat Oven & Poles</option>
                              <option>Pasang & Finishing</option>
                            </select>
                          </div>
                        </div>

                        <div className="text-xs">
                          <label className="text-[10px] font-bold text-slate-400">Mekanik Penerima</label>
                          <input
                            type="text"
                            value={allocationMechanic}
                            onChange={(e) => setAllocationMechanic(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs mt-1"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleExecuteAllocation}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Konfirmasi Alokasi ke SPK
                        </button>
                      </div>
                    )}

                    {/* MODE 4: BIN RELOCATION */}
                    {activeMode === 'RELOCATE' && (
                      <div className="pt-2 border-t border-slate-800 space-y-3 text-xs">
                        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-2.5 text-indigo-300">
                          <p className="font-semibold">Relokasi Tempat Penyimpanan Rak</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400">Lokasi Rak Baru:</label>
                          <input
                            type="text"
                            value={targetBinLocation}
                            onChange={(e) => setTargetBinLocation(e.target.value)}
                            placeholder="Contoh: RAK-B2-04, LEM-CAT-02"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono mt-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleExecuteRelocation}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all"
                        >
                          Update Lokasi Rak
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="h-full min-h-[220px] bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <Barcode className="w-12 h-12 text-slate-700 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Belum Ada Part yang Dipindai</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                      Arahkan kamera ke barcode part atau klik salah satu barcode sampel di sebelah kiri.
                    </p>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* PRINT LABEL VIEW */
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Part Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Part untuk Dicetak Label Barcode:
                </label>
                <select
                  value={selectedPart?.id || ''}
                  onChange={(e) => {
                    const p = parts.find(x => x.id === Number(e.target.value));
                    if (p) setSelectedPart(p);
                  }}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {parts.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name} - Lokasi: {p.binLocation} (Stok: {p.stockQuantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Label Size Selection */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Ukuran Label Thermal:</span>
                {(['50x30', '70x40', '100x50'] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setLabelSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                      labelSize === size
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold shadow'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {size} mm (Standard)
                  </button>
                ))}
              </div>

              {/* Thermal Label Visual Preview */}
              {selectedPart && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Visual Preview Thermal Label (Zebra / TSC):
                  </p>
                  
                  <div className="bg-white text-slate-900 p-5 rounded-xl border border-slate-300 shadow-2xl max-w-sm mx-auto font-sans">
                    <div className="border-b-2 border-black pb-1 mb-2 flex items-center justify-between">
                      <span className="font-black text-xs tracking-wider uppercase">BENGKEL PRO ERP</span>
                      <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded font-mono">
                        {selectedPart.binLocation}
                      </span>
                    </div>

                    <div className="mb-2">
                      <p className="font-mono font-black text-sm text-black tracking-tight">{selectedPart.sku}</p>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mt-0.5">
                        {selectedPart.name}
                      </p>
                    </div>

                    {/* Barcode & QR layout */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-300">
                      <div className="flex flex-col items-center">
                        {/* High Quality Barcode Lines */}
                        <div className="h-10 flex items-center gap-[2px] bg-slate-100 p-1 rounded">
                          <div className="w-1.5 h-8 bg-black"></div>
                          <div className="w-0.5 h-8 bg-black"></div>
                          <div className="w-2 h-8 bg-black"></div>
                          <div className="w-0.5 h-8 bg-black"></div>
                          <div className="w-1.5 h-8 bg-black"></div>
                          <div className="w-2 h-8 bg-black"></div>
                          <div className="w-0.5 h-8 bg-black"></div>
                          <div className="w-1 h-8 bg-black"></div>
                          <div className="w-1.5 h-8 bg-black"></div>
                          <div className="w-0.5 h-8 bg-black"></div>
                          <div className="w-1.5 h-8 bg-black"></div>
                          <div className="w-2 h-8 bg-black"></div>
                          <div className="w-0.5 h-8 bg-black"></div>
                          <div className="w-1.5 h-8 bg-black"></div>
                        </div>
                        <span className="font-mono text-[10px] font-bold mt-1 tracking-wider">{selectedPart.barcode}</span>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded p-1 flex items-center justify-center">
                          <QrCode className="w-9 h-9 text-white" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 block mt-1">
                          Min: {selectedPart.minStockLevel} {selectedPart.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Camera Scanner Module Ready &bull; Zero Stock Leakage Active</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition-colors"
            >
              Tutup
            </button>
            {activeMode === 'PRINT_LABEL' && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-colors shadow-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Label Sekarang
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
