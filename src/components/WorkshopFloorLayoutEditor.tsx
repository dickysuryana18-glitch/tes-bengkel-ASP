import { useState } from 'react';
import { 
  LayoutGrid, Car, Move, MapPin, CheckCircle2, AlertTriangle, 
  RotateCcw, Save, Plus, Trash2, Info, Layers, Wrench, 
  Sparkles, Maximize2, RefreshCw, ZoomIn, ZoomOut, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkshopBaySlot {
  id: string;
  name: string;
  code: string;
  type: 'REPAIR_HEAVY' | 'PAINT_OVEN' | 'DEMPUL_PREP' | 'DETAILING_POLES' | 'QC_INSPECTION' | 'PARKING_WAITING' | 'PARKING_DELIVERY';
  x: number; // percentage coordinate 0 - 100
  y: number; // percentage coordinate 0 - 100
  width: number; // percentage width
  height: number; // percentage height
  assignedVehicleId?: string | null;
  assignedMechanic?: string;
}

interface WorkshopVehicle {
  id: string;
  plate: string;
  model: string;
  customer: string;
  stage: string;
  slaStatus: 'ON_TRACK' | 'WARNING' | 'OVERDUE';
  assignedBayId?: string | null;
  color: string;
}

const INITIAL_BAYS: WorkshopBaySlot[] = [
  // Upper Row: Preparation & Heavy Repair
  { id: 'bay-1', name: 'Bay Bongkar & Ketok 1', code: 'BAY-KTK-01', type: 'REPAIR_HEAVY', x: 4, y: 12, width: 20, height: 24, assignedVehicleId: 'veh-1', assignedMechanic: 'Budi Santoso' },
  { id: 'bay-2', name: 'Bay Las & Tarik Frame', code: 'BAY-LAS-02', type: 'REPAIR_HEAVY', x: 27, y: 12, width: 20, height: 24, assignedVehicleId: null, assignedMechanic: 'Ahmad Fauzi' },
  { id: 'bay-3', name: 'Bay Dempul & Epoxy 1', code: 'BAY-DMP-01', type: 'DEMPUL_PREP', x: 50, y: 12, width: 20, height: 24, assignedVehicleId: 'veh-2', assignedMechanic: 'Dedi Kusnadi' },
  { id: 'bay-4', name: 'Bay Dempul & Epoxy 2', code: 'BAY-DMP-02', type: 'DEMPUL_PREP', x: 73, y: 12, width: 20, height: 24, assignedVehicleId: null, assignedMechanic: 'Hendra Gunawan' },

  // Center Row: Spray Booths (Oven Cat)
  { id: 'bay-5', name: 'Spray Booth Oven Cat A', code: 'OVEN-CAT-A', type: 'PAINT_OVEN', x: 4, y: 44, width: 28, height: 26, assignedVehicleId: 'veh-3', assignedMechanic: 'Joko Widodo (Master Painter)' },
  { id: 'bay-6', name: 'Spray Booth Oven Cat B', code: 'OVEN-CAT-B', type: 'PAINT_OVEN', x: 35, y: 44, width: 28, height: 26, assignedVehicleId: null, assignedMechanic: 'Rian Pratama' },
  { id: 'bay-7', name: 'Bay Detailing & Polish', code: 'BAY-POL-01', type: 'DETAILING_POLES', x: 66, y: 44, width: 27, height: 26, assignedVehicleId: 'veh-4', assignedMechanic: 'Wahyu Hidayat' },

  // Bottom Row: QC & Staging Parking Slots
  { id: 'bay-8', name: 'Final Inspection & QC', code: 'BAY-QC-01', type: 'QC_INSPECTION', x: 4, y: 76, width: 24, height: 20, assignedVehicleId: 'veh-5', assignedMechanic: 'Agus Setiawan (QC Lead)' },
  { id: 'bay-9', name: 'Staging Parkir Siap Ambil', code: 'STG-RDY-01', type: 'PARKING_DELIVERY', x: 31, y: 76, width: 30, height: 20, assignedVehicleId: 'veh-6', assignedMechanic: 'Customer Service' },
  { id: 'bay-10', name: 'Slot Parkir Antrean Masuk', code: 'STG-IN-01', type: 'PARKING_WAITING', x: 64, y: 76, width: 29, height: 20, assignedVehicleId: null, assignedMechanic: 'Security / Reception' },
];

const INITIAL_VEHICLES: WorkshopVehicle[] = [
  { id: 'veh-1', plate: 'B 1982 SSY', model: 'Fortuner GR Sport', customer: 'Hendra G.', stage: 'Ketok & Las', slaStatus: 'ON_TRACK', assignedBayId: 'bay-1', color: '#38BDF8' },
  { id: 'veh-2', plate: 'B 2341 TZA', model: 'Honda CR-V Turbo', customer: 'Siti Aminah', stage: 'Dempul Panel', slaStatus: 'WARNING', assignedBayId: 'bay-3', color: '#F59E0B' },
  { id: 'veh-3', plate: 'D 1209 XYZ', model: 'Pajero Sport Dakar', customer: 'Bambang S.', stage: 'Cat Oven Bake', slaStatus: 'OVERDUE', assignedBayId: 'bay-5', color: '#EF4444' },
  { id: 'veh-4', plate: 'B 9912 KAA', model: 'Hyundai Ioniq 5', customer: 'Kevin L.', stage: 'Poles & Detailing', slaStatus: 'ON_TRACK', assignedBayId: 'bay-7', color: '#10B981' },
  { id: 'veh-5', plate: 'F 1455 AA', model: 'Toyota Veloz 1.5 Q', customer: 'PT Sumber Logistik', stage: 'Final QC Check', slaStatus: 'ON_TRACK', assignedBayId: 'bay-8', color: '#6366F1' },
  { id: 'veh-6', plate: 'B 7788 MNO', model: 'Mazda CX-5 GT', customer: 'Dewi Lestari', stage: 'Siap Delivery', slaStatus: 'ON_TRACK', assignedBayId: 'bay-9', color: '#10B981' },
  { id: 'veh-7', plate: 'B 3012 PQR', model: 'Innova Zenix Hybrid', customer: 'Hartono Wijaya', stage: 'Menunggu Alokasi Bay', slaStatus: 'ON_TRACK', assignedBayId: null, color: '#A855F7' },
  { id: 'veh-8', plate: 'B 8821 BBZ', model: 'Toyota Raize GR', customer: 'Dr. Anita', stage: 'Antrean Bongkar', slaStatus: 'WARNING', assignedBayId: null, color: '#EC4899' },
];

export function WorkshopFloorLayoutEditor() {
  const [bays, setBays] = useState<WorkshopBaySlot[]>(INITIAL_BAYS);
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>(INITIAL_VEHICLES);
  const [selectedBay, setSelectedBay] = useState<WorkshopBaySlot | null>(null);
  const [draggedVehicleId, setDraggedVehicleId] = useState<string | null>(null);
  const [hoveredBayId, setHoveredBayId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('ALL');
  const [showGridLines, setShowGridLines] = useState(true);

  // Unassigned vehicles pool (Waiting list in staging lot)
  const unassignedVehicles = vehicles.filter(v => !v.assignedBayId);

  const handleDragStartVehicle = (vehicleId: string) => {
    setDraggedVehicleId(vehicleId);
  };

  const handleDropOnBay = (bayId: string) => {
    if (!draggedVehicleId) return;

    const vehicle = vehicles.find(v => v.id === draggedVehicleId);
    const targetBay = bays.find(b => b.id === bayId);
    if (!vehicle || !targetBay) return;

    // Check if target bay already occupied
    const occupiedVehicle = vehicles.find(v => v.assignedBayId === bayId && v.id !== draggedVehicleId);

    // Update vehicles assignment
    const updatedVehicles = vehicles.map(v => {
      if (v.id === draggedVehicleId) {
        return { ...v, assignedBayId: bayId };
      }
      if (occupiedVehicle && v.id === occupiedVehicle.id) {
        // Swap or unassign previous occupant
        return { ...v, assignedBayId: vehicle.assignedBayId || null };
      }
      return v;
    });

    setVehicles(updatedVehicles);

    // Update bays state
    const updatedBays = bays.map(b => {
      if (b.id === bayId) {
        return { ...b, assignedVehicleId: draggedVehicleId };
      }
      if (vehicle.assignedBayId && b.id === vehicle.assignedBayId) {
        return { ...b, assignedVehicleId: occupiedVehicle ? occupiedVehicle.id : null };
      }
      return b;
    });

    setBays(updatedBays);
    setDraggedVehicleId(null);
    setHoveredBayId(null);

    toast.success(`Unit ${vehicle.plate} Dialokasikan`, {
      description: `Ditempatkan di ${targetBay.name} (${targetBay.code}). Mekanik PIC: ${targetBay.assignedMechanic || 'Standby'}.`
    });
  };

  const handleUnassignVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, assignedBayId: null } : v));
    setBays(bays.map(b => b.assignedVehicleId === vehicleId ? { ...b, assignedVehicleId: null } : b));

    toast.info(`Unit ${vehicle.plate} Dipindahkan ke Antrean`, {
      description: `Unit dilepas dari bay workshop ke parking staging queue.`
    });
  };

  const handleSaveFloorPlan = () => {
    toast.success("Denah & Alokasi Workshop Berhasil Disimpan", {
      description: "Tata letak spasial disinkronkan ke seluruh tablet mekanik & dashboard Service Advisor."
    });
  };

  const handleResetLayout = () => {
    setBays(INITIAL_BAYS);
    setVehicles(INITIAL_VEHICLES);
    toast.info("Tata Letak Workshop Direset ke Default");
  };

  const getBayTypeColor = (type: WorkshopBaySlot['type']) => {
    switch (type) {
      case 'PAINT_OVEN': return 'border-blue-500/50 bg-blue-950/30 text-blue-300';
      case 'DEMPUL_PREP': return 'border-amber-500/50 bg-amber-950/30 text-amber-300';
      case 'REPAIR_HEAVY': return 'border-rose-500/50 bg-rose-950/30 text-rose-300';
      case 'DETAILING_POLES': return 'border-purple-500/50 bg-purple-950/30 text-purple-300';
      case 'QC_INSPECTION': return 'border-teal-500/50 bg-teal-950/30 text-teal-300';
      case 'PARKING_DELIVERY': return 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300';
      default: return 'border-slate-700 bg-slate-900/50 text-slate-400';
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Visual Workshop Floor Layout Editor
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">
              2D Floor Plan Live
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manajemen spasial tata letak bay pengerjaan (Bongkar, Las, Dempul, Oven Cat, QC) dan alokasi unit kendaraan secara Drag & Drop
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleResetLayout}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </button>
          <button 
            onClick={handleSaveFloorPlan}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Alokasi Spasial
          </button>
        </div>
      </div>

      {/* Main Interactive Workshop Editor Container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">
        
        {/* Left Side: Interactive 2D Floor Plan Canvas */}
        <div className="flex-1 bg-[#0B1120] border-2 border-slate-800 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-2xl">
          
          {/* Floor Canvas Controls Toolbar */}
          <div className="flex justify-between items-center mb-3 z-10">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Kapasitas: <strong className="text-white">{bays.filter(b => b.assignedVehicleId).length} / {bays.length} Bay Terisi</strong>
              </span>
              
              <button 
                onClick={() => setShowGridLines(!showGridLines)}
                className={`px-2.5 py-1 rounded border text-xs font-bold transition-colors ${
                  showGridLines ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Grid Lantai
              </button>
            </div>

            {/* Legend Indicators */}
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Ketok/Las
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dempul
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Oven Cat
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Poles
              </span>
              <span className="flex items-center gap-1 text-teal-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span> Final QC
              </span>
            </div>
          </div>

          {/* 2D Workshop Floor Stage */}
          <div 
            className={`flex-1 relative rounded-xl border border-slate-800 bg-[#0F172A]/80 overflow-hidden ${
              showGridLines ? 'bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:4rem_4rem]' : ''
            }`}
          >
            {/* Workshop Zone Markings */}
            <div className="absolute top-2 left-4 text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest pointer-events-none">
              ZONE A: HEAVY BODY REPAIR & PREP AREA
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-4 text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest pointer-events-none">
              ZONE B: SPRAY BOOTH & DUST-FREE PAINT LAB
            </div>
            <div className="absolute bottom-2 left-4 text-[9px] font-mono text-slate-600 font-bold uppercase tracking-widest pointer-events-none">
              ZONE C: FINAL INSPECTION, QC & STAGING LOT
            </div>

            {/* Rendered Bay Slots on Floor */}
            {bays.map(bay => {
              const assignedVehicle = vehicles.find(v => v.assignedBayId === bay.id);
              const isHovered = hoveredBayId === bay.id;

              return (
                <div
                  key={bay.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredBayId(bay.id);
                  }}
                  onDragLeave={() => setHoveredBayId(null)}
                  onDrop={() => handleDropOnBay(bay.id)}
                  onClick={() => setSelectedBay(bay)}
                  style={{
                    left: `${bay.x}%`,
                    top: `${bay.y}%`,
                    width: `${bay.width}%`,
                    height: `${bay.height}%`,
                  }}
                  className={`absolute rounded-xl border-2 p-2.5 flex flex-col justify-between transition-all cursor-pointer ${
                    getBayTypeColor(bay.type)
                  } ${
                    isHovered ? 'scale-[1.03] ring-4 ring-indigo-500 shadow-2xl z-20 border-indigo-400 bg-indigo-950/60' : 'hover:border-slate-500'
                  } ${
                    selectedBay?.id === bay.id ? 'ring-2 ring-white border-white' : ''
                  }`}
                >
                  {/* Bay Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wide opacity-80 block">
                        {bay.code}
                      </span>
                      <h4 className="text-[11px] font-bold text-white truncate max-w-[140px] leading-tight">
                        {bay.name}
                      </h4>
                    </div>

                    <span className={`w-2.5 h-2.5 rounded-full ${
                      assignedVehicle ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`} title={assignedVehicle ? 'Bay Terisi' : 'Bay Kosong'}></span>
                  </div>

                  {/* Inside Bay: Assigned Vehicle Card or Empty Prompt */}
                  {assignedVehicle ? (
                    <div 
                      draggable
                      onDragStart={() => handleDragStartVehicle(assignedVehicle.id)}
                      className="bg-[#0B1120] border border-slate-700/80 rounded-lg p-2 flex items-center justify-between shadow-lg hover:border-indigo-400 transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div 
                          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-950 font-bold shrink-0 shadow"
                          style={{ backgroundColor: assignedVehicle.color }}
                        >
                          <Car className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white font-mono text-[11px] truncate tracking-wide">{assignedVehicle.plate}</p>
                          <p className="text-[9px] text-slate-400 truncate">{assignedVehicle.model}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          assignedVehicle.slaStatus === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400' :
                          assignedVehicle.slaStatus === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {assignedVehicle.stage.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-700/60 rounded-lg h-10 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                      <Move className="w-3 h-3 mr-1 text-slate-600" /> Tarik Mobil ke Sini
                    </div>
                  )}

                  {/* Bay PIC Footer */}
                  <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-slate-800/40">
                    <span className="truncate">PIC: <strong className="text-slate-300">{bay.assignedMechanic || '-'}</strong></span>
                    <span className="font-mono text-slate-500">{assignedVehicle ? 'OCCUPIED' : 'READY'}</span>
                  </div>

                </div>
              );
            })}

          </div>

        </div>

        {/* Right Side: Unassigned Vehicles Queue & Bay Inspector Pane */}
        <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0 overflow-hidden">
          
          {/* Waiting / Staging Vehicles Queue */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex flex-col flex-1 overflow-hidden shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-indigo-400" />
                  Antrean Unit Belum Masuk Bay ({unassignedVehicles.length})
                </h3>
                <p className="text-[10px] text-slate-400">Tarik mobil dari daftar ini langsung ke kotak bay</p>
              </div>
            </div>

            {/* Draggable Vehicle Cards List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {unassignedVehicles.map(veh => (
                <div
                  key={veh.id}
                  draggable
                  onDragStart={() => handleDragStartVehicle(veh.id)}
                  className="bg-[#0F172A] border border-slate-700 hover:border-indigo-500 rounded-xl p-3 shadow-md transition-all hover:scale-[1.01] cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-950 font-bold shrink-0 shadow"
                        style={{ backgroundColor: veh.color }}
                      >
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white font-mono text-xs">{veh.plate}</p>
                        <p className="text-[11px] text-slate-300 font-medium">{veh.model}</p>
                        <p className="text-[10px] text-slate-500">Pelanggan: {veh.customer}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        veh.slaStatus === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        veh.slaStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {veh.stage}
                      </span>
                      <p className="text-[9px] text-slate-500 font-mono mt-1 flex items-center justify-end gap-1">
                        <Move className="w-2.5 h-2.5 text-indigo-400" /> Siap Drag
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {unassignedVehicles.length === 0 && (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-white">Semua Unit Telah Dialokasikan</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tidak ada unit kendaraan yang mengantre di staging area.</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Bay Inspector Panel */}
          {selectedBay && (
            <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-4 shadow-xl animate-in fade-in duration-200">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">{selectedBay.code}</span>
                  <h4 className="text-sm font-bold text-white">{selectedBay.name}</h4>
                </div>
                <button 
                  onClick={() => setSelectedBay(null)}
                  className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Lead Mekanik PIC:</span>
                  <span className="text-white font-bold">{selectedBay.assignedMechanic}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Tipe Pengerjaan:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {selectedBay.type.replace('_', ' ')}
                  </span>
                </div>

                {selectedBay.assignedVehicleId ? (
                  <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl space-y-2 mt-2">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Unit Saat Ini:</p>
                    {(() => {
                      const veh = vehicles.find(v => v.id === selectedBay.assignedVehicleId);
                      if (!veh) return null;
                      return (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white font-mono text-sm">{veh.plate}</p>
                            <p className="text-slate-300 text-xs">{veh.model} ({veh.customer})</p>
                          </div>
                          <button
                            onClick={() => handleUnassignVehicle(veh.id)}
                            className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Lepas Unit
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-slate-500 text-[11px] italic pt-1">
                    Bay saat ini dalam kondisi kosong dan siap menerima unit baru.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
