import { useState } from 'react';
import { 
  Users, Banknote, TrendingUp, Wrench, CheckCircle2, 
  Printer, Download, ShieldCheck, ChevronRight, Clock, Star
} from 'lucide-react';

interface TaskRecord {
  id: string;
  woNumber: string;
  taskName: string;
  dateCompleted: string;
  commission: number;
}

interface MechanicPayroll {
  id: string;
  name: string;
  specialty: string;
  efficiency: number;
  baseSalary: number;
  status: 'Pending' | 'Paid';
  tasks: TaskRecord[];
}

const MOCK_MECHANICS: MechanicPayroll[] = [
  {
    id: 'm1',
    name: 'Ahmad Riyadi',
    specialty: 'Ketok & Las',
    efficiency: 94,
    baseSalary: 3500000,
    status: 'Pending',
    tasks: [
      { id: 't1', woNumber: 'SPK-2310-001', taskName: 'Tarik Sasis Depan', dateCompleted: '10 Oct 2023', commission: 150000 },
      { id: 't2', woNumber: 'SPK-2310-002', taskName: 'Ketok Pintu Kanan', dateCompleted: '11 Oct 2023', commission: 75000 },
      { id: 't3', woNumber: 'SPK-2310-005', taskName: 'Las Lantai Kabin', dateCompleted: '12 Oct 2023', commission: 200000 }
    ]
  },
  {
    id: 'm2',
    name: 'Budi Santoso',
    specialty: 'Dempul & Pengecatan',
    efficiency: 88,
    baseSalary: 4000000,
    status: 'Paid',
    tasks: [
      { id: 't4', woNumber: 'SPK-2310-001', taskName: 'Pengecatan Bumper', dateCompleted: '10 Oct 2023', commission: 120000 },
      { id: 't5', woNumber: 'SPK-2310-003', taskName: 'Dempul Kap Mesin', dateCompleted: '11 Oct 2023', commission: 85000 }
    ]
  },
  {
    id: 'm3',
    name: 'Rudi Hermawan',
    specialty: 'Mekanik Mesin & Kaki',
    efficiency: 97,
    baseSalary: 3800000,
    status: 'Pending',
    tasks: [
      { id: 't6', woNumber: 'SPK-2310-008', taskName: 'Turun Mesin (Overhaul)', dateCompleted: '09 Oct 2023', commission: 300000 },
      { id: 't7', woNumber: 'SPK-2310-009', taskName: 'Ganti Shockbreaker', dateCompleted: '12 Oct 2023', commission: 100000 }
    ]
  }
];

export function MechanicPayrollModule() {
  const [mechanics, setMechanics] = useState<MechanicPayroll[]>(MOCK_MECHANICS);
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicPayroll | null>(MOCK_MECHANICS[0]);
  const [search, setSearch] = useState('');

  const filteredMechanics = mechanics.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleProcessPayroll = () => {
    if (!selectedMechanic) return;
    
    const updated = { ...selectedMechanic, status: 'Paid' as const };
    setMechanics(prev => prev.map(m => m.id === selectedMechanic.id ? updated : m));
    setSelectedMechanic(updated);
  };

  const calculateTotalCommission = (tasks: TaskRecord[]) => {
    return tasks.reduce((sum, task) => sum + task.commission, 0);
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Kinerja & Payroll
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">HR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola pencapaian mekanik, insentif SPK, dan slip gaji</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-700 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Rekap
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Mekanik</p>
            <p className="text-lg sm:text-xl font-bold text-white">{mechanics.length} <span className="text-xs font-normal text-slate-400">Aktif</span></p>
          </div>
        </div>
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pekerjaan Selesai</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              {mechanics.reduce((sum, m) => sum + m.tasks.length, 0)} <span className="text-xs font-normal text-slate-400">Task</span>
            </p>
          </div>
        </div>
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
            <Star className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rata Efisiensi</p>
            <p className="text-lg sm:text-xl font-bold text-white">93%</p>
          </div>
        </div>
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
            <Banknote className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimasi Payroll</p>
            <p className="text-sm sm:text-base font-bold text-white font-mono">
              Rp {(mechanics.reduce((sum, m) => sum + m.baseSalary + calculateTotalCommission(m.tasks), 0)).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
        
        {/* LEFT PANE: Mechanic List */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0 max-h-56 md:max-h-none">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
            <input 
              type="text" 
              placeholder="Cari mekanik atau divisi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0F172A] border border-slate-700 text-xs focus:border-indigo-500 focus:outline-none w-full text-slate-300 placeholder:text-slate-500 rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredMechanics.map(mechanic => {
              const isSelected = selectedMechanic?.id === mechanic.id;
              const totalCommissions = calculateTotalCommission(mechanic.tasks);

              return (
                <div 
                  key={mechanic.id}
                  onClick={() => setSelectedMechanic(mechanic)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                      : 'bg-[#0F172A] border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{mechanic.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{mechanic.specialty}</p>
                    
                    <div className="flex gap-2 mt-2">
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 border border-slate-700 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" /> {mechanic.efficiency}%
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 border border-slate-700 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-indigo-400" /> {mechanic.tasks.length} Job
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {mechanic.status === 'Paid' ? (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 uppercase tracking-widest block mb-2 text-center">Paid</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 uppercase tracking-widest block mb-2 text-center">Pending</span>
                    )}
                    <p className="text-xs font-bold text-white font-mono">Rp {(mechanic.baseSalary + totalCommissions).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANE: Detail & Payslip */}
        <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          {selectedMechanic ? (
            <>
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-800 bg-[#0F172A]/80 flex justify-between items-start shrink-0">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-700 border-2 border-indigo-500/30 flex items-center justify-center text-xl font-bold text-slate-300">
                    {selectedMechanic.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedMechanic.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                      <span>Divisi: <strong className="text-slate-300">{selectedMechanic.specialty}</strong></span>
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 flex items-center gap-1">
                        Efisiensi: <span className="text-emerald-400 font-bold">{selectedMechanic.efficiency}%</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                   {selectedMechanic.status === 'Paid' ? (
                     <div className="px-3 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Gaji Telah Dibayar
                      </div>
                   ) : (
                      <div className="px-3 py-1 rounded border border-amber-500/20 bg-amber-500/10 text-amber-500 text-xs font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Menunggu Proses Payroll
                      </div>
                   )}
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col lg:flex-row gap-6">
                
                {/* Left Col: Task List */}
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    Pekerjaan Diselesaikan (Periode Ini)
                  </h3>
                  
                  <div className="border border-slate-700 rounded-xl overflow-hidden bg-[#0F172A]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-700">
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Nomor SPK</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Nama Pekerjaan</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Tgl Selesai</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase text-right">Insentif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedMechanic.tasks.map(task => (
                          <tr key={task.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono font-bold text-indigo-400">{task.woNumber}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-200">{task.taskName}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{task.dateCompleted}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-white font-mono">Rp {task.commission.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                        {selectedMechanic.tasks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                              Tidak ada pekerjaan tercatat di periode ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Col: Salary Slip */}
                <div className="w-full lg:w-80 shrink-0">
                  <div className="bg-[#0F172A] border border-slate-700 rounded-xl overflow-hidden shadow-sm sticky top-0">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/30 flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5" /> Rincian Payroll
                      </h3>
                      <button className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors border border-slate-700 rounded px-2 py-1 bg-slate-800">
                         <Printer className="w-3 h-3" /> Cetak Slip
                      </button>
                    </div>
                    
                    <div className="p-5 space-y-4">
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Gaji Pokok</span>
                        <span className="font-bold text-slate-200 font-mono">Rp {selectedMechanic.baseSalary.toLocaleString('id-ID')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Insentif Borongan ({selectedMechanic.tasks.length} task)</span>
                        <span className="font-bold text-slate-200 font-mono">Rp {calculateTotalCommission(selectedMechanic.tasks).toLocaleString('id-ID')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Bonus Efisiensi (Di atas 90%)</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {selectedMechanic.efficiency > 90 ? '+ Rp 250.000' : '-'}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-slate-700 border-dashed flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Take Home Pay</span>
                        <span className="text-xl font-bold text-indigo-400 font-mono">
                          Rp {(
                            selectedMechanic.baseSalary + 
                            calculateTotalCommission(selectedMechanic.tasks) + 
                            (selectedMechanic.efficiency > 90 ? 250000 : 0)
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>

                    </div>
                    
                    {/* Action Block */}
                    <div className="p-4 bg-slate-800/20 border-t border-slate-700">
                      {selectedMechanic.status === 'Pending' ? (
                        <button 
                          onClick={handleProcessPayroll}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Proses Pencairan Gaji
                        </button>
                      ) : (
                        <div className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-400 font-medium text-sm rounded-lg flex items-center justify-center gap-2 opacity-70 cursor-not-allowed">
                          Payroll Selesai Diproses
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
              <Users className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm font-medium">Pilih mekanik untuk melihat rincian kinerja dan payroll.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
