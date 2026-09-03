import { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Search, ClipboardCheck, 
  Car, User, Calendar, ShieldCheck, ChevronRight, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getStoredWorkOrders, 
  saveWorkOrdersToStorage, 
  WorkOrderItem,
  addAuditLogEntry 
} from '../data/spkDatabase';

interface VehicleQC {
  id: string;
  woNumber: string;
  plate: string;
  model: string;
  mechanic: string;
  type: string;
  dateReady: string;
  status: 'Pending' | 'Passed' | 'Failed';
  rawOrder?: WorkOrderItem;
}

const QC_CHECKLIST = [
  { id: 'c1', label: 'Kesesuaian Warna Cat (No Belang)', category: 'Body & Paint' },
  { id: 'c2', label: 'Kerataan Permukaan (Tidak Bergelombang)', category: 'Body & Paint' },
  { id: 'c3', label: 'Kerapian Nat & Celah Panel (Gap Alignment)', category: 'Assembly' },
  { id: 'c4', label: 'Fungsi Kelistrikan / Lampu Berjalan Normal', category: 'Electrical' },
  { id: 'c5', label: 'Kebersihan Eksterior & Interior (Bebas Debu/Overspray)', category: 'Finishing' },
];

function buildQCQueue(workOrders: WorkOrderItem[]): VehicleQC[] {
  return workOrders.map(order => {
    let status: 'Pending' | 'Passed' | 'Failed' = 'Pending';
    if (order.status === 'SELESAI' || order.kanbanStage === 'ready') {
      status = 'Passed';
    } else if (order.detailedStage === 'QC' || order.kanbanStage === 'qc') {
      status = 'Pending';
    } else if (order.slaStatus === 'WARNING' && order.history?.some(h => h.note?.includes('Rework'))) {
      status = 'Failed';
    }

    return {
      id: order.id,
      woNumber: order.spkNumber,
      plate: order.vehicle.plate,
      model: `${order.vehicle.brand} ${order.vehicle.model}`,
      mechanic: order.leadMechanic || 'Bambang Sudarso',
      type: order.serviceCategory === 'BODY_REPAIR' ? 'Body Repair & Paint' : 'General Service',
      dateReady: order.targetDeliveryDate || 'Hari ini',
      status,
      rawOrder: order
    };
  });
}

export function QCInspectionFlow() {
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(() => getStoredWorkOrders());
  const [queue, setQueue] = useState<VehicleQC[]>(() => buildQCQueue(getStoredWorkOrders()));
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleQC | null>(() => {
    const initialQueue = buildQCQueue(getStoredWorkOrders());
    return initialQueue[0] || null;
  });
  const [search, setSearch] = useState('');
  
  // States for the active inspection
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  // Sync with persistent work order updates
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WorkOrderItem[]>;
      const orders = (customEvent.detail && Array.isArray(customEvent.detail))
        ? customEvent.detail 
        : getStoredWorkOrders();
      setWorkOrders(orders);
      const newQueue = buildQCQueue(orders);
      setQueue(newQueue);
      if (selectedVehicle) {
        const found = newQueue.find(q => q.id === selectedVehicle.id);
        if (found) setSelectedVehicle(found);
      }
    };

    window.addEventListener('autocare_workorders_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('autocare_workorders_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [selectedVehicle]);
  
  const filteredQueue = queue.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.woNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleCheck = (id: string) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isAllChecked = QC_CHECKLIST.every(item => checks[item.id]);

  const handleAction = (result: 'Pass' | 'Fail') => {
    if (!selectedVehicle) return;
    
    if (result === 'Fail' && !notes.trim()) {
      toast.error("Catatan rework (Rework Notes) WAJIB diisi jika kendaraan Gagal QC.");
      return;
    }
    
    if (result === 'Pass' && !isAllChecked) {
      toast.error("Semua 5 poin inspeksi mutu wajib dicentang (LULUS) untuk menyelesaikan QC.");
      return;
    }

    const currentOrders = getStoredWorkOrders();
    const targetIdx = currentOrders.findIndex(o => o.id === selectedVehicle.id || o.spkNumber === selectedVehicle.woNumber);

    if (targetIdx >= 0) {
      const order = currentOrders[targetIdx];
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      
      let updatedOrder: WorkOrderItem;
      if (result === 'Pass') {
        updatedOrder = {
          ...order,
          status: 'SELESAI',
          kanbanStage: 'ready',
          detailedStage: 'Siap Ambil',
          progressPercent: 100,
          slaStatus: 'ON_TRACK',
          history: [
            ...(order.history || []),
            {
              stage: 'Quality Control (QC) Passed',
              date: nowStr,
              status: 'completed',
              note: notes.trim() || 'Semua item inspeksi mutu dinyatakan LULUS & Sempurna.',
              actor: 'QC Inspector'
            }
          ],
          updatedAt: nowStr
        };

        addAuditLogEntry({
          user: 'QC Inspector',
          role: 'QC',
          action: 'APPROVE',
          module: 'Quality Control',
          targetId: order.spkNumber,
          details: `Kendaraan ${order.vehicle.plate} (${order.spkNumber}) dinyatakan LULUS QC dan siap serah terima.`
        });
        toast.success(`Kendaraan ${order.vehicle.plate} (${order.spkNumber}) LULUS QC & Siap Serah Terima!`);
      } else {
        updatedOrder = {
          ...order,
          status: 'DALAM_PENGERJAAN',
          kanbanStage: 'repair',
          detailedStage: 'Ketok',
          slaStatus: 'WARNING',
          history: [
            ...(order.history || []),
            {
              stage: 'QC Inspection Rejected / Rework',
              date: nowStr,
              status: 'current',
              note: `Rework: ${notes.trim()}`,
              actor: 'QC Inspector'
            }
          ],
          updatedAt: nowStr
        };

        addAuditLogEntry({
          user: 'QC Inspector',
          role: 'QC',
          action: 'UPDATE',
          module: 'Quality Control',
          targetId: order.spkNumber,
          details: `Kendaraan ${order.vehicle.plate} (${order.spkNumber}) dikembalikan untuk REWORK: ${notes.trim()}`
        });
        toast.warning(`Kendaraan ${order.vehicle.plate} (${order.spkNumber}) Ditolak QC (Dikembalikan untuk Rework)`);
      }

      currentOrders[targetIdx] = updatedOrder;
      saveWorkOrdersToStorage(currentOrders);
    }
    
    // Reset form & select next pending
    setChecks({});
    setNotes('');
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Quality Control (QC)
            <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-widest font-bold">Final Inspection</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Inspeksi akhir terintegrasi langsung dengan database SPK & Workshop Kanban</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
        
        {/* LEFT PANE: Queue List */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0 max-h-56 md:max-h-none">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Antrean Unit SPK</h3>
              <span className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {filteredQueue.length} Unit
              </span>
            </div>
            <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-teal-500 transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari Nopol atau SPK..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-300 placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {filteredQueue.map(vehicle => {
              const isSelected = selectedVehicle?.id === vehicle.id;
              
              return (
                <div 
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-teal-900/20 border-teal-500/50 shadow-lg shadow-teal-500/5' 
                      : 'bg-[#0F172A] border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-mono font-bold text-white tracking-tight uppercase">
                      {vehicle.plate}
                    </span>
                    {vehicle.status === 'Pending' ? (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-bold border border-slate-700 uppercase">Menunggu QC</span>
                    ) : vehicle.status === 'Passed' ? (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30 uppercase">Lulus QC</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 uppercase">Rework</span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-300 font-medium">{vehicle.model}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {vehicle.mechanic}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {vehicle.dateReady}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredQueue.length === 0 && (
              <div className="text-center p-6 text-slate-500 text-sm">
                Tidak ada antrean QC yang cocok.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Inspection Form */}
        <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          {selectedVehicle ? (
            <>
              {/* Header Info */}
              <div className="p-4 sm:p-6 border-b border-slate-800 bg-[#0F172A]/80 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl sm:text-2xl font-mono font-bold text-white uppercase">{selectedVehicle.plate}</h2>
                    <span className="px-2.5 py-1 rounded-md text-[10px] bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 uppercase tracking-widest">
                      {selectedVehicle.woNumber}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-300">{selectedVehicle.model} — <span className="text-slate-500">{selectedVehicle.type}</span></p>
                </div>
                
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mekanik Penanggung Jawab</p>
                  <p className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 sm:justify-end">
                    <User className="w-4 h-4 text-slate-400" />
                    {selectedVehicle.mechanic}
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
                
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-4 h-4 text-teal-400" />
                    Checklist Standar Mutu Body & Paint
                  </h3>
                  
                  <div className="space-y-3">
                    {QC_CHECKLIST.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleToggleCheck(item.id)}
                        className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                          checks[item.id] 
                            ? 'bg-teal-500/10 border-teal-500/30' 
                            : 'bg-[#0F172A] border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          checks[item.id] ? 'bg-teal-500 border-teal-500' : 'bg-slate-800 border-slate-600'
                        }`}>
                          {checks[item.id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors ${checks[item.id] ? 'text-teal-400' : 'text-slate-200'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Catatan Temuan / Rework
                  </h3>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Ada debu halus di panel pintu kiri, perlu dipoles ulang..."
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-colors resize-none h-28"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">
                    * Catatan wajib diisi jika kendaraan tidak lolos QC (Rework).
                  </p>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0F172A]/90 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  Inspektur QC: <span className="text-slate-200 font-bold">Gunawan Pratama (QC Head)</span>
                </div>
                
                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button 
                    onClick={() => handleAction('Fail')}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak / Rework
                  </button>
                  <button 
                    onClick={() => handleAction('Pass')}
                    disabled={!isAllChecked}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Lulus QC & Selesai
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
              <ShieldCheck className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm font-medium">Pilih kendaraan dari antrean untuk memulai inspeksi QC.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
