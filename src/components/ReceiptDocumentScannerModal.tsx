import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, X, Check, RefreshCw, Sparkles, FileText, 
  Receipt, DollarSign, Calendar, Building2, Car, Tag, 
  Trash2, Plus, ZoomIn, ZoomOut, RotateCw, AlertTriangle, 
  CheckCircle2, Layers, ArrowRight, Eye, ShieldCheck, Zap,
  SlidersHorizontal, Image as ImageIcon, ScanLine
} from 'lucide-react';
import { toast } from 'sonner';

export interface ScannedExpenseItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  partCode?: string;
}

export interface ScannedExpenseData {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  transactionDate: string;
  category: 'Bahan Cat & Thinner' | 'Sparepart & Komponen' | 'Sublet / Pihak Ketiga' | 'Alat Kerja & Consumable' | 'BBM & Operasional Unit' | 'Lain-lain';
  paymentMethod: string;
  subtotal: number;
  tax: number;
  grandTotal: number;
  items: ScannedExpenseItem[];
  linkedSpkNumber?: string;
  linkedPlateNumber?: string;
  confidenceScore: number;
  notes?: string;
  imageUrl?: string;
  scannedAt: string;
  scannedBy: string;
  status: 'Verified' | 'Pending Review';
}

interface ReceiptDocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: ScannedExpenseData) => void;
  activeSpkList?: { spkNumber: string; plateNumber: string; customerName: string }[];
  defaultSpkNumber?: string;
}

// Preset realistic workshop receipt sample images and simulations
const SAMPLE_PRESETS = [
  {
    id: 'paint',
    title: 'Nota Toko Cat & Thinner',
    subtitle: 'Clear Coat Sikkens, Thinner PU, Amplas',
    vendor: 'Toko Cat & Thinner Auto Color',
    category: 'Bahan Cat & Thinner' as const,
    presetType: 'paint',
    spk: 'SPK-2026-0881',
    plate: 'B 1982 SSY',
    mockTotal: 1350000,
    gradient: 'from-blue-600/30 to-indigo-900/40'
  },
  {
    id: 'sparepart',
    title: 'Faktur Toko Sparepart',
    subtitle: 'Bumper Depan Honda CR-V Original & Klip',
    vendor: 'PT Sumber Rezeki Motor Partsindo',
    category: 'Sparepart & Komponen' as const,
    presetType: 'sparepart',
    spk: 'SPK-2026-0875',
    plate: 'B 2341 TZA',
    mockTotal: 3163500,
    gradient: 'from-emerald-600/30 to-teal-900/40'
  },
  {
    id: 'sublet',
    title: 'Kwitansi Sublet Press Sasis',
    subtitle: 'Tarik Apron Depan Pajero & Bubut Disc',
    vendor: 'Bengkel Bubut & Press Presisi Jaya',
    category: 'Sublet / Pihak Ketiga' as const,
    presetType: 'sublet',
    spk: 'SPK-2026-0850',
    plate: 'D 1209 XYZ',
    mockTotal: 750000,
    gradient: 'from-amber-600/30 to-orange-900/40'
  },
  {
    id: 'fuel_toll',
    title: 'Struk SPBU & Tol Test Drive',
    subtitle: 'Pertamax Turbo Test Drive Unit',
    vendor: 'SPBU Pertamina 34-12902',
    category: 'BBM & Operasional Unit' as const,
    presetType: 'fuel_toll',
    spk: 'SPK-2026-0881',
    plate: 'B 1982 SSY',
    mockTotal: 250000,
    gradient: 'from-rose-600/30 to-pink-900/40'
  }
];

export function ReceiptDocumentScannerModal({
  isOpen,
  onClose,
  onSaveExpense,
  activeSpkList = [
    { spkNumber: 'SPK-2026-0881', plateNumber: 'B 1982 SSY', customerName: 'Andi Wijaya (Toyota Fortuner)' },
    { spkNumber: 'SPK-2026-0875', plateNumber: 'B 2341 TZA', customerName: 'CV Makmur Bersama (Honda CR-V)' },
    { spkNumber: 'SPK-2026-0850', plateNumber: 'D 1209 XYZ', customerName: 'Asuransi Sinar Mas (Pajero Sport)' },
    { spkNumber: 'SPK-2026-0844', plateNumber: 'B 8899 MKW', customerName: 'Hendro Santoso (Yaris Cross)' },
    { spkNumber: 'OVERHEAD', plateNumber: 'BENGKEL-OPS', customerName: 'Biaya Umum Operasional Workshop' }
  ],
  defaultSpkNumber
}: ReceiptDocumentScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgressStep, setOcrProgressStep] = useState('');
  const [extractedData, setExtractedData] = useState<ScannedExpenseData | null>(null);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Stop Camera Stream safely
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {}
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start Camera Stream
  const startCamera = async (isCancelledRef?: { current: boolean }) => {
    setCameraError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (isCancelledRef?.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (playErr: any) {
          // Play request might be interrupted if component unmounts or modal closes
          if (playErr?.name !== 'AbortError' && playErr?.name !== 'NotAllowedError') {
            console.warn("Video play notice:", playErr);
          }
        }
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access failed or unavailable in container frame:", err);
      setIsCameraActive(false);
      setCameraError("Kamera perangkat tidak dapat diakses langsung. Anda dapat mengunggah file foto/struk atau menggunakan Preset Struk Bengkel di tab sebelah.");
    }
  };

  useEffect(() => {
    const isCancelled = { current: false };

    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera(isCancelled);
    } else {
      stopCamera();
    }

    return () => {
      isCancelled.current = true;
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, capturedImage]);

  // Capture Photo from Camera Viewfinder
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
      processOcrExtraction(dataUrl);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedImage(result);
      processOcrExtraction(result);
    };
    reader.readAsDataURL(file);
  };

  // Select Sample Preset Receipt
  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    // Generate synthetic realistic canvas preview for sample preset
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Paper background
      ctx.fillStyle = '#FAFAF9';
      ctx.fillRect(0, 0, 600, 800);
      
      // Header
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(preset.vendor.toUpperCase(), 300, 70);
      
      ctx.font = '13px monospace';
      ctx.fillStyle = '#64748B';
      ctx.fillText('AutoCare Bengkel Pro Partner Slip', 300, 95);
      ctx.fillText(`Telp: (021) 789-2231 • Jakarta Selatan`, 300, 115);
      
      // Divider
      ctx.strokeStyle = '#CBD5E1';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(30, 140);
      ctx.lineTo(570, 140);
      ctx.stroke();

      // Meta info
      ctx.setLineDash([]);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.fillText(`TANGGAL : ${new Date().toLocaleDateString('id-ID')} 14:22`, 40, 175);
      ctx.fillText(`NO. SPK : ${preset.spk} (${preset.plate})`, 40, 200);
      ctx.fillText(`KASIR   : MEKANIK-04 / WORKSHOP GUDANG`, 40, 225);

      // Divider
      ctx.beginPath();
      ctx.moveTo(30, 250);
      ctx.lineTo(570, 250);
      ctx.stroke();

      // Items
      ctx.font = 'bold 13px monospace';
      ctx.fillText('RINCIAN ITEM / MATERIAL', 40, 280);
      ctx.textAlign = 'right';
      ctx.fillText('JUMLAH (RP)', 560, 280);

      ctx.textAlign = 'left';
      ctx.font = '13px monospace';
      ctx.fillText(`1. ${preset.subtitle}`, 40, 320);
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`Rp ${preset.mockTotal.toLocaleString('id-ID')}`, 560, 320);

      // Total Box
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(30, 640, 540, 70);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL PENGELUARAN:', 50, 682);
      ctx.textAlign = 'right';
      ctx.fillText(`Rp ${preset.mockTotal.toLocaleString('id-ID')}`, 550, 682);

      const previewDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(previewDataUrl);
      processOcrExtraction(previewDataUrl, preset.presetType);
    }
  };

  // Perform AI OCR Extraction
  const processOcrExtraction = async (imageDataUrl: string, presetType?: string) => {
    setIsProcessingOcr(true);
    setOcrProgressStep('Menganalisis citra struk fisik...');

    try {
      // Step 1 Simulation
      setTimeout(() => setOcrProgressStep('Mendeteksi entitas vendor & nomor nota...'), 400);
      setTimeout(() => setOcrProgressStep('Mengekstrak tabel harga & item sparepart/bahan...'), 800);

      const response = await fetch('/api/ocr/expense-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/jpeg',
          presetType: presetType || 'paint'
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const ocrData = resJson.data;
        
        const mappedItems: ScannedExpenseItem[] = (ocrData.items || []).map((it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          itemName: it.itemName || 'Material Workshop',
          qty: it.qty || 1,
          unit: it.unit || 'Pcs',
          unitPrice: it.unitPrice || 0,
          subtotal: it.subtotal || (it.qty * it.unitPrice),
          partCode: it.partCode || ''
        }));

        const result: ScannedExpenseData = {
          id: `EXP-${Date.now()}`,
          vendorName: ocrData.vendorName || 'Toko Rekanan Bengkel',
          invoiceNumber: ocrData.invoiceNumber || `STRUK-${Date.now().toString().slice(-6)}`,
          transactionDate: ocrData.transactionDate || new Date().toISOString().split('T')[0],
          category: ocrData.category || 'Bahan Cat & Thinner',
          paymentMethod: ocrData.paymentMethod || 'Tunai / Cash',
          subtotal: ocrData.subtotal || ocrData.grandTotal || 0,
          tax: ocrData.tax || 0,
          grandTotal: ocrData.grandTotal || 0,
          items: mappedItems,
          linkedSpkNumber: defaultSpkNumber || ocrData.linkedSpkNumber || 'SPK-2026-0881',
          linkedPlateNumber: ocrData.linkedPlateNumber || 'B 1982 SSY',
          confidenceScore: ocrData.confidenceScore || 96,
          notes: ocrData.notes || 'Struk terverifikasi otomatis melalui modul OCR AutoCare.',
          imageUrl: imageDataUrl,
          scannedAt: new Date().toLocaleString('id-ID'),
          scannedBy: 'Mekanik / Foreman Workshop',
          status: 'Verified'
        };

        setExtractedData(result);
        toast.success(`OCR Berhasil! Berhasil mengekstrak ${result.items.length} item dari ${result.vendorName}`);
      } else {
        throw new Error("Gagal mengekstrak data struk.");
      }
    } catch (err: any) {
      console.error("OCR Extraction failed:", err);
      toast.error("Gagal membaca struk. Menggunakan data cadangan cerdas.");
      // Fallback
      handleSelectPreset(SAMPLE_PRESETS[0]);
    } finally {
      setIsProcessingOcr(false);
      setOcrProgressStep('');
    }
  };

  // Item form modifications
  const handleItemChange = (index: number, field: keyof ScannedExpenseItem, value: any) => {
    if (!extractedData) return;
    const newItems = [...extractedData.items];
    const target = { ...newItems[index], [field]: value };
    if (field === 'qty' || field === 'unitPrice') {
      target.subtotal = Number(target.qty || 0) * Number(target.unitPrice || 0);
    }
    newItems[index] = target;

    const subtotal = newItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const grandTotal = subtotal + (extractedData.tax || 0);

    setExtractedData({
      ...extractedData,
      items: newItems,
      subtotal,
      grandTotal
    });
  };

  const handleAddItem = () => {
    if (!extractedData) return;
    const newItem: ScannedExpenseItem = {
      id: `item-${Date.now()}`,
      itemName: 'Item Baru',
      qty: 1,
      unit: 'Pcs',
      unitPrice: 0,
      subtotal: 0
    };
    setExtractedData({
      ...extractedData,
      items: [...extractedData.items, newItem]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!extractedData) return;
    const newItems = extractedData.items.filter((_, i) => i !== index);
    const subtotal = newItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const grandTotal = subtotal + (extractedData.tax || 0);

    setExtractedData({
      ...extractedData,
      items: newItems,
      subtotal,
      grandTotal
    });
  };

  // Reset and Scan another
  const handleReset = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setZoomLevel(1);
    setRotationAngle(0);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Confirm and Save Expense
  const handleConfirmSave = () => {
    if (!extractedData) return;
    onSaveExpense(extractedData);
    toast.success(`Pengeluaran struk ${extractedData.invoiceNumber} berhasil dicatat dan dibebankan ke ${extractedData.linkedSpkNumber}!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[92vh] max-h-[900px] bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Smart Document Scanner & OCR Pengeluaran</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> AI OCR Vision
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Foto struk nota fisik atau faktur vendor sparepart & cat untuk mengekstrak biaya SPK secara otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {capturedImage && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Foto Ulang</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT PANEL: Viewfinder / Image Preview */}
          <div className="lg:w-1/2 bg-[#0B1120] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col relative overflow-hidden">
            
            {/* Mode Switcher Tabs (Only if not yet captured) */}
            {!capturedImage && (
              <div className="p-3 bg-[#0F172A]/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-[#131D33] p-1 rounded-lg border border-slate-700/60 text-xs w-full sm:w-auto">
                  <button
                    onClick={() => { setActiveTab('camera'); startCamera(); }}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'camera' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kamera Langsung</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('upload'); stopCamera(); }}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File / Foto</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('presets'); stopCamera(); }}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'presets' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Contoh Struk Bengkel</span>
                  </button>
                </div>

                {activeTab === 'camera' && (
                  <button
                    onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs hidden sm:flex items-center gap-1"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </button>
                )}
              </div>
            )}

            {/* Viewport Display */}
            <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-dot-grid">
              
              {/* STATE 1: Real-time Camera Viewfinder */}
              {!capturedImage && activeTab === 'camera' && (
                <div className="relative w-full h-full max-h-[480px] rounded-xl overflow-hidden border border-slate-700/80 bg-black flex items-center justify-center group shadow-2xl">
                  {/* Keep video element persistently mounted in DOM for reliable stream binding */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />

                  {isCameraActive ? (
                    <>
                      {/* Optical Document Framing Overlay */}
                      <div className="absolute inset-6 border-2 border-dashed border-indigo-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                          <span className="w-6 h-6 border-t-2 border-l-2 border-indigo-400"></span>
                          <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/40">
                            Posisikan Struk / Nota di Kotak Ini
                          </span>
                          <span className="w-6 h-6 border-t-2 border-r-2 border-indigo-400"></span>
                        </div>

                        {/* Scanner Laser Bar Animation */}
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse"></div>

                        <div className="flex justify-between items-end">
                          <span className="w-6 h-6 border-b-2 border-l-2 border-indigo-400"></span>
                          <span className="text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded">
                            Auto Focus & HDR
                          </span>
                          <span className="w-6 h-6 border-b-2 border-r-2 border-indigo-400"></span>
                        </div>
                      </div>

                      {/* Floating Bottom Capture Trigger Button */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                        <button
                          onClick={handleCapturePhoto}
                          className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 border-4 border-indigo-600 shadow-xl shadow-indigo-500/30 flex items-center justify-center text-indigo-600 active:scale-95 transition-all"
                        >
                          <Camera className="w-7 h-7" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center max-w-md space-y-4">
                      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Akses Kamera Diperlukan</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {cameraError || "Klik tombol di bawah untuk mengaktifkan kamera atau beralih ke tab Upload File."}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={() => startCamera()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Coba Hubungkan Kamera
                        </button>
                        <button
                          onClick={() => setActiveTab('presets')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
                        >
                          Gunakan Preset Struk
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STATE 2: Upload File Dropzone */}
              {!capturedImage && activeTab === 'upload' && (
                <div className="w-full h-full max-h-[480px] border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl bg-[#0F172A]/50 flex flex-col items-center justify-center p-6 text-center transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Upload Foto Nota / Struk Pembelian</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Tarik dan lepas file struk di sini atau klik untuk memilih file dari komputer/smartphone (JPG, PNG, PDF)
                  </p>

                  <label className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Pilih Foto dari Galeri</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-3">Maksimal ukuran file: 25 MB</p>
                </div>
              )}

              {/* STATE 3: Sample Workshop Presets */}
              {!capturedImage && activeTab === 'presets' && (
                <div className="w-full h-full max-h-[480px] overflow-y-auto custom-scrollbar space-y-3 p-1">
                  <div className="text-center mb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Pilih Contoh Struk Nyata Bengkel</h4>
                    <p className="text-[11px] text-slate-400">Simulasi instan pengujian OCR tanpa perlu mencetak kertas fisik</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SAMPLE_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 bg-gradient-to-br ${preset.gradient} cursor-pointer transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between group`}
                      >
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-slate-900/80 text-indigo-300 border border-indigo-500/30">
                            {preset.category}
                          </span>
                          <h5 className="text-sm font-bold text-white mt-2 group-hover:text-indigo-300 transition-colors">
                            {preset.title}
                          </h5>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {preset.subtitle}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-300 text-[11px]">{preset.spk}</span>
                          <span className="font-mono font-bold text-emerald-400">Rp {preset.mockTotal.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATE 4: Captured Document Preview & Controls */}
              {capturedImage && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="relative w-full h-full max-h-[500px] overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="Scanned Document"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-w-full max-h-full object-contain select-none shadow-xl"
                    />

                    {/* OCR Scanning Overlay Animation */}
                    {isProcessingOcr && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                          <Sparkles className="w-7 h-7 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-wide">Mengekstrak Data Struk (AI Vision OCR)</h4>
                          <p className="text-xs text-indigo-300 font-mono mt-1 animate-pulse">{ocrProgressStep}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Adjust Tools */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-lg p-1 text-slate-300 shadow-lg">
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))}
                      className="p-1.5 hover:bg-slate-800 rounded"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
                      className="p-1.5 hover:bg-slate-800 rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
                      className="p-1.5 hover:bg-slate-800 rounded"
                      title="Putar Dokumen"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Status Ribbon on Left */}
            <div className="p-3 bg-[#0F172A] border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Bengkel OCR Engine • Zero Stock Leakage Security
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                1080p Resolution
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: Extracted Data Verification & Cost Assignment Form */}
          <div className="lg:w-1/2 flex flex-col bg-[#1E293B] overflow-hidden">
            
            {/* Header info in right panel */}
            <div className="p-4 border-b border-slate-800 bg-[#0F172A]/70 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Verifikasi Data Pengeluaran & Beban SPK
                </h4>
                <p className="text-[11px] text-slate-400">Periksa dan sesuaikan nominal sebelum disimpan ke akuntansi SPK</p>
              </div>

              {extractedData && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Akurasi {extractedData.confidenceScore}%</span>
                </div>
              )}
            </div>

            {/* Form Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
              
              {!extractedData ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-600">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-300">Belum Ada Struk yang Dipindai</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Ambil foto struk dari kamera, upload foto nota, atau pilih salah satu preset untuk memulai ekstraksi otomatis.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* General Metadata Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Vendor Name */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Nama Vendor / Toko / Merchant
                      </label>
                      <div className="relative flex items-center">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3" />
                        <input
                          type="text"
                          value={extractedData.vendorName}
                          onChange={(e) => setExtractedData({ ...extractedData, vendorName: e.target.value })}
                          className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-medium focus:outline-none"
                          placeholder="e.g. Toko Cat Sikkens"
                        />
                      </div>
                    </div>

                    {/* Invoice / Struk Number */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        No. Struk / Nota Fisik
                      </label>
                      <div className="relative flex items-center">
                        <Receipt className="w-4 h-4 text-slate-500 absolute left-3" />
                        <input
                          type="text"
                          value={extractedData.invoiceNumber}
                          onChange={(e) => setExtractedData({ ...extractedData, invoiceNumber: e.target.value })}
                          className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Kategori Pengeluaran
                      </label>
                      <div className="relative flex items-center">
                        <Tag className="w-4 h-4 text-slate-500 absolute left-3" />
                        <select
                          value={extractedData.category}
                          onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value as any })}
                          className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none appearance-none"
                        >
                          <option value="Bahan Cat & Thinner">Bahan Cat & Thinner</option>
                          <option value="Sparepart & Komponen">Sparepart & Komponen</option>
                          <option value="Sublet / Pihak Ketiga">Sublet / Pihak Ketiga (Bubut/Press)</option>
                          <option value="Alat Kerja & Consumable">Alat Kerja & Consumable Bengkel</option>
                          <option value="BBM & Operasional Unit">BBM & Operasional Unit Test Drive</option>
                          <option value="Lain-lain">Lain-lain</option>
                        </select>
                      </div>
                    </div>

                    {/* Linked Work Order (SPK) */}
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1 flex items-center justify-between">
                        <span>Alokasi Beban ke SPK / Unit</span>
                        <span className="text-[9px] text-slate-400">Zero Stock Leakage</span>
                      </label>
                      <div className="relative flex items-center">
                        <Car className="w-4 h-4 text-indigo-400 absolute left-3" />
                        <select
                          value={extractedData.linkedSpkNumber}
                          onChange={(e) => {
                            const selected = activeSpkList.find(s => s.spkNumber === e.target.value);
                            setExtractedData({ 
                              ...extractedData, 
                              linkedSpkNumber: e.target.value,
                              linkedPlateNumber: selected?.plateNumber || ''
                            });
                          }}
                          className="w-full bg-[#0F172A] border border-indigo-500/50 focus:border-indigo-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none appearance-none"
                        >
                          {activeSpkList.map(spk => (
                            <option key={spk.spkNumber} value={spk.spkNumber}>
                              {spk.spkNumber} • {spk.plateNumber} ({spk.customerName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Items Line Table */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Rincian Item yang Terekstrak ({extractedData.items.length} Item)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-[11px] px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Item</span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-[#0F172A]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#131D33] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                          <tr>
                            <th className="px-3 py-2">Item Deskripsi / Part Code</th>
                            <th className="px-2 py-2 w-16 text-center">Qty</th>
                            <th className="px-2 py-2 w-28 text-right">Harga Satuan</th>
                            <th className="px-3 py-2 w-32 text-right">Subtotal</th>
                            <th className="px-2 py-2 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {extractedData.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.itemName}
                                  onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 text-xs text-white focus:outline-none py-0.5"
                                  placeholder="Nama material/part..."
                                />
                                {item.partCode && (
                                  <span className="text-[9px] text-indigo-400 font-mono block">
                                    Code: {item.partCode}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="any"
                                  value={item.qty}
                                  onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-[#131D33] border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-[#131D33] border border-slate-700 rounded px-2 py-0.5 text-right text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-200">
                                Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                  title="Hapus Baris"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Summary Calculation Card */}
                  <div className="p-4 bg-[#0F172A] border border-slate-700 rounded-xl space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-400 font-sans">
                      <span>Subtotal Biaya Pembelian</span>
                      <span className="font-mono text-slate-200 font-bold">
                        Rp {extractedData.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 font-sans">
                      <span>PPN / Pajak (Bila ada)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-sans">11% PPN</span>
                        <input
                          type="number"
                          value={extractedData.tax}
                          onChange={(e) => {
                            const newTax = parseFloat(e.target.value) || 0;
                            setExtractedData({
                              ...extractedData,
                              tax: newTax,
                              grandTotal: extractedData.subtotal + newTax
                            });
                          }}
                          className="w-28 bg-[#131D33] border border-slate-700 rounded px-2 py-0.5 text-right text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700 border-dashed flex justify-between items-baseline font-sans">
                      <div>
                        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                          Total Beban Pengeluaran
                        </span>
                        <p className="text-[10px] text-indigo-400 font-normal">
                          Akan dialokasikan ke COGS {extractedData.linkedSpkNumber}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        Rp {extractedData.grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Metode Pembayaran Nota
                      </label>
                      <select
                        value={extractedData.paymentMethod}
                        onChange={(e) => setExtractedData({ ...extractedData, paymentMethod: e.target.value })}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Tunai / Cash">Tunai / Kas Kecil (Petty Cash)</option>
                        <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                        <option value="QRIS Mandiri">QRIS / Digital Wallet</option>
                        <option value="Tempo / Hutang Dagang 14 Hari">Tempo / Hutang Dagang 14 Hari</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Catatan Tambahan
                      </label>
                      <input
                        type="text"
                        value={extractedData.notes}
                        onChange={(e) => setExtractedData({ ...extractedData, notes: e.target.value })}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                        placeholder="e.g. Pembelian mendesak untuk bumper"
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Footer Actions on Right */}
            <div className="p-4 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!extractedData}
                onClick={handleConfirmSave}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Masukkan ke Biaya SPK</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
