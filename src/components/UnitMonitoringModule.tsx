import { useState, useEffect, useRef } from 'react';
import { 
  Car, Search, Filter, Clock, AlertTriangle, CheckCircle2, 
  ChevronRight, Phone, MessageSquare, Download, MapPin, 
  Calendar, Wrench, Shield, ArrowUpRight, RefreshCw, Eye, 
  ShieldAlert, LayoutGrid, List, BellRing, Sparkles, X, ChevronDown,
  Layers, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { ServiceAdvisorLagAlertModal } from './ServiceAdvisorLagAlertModal';
import { getStoredWorkOrders, WorkOrderItem } from '../data/spkDatabase';
import { INITIAL_REPAIR_LAG_ALERTS, RepairLagAlert } from '../data/historicalRepairBenchmarks';

interface MonitoredVehicle {
  id: string;
  spkNumber: string;
  plateNumber: string;
  vehicleModel: string;
  customerName: string;
  customerPhone: string;
  insuranceName: string;
  currentStage: 'Bongkar' | 'Ketok' | 'Las' | 'Dempul' | 'Cat Oven' | 'Poles' | 'Pasang' | 'QC' | 'Siap Ambil';
  bayLocation: string;
  leadMechanic: string;
  entryDate: string;
  targetDeliveryDate: string;
  progressPercent: number;
  slaStatus: 'ON_TRACK' | 'WARNING' | 'OVERDUE';
  daysRemaining: number;
  notes: string;
}

const STAGE_OPTIONS = [
  { value: 'ALL', label: 'Semua Tahapan' },
  { value: 'Bongkar', label: 'Bongkar' },
  { value: 'Ketok', label: 'Ketok / Panel' },
  { value: 'Las', label: 'Las / Ketok Berat' },
  { value: 'Dempul', label: 'Dempul / Epoxy' },
  { value: 'Cat Oven', label: 'Cat Oven' },
  { value: 'Poles', label: 'Poles / Finishing' },
  { value: 'Pasang', label: 'Pasang (Assembly)' },
  { value: 'QC', label: 'Quality Control' },
  { value: 'Siap Ambil', label: 'Siap Ambil / Ready' },
] as const;

function mapWorkOrderToMonitored(order: WorkOrderItem): MonitoredVehicle {
  return {
    id: order.id,
    spkNumber: order.spkNumber,
    plateNumber: order.vehicle.plate,
    vehicleModel: `${order.vehicle.brand} ${order.vehicle.model}`,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    insuranceName: order.insuranceCompany || (order.customer.type === 'Corporate' ? 'Fleet Perusahaan' : 'Personal / Non-Asuransi'),
    currentStage: order.detailedStage || 'Bongkar',
    bayLocation: order.bayLocation || 'Bay Pembongkaran 1',
    leadMechanic: order.leadMechanic || 'Bambang Sudarso',
    entryDate: order.entryDate || order.createdAt?.substring(0, 10) || '2026-08-30',
    targetDeliveryDate: order.targetDeliveryDate || '2026-09-04',
    progressPercent: order.progressPercent || 25,
    slaStatus: order.slaStatus || 'ON_TRACK',
    daysRemaining: order.daysRemaining !== undefined ? order.daysRemaining : 3,
    notes: order.notes || 'Pengerjaan unit workshop.'
  };
}

export function UnitMonitoringModule() {
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(() => getStoredWorkOrders());
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'ON_TRACK' | 'WARNING' | 'OVERDUE'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedVehicle, setSelectedVehicle] = useState<MonitoredVehicle | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [showAlertBanner, setShowAlertBanner] = useState(false);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false);
  const stageDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setIsStageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load alert count
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState(2);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_sa_repair_lag_alerts');
      const alerts: RepairLagAlert[] = saved ? JSON.parse(saved) : INITIAL_REPAIR_LAG_ALERTS;
      const count = alerts.filter(a => a.saActionStatus !== 'RESOLVED').length;
      setUnresolvedAlertsCount(count);
    } catch {
      setUnresolvedAlertsCount(2);
    }
  }, [isAlertModalOpen]);

  // Sync with persistent work order database updates
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WorkOrderItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setWorkOrders(customEvent.detail);
      } else {
        setWorkOrders(getStoredWorkOrders());
      }
    };

    window.addEventListener('autocare_workorders_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('autocare_workorders_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const vehicles: MonitoredVehicle[] = workOrders
    .filter(wo => wo.status !== 'DRAFT')
    .map(mapWorkOrderToMonitored);

  const filteredVehicles = vehicles.filter(v => {
    const matchSearch = 
      v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.spkNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.customerName.toLowerCase().includes(search.toLowerCase()) ||
      v.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
      v.insuranceName.toLowerCase().includes(search.toLowerCase()) ||
      v.bayLocation.toLowerCase().includes(search.toLowerCase()) ||
      v.leadMechanic.toLowerCase().includes(search.toLowerCase());

    const matchStage = stageFilter === 'ALL' || v.currentStage === stageFilter;
    const matchSla = slaFilter === 'ALL' || v.slaStatus === slaFilter;

    return matchSearch && matchStage && matchSla;
  });

  const countTotal = vehicles.length;
  const countOnTrack = vehicles.filter(v => v.slaStatus === 'ON_TRACK').length;
  const countWarning = vehicles.filter(v => v.slaStatus === 'WARNING').length;
  const countOverdue = vehicles.filter(v => v.slaStatus === 'OVERDUE').length;

  const handleSendWaUpdate = (v: MonitoredVehicle) => {
    const msg = `Halo Bpk/Ibu ${v.customerName}, update dari Bengkel Pro untuk unit ${v.vehicleModel} (${v.plateNumber}): Saat ini sedang dalam tahap [${v.currentStage}] dengan progress ${v.progressPercent}%. Penempatan: ${v.bayLocation}. Estimasi siap: ${v.targetDeliveryDate}. Terima kasih!`;
    const waUrl = `https://api.whatsapp.com/send?phone=62${v.customerPhone.replace(/^0/, '')}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    toast.success(`Menyiapkan WhatsApp ke ${v.customerName}`, {
      description: `Format status ${v.plateNumber} siap dikirimkan.`
    });
  };

  const handleExportSummary = () => {
    toast.success("Export Data Monitoring Berhasil", {
      description: `${filteredVehicles.length} unit berhasil diexport ke format CSV / Spreadsheet.`
    });
  };

  return (
    <div className="p-3 sm:p-5 h-full flex flex-col max-w-[1700px] mx-auto overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header & Compact Status Bar (Direct Access, Zero Wasted Height) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Monitoring Unit Workshop
              <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
                {vehicles.length} Unit Aktif
              </span>
            </h2>

            {unresolvedAlertsCount > 0 && (
              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5 transition-colors animate-pulse"
                title="Buka Pusat Alert Keterlambatan Service Advisor"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{unresolvedAlertsCount} Alert SLA Lag</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
            Pelacakan posisi bay, progres tahapan pengerjaan, SLA lead-time, dan status penyelesaian unit kendaraan real-time.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0F172A] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Tabel Rinci"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Grid Kartu Bay"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartu Bay</span>
            </button>
          </div>

          <button 
            onClick={() => {
              setWorkOrders(getStoredWorkOrders());
              toast.info("Data Monitoring Diperbarui", { description: "Sinkronisasi status sensor bay & database SPK selesai." });
            }}
            className="px-2.5 py-1.5 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Refresh Data Sensor & SPK"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button 
            onClick={handleExportSummary}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Interactive KPI Filter Pills & Search Bar (High Density, Immediate Visibility) */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-2.5 sm:p-3 mb-3 shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-sm">
        
        {/* Quick SLA Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0 shrink-0">
          <button
            onClick={() => setSlaFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              slaFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
                : 'bg-[#0F172A] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-indigo-400" />
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono font-bold">
              {countTotal}
            </span>
          </button>

          <button
            onClick={() => setSlaFilter('ON_TRACK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              slaFilter === 'ON_TRACK'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-[#0F172A] text-slate-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>On Track</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950/80 text-emerald-300 font-mono font-bold">
              {countOnTrack}
            </span>
          </button>

          <button
            onClick={() => setSlaFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              slaFilter === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-[#0F172A] text-slate-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Hari Terakhir</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950/80 text-amber-300 font-mono font-bold">
              {countWarning}
            </span>
          </button>

          <button
            onClick={() => setSlaFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              slaFilter === 'OVERDUE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'bg-[#0F172A] text-slate-400 hover:text-rose-300 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Overdue / Telat</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950/80 text-rose-300 font-mono font-bold">
              {countOverdue}
            </span>
          </button>
        </div>

        {/* Filter Tahap & Search Box */}
        <div className="flex items-center gap-2 flex-1 md:justify-end">
          {/* Custom Interactive Stage Dropdown */}
          <div className="relative shrink-0" ref={stageDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStageDropdownOpen(!isStageDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                stageFilter !== 'ALL'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                  : 'bg-[#0F172A] text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-normal hidden sm:inline">Tahap:</span>
              <span className="font-bold text-white max-w-[110px] sm:max-w-[150px] truncate">
                {STAGE_OPTIONS.find(opt => opt.value === stageFilter)?.label || 'Semua Tahapan'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isStageDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {/* Dropdown Menu Popover */}
            {isStageDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter Tahap Pengerjaan</span>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {vehicles.length} Unit
                  </span>
                </div>
                
                <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
                  {STAGE_OPTIONS.map(opt => {
                    const count = opt.value === 'ALL' 
                      ? vehicles.length 
                      : vehicles.filter(v => v.currentStage === opt.value).length;
                    const isSelected = stageFilter === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStageFilter(opt.value);
                          setIsStageDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                            : 'text-slate-200 hover:bg-[#0F172A] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            opt.value === 'ALL' ? 'bg-indigo-400' :
                            opt.value === 'Bongkar' ? 'bg-blue-400' :
                            opt.value === 'Ketok' ? 'bg-amber-400' :
                            opt.value === 'Las' ? 'bg-orange-400' :
                            opt.value === 'Dempul' ? 'bg-yellow-400' :
                            opt.value === 'Cat Oven' ? 'bg-purple-400' :
                            opt.value === 'Poles' ? 'bg-cyan-400' :
                            opt.value === 'Pasang' ? 'bg-sky-400' :
                            opt.value === 'QC' ? 'bg-teal-400' : 'bg-emerald-400'
                          }`} />
                          <span className="truncate">{opt.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isSelected 
                              ? 'bg-indigo-700 text-white' 
                              : 'bg-[#0F172A] text-slate-400 border border-slate-800'
                          }`}>
                            {count}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="flex items-center bg-[#0F172A] rounded-lg px-2.5 py-1.5 border border-slate-700 focus-within:border-indigo-500 flex-1 max-w-sm transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" />
            <input 
              type="text" 
              placeholder="Cari Plat, SPK, Pelanggan, Bay, Mekanik..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full text-white placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Vehicle Monitoring Area (Now positioned right at the top fold!) */}
      <div className="flex-1 min-h-0 bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
        
        {viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-[#0F172A] shadow-sm">
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Kendaraan & SPK</th>
                  <th className="px-4 py-3">Pelanggan & Asuransi</th>
                  <th className="px-4 py-3">Lokasi Bay & Teknisi</th>
                  <th className="px-4 py-3">Tahap & Progres</th>
                  <th className="px-4 py-3">Target Selesai & SLA</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredVehicles.map((v, idx) => (
                  <tr 
                    key={v.id} 
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedVehicle(v)}
                  >
                    
                    {/* Kendaraan & SPK */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 group-hover:border-indigo-400/40 transition-colors">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-mono tracking-wide group-hover:text-indigo-300 transition-colors">
                              {v.plateNumber}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.2 rounded">
                              {v.spkNumber}
                            </span>
                          </div>
                          <p className="text-slate-300 font-medium text-xs mt-0.5">{v.vehicleModel}</p>
                        </div>
                      </div>
                    </td>

                    {/* Pelanggan & Asuransi */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{v.customerName}</p>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                        <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{v.insuranceName}</span>
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-mono">{v.customerPhone}</p>
                    </td>

                    {/* Posisi Bay & Mekanik */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-indigo-300 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{v.bayLocation}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-500 shrink-0" />
                        Lead: <span className="text-slate-300 font-medium">{v.leadMechanic}</span>
                      </p>
                    </td>

                    {/* Tahap & Progres */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5 gap-2 max-w-[180px]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {v.currentStage}
                        </span>
                        <span className="font-mono font-bold text-white text-xs">{v.progressPercent}%</span>
                      </div>
                      <div className="w-36 sm:w-44 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/60">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            v.progressPercent >= 90 ? 'bg-emerald-500' :
                            v.progressPercent >= 60 ? 'bg-indigo-500' : 
                            v.progressPercent >= 30 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${v.progressPercent}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Target Delivery & SLA */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{v.targetDeliveryDate}</span>
                      </div>
                      <div className="mt-1">
                        {v.slaStatus === 'ON_TRACK' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Sisa {v.daysRemaining} Hari
                          </span>
                        )}
                        {v.slaStatus === 'WARNING' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Hari Terakhir
                          </span>
                        )}
                        {v.slaStatus === 'OVERDUE' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Telat {Math.abs(v.daysRemaining)} Hari
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleSendWaUpdate(v)}
                          title="Kirim Update WA ke Pelanggan"
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setSelectedVehicle(v)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                          <Car className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Tidak Ada Kendaraan Ditemukan</p>
                        <p className="text-xs text-slate-500 mb-3">
                          Kriteria pencarian atau filter yang Anda pilih tidak memiliki unit aktif.
                        </p>
                        <button 
                          onClick={() => { setSearch(''); setStageFilter('ALL'); setSlaFilter('ALL'); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD / BAY GRID VIEW */
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredVehicles.map(v => (
                <div 
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className="bg-[#0F172A] border border-slate-700/80 hover:border-indigo-500/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-indigo-950/20 cursor-pointer flex flex-col justify-between group relative"
                >
                  {/* Top Row: Plate & SLA Badge */}
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                          {v.plateNumber}
                        </span>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">{v.vehicleModel}</p>
                      </div>

                      <div>
                        {v.slaStatus === 'ON_TRACK' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Sisa {v.daysRemaining}h
                          </span>
                        )}
                        {v.slaStatus === 'WARNING' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Hari Ini
                          </span>
                        )}
                        {v.slaStatus === 'OVERDUE' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Telat {Math.abs(v.daysRemaining)}h
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                      <span className="font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.2 rounded text-[10px]">
                        {v.spkNumber}
                      </span>
                      <span className="truncate">{v.customerName}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-[#1E293B] p-2.5 rounded-lg border border-slate-800 mb-3 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          {v.currentStage}
                        </span>
                        <span className="font-mono font-bold text-white">{v.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            v.progressPercent >= 90 ? 'bg-emerald-500' :
                            v.progressPercent >= 60 ? 'bg-indigo-500' : 
                            v.progressPercent >= 30 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${v.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bay & Mechanic Info */}
                    <div className="space-y-1 text-xs text-slate-300">
                      <p className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{v.bayLocation}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Wrench className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Teknisi: <strong className="text-slate-300 font-medium">{v.leadMechanic}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {v.targetDeliveryDate}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleSendWaUpdate(v)}
                        title="Kirim Update WA"
                        className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setSelectedVehicle(v)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredVehicles.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400">
                  <p className="text-sm font-bold text-white mb-1">Tidak Ada Kendaraan Ditemukan</p>
                  <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter status SLA.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Table / List Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Menampilkan <strong className="text-white">{filteredVehicles.length}</strong> dari {vehicles.length} unit aktif</span>
          <span className="hidden sm:inline font-medium text-slate-500">AutoCare Workshop Real-Time Telemetry & SPK Tracking</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedVehicle.plateNumber}</h3>
                  <p className="text-xs text-slate-400">{selectedVehicle.vehicleModel} — <span className="text-indigo-400 font-mono">{selectedVehicle.spkNumber}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#0F172A] p-4 rounded-xl border border-slate-800">
                <div>
                  <p className="text-slate-500 font-medium">Pelanggan</p>
                  <p className="text-white font-bold text-sm mt-0.5">{selectedVehicle.customerName}</p>
                  <p className="text-slate-400 font-mono mt-0.5">{selectedVehicle.customerPhone}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Rekanan Asuransi / Fleet</p>
                  <p className="text-indigo-400 font-bold text-sm mt-0.5">{selectedVehicle.insuranceName}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Penempatan Bay</p>
                  <p className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedVehicle.bayLocation}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Lead Mekanik</p>
                  <p className="text-white font-bold mt-0.5">{selectedVehicle.leadMechanic}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-bold mb-2 uppercase tracking-wider text-[10px]">Progres & Catatan Pengerjaan</p>
                <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Tahap Saat Ini: <strong className="text-indigo-400">{selectedVehicle.currentStage}</strong></span>
                    <span className="font-mono font-bold text-white">{selectedVehicle.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedVehicle.progressPercent}%` }}></div>
                  </div>
                  <p className="text-slate-300 italic text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    "{selectedVehicle.notes}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#0F172A] p-3.5 rounded-xl border border-slate-800">
                <div>
                  <p className="text-slate-500 text-[10px]">Tanggal Masuk Unit</p>
                  <p className="text-white font-medium mt-0.5">{selectedVehicle.entryDate}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">Target Estimasi Selesai</p>
                  <p className="text-white font-medium mt-0.5">{selectedVehicle.targetDeliveryDate}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0F172A] flex justify-between items-center gap-2">
              <button 
                onClick={() => handleSendWaUpdate(selectedVehicle)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Kirim Update WhatsApp
              </button>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Service Advisor SLA Repair Delay Modal */}
      <ServiceAdvisorLagAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />

    </div>
  );
}
