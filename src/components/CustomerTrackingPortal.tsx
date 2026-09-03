import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, AlertCircle, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface TrackingData {
  vehicle: {
    plate: string;
    model: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  status: {
    overallProgress: number;
    estimatedCompletion: string;
  };
  timeline: {
    stage: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
    timestamp?: string;
  }[];
}

const mockTrackingData: TrackingData = {
  vehicle: {
    plate: 'B 1234 ABC',
    model: 'Honda CR-V 2022'
  },
  customer: {
    name: 'Dr. Irwan Santoso',
    phone: '0812-9876-1234'
  },
  status: {
    overallProgress: 65,
    estimatedCompletion: '15 Oct 2026, 14:00 WIB'
  },
  timeline: [
    {
      stage: 'Check-in & Reception',
      description: 'Kendaraan diterima dan didaftarkan di sistem.',
      status: 'completed',
      timestamp: '10 Oct 2026, 08:30 WIB'
    },
    {
      stage: 'Estimasi & Approval',
      description: 'Estimasi biaya dan persetujuan asuransi.',
      status: 'completed',
      timestamp: '11 Oct 2026, 09:00 WIB'
    },
    {
      stage: 'Proses Repair (Ketok/Las)',
      description: 'Perbaikan panel body oleh mekanik.',
      status: 'completed',
      timestamp: '12 Oct 2026, 15:00 WIB'
    },
    {
      stage: 'Painting (Oven)',
      description: 'Proses pengecatan dasar dan clear coat.',
      status: 'current',
      timestamp: 'Sedang Berjalan'
    },
    {
      stage: 'Assembly & Poles',
      description: 'Pemasangan kembali komponen dan finishing.',
      status: 'pending'
    },
    {
      stage: 'Quality Control',
      description: 'Pengecekan akhir oleh tim QC Bengkel Pro.',
      status: 'pending'
    },
    {
      stage: 'Ready for Delivery',
      description: 'Kendaraan siap diambil oleh pelanggan.',
      status: 'pending'
    }
  ]
};

export function CustomerTrackingPortal({ 
  trackingId, 
  onLogout,
  onBackToErp 
}: { 
  trackingId: string;
  onLogout?: () => void;
  onBackToErp?: () => void;
}) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch based on trackingHash
    const fetchTrackingData = async () => {
      setLoading(true);
      // Mocking network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setData(mockTrackingData);
      setLoading(false);
    };

    fetchTrackingData();
  }, [trackingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-mono tracking-tight">Bengkel Pro</h2>
        <p className="text-slate-400 mt-2 text-sm">Mencari data kendaraan {trackingId}...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Public Header */}
      <header className="sticky top-0 z-10 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          {onBackToErp && (
            <button
              onClick={onBackToErp}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors mr-1"
              title="Kembali ke ERP Bengkel Pro"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
            BP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Bengkel Pro</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Portal Tracking Pelanggan</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            LIVE
          </span>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Keluar dari Portal Pelanggan"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 pb-20">
        
        {/* Vehicle Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/80 shadow-xl relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight">{data.vehicle.plate}</h2>
              <p className="text-indigo-400 font-medium mt-1">{data.vehicle.model}</p>
            </div>
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
               {/* QR Code Placeholder for authenticity */}
               <div className="w-10 h-10 border-2 border-dashed border-slate-600 rounded flex items-center justify-center opacity-50">
                 <span className="text-[8px] font-mono text-slate-400 text-center leading-tight">TRACK<br/>ID</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pelanggan</span>
              </div>
              <p className="text-sm font-semibold text-slate-300">{data.customer.name}</p>
            </div>
            <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Kontak</span>
              </div>
              <p className="text-sm font-semibold text-slate-300">{data.customer.phone}</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700/80 shadow-xl"
        >
          <div className="flex justify-between items-end mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Progress</h3>
              <p className="text-3xl font-bold text-white">{data.status.overallProgress}%</p>
            </div>
            <div className="text-right">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estimasi Selesai</h3>
              <p className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4" />
                {data.status.estimatedCompletion}
              </p>
            </div>
          </div>
          
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.status.overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400" 
            ></motion.div>
          </div>
        </motion.div>

        {/* Timeline Tracking */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1E293B] rounded-2xl p-5 md:p-6 border border-slate-700/80 shadow-xl"
        >
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            Riwayat & Status Produksi
          </h3>

          <div className="relative border-l-2 border-slate-700/50 ml-3 space-y-8">
            {data.timeline.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                {/* Custom Timeline Dot */}
                <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-[#1E293B] ${
                  item.status === 'completed' ? 'bg-teal-500' :
                  item.status === 'current' ? 'bg-indigo-500' :
                  'bg-slate-700'
                }`}>
                  {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  {item.status === 'current' && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>

                {/* Content */}
                <div className={`${item.status === 'pending' ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <h4 className={`text-base font-bold ${
                      item.status === 'completed' ? 'text-slate-200' :
                      item.status === 'current' ? 'text-indigo-400' :
                      'text-slate-500'
                    }`}>
                      {item.stage}
                    </h4>
                    {item.timestamp && (
                      <span className={`text-[10px] font-mono whitespace-nowrap px-2 py-0.5 rounded-full border ${
                        item.status === 'current' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {item.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support Banner */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex gap-4 items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-300 font-medium">Butuh Bantuan?</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Jika Anda memiliki pertanyaan mengenai status perbaikan, silakan hubungi Service Advisor kami yang bertugas.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
