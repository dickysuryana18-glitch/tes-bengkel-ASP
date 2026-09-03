import React, { useState } from 'react';
import { 
  Car, User, CheckCircle2, XCircle, FileText, 
  ShieldCheck, AlertTriangle, ChevronRight, Phone, MessageSquare,
  Wrench, Sparkles, Clock, Check, Download, Share2
} from 'lucide-react';
import { toast } from 'sonner';

export interface EstimatePreviewData {
  estimateId: string;
  customer: {
    name: string;
    phone: string;
    type: string;
  };
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    color: string;
  };
  insurancePolicy?: string;
  damagePoints: {
    id: string;
    panel: string;
    severity: string;
    suggestedAction: string;
    x: number;
    y: number;
  }[];
  lineItems: {
    id: string;
    type: 'jasa' | 'part';
    description: string;
    qty: number;
    unitPrice: number;
  }[];
  notes?: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING_CUSTOMER' | 'ACCEPTED' | 'DECLINED';
}

interface ClientEstimatePreviewProps {
  data?: EstimatePreviewData;
  onStatusChange?: (newStatus: 'ACCEPTED' | 'DECLINED', reason?: string) => void;
  onBackToErp?: () => void;
}

export function ClientEstimatePreview({ data: initialData, onStatusChange, onBackToErp }: ClientEstimatePreviewProps) {
  // If no data supplied, provide a complete fallback based on mock/localStorage or active state
  const [estimate, setEstimate] = useState<EstimatePreviewData>(() => {
    if (initialData) return initialData;
    
    // Check if query string has encoded data or localStorage
    const savedPreview = localStorage.getItem('bengkelpro_active_estimate_preview');
    if (savedPreview) {
      try {
        return JSON.parse(savedPreview);
      } catch (e) {
        console.error(e);
      }
    }

    return {
      estimateId: 'EST-2023-B1420KLA-8821',
      customer: {
        name: 'Bambang Pratama',
        phone: '0812-8912-8912',
        type: 'Insurance'
      },
      vehicle: {
        plate: 'B 1420 KLA',
        brand: 'Honda',
        model: 'HR-V SE 1.5 CVT',
        color: 'Modern Steel Metallic'
      },
      insurancePolicy: 'Garda Oto - No. Polis POL-8891289 (Deductible/OR Rp 300.000)',
      damagePoints: [
        { id: 'dp-1', panel: 'Pintu Depan Kanan', severity: 'Penyok Sedang', suggestedAction: 'Ketok Magic & Cat Oven Panel', x: 62, y: 48 },
        { id: 'dp-2', panel: 'Fender Kanan Depan', severity: 'Baret Ringan', suggestedAction: 'Poles Detail & Touch Up Cat', x: 78, y: 42 }
      ],
      lineItems: [
        { id: '1', type: 'jasa', description: 'Ketok Magic Pintu Kanan Depan', qty: 1, unitPrice: 350000 },
        { id: '2', type: 'part', description: 'Klip & Karet Pintu Original Honda', qty: 4, unitPrice: 25000 },
        { id: '3', type: 'jasa', description: 'Pengecatan Panel Pintu Kanan (Oven Cat Sikkens)', qty: 1, unitPrice: 750000 },
        { id: '4', type: 'jasa', description: 'Poles & Touch Up Fender Kanan', qty: 1, unitPrice: 200000 }
      ],
      notes: 'Estimasi pengerjaan estimasi 3-4 hari kerja setelah persetujuan. Garansi cat oven 6 bulan.',
      createdAt: '12 Okt 2023, 10:15 WIB',
      expiresAt: '19 Okt 2023, 23:59 WIB',
      status: 'PENDING_CUSTOMER'
    };
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    estimate.lineItems.forEach(item => {
      initial[item.id] = true;
    });
    return initial;
  });

  const [decisionNotes, setDecisionNotes] = useState('');
  const [signatureName, setSignatureName] = useState(estimate.customer.name);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Toggle optional items
  const toggleItem = (id: string) => {
    if (estimate.status !== 'PENDING_CUSTOMER') return;
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculations based on approved line items
  const activeLineItems = estimate.lineItems.filter(item => selectedItems[item.id]);
  const subtotal = activeLineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const ppn = subtotal * 0.11;
  const grandTotal = subtotal + ppn;

  const handleAcceptEstimate = () => {
    if (!signatureName.trim()) {
      toast.error('Mohon ketik nama lengkap Anda sebagai konfirmasi persetujuan.');
      return;
    }
    if (!agreedTerms) {
      toast.error('Mohon centang persetujuan syarat & ketentuan pengerjaan.');
      return;
    }

    setEstimate(prev => ({ ...prev, status: 'ACCEPTED' }));
    if (onStatusChange) {
      onStatusChange('ACCEPTED', decisionNotes);
    }
    toast.success('Terima kasih! Estimasi perbaikan telah Anda setujui.', {
      description: 'Notifikasi otomatis terkirim ke Service Advisor Bengkel Pro.'
    });
  };

  const handleDeclineEstimate = () => {
    if (!declineReason.trim()) {
      toast.error('Mohon berikan alasan penolakan/revisi.');
      return;
    }

    setEstimate(prev => ({ ...prev, status: 'DECLINED' }));
    setShowDeclineModal(false);
    if (onStatusChange) {
      onStatusChange('DECLINED', declineReason);
    }
    toast.warning('Estimasi ditolak / meminta revisi.', {
      description: 'Service Advisor kami akan menghubungi Anda segera.'
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Banner for Client */}
      <header className="bg-[#0F172A]/90 border-b border-slate-800 backdrop-blur sticky top-0 z-20 px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              B
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Bengkel Pro
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Portal Pelanggan
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Persetujuan Resmi Estimasi Biaya & Perbaikan Unit</p>
            </div>
          </div>

          {onBackToErp && (
            <button 
              onClick={onBackToErp}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              Kembali ke Dashboard ERP
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Status Callout Banner */}
        {estimate.status === 'ACCEPTED' ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3.5 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300">Estimasi Berhasil Disetujui</h3>
              <p className="text-xs text-emerald-400/80">
                Persetujuan elektronik atas nama <span className="font-semibold text-white">{signatureName}</span> telah diverifikasi. Job Card (SPK) sedang diproses ke bengkel.
              </p>
            </div>
          </div>
        ) : estimate.status === 'DECLINED' ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3.5 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-300">Estimasi Ditolak / Menunggu Diskusi Ulang</h3>
              <p className="text-xs text-rose-400/80">
                Service Advisor kami telah menerima catatan penolakan dan akan menghubungi kontak Anda segera.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">ID Estimasi Resmi</p>
                <p className="text-sm font-bold text-white font-mono">{estimate.estimateId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Berlaku hingga: <span className="font-semibold text-slate-200">{estimate.expiresAt}</span></span>
            </div>
          </div>
        )}

        {/* Section 1: Customer & Vehicle Profile Card */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Vehicle Info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{estimate.vehicle.plate}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                    {estimate.vehicle.color}
                  </span>
                </div>
                <p className="text-sm text-slate-300 font-medium">{estimate.vehicle.brand} {estimate.vehicle.model}</p>
                {estimate.insurancePolicy && (
                  <p className="text-xs text-indigo-400 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    {estimate.insurancePolicy}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Customer Info */}
            <div className="flex items-start gap-4 md:border-l md:border-slate-800 md:pl-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pemilik / Penanggung Jawab</p>
                <p className="text-sm font-bold text-white">{estimate.customer.name}</p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {estimate.customer.phone}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                    {estimate.customer.type}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Visual Damage Mapping Points */}
        {estimate.damagePoints.length > 0 && (
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Titik Kerusakan Terinspeksi ({estimate.damagePoints.length} Titik)</h2>
              </div>
              <span className="text-[11px] text-slate-400">Hasil Cek Fisik oleh SA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {estimate.damagePoints.map((dp, idx) => (
                <div key={dp.id || idx} className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-200">{dp.panel}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        dp.severity.includes('Parah') 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : dp.severity.includes('Sedang') 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {dp.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-300">Tindakan: {dp.suggestedAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Itemized Repair & Replacement Quotation Table */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0F172A]/70 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Rincian Jasa Perbaikan & Suku Cadang</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {estimate.status === 'PENDING_CUSTOMER' 
                  ? 'Anda dapat mencentang / menghapus centang item pekerjaan yang ingin disetujui' 
                  : 'Rincian resmi pekerjaan yang telah terkonfirmasi'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0F172A] text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-800">
                <tr>
                  {estimate.status === 'PENDING_CUSTOMER' && (
                    <th className="px-4 py-3 w-12 text-center">Pilih</th>
                  )}
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Deskripsi Pekerjaan / Sparepart</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Harga Satuan</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {estimate.lineItems.map((item) => {
                  const isChecked = selectedItems[item.id];
                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        isChecked ? 'hover:bg-slate-800/40' : 'opacity-40 bg-slate-900/50'
                      }`}
                    >
                      {estimate.status === 'PENDING_CUSTOMER' && (
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleItem(item.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          item.type === 'jasa' 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{item.qty}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                        Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Section */}
          <div className="p-5 bg-[#0F172A]/80 border-t border-slate-800 flex flex-col items-end space-y-2">
            <div className="w-full max-w-sm space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">Subtotal (Item Terpilih):</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="font-sans">PPN (11%):</span>
                <span>Rp {ppn.toLocaleString('id-ID')}</span>
              </div>
              <div className="h-px bg-slate-800 my-2"></div>
              <div className="flex justify-between items-baseline text-sm font-bold text-white">
                <span className="font-sans uppercase tracking-wider text-xs text-slate-300">Total Akhir:</span>
                <span className="text-xl text-indigo-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Workshop Guarantee & Terms */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Jaminan Standar Kualitas Bengkel Pro
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>Garansi cat oven dan anti-belang selama 6 (enam) bulan penuh.</li>
            <li>Suku cadang 100% genuine / original bergaransi resmi pabrik.</li>
            <li>Tracking tahapan pengerjaan transparan secara real-time via Customer Tracking Portal.</li>
          </ul>
        </div>

        {/* Section 5: Client Approval / Decision Panel */}
        {estimate.status === 'PENDING_CUSTOMER' ? (
          <div className="bg-[#1E293B] border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Konfirmasi & Tanda Tangan Digital</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Silakan verifikasi nama Anda dan berikan persetujuan untuk memulai proses perbaikan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Nama Penyetuju / Pemilik Kendaraan
                </label>
                <input 
                  type="text" 
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ketik nama lengkap Anda..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <input 
                  type="text" 
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Contoh: Minta fokus pada panel pintu depan..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 bg-[#0F172A]/70 rounded-xl border border-slate-800 cursor-pointer">
              <input 
                type="checkbox" 
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                Saya menyetujui rincian biaya estimasi di atas sebesar <strong className="text-indigo-400">Rp {grandTotal.toLocaleString('id-ID')}</strong> dan memberi wewenang penuh kepada Bengkel Pro untuk melaksanakan pekerjaan perbaikan pada unit <strong className="text-white">{estimate.vehicle.plate}</strong>.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={() => setShowDeclineModal(true)}
                className="sm:w-1/3 py-3 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 font-bold rounded-xl border border-slate-700 hover:border-rose-500/40 text-xs transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Tolak / Minta Revisi
              </button>
              
              <button 
                onClick={handleAcceptEstimate}
                disabled={!agreedTerms || !signatureName.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 text-xs transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui Estimasi & Mulai Perbaikan
              </button>
            </div>

          </div>
        ) : (
          /* When already decided */
          <div className="p-5 rounded-2xl bg-[#1E293B] border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Status Otorisasi Dokumen:</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {estimate.status === 'ACCEPTED' ? 'DISETUJUI OLEH PELANGGAN' : 'DITOLAK / REVISI DIAJUKAN'}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  toast.success('Estimasi diunduh dalam format PDF resmi');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Dokumen
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Decline / Revision Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Alasan Penolakan / Permintaan Revisi</h3>
            </div>
            <p className="text-xs text-slate-400">
              Mohon informasikan hal yang perlu disesuaikan (misal: penyesuaian anggaran, opsi sparepart second/aftermarket, atau penghapusan panel).
            </p>
            <textarea 
              rows={4}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Contoh: Mohon kurangi item pengecatan fender, fokus saja pada ketok pintu..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-rose-500 focus:outline-none resize-none"
            />
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDeclineEstimate}
                disabled={!declineReason.trim()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>AutoCare ERP © 2026 Bengkel Pro Management System. All rights reserved.</p>
        <p className="text-[10px] text-slate-600 mt-1">Komunikasi & enkripsi data diamankan dengan TLS 1.3 Enterprise Standard.</p>
      </footer>

    </div>
  );
}
