import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, ShieldAlert, CheckCircle2, ChevronRight,
  MessageSquare, Send, Calendar, User, Wrench, RefreshCw, X,
  TrendingUp, Sparkles, Filter, ExternalLink, Phone, ArrowUpRight,
  Sliders, Activity, Check, Copy, AlertCircle, PlusCircle, BellRing
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  RepairLagAlert, 
  HISTORICAL_BENCHMARKS, 
  INITIAL_REPAIR_LAG_ALERTS, 
  calculateStageLag,
  LagSeverity 
} from '../data/historicalRepairBenchmarks';

interface ServiceAdvisorLagAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSpk?: (spkNumber: string) => void;
}

export function ServiceAdvisorLagAlertModal({
  isOpen,
  onClose,
  onNavigateToSpk
}: ServiceAdvisorLagAlertModalProps) {
  const [alerts, setAlerts] = useState<RepairLagAlert[]>(() => {
    const saved = localStorage.getItem('erp_sa_repair_lag_alerts');
    return saved ? JSON.parse(saved) : INITIAL_REPAIR_LAG_ALERTS;
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'UNRESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<RepairLagAlert | null>(alerts[0] || null);
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'BENCHMARK_EXPLORER' | 'SIMULATE_ANOMALY'>('ALERTS');

  // Action Modals / Forms inside Drawer
  const [actionType, setActionType] = useState<'NONE' | 'WHATSAPP' | 'ESCALATE' | 'RESCHEDULE' | 'RESOLVE'>('NONE');
  const [customWaMessage, setCustomWaMessage] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [escalationPriority, setEscalationPriority] = useState<'URGENT_EXPEDITE' | 'BAY_REALLOCATE' | 'OVERTIME_REQUEST'>('URGENT_EXPEDITE');
  const [actionNotes, setActionNotes] = useState('');

  // Simulation Form State
  const [simDamageClass, setSimDamageClass] = useState<'RINGAN' | 'SEDANG' | 'BERAT' | 'GENERAL_REPAIR'>('SEDANG');
  const [simStage, setSimStage] = useState('Ketok');
  const [simElapsedHours, setSimElapsedHours] = useState(38);
  const [simSpkNumber, setSimSpkNumber] = useState('SPK-2026-0912');
  const [simPlate, setSimPlate] = useState('B 7788 JKL');
  const [simCustomer, setSimCustomer] = useState('Rahmat Hidayat');
  const [simModel, setSimModel] = useState('Toyota Innova Zenix Q Hybrid');

  const saveAlerts = (newAlerts: RepairLagAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('erp_sa_repair_lag_alerts', JSON.stringify(newAlerts));
  };

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(item => {
    if (activeFilter === 'CRITICAL') return item.severity === 'CRITICAL_LAG';
    if (activeFilter === 'MODERATE') return item.severity === 'MODERATE_LAG';
    if (activeFilter === 'UNRESOLVED') return item.saActionStatus !== 'RESOLVED';
    return true;
  });

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL_LAG' && a.saActionStatus !== 'RESOLVED').length;
  const warningCount = alerts.filter(a => a.severity === 'MODERATE_LAG' && a.saActionStatus !== 'RESOLVED').length;

  const handleOpenWhatsApp = (alertItem: RepairLagAlert) => {
    setSelectedAlert(alertItem);
    setCustomWaMessage(alertItem.customerNoticeSuggested);
    setActionType('WHATSAPP');
  };

  const handleSendWhatsApp = () => {
    if (!selectedAlert) return;
    const updated = alerts.map(a => a.id === selectedAlert.id ? {
      ...a,
      saActionStatus: 'CUSTOMER_NOTIFIED' as const,
      lastActionAt: new Date().toISOString(),
      actionNotes: `Notifikasi WA terkirim ke pelanggan: "${customWaMessage.substring(0, 60)}..."`
    } : a);

    saveAlerts(updated);
    setSelectedAlert({
      ...selectedAlert,
      saActionStatus: 'CUSTOMER_NOTIFIED',
      lastActionAt: new Date().toISOString()
    });

    toast.success('Pesan WhatsApp Pengingat Terkirim ke Customer', {
      description: `Customer ${selectedAlert.customerName} (${selectedAlert.customerPhone}) telah dinotifikasi mengenai update ETA.`
    });
    setActionType('NONE');
  };

  const handleEscalateForeman = () => {
    if (!selectedAlert) return;
    const updated = alerts.map(a => a.id === selectedAlert.id ? {
      ...a,
      saActionStatus: 'ESCALATED_FOREMAN' as const,
      lastActionAt: new Date().toISOString(),
      actionNotes: `Eskalasi Prioritas (${escalationPriority}): ${actionNotes || 'Percepat perpindahan stage unit.'}`
    } : a);

    saveAlerts(updated);
    setSelectedAlert({
      ...selectedAlert,
      saActionStatus: 'ESCALATED_FOREMAN',
      lastActionAt: new Date().toISOString()
    });

    toast.warning('Tiket Eskalasi Terkirim ke Foreman & Workshop Manager', {
      description: `SPK ${selectedAlert.spkNumber} masuk antrean prioritas ekspedite bengkel.`
    });
    setActionType('NONE');
    setActionNotes('');
  };

  const handleRescheduleETA = () => {
    if (!selectedAlert || !newDeliveryDate) return;
    const updated = alerts.map(a => a.id === selectedAlert.id ? {
      ...a,
      projectedNewDeliveryDate: newDeliveryDate,
      saActionStatus: 'ETA_RESCHEDULED' as const,
      lastActionAt: new Date().toISOString(),
      actionNotes: `Janji serah terima disesuaikan dari ${a.originalPromisedDate} ke ${newDeliveryDate}. Catatan: ${actionNotes}`
    } : a);

    saveAlerts(updated);
    setSelectedAlert({
      ...selectedAlert,
      projectedNewDeliveryDate: newDeliveryDate,
      saActionStatus: 'ETA_RESCHEDULED',
      lastActionAt: new Date().toISOString()
    });

    toast.info(`Jadwal Serah Terima SPK ${selectedAlert.spkNumber} Berhasil Diperbarui`, {
      description: `Tanggal janji penyerahan baru: ${newDeliveryDate}`
    });
    setActionType('NONE');
    setActionNotes('');
  };

  const handleResolveAlert = (alertItem: RepairLagAlert) => {
    const updated = alerts.map(a => a.id === alertItem.id ? {
      ...a,
      saActionStatus: 'RESOLVED' as const,
      lastActionAt: new Date().toISOString(),
      actionNotes: 'Alert diselesaikan oleh Service Advisor setelah konfirmasi progres lapangan.'
    } : a);

    saveAlerts(updated);
    if (selectedAlert?.id === alertItem.id) {
      setSelectedAlert({
        ...selectedAlert,
        saActionStatus: 'RESOLVED'
      });
    }
    toast.success(`Alert SPK ${alertItem.spkNumber} ditandai selesai/terkelola.`);
  };

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const lagCalc = calculateStageLag(simDamageClass, simStage, Number(simElapsedHours));

    const newAlert: RepairLagAlert = {
      id: `sim-${Date.now()}`,
      spkNumber: simSpkNumber,
      plateNumber: simPlate,
      vehicleModel: simModel,
      customerName: simCustomer,
      customerPhone: '081298765432',
      serviceAdvisorName: 'Doni Pratama, S.T.',
      assignedForeman: 'Budi Santoso',
      insuranceName: 'Garda Oto Comprehensive',
      damageClass: simDamageClass,
      currentStage: simStage,
      bayLocation: `Bay ${simStage} 2`,
      stageEnteredAt: new Date(Date.now() - simElapsedHours * 3600000).toISOString(),
      stageElapsedHours: Number(simElapsedHours),
      historicalAvgStageHours: lagCalc.historicalAvg,
      slaWarningHours: lagCalc.slaWarning,
      slaCriticalHours: lagCalc.slaCritical,
      lagDurationHours: lagCalc.lagHours,
      lagPercentage: lagCalc.lagPercent,
      severity: lagCalc.severity,
      repairStartedAt: '2026-08-25',
      originalPromisedDate: '2026-08-28',
      projectedNewDeliveryDate: lagCalc.severity === 'CRITICAL_LAG' ? '2026-08-31' : '2026-08-29',
      totalScheduleDelayDays: lagCalc.severity === 'CRITICAL_LAG' ? 3 : lagCalc.severity === 'MODERATE_LAG' ? 1 : 0,
      rootCauseCategory: lagCalc.lagPercent > 80 ? 'SPAREPART_WAIT' : 'BAY_BOTTLENECK',
      rootCauseDescription: `Simulasi: Terjadi stagnasi status di tahap ${simStage} selama ${simElapsedHours} jam (rata-rata historis ${lagCalc.historicalAvg} jam). Deviasi: +${lagCalc.lagPercent}%.`,
      recommendedAction: `Konfirmasi SA dengan Foreman ${simStage} untuk memastikan kelancaran material & mekanik bertugas.`,
      customerNoticeSuggested: `Yth. Bpk/Ibu ${simCustomer}, kami mengabarkan progres unit ${simPlate} saat ini sedang penyelesaian di tahap ${simStage}. Terima kasih atas kesabaran Anda.`,
      saActionStatus: 'UNACKNOWLEDGED'
    };

    const updatedList = [newAlert, ...alerts];
    saveAlerts(updatedList);
    setSelectedAlert(newAlert);
    setActiveTab('ALERTS');

    if (lagCalc.severity === 'CRITICAL_LAG') {
      toast.error(`🚨 ALERT KRITIS: SPK ${simSpkNumber} Mengalami Keterlambatan Signifikan!`, {
        description: `Waktu pengerjaan ${simElapsedHours} jam melebihi rata-rata historis ${lagCalc.historicalAvg} jam (+${lagCalc.lagPercent}%).`
      });
    } else if (lagCalc.severity === 'MODERATE_LAG') {
      toast.warning(`⚠️ PERINGATAN LAG: SPK ${simSpkNumber} Mendekati Batas Toleransi SLA`, {
        description: `Deviasi +${lagCalc.lagPercent}% dari rata-rata historis tahap ${simStage}.`
      });
    } else {
      toast.info(`ℹ️ SPK ${simSpkNumber} berhasil dievaluasi (Status: On Track).`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#1E293B]/70 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Sistem Alert Keterlambatan Pengerjaan (SA Delay Warning)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Data Historis Bengkel Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Notifikasi cerdas untuk Service Advisor saat durasi status perbaikan menyimpang dari benchmark rata-rata historis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                saveAlerts(INITIAL_REPAIR_LAG_ALERTS);
                toast.success('Data alert keterlambatan direset ke benchmark default.');
              }}
              className="p-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors hidden sm:flex items-center gap-1.5"
              title="Reset Data Benchmark"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Metric Bar & Navigation Tabs */}
        <div className="bg-[#0B1120] border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ALERTS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Daftar Alert Aktif</span>
              {criticalCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {criticalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('BENCHMARK_EXPLORER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'BENCHMARK_EXPLORER'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Benchmark Historis Bengkel</span>
            </button>

            <button
              onClick={() => setActiveTab('SIMULATE_ANOMALY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'SIMULATE_ANOMALY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Uji Simulasi Lag</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-bold">{criticalCount}</span> Kritis (&gt;50% Lag)
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-md">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-bold">{warningCount}</span> Peringatan (25-50%)
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'ALERTS' && (
            <>
              {/* Left Column: Alerts List */}
              <div className="w-full md:w-5/12 border-r border-slate-800 flex flex-col bg-[#0F172A] overflow-hidden">
                {/* Filter Header */}
                <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-300">Filter Status:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveFilter('ALL')}
                      className={`px-2 py-0.5 text-[11px] rounded font-medium ${
                        activeFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Semua ({alerts.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('CRITICAL')}
                      className={`px-2 py-0.5 text-[11px] rounded font-medium ${
                        activeFilter === 'CRITICAL' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-950/40'
                      }`}
                    >
                      Kritis
                    </button>
                    <button
                      onClick={() => setActiveFilter('MODERATE')}
                      className={`px-2 py-0.5 text-[11px] rounded font-medium ${
                        activeFilter === 'MODERATE' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-amber-950/40'
                      }`}
                    >
                      Warning
                    </button>
                  </div>
                </div>

                {/* List of Alerts */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {filteredAlerts.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
                      <p className="text-xs font-medium">Tidak ada alert keterlambatan aktif pada filter ini.</p>
                      <p className="text-[11px] text-slate-600">Seluruh SPK berjalan sesuai target SLA historis.</p>
                    </div>
                  ) : (
                    filteredAlerts.map(alertItem => {
                      const isSelected = selectedAlert?.id === alertItem.id;
                      const isCritical = alertItem.severity === 'CRITICAL_LAG';
                      const isModerate = alertItem.severity === 'MODERATE_LAG';

                      return (
                        <div
                          key={alertItem.id}
                          onClick={() => setSelectedAlert(alertItem)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                              : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-indigo-300">
                                  {alertItem.spkNumber}
                                </span>
                                <span className="font-bold text-xs text-white">
                                  {alertItem.plateNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                {alertItem.vehicleModel} • {alertItem.customerName}
                              </p>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                : isModerate
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {isCritical ? '🚨 KRITIS +' + alertItem.lagPercentage + '%' : isModerate ? '⚠️ LAG +' + alertItem.lagPercentage + '%' : 'ON TRACK'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Tahap Stagnan:</span>
                              <span className="font-semibold text-rose-300">{alertItem.currentStage} ({alertItem.stageElapsedHours}h)</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Rata-rata Historis:</span>
                              <span className="text-slate-300">{alertItem.historicalAvgStageHours}h (Batas: {alertItem.slaCriticalHours}h)</span>
                            </div>
                          </div>

                          {alertItem.saActionStatus !== 'UNACKNOWLEDGED' && (
                            <div className="mt-2 text-[10px] text-teal-400 bg-teal-950/30 border border-teal-900/40 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Status SA: {alertItem.saActionStatus.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Selected Alert Detailed Analysis & SA Actions */}
              <div className="w-full md:w-7/12 flex flex-col bg-[#0B1120] overflow-y-auto custom-scrollbar p-5">
                {selectedAlert ? (
                  <div className="space-y-5">
                    {/* Top Identity Card */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">
                              {selectedAlert.plateNumber} — {selectedAlert.vehicleModel}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {selectedAlert.damageClass}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Customer: <strong className="text-slate-200">{selectedAlert.customerName}</strong> ({selectedAlert.customerPhone}) • Asuransi: {selectedAlert.insuranceName}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Service Advisor PIC:</span>
                          <span className="text-xs font-semibold text-slate-200">{selectedAlert.serviceAdvisorName}</span>
                        </div>
                      </div>

                      {/* Stage Timing Deviation Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800 text-center">
                        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Durasi di {selectedAlert.currentStage}</span>
                          <span className="text-base font-mono font-bold text-rose-400">
                            {selectedAlert.stageElapsedHours} jam
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Rata-rata Historis</span>
                          <span className="text-base font-mono font-bold text-slate-200">
                            {selectedAlert.historicalAvgStageHours} jam
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Keterlambatan (Lag)</span>
                          <span className="text-base font-mono font-bold text-amber-400">
                            +{selectedAlert.lagDurationHours} jam (+{selectedAlert.lagPercentage}%)
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Proyeksi Selesai Baru</span>
                          <span className="text-base font-mono font-bold text-indigo-400">
                            {selectedAlert.projectedNewDeliveryDate}
                          </span>
                        </div>
                      </div>

                      {/* Visual Timeline Comparison */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-400 font-medium">Beban Waktu Tahap Terhadap Toleransi SLA:</span>
                          <span className="font-mono font-bold text-rose-400">
                            {Math.min(100, Math.round((selectedAlert.stageElapsedHours / selectedAlert.slaCriticalHours) * 100))}% dari Ambang Kritis ({selectedAlert.slaCriticalHours} jam)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex relative">
                          <div 
                            className={`h-full transition-all ${
                              selectedAlert.severity === 'CRITICAL_LAG' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, (selectedAlert.stageElapsedHours / selectedAlert.slaCriticalHours) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>0h (Mulai)</span>
                          <span>Target Rata-rata: {selectedAlert.historicalAvgStageHours}h</span>
                          <span>Warning SLA: {selectedAlert.slaWarningHours}h</span>
                          <span className="text-rose-400 font-semibold">Critical SLA: {selectedAlert.slaCriticalHours}h</span>
                        </div>
                      </div>
                    </div>

                    {/* AI & Historical Root Cause Analysis */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#1e1b4b]/40 border border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          Analisis Akar Masalah & Rekomendasi Sistem
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {selectedAlert.rootCauseDescription}
                      </p>
                      <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-indigo-300">Rekomendasi Tindakan Service Advisor:</strong>
                          <span>{selectedAlert.recommendedAction}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Workspace for Service Advisor */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Aksi Respons Service Advisor (Solusi Cepat)</span>
                        <span className="text-[10px] font-normal text-slate-500">Pilih salah satu tindakan</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Action 1: WhatsApp Customer */}
                        <button
                          onClick={() => handleOpenWhatsApp(selectedAlert)}
                          className="p-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-700/40 hover:border-emerald-600 text-left transition-all group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">WhatsApp</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-200">Kirim Update WA</p>
                            <p className="text-[10px] text-emerald-400/80 leading-tight mt-0.5">Beritahu customer secara proaktif sebelum komplain.</p>
                          </div>
                        </button>

                        {/* Action 2: Escalate to Foreman */}
                        <button
                          onClick={() => {
                            setActionType('ESCALATE');
                            setActionNotes('');
                          }}
                          className="p-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-700/40 hover:border-amber-600 text-left transition-all group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Wrench className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">Workshop</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-200">Eskalasi ke Foreman</p>
                            <p className="text-[10px] text-amber-400/80 leading-tight mt-0.5">Minta percepatan bay / alokasi mekanik tambahan.</p>
                          </div>
                        </button>

                        {/* Action 3: Adjust Delivery Promise Date */}
                        <button
                          onClick={() => {
                            setActionType('RESCHEDULE');
                            setNewDeliveryDate(selectedAlert.projectedNewDeliveryDate);
                            setActionNotes('');
                          }}
                          className="p-3 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-700/40 hover:border-indigo-600 text-left transition-all group flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">Jadwal</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-200">Ubah Janji Selesai</p>
                            <p className="text-[10px] text-indigo-400/80 leading-tight mt-0.5">Sinkronkan tanggal estimasi baru ke sistem & SPK.</p>
                          </div>
                        </button>
                      </div>

                      {/* Interactive Action Forms */}
                      {actionType === 'WHATSAPP' && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-800/90 border border-emerald-500/40 space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> Template Pesan WhatsApp ke {selectedAlert.customerName}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(customWaMessage);
                                toast.success('Template pesan disalin ke clipboard!');
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Salin Teks
                            </button>
                          </div>
                          <textarea
                            value={customWaMessage}
                            onChange={(e) => setCustomWaMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            placeholder="Ketik pesan update status untuk customer..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActionType('NONE')}
                              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleSendWhatsApp}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                            >
                              <Send className="w-3 h-3" /> Kirim Update WA & Log
                            </button>
                          </div>
                        </div>
                      )}

                      {actionType === 'ESCALATE' && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-800/90 border border-amber-500/40 space-y-3 animate-in fade-in">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" /> Form Tiket Eskalasi ke Foreman {selectedAlert.assignedForeman}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Tingkat Prioritas Bengkel:</label>
                              <select
                                value={escalationPriority}
                                onChange={(e: any) => setEscalationPriority(e.target.value)}
                                className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                              >
                                <option value="URGENT_EXPEDITE">⚡ Urgent Expedite (Prioritas 1)</option>
                                <option value="BAY_REALLOCATE">🔄 Pindah Bay / Tambah Mekanik</option>
                                <option value="OVERTIME_REQUEST">🌙 Ajukan Lembur Khusus Unit</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Catatan Tambahan untuk Foreman:</label>
                              <input
                                type="text"
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder="Contoh: Unit harus masuk booth oven sebelum jam 15:00"
                                className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActionType('NONE')}
                              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleEscalateForeman}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" /> Kirim Instruksi Eskalasi
                            </button>
                          </div>
                        </div>
                      )}

                      {actionType === 'RESCHEDULE' && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-800/90 border border-indigo-500/40 space-y-3 animate-in fade-in">
                          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Penyesuaian Janji Selesai Baru (Reschedule ETA)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Tanggal Janji Selesai Baru:</label>
                              <input
                                type="date"
                                value={newDeliveryDate}
                                onChange={(e) => setNewDeliveryDate(e.target.value)}
                                className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Alasan Penyesuaian:</label>
                              <input
                                type="text"
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder="Contoh: Keterlambatan supply part sasis OEM"
                                className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActionType('NONE')}
                              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleRescheduleETA}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                            >
                              <Check className="w-3 h-3" /> Simpan Tanggal Baru & Update SPK
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <button
                          onClick={() => handleResolveAlert(selectedAlert)}
                          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Tandai Selesai / Terkelola</span>
                        </button>

                        {onNavigateToSpk && (
                          <button
                            onClick={() => onNavigateToSpk(selectedAlert.spkNumber)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                          >
                            <span>Buka SPK di Workshop Board</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                    <ShieldAlert className="w-12 h-12 mb-2 opacity-40" />
                    <p className="text-xs">Pilih salah satu alert keterlambatan di sisi kiri untuk melihat analisis mendalam.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: Historical Benchmarks Explorer */}
          {activeTab === 'BENCHMARK_EXPLORER' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#0B1120]">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Kamus Standar Waktu Pengerjaan Historis (Workshop Historical Baseline)
                </h3>
                <p className="text-xs text-slate-400">
                  Data statistik durasi rata-rata per tahap pengerjaan yang dihitung dari ratusan histori SPK unit selesai di AutoCare Bengkel Pro.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.values(HISTORICAL_BENCHMARKS).map(bm => (
                  <div key={bm.damageClass} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div>
                        <h4 className="text-sm font-bold text-white">{bm.label}</h4>
                        <p className="text-[11px] text-slate-400">{bm.description}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                        Avg {bm.totalHistoricalAvgDays} Hari
                      </span>
                    </div>

                    <div className="space-y-2">
                      {bm.stages.map(st => (
                        <div key={st.stageId} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 text-xs">
                          <span className="text-slate-300 font-medium">{st.stageName}</span>
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <span className="text-emerald-400 font-bold" title="Rata-rata Historis">
                              Avg: {st.historicalAvgHours}h
                            </span>
                            <span className="text-amber-400" title="Batas Peringatan SA">
                              Warn: {st.slaWarningThresholdHours}h
                            </span>
                            <span className="text-rose-400 font-bold" title="Batas Kritis">
                              Crit: {st.slaCriticalThresholdHours}h
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Anomaly Simulator & Testing */}
          {activeTab === 'SIMULATE_ANOMALY' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0B1120]">
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Uji Simulasi Deteksi Keterlambatan (Anomaly Engine Test)</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Masukkan durasi pengerjaan suatu SPK untuk menguji kalkulasi deviasi historis dan pemicu alert Service Advisor.
                  </p>
                </div>

                <form onSubmit={handleRunSimulation} className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Nomor SPK:</label>
                      <input
                        type="text"
                        value={simSpkNumber}
                        onChange={(e) => setSimSpkNumber(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">No. Polisi:</label>
                      <input
                        type="text"
                        value={simPlate}
                        onChange={(e) => setSimPlate(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Model Mobil:</label>
                      <input
                        type="text"
                        value={simModel}
                        onChange={(e) => setSimModel(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Customer:</label>
                      <input
                        type="text"
                        value={simCustomer}
                        onChange={(e) => setSimCustomer(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Kategori Kerusakan:</label>
                      <select
                        value={simDamageClass}
                        onChange={(e: any) => setSimDamageClass(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      >
                        <option value="RINGAN">Ringan (1-2 Panel)</option>
                        <option value="SEDANG">Sedang (3-5 Panel)</option>
                        <option value="BERAT">Berat (Sasis/Tabrakan)</option>
                        <option value="GENERAL_REPAIR">General Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Tahap Pengerjaan:</label>
                      <select
                        value={simStage}
                        onChange={(e) => setSimStage(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      >
                        <option value="Bongkar">Bongkar</option>
                        <option value="Ketok">Ketok</option>
                        <option value="Dempul">Dempul</option>
                        <option value="Cat Oven">Cat Oven</option>
                        <option value="Poles">Poles</option>
                        <option value="Pasang">Pasang</option>
                        <option value="QC">QC</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Lama Berjalan di Tahap (Jam):</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={simElapsedHours}
                        onChange={(e) => setSimElapsedHours(Number(e.target.value))}
                        className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Eksekusi Simulasi & Picu Alert SA</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
