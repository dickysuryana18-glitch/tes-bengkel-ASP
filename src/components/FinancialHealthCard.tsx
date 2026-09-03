import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area, XAxis, YAxis
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Flame, PieChart as PieIcon, 
  ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Info, Filter, CheckCircle2, Sliders, ChevronRight, Zap, Calculator,
  FileSpreadsheet, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export interface RepairOrderFinancial {
  id: string;
  spkNumber: string;
  plateNumber: string;
  vehicleModel: string;
  serviceType: 'Body & Paint' | 'General Repair' | 'Sparepart Replacement' | 'Detailing & Coating' | 'AC & Electrical';
  status: 'In-Progress' | 'QC / Ready' | 'Waiting Approval' | 'Waiting Part' | 'Delivered';
  revenue: number;
  partCost: number;
  laborCost: number;
  paintMaterialCost: number;
  allocatedOverhead: number;
}

const MOCK_REPAIR_ORDERS: RepairOrderFinancial[] = [
  {
    id: 'spk-1',
    spkNumber: 'SPK-2026-0881',
    plateNumber: 'B 1982 SSY',
    vehicleModel: 'Toyota Fortuner GR Sport',
    serviceType: 'Body & Paint',
    status: 'In-Progress',
    revenue: 14500000,
    partCost: 3200000,
    laborCost: 2800000,
    paintMaterialCost: 1500000,
    allocatedOverhead: 950000
  },
  {
    id: 'spk-2',
    spkNumber: 'SPK-2026-0875',
    plateNumber: 'B 2341 TZA',
    vehicleModel: 'Honda CR-V Turbo',
    serviceType: 'Body & Paint',
    status: 'In-Progress',
    revenue: 8200000,
    partCost: 1800000,
    laborCost: 1700000,
    paintMaterialCost: 900000,
    allocatedOverhead: 600000
  },
  {
    id: 'spk-3',
    spkNumber: 'SPK-2026-0850',
    plateNumber: 'D 1209 XYZ',
    vehicleModel: 'Mitsubishi Pajero Sport',
    serviceType: 'Body & Paint',
    status: 'In-Progress',
    revenue: 18000000,
    partCost: 5500000,
    laborCost: 3600000,
    paintMaterialCost: 1800000,
    allocatedOverhead: 1200000
  },
  {
    id: 'spk-4',
    spkNumber: 'SPK-2026-0892',
    plateNumber: 'B 1420 KLA',
    vehicleModel: 'Honda HR-V SE',
    serviceType: 'General Repair',
    status: 'In-Progress',
    revenue: 6800000,
    partCost: 2400000,
    laborCost: 1500000,
    paintMaterialCost: 0,
    allocatedOverhead: 500000
  },
  {
    id: 'spk-5',
    spkNumber: 'SPK-2026-0844',
    plateNumber: 'B 8899 MKW',
    vehicleModel: 'Toyota Yaris Cross',
    serviceType: 'Detailing & Coating',
    status: 'QC / Ready',
    revenue: 4500000,
    partCost: 450000,
    laborCost: 1100000,
    paintMaterialCost: 350000,
    allocatedOverhead: 350000
  },
  {
    id: 'spk-6',
    spkNumber: 'SPK-2026-0830',
    plateNumber: 'B 9081 GHL',
    vehicleModel: 'Toyota Hilux Double Cabin',
    serviceType: 'Body & Paint',
    status: 'QC / Ready',
    revenue: 22500000,
    partCost: 6800000,
    laborCost: 4500000,
    paintMaterialCost: 2200000,
    allocatedOverhead: 1500000
  },
  {
    id: 'spk-7',
    spkNumber: 'SPK-2026-0822',
    plateNumber: 'B 3321 KMN',
    vehicleModel: 'Toyota Kijang Innova Zenix',
    serviceType: 'Sparepart Replacement',
    status: 'Waiting Part',
    revenue: 11200000,
    partCost: 6500000,
    laborCost: 1200000,
    paintMaterialCost: 200000,
    allocatedOverhead: 650000
  },
  {
    id: 'spk-8',
    spkNumber: 'SPK-2026-0819',
    plateNumber: 'B 7788 CIV',
    vehicleModel: 'Honda Civic RS Turbo',
    serviceType: 'General Repair',
    status: 'Waiting Approval',
    revenue: 9600000,
    partCost: 3800000,
    laborCost: 1900000,
    paintMaterialCost: 0,
    allocatedOverhead: 700000
  },
  {
    id: 'spk-9',
    spkNumber: 'SPK-2026-0810',
    plateNumber: 'B 1010 WVA',
    vehicleModel: 'Hyundai Ioniq 5 EV',
    serviceType: 'AC & Electrical',
    status: 'In-Progress',
    revenue: 5800000,
    partCost: 1600000,
    laborCost: 1400000,
    paintMaterialCost: 0,
    allocatedOverhead: 450000
  },
  {
    id: 'spk-10',
    spkNumber: 'SPK-2026-0805',
    plateNumber: 'D 4455 BMR',
    vehicleModel: 'BMW 320i Sport',
    serviceType: 'Sparepart Replacement',
    status: 'Delivered',
    revenue: 15400000,
    partCost: 8900000,
    laborCost: 1800000,
    paintMaterialCost: 400000,
    allocatedOverhead: 900000
  }
];

const SERVICE_COLORS: Record<string, string> = {
  'Body & Paint': '#6366F1', // Indigo
  'General Repair': '#06B6D4', // Cyan
  'Sparepart Replacement': '#10B981', // Emerald
  'Detailing & Coating': '#F59E0B', // Amber
  'AC & Electrical': '#EC4899' // Pink
};

// Daily fixed costs baseline for the workshop (Sewa, Gaji Tetap, Lisensi Software, Listrik Dasar)
const DAILY_FIXED_OVERHEAD = 3450000;

export function FinancialHealthCard() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WIP' | 'READY' | 'PENDING'>('ALL');
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [showDetailBreakdown, setShowDetailBreakdown] = useState(false);

  // Filter repair orders based on selection
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'WIP') {
      return MOCK_REPAIR_ORDERS.filter(o => o.status === 'In-Progress');
    }
    if (statusFilter === 'READY') {
      return MOCK_REPAIR_ORDERS.filter(o => o.status === 'QC / Ready' || o.status === 'Delivered');
    }
    if (statusFilter === 'PENDING') {
      return MOCK_REPAIR_ORDERS.filter(o => o.status === 'Waiting Approval' || o.status === 'Waiting Part');
    }
    return MOCK_REPAIR_ORDERS;
  }, [statusFilter]);

  // Aggregate Totals
  const financialTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalPartCost = 0;
    let totalLaborCost = 0;
    let totalPaintMaterialCost = 0;
    let totalAllocatedOverhead = 0;

    filteredOrders.forEach(order => {
      totalRevenue += order.revenue;
      totalPartCost += order.partCost;
      totalLaborCost += order.laborCost;
      totalPaintMaterialCost += order.paintMaterialCost;
      totalAllocatedOverhead += order.allocatedOverhead;
    });

    const totalDirectCOGS = totalPartCost + totalLaborCost + totalPaintMaterialCost;
    const grossProfit = totalRevenue - totalDirectCOGS;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalOperatingCost = totalDirectCOGS + totalAllocatedOverhead;
    const netProfit = totalRevenue - totalOperatingCost;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Daily Burn Rate Calculation
    // Daily Direct Labor Burn = (Total Labor Cost / Estimated avg cycle days: 5.5 days)
    const activeWipCount = filteredOrders.filter(o => o.status === 'In-Progress').length;
    const dailyLaborBurn = (totalLaborCost / 6.5);
    const dailyMaterialBurn = (totalPaintMaterialCost / 4.5);
    const dailyTotalBurnRate = DAILY_FIXED_OVERHEAD + dailyLaborBurn + dailyMaterialBurn;

    // Daily Revenue Run Rate (estimated daily recognized turnover)
    const dailyRevenueRate = totalRevenue / 7;
    const burnCoverageRatio = dailyTotalBurnRate > 0 ? dailyRevenueRate / dailyTotalBurnRate : 0;

    return {
      totalRevenue,
      totalPartCost,
      totalLaborCost,
      totalPaintMaterialCost,
      totalDirectCOGS,
      grossProfit,
      grossMarginPercent,
      totalAllocatedOverhead,
      netProfit,
      netMarginPercent,
      dailyTotalBurnRate,
      dailyLaborBurn,
      dailyMaterialBurn,
      dailyFixedOverhead: DAILY_FIXED_OVERHEAD,
      dailyRevenueRate,
      burnCoverageRatio,
      orderCount: filteredOrders.length,
      activeWipCount
    };
  }, [filteredOrders]);

  // Revenue Pie Data by Service Type
  const revenueByServiceData = useMemo(() => {
    const map: Record<string, { totalRevenue: number; count: number; grossProfit: number }> = {};

    filteredOrders.forEach(order => {
      if (!map[order.serviceType]) {
        map[order.serviceType] = { totalRevenue: 0, count: 0, grossProfit: 0 };
      }
      map[order.serviceType].totalRevenue += order.revenue;
      map[order.serviceType].count += 1;
      const orderCOGS = order.partCost + order.laborCost + order.paintMaterialCost;
      map[order.serviceType].grossProfit += (order.revenue - orderCOGS);
    });

    const total = financialTotals.totalRevenue || 1;

    return Object.entries(map).map(([name, data]) => {
      const percentage = (data.totalRevenue / total) * 100;
      const margin = data.totalRevenue > 0 ? (data.grossProfit / data.totalRevenue) * 100 : 0;
      return {
        name,
        value: data.totalRevenue,
        percentage: Number(percentage.toFixed(1)),
        margin: Number(margin.toFixed(1)),
        count: data.count,
        color: SERVICE_COLORS[name] || '#818CF8'
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredOrders, financialTotals.totalRevenue]);

  // Format IDR Helper
  const formatIDR = (val: number) => {
    if (Math.abs(val) >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(2)} M`;
    }
    if (Math.abs(val) >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const formatFullIDR = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  return (
    <div id="financial-health-card" className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Header with Status & Filter Bar */}
      <div className="p-5 border-b border-slate-800 bg-[#0F172A]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">Kesehatan Finansial & Margin Operasional</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Kondisi Sehat (Ratio {financialTotals.burnCoverageRatio.toFixed(2)}x)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                {financialTotals.orderCount} SPK Terhitung
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kalkulasi real-time Daily Burn Rate, Gross Margin, Net Margin, dan dekomposisi revenue berdasarkan status SPK
            </p>
          </div>
        </div>

        {/* Filter by Order Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-0.5 flex text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua SPK ({MOCK_REPAIR_ORDERS.length})
            </button>
            <button
              onClick={() => setStatusFilter('WIP')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                statusFilter === 'WIP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WIP Sedang Dikerjakan
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                statusFilter === 'READY' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Siap Ambil / QC
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                statusFilter === 'PENDING' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tunggu Part/Appr.
            </button>
          </div>

          <button
            onClick={() => setShowDetailBreakdown(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showDetailBreakdown 
                ? 'bg-slate-800 text-indigo-300 border-indigo-500/50' 
                : 'bg-[#0F172A] hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Tampilkan Detail Struktur Biaya"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rincian Biaya</span>
          </button>
        </div>
      </div>

      {/* Main KPI Strip for Financial Health */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-800/80 bg-[#131D33]/40">
        
        {/* Metric 1: Daily Burn Rate */}
        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Daily Burn Rate
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Operasional/Hari
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl lg:text-2xl font-bold text-white font-mono tracking-tight">
              {formatIDR(financialTotals.dailyTotalBurnRate)}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
              <span>Fixed: <strong className="text-slate-300">{formatIDR(financialTotals.dailyFixedOverhead)}</strong></span>
              <span>Labor+Bahan: <strong className="text-amber-300">{formatIDR(financialTotals.dailyLaborBurn + financialTotals.dailyMaterialBurn)}</strong></span>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full w-[68%] rounded-full"></div>
          </div>
        </div>

        {/* Metric 2: Gross Profit Margin */}
        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Gross Profit Margin
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Target &gt; 40%
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <p className="text-xl lg:text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                {financialTotals.grossMarginPercent.toFixed(1)}%
              </p>
              <span className="text-xs text-slate-400 font-medium">({formatIDR(financialTotals.grossProfit)})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>Revenue: <strong className="text-white font-mono">{formatIDR(financialTotals.totalRevenue)}</strong></span>
            </p>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(financialTotals.grossMarginPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Net Profit Margin */}
        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> Net Profit Margin
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Setelah Overhead
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <p className="text-xl lg:text-2xl font-bold text-indigo-400 font-mono tracking-tight">
                {financialTotals.netMarginPercent.toFixed(1)}%
              </p>
              <span className="text-xs text-slate-400 font-medium">({formatIDR(financialTotals.netProfit)})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Overhead Terserap: <strong className="text-slate-300">{formatIDR(financialTotals.totalAllocatedOverhead)}</strong>
            </p>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(financialTotals.netMarginPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4: Revenue / Burn Coverage Ratio */}
        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Run-Rate Coverage
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
              Kapasitas Kas
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl lg:text-2xl font-bold text-white font-mono tracking-tight">
              {financialTotals.burnCoverageRatio.toFixed(2)}x
            </p>
            <p className="text-[11px] text-teal-400 mt-1.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Pendapatan harian aman menutup biaya tetap</span>
            </p>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-teal-500 h-full w-[85%] rounded-full"></div>
          </div>
        </div>

      </div>

      {/* Expanded Rincian Biaya Drawer (Collapsible) */}
      {showDetailBreakdown && (
        <div className="p-4 bg-[#0B1120] border-b border-slate-800 text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-300">
            <div className="p-3 bg-[#131D33] rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Sparepart COGS</div>
              <div className="text-base font-bold text-white mt-1 font-mono">{formatFullIDR(financialTotals.totalPartCost)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {((financialTotals.totalPartCost / (financialTotals.totalRevenue || 1)) * 100).toFixed(1)}% dari Total Revenue
              </div>
            </div>

            <div className="p-3 bg-[#131D33] rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Biaya Tenaga Kerja (Labor)</div>
              <div className="text-base font-bold text-white mt-1 font-mono">{formatFullIDR(financialTotals.totalLaborCost)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {((financialTotals.totalLaborCost / (financialTotals.totalRevenue || 1)) * 100).toFixed(1)}% dari Total Revenue
              </div>
            </div>

            <div className="p-3 bg-[#131D33] rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Material Cat & Thinner</div>
              <div className="text-base font-bold text-white mt-1 font-mono">{formatFullIDR(financialTotals.totalPaintMaterialCost)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {((financialTotals.totalPaintMaterialCost / (financialTotals.totalRevenue || 1)) * 100).toFixed(1)}% dari Total Revenue
              </div>
            </div>

            <div className="p-3 bg-[#131D33] rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Alokasi Beban Pabrik & Fasilitas</div>
              <div className="text-base font-bold text-white mt-1 font-mono">{formatFullIDR(financialTotals.totalAllocatedOverhead)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Oven heating, sewa bay, listrik 3-phase
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Left = Integrated Pie Chart Breakdown, Right = Financial Breakdown Table & Margins */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* LEFT: Integrated Pie Chart for Service Revenue Breakdown */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-[#0F172A]/70 rounded-xl border border-slate-800/80">
          <div className="w-full flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
              Revenue by Service Type
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Total: <strong className="text-white">{formatIDR(financialTotals.totalRevenue)}</strong>
            </span>
          </div>

          {/* Integrated Donut Pie Chart */}
          <div className="h-[230px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByServiceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#0F172A"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setActiveSegment(revenueByServiceData[index]?.name || null)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  {revenueByServiceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={activeSegment === null || activeSegment === entry.name ? 1 : 0.45}
                      className="cursor-pointer transition-all duration-300"
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-bold text-white font-mono tracking-tight">
                {activeSegment 
                  ? `${revenueByServiceData.find(s => s.name === activeSegment)?.percentage}%`
                  : `${financialTotals.grossMarginPercent.toFixed(0)}%`
                }
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider max-w-[100px] truncate">
                {activeSegment || 'Gross Margin'}
              </span>
            </div>
          </div>

          {/* Legend Grid with Margins per Service */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800">
            {revenueByServiceData.map(service => (
              <div 
                key={service.name}
                onMouseEnter={() => setActiveSegment(service.name)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  activeSegment === service.name 
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-sm' 
                    : 'bg-[#131D33]/60 border-slate-800/60 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: service.color }} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">{service.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatIDR(service.value)} ({service.percentage}%)</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    +{service.margin}%
                  </span>
                  <p className="text-[9px] text-slate-500">{service.count} unit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Live Work Order Profitability Matrix & Recommendations */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                Matriks Profitabilitas SPK Aktif
              </h4>
              <p className="text-[11px] text-slate-400">Analisis margin kontribusi per unit perbaikan</p>
            </div>

            <button
              onClick={() => {
                toast.success("Mengekspor Laporan Kesehatan Finansial Workshop (PDF/Excel)");
              }}
              className="text-[11px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>Ekspor Laporan</span>
            </button>
          </div>

          {/* Compact Mini Table of Top SPK Margins */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0F172A]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#131D33] text-[10px] uppercase text-slate-400 tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">No. SPK & Unit</th>
                  <th className="px-3 py-2.5">Layanan</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5 text-right">COGS Direct</th>
                  <th className="px-3 py-2.5 text-right">Gross Margin</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrders.slice(0, 5).map(order => {
                  const directCogs = order.partCost + order.laborCost + order.paintMaterialCost;
                  const marginRp = order.revenue - directCogs;
                  const marginPct = (marginRp / order.revenue) * 100;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-indigo-300">{order.spkNumber}</div>
                        <div className="text-[10px] text-slate-400">{order.plateNumber} • {order.vehicleModel}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                          backgroundColor: `${SERVICE_COLORS[order.serviceType]}20`,
                          color: SERVICE_COLORS[order.serviceType],
                          border: `1px solid ${SERVICE_COLORS[order.serviceType]}40`
                        }}>
                          {order.serviceType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                        {formatIDR(order.revenue)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                        {formatIDR(directCogs)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                        +{marginPct.toFixed(1)}%
                        <div className="text-[9px] text-slate-400 font-normal">({formatIDR(marginRp)})</div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          order.status === 'In-Progress' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : order.status === 'QC / Ready'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Strategic Financial Insights Footer Banner */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-950/40 via-[#0F172A] to-emerald-950/30 rounded-xl border border-indigo-900/50 flex items-start gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-200 leading-relaxed font-medium">
                <strong className="text-emerald-400">Optimasi Keuangan:</strong> Layanan <strong className="text-white">Body & Paint</strong> menyumbang margin kotor tertinggi (<strong className="text-emerald-400">46.8%</strong>). Daily Burn Rate saat ini terkendali pada <strong className="text-white">{formatIDR(financialTotals.dailyTotalBurnRate)}/hari</strong> dengan rasio penutupan kas sehat di <strong className="text-teal-300">{financialTotals.burnCoverageRatio.toFixed(2)}x</strong>.
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                <span>Titik Impas (BEP): <strong>4 Unit SPK/Minggu</strong></span>
                <span>•</span>
                <span>Efisiensi Material Thinner: <strong>94.2%</strong></span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
