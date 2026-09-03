import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, Clock, ChevronRight, MessageSquare, 
  Send, Wrench, RefreshCw, Bell, BellRing, Sparkles, ArrowUpRight,
  TrendingUp, CheckCircle2, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  RepairLagAlert, 
  INITIAL_REPAIR_LAG_ALERTS 
} from '../data/historicalRepairBenchmarks';
import { ServiceAdvisorLagAlertModal } from './ServiceAdvisorLagAlertModal';

interface ServiceAdvisorLagAlertsWidgetProps {
  onNavigateToSpk?: (spkNumber: string) => void;
  compact?: boolean;
}

export function ServiceAdvisorLagAlertsWidget({
  onNavigateToSpk,
  compact = false
}: ServiceAdvisorLagAlertsWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<RepairLagAlert[]>(() => {
    const saved = localStorage.getItem('erp_sa_repair_lag_alerts');
    return saved ? JSON.parse(saved) : INITIAL_REPAIR_LAG_ALERTS;
  });

  const unresolvedAlerts = alerts.filter(a => a.saActionStatus !== 'RESOLVED');
  const criticalAlerts = unresolvedAlerts.filter(a => a.severity === 'CRITICAL_LAG');
  const moderateAlerts = unresolvedAlerts.filter(a => a.severity === 'MODERATE_LAG');

  const topCriticalAlert = criticalAlerts[0] || moderateAlerts[0] || alerts[0];

  return (
    <>
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B]/50 to-[#0F172A] border border-rose-500/30 shadow-lg shadow-rose-950/20 relative overflow-hidden ${
        compact ? 'p-3' : ''
      }`}>
        {/* Background Subtle Flare */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  SLA Monitor: Alert Keterlambatan Pengerjaan (Service Advisor)
                </h3>
                {criticalAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                    {criticalAlerts.length} Kritis
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Peringatan dini deviasi durasi status SPK terhadap data benchmark historis bengkel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950 transition-all shrink-0"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Buka Pusat Alert SA ({unresolvedAlerts.length})</span>
            </button>
          </div>
        </div>

        {/* Featured Alert Summary Banner */}
        {topCriticalAlert && (
          <div className="p-3.5 rounded-xl bg-[#0B1120]/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-indigo-400">{topCriticalAlert.spkNumber}</span>
                <span className="font-bold text-xs text-white">{topCriticalAlert.plateNumber}</span>
                <span className="text-xs text-slate-400">({topCriticalAlert.vehicleModel})</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  Tahap {topCriticalAlert.currentStage}: {topCriticalAlert.stageElapsedHours} Jam (Avg Hist: {topCriticalAlert.historicalAvgStageHours} Jam)
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{topCriticalAlert.rootCauseDescription}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Tindakan SA</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mini stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80 text-center">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Unit Terlambat Kritis</span>
            <span className="text-sm font-bold font-mono text-rose-400">{criticalAlerts.length} SPK</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Mendekati Batas SLA</span>
            <span className="text-sm font-bold font-mono text-amber-400">{moderateAlerts.length} SPK</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Rata-rata Deviasi Lag</span>
            <span className="text-sm font-bold font-mono text-indigo-400">+106.8%</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Status Tindakan SA</span>
            <span className="text-sm font-bold font-mono text-emerald-400">Proaktif Terkelola</span>
          </div>
        </div>
      </div>

      {/* Main Alert Modal / Drawer */}
      <ServiceAdvisorLagAlertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Reload from local storage to keep state in sync
          const saved = localStorage.getItem('erp_sa_repair_lag_alerts');
          if (saved) setAlerts(JSON.parse(saved));
        }}
        onNavigateToSpk={onNavigateToSpk}
      />
    </>
  );
}
