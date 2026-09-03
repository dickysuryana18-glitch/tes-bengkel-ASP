import { useState } from 'react';
import { 
  Camera, CheckCircle2, Clock, UploadCloud, 
  AlertCircle, Wrench, ArrowLeft, Image as ImageIcon,
  Car
} from 'lucide-react';
import { toast } from 'sonner';

interface AssignedJob {
  id: string;
  plate: string;
  vehicle: string;
  task: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  deadline: string;
  notes: string;
}

const MOCK_JOBS: AssignedJob[] = [
  {
    id: 'SPK-2310-045',
    plate: 'B 1234 ABC',
    vehicle: 'Toyota Avanza 2018',
    task: 'Pengecatan Bumper Depan & Kap Mesin',
    status: 'IN_PROGRESS',
    deadline: 'Hari Ini, 14:00',
    notes: 'Gunakan cat seri XZ-100. Pastikan dempul kering sempurna sebelum naik epoxy.'
  },
  {
    id: 'SPK-2310-048',
    plate: 'L 8890 YU',
    vehicle: 'Honda Brio RS 2021',
    task: 'Ketok Magic Pintu Kiri',
    status: 'PENDING',
    deadline: 'Besok, 10:00',
    notes: 'Hati-hati power window, lepas panel dalam dulu.'
  }
];

export function MobileTechnicianModule() {
  const [jobs, setJobs] = useState<AssignedJob[]>(MOCK_JOBS);
  const [activeJob, setActiveJob] = useState<AssignedJob | null>(null);

  const handleStatusUpdate = (jobId: string, newStatus: AssignedJob['status']) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    if (activeJob && activeJob.id === jobId) {
      setActiveJob({ ...activeJob, status: newStatus });
    }
    toast.success(`Status tugas diperbarui menjadi ${newStatus.replace('_', ' ')}`);
  };

  const handlePhotoUpload = () => {
    // In a real app, this would trigger <input type="file" accept="image/*" capture="environment" />
    toast.success("Foto progres perbaikan berhasil diunggah dan disimpan ke sistem.");
  };

  if (activeJob) {
    return (
      <div className="flex flex-col h-full bg-[#0F172A] sm:bg-[#0B1120] max-w-md mx-auto shadow-2xl relative w-full border-x border-slate-800">
        {/* Header */}
        <div className="bg-[#1E293B] border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveJob(null)}
            className="p-2 -ml-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">{activeJob.plate}</h2>
            <p className="text-[10px] text-slate-400">{activeJob.id}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Detail Kendaraan & Tugas</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-200">{activeJob.vehicle}</p>
                  <p className="text-xs text-slate-400 mt-1">{activeJob.task}</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mt-2">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Catatan Foreman
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{activeJob.notes}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status Pengerjaan</h3>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleStatusUpdate(activeJob.id, 'PENDING')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  activeJob.status === 'PENDING' 
                    ? 'bg-slate-700 border-slate-500 text-white' 
                    : 'bg-[#1E293B] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-bold">Pending</span>
              </button>
              
              <button 
                onClick={() => handleStatusUpdate(activeJob.id, 'IN_PROGRESS')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  activeJob.status === 'IN_PROGRESS' 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                    : 'bg-[#1E293B] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Wrench className="w-5 h-5" />
                <span className="text-[10px] font-bold">Dikerjakan</span>
              </button>
              
              <button 
                onClick={() => handleStatusUpdate(activeJob.id, 'COMPLETED')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  activeJob.status === 'COMPLETED' 
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                    : 'bg-[#1E293B] border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-[10px] font-bold">Selesai</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Dokumentasi Progres</h3>
            
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                <Camera className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Upload Foto Perbaikan</p>
                <p className="text-xs text-slate-400 mt-1">Ambil gambar real-time dari kamera HP</p>
              </div>
              <button 
                onClick={handlePhotoUpload}
                className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <ImageIcon className="w-4 h-4" /> Buka Kamera
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F172A] sm:bg-[#0B1120] max-w-md mx-auto shadow-2xl relative w-full border-x border-slate-800">
      <div className="bg-indigo-600 p-6 pb-8 shrink-0 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-bold text-white relative z-10">Tugas Saya</h2>
        <p className="text-indigo-200 text-sm mt-1 relative z-10">Halo, Joko P. (Mekanik Body)</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 -mt-4 z-10 custom-scrollbar space-y-4 pb-6">
        {jobs.map(job => (
          <div 
            key={job.id}
            onClick={() => setActiveJob(job)}
            className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 shadow-xl active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-white text-lg">{job.plate}</h3>
                <p className="text-xs text-slate-400">{job.vehicle}</p>
              </div>
              {job.status === 'PENDING' && <span className="bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-slate-600">Pending</span>}
              {job.status === 'IN_PROGRESS' && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-blue-500/30">Proses</span>}
              {job.status === 'COMPLETED' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-emerald-500/30">Selesai</span>}
            </div>
            
            <p className="text-sm text-slate-300 font-medium line-clamp-2">{job.task}</p>
            
            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" /> Deadline: {job.deadline}
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Tidak ada tugas aktif saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
