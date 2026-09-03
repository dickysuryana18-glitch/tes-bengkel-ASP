import { useState, useRef, useEffect, type ReactNode, type FormEvent } from "react";
import { Clock, AlertCircle, Search, BarChart2, MessageSquare, Send, X, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { VehicleDetailsModal } from "./VehicleDetailsModal";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects,
  useDroppable
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getStoredWorkOrders, saveWorkOrdersToStorage, WorkOrderItem, WorkshopKanbanStage, SPKStatus, DetailedRepairStage } from "../data/spkDatabase";

// Types
type Priority = 'low' | 'normal' | 'high';
type Status = 'estimasi' | 'approval' | 'repair' | 'painting' | 'assembly' | 'qc';

interface VehicleHistory {
  stage: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
}

interface VehicleCard {
  id: string;
  plate: string;
  customer: string;
  model: string;
  time: string;
  priority: Priority;
  progress?: number;
  info?: string;
  mechanic?: string;
  notes?: string;
  history?: VehicleHistory[];
}

interface Column {
  id: Status;
  title: string;
  color: string;
  cards: VehicleCard[];
}

function buildKanbanColumnsFromWorkOrders(workOrders: WorkOrderItem[]): Column[] {
  const baseColumns: Record<Status, VehicleCard[]> = {
    estimasi: [],
    approval: [],
    repair: [],
    painting: [],
    assembly: [],
    qc: []
  };

  workOrders.forEach(order => {
    const stage = (order.kanbanStage as Status) || 'repair';
    const validStage: Status = baseColumns[stage] ? stage : 'repair';

    const card: VehicleCard = {
      id: order.id,
      plate: order.vehicle.plate,
      customer: order.customer.name,
      model: `${order.vehicle.brand} ${order.vehicle.model}`,
      time: order.daysRemaining !== undefined ? (order.daysRemaining >= 0 ? `${order.daysRemaining}h remaining` : 'Overdue') : 'In Progress',
      priority: order.priority || 'normal',
      progress: order.progressPercent,
      info: order.insuranceCompany || order.bayLocation,
      mechanic: order.leadMechanic,
      notes: order.notes,
      history: (order.history || []).map(h => ({
        stage: h.stage,
        date: h.date,
        status: h.status
      }))
    };

    baseColumns[validStage].push(card);
  });

  return [
    {
      id: 'estimasi',
      title: 'Estimasi',
      color: 'border-l-slate-500',
      cards: baseColumns.estimasi
    },
    {
      id: 'approval',
      title: 'Approval',
      color: 'border-l-purple-500',
      cards: baseColumns.approval
    },
    {
      id: 'repair',
      title: 'Repair',
      color: 'border-l-blue-500',
      cards: baseColumns.repair
    },
    {
      id: 'painting',
      title: 'Painting',
      color: 'border-l-amber-500',
      cards: baseColumns.painting
    },
    {
      id: 'assembly',
      title: 'Assembly',
      color: 'border-l-indigo-500',
      cards: baseColumns.assembly
    },
    {
      id: 'qc',
      title: 'QC',
      color: 'border-l-teal-500',
      cards: baseColumns.qc
    }
  ];
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  isMe: boolean;
  context?: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', sender: 'Siti', role: 'Service Advisor', text: 'Budi, untuk B 1982 SSY apakah proses oven cat sudah selesai lapisan clear coat?', time: '09:15', isMe: true, context: 'B 1982 SSY' },
  { id: '2', sender: 'Budi', role: 'Foreman', text: 'Sedang bake 60 derajat selama 45 menit bu. Siang ini lanjut polishing.', time: '09:20', isMe: false, context: 'B 1982 SSY' },
  { id: '3', sender: 'Siti', role: 'Service Advisor', text: 'Mantap, customer minta foto sebelum dan sesudah untuk laporan klaim asuransi Garda Oto ya.', time: '09:22', isMe: true, context: 'B 1982 SSY' },
  { id: '4', sender: 'Joko P.', role: 'Mekanik', text: 'Siap bu Siti, foto progres perbaikan sudah diunggah langsung ke sistem.', time: '10:05', isMe: false, context: 'B 2341 TZA' }
];

function VehicleCardContent({ card, columnId }: { card: VehicleCard, columnId: string }) {
  return (
    <>
      {card.priority === 'high' && (
        <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
          <AlertCircle className="w-4 h-4 text-red-500 fill-red-500/20" />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-1">
        <span className="font-mono font-bold text-indigo-400 text-sm group-hover:text-indigo-300 transition-colors">{card.plate}</span>
      </div>
      
      <div className="flex flex-col gap-0.5 mb-3">
        <p className="text-xs text-slate-300 font-semibold truncate">{card.customer}</p>
        <p className="text-[10px] text-slate-500">{card.model}</p>
      </div>
      
      {card.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-medium uppercase tracking-wider">
            <span>Progress</span>
            <span>{card.progress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
            <div 
              className={`h-full rounded-full ${
                columnId === 'repair' ? 'bg-blue-500' : 
                columnId === 'painting' ? 'bg-amber-500' : 
                columnId === 'qc' ? 'bg-teal-500' : 'bg-indigo-500'
              }`} 
              style={{ width: `${card.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3 h-3" />
          <span className="text-[10px]">{card.time}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {card.info && (
            <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium max-w-[100px] truncate">
              {card.info}
            </span>
          )}
          {card.mechanic && (
            <div 
              className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-[8px] font-bold text-indigo-400" 
              title={`Mechanic: ${card.mechanic}`}
            >
              {card.mechanic.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SortableVehicleCard({ 
  card, 
  columnId, 
  onClick, 
  disabled 
}: { 
  card: VehicleCard; 
  columnId: string; 
  onClick: () => void; 
  disabled: boolean; 
  key?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: card.id, 
    data: { type: 'Card', card, columnId },
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-[#0F172A] p-3.5 rounded-lg border shadow-sm transition-all group relative ${
        isDragging 
          ? 'border-indigo-500 cursor-grabbing' 
          : disabled 
            ? 'border-slate-700/60 cursor-pointer' 
            : 'border-slate-700/60 cursor-grab hover:border-indigo-500/50 hover:shadow-indigo-500/10'
      }`}
    >
       <VehicleCardContent card={card} columnId={columnId} />
    </div>
  );
}

function DroppableColumn({ column, children }: { column: Column, children: ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
      <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

export function WorkshopBoard() {
  const [columns, setColumns] = useState<Column[]>(() => buildKanbanColumnsFromWorkOrders(getStoredWorkOrders()));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<(VehicleCard & { statusName?: string }) | null>(null);
  const [activeCard, setActiveCard] = useState<VehicleCard | null>(null);
  const [initialColumnId, setInitialColumnId] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync with cross-tab / cross-module storage updates
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WorkOrderItem[]>;
      const orders = (customEvent.detail && Array.isArray(customEvent.detail)) 
        ? customEvent.detail 
        : getStoredWorkOrders();
      setColumns(buildKanbanColumnsFromWorkOrders(orders));
    };

    window.addEventListener('autocare_workorders_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('autocare_workorders_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Siti',
      role: 'Service Advisor',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    
    setMessages([...messages, newMsg]);
    setChatMessage("");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Card') {
      const card = active.data.current.card as VehicleCard;
      setActiveCard(card);
      
      const columnId = columns.find(col => col.cards.some(c => c.id === card.id))?.id || null;
      setInitialColumnId(columnId);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveACard) return;

    setColumns((columns) => {
      const activeContainerIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
      const overContainerIndex = isOverAColumn 
        ? columns.findIndex(col => col.id === overId)
        : columns.findIndex(col => col.cards.some(c => c.id === overId));

      if (activeContainerIndex === -1 || overContainerIndex === -1) return columns;

      if (activeContainerIndex !== overContainerIndex) {
        const newColumns = [...columns.map(col => ({ ...col, cards: [...col.cards] }))];
        const activeCard = newColumns[activeContainerIndex].cards.find(c => c.id === activeId)!;
        
        newColumns[activeContainerIndex].cards = newColumns[activeContainerIndex].cards.filter(c => c.id !== activeId);
        
        if (isOverAColumn) {
          newColumns[overContainerIndex].cards.push(activeCard);
        } else {
          const overIndex = newColumns[overContainerIndex].cards.findIndex(c => c.id === overId);
          newColumns[overContainerIndex].cards.splice(overIndex >= 0 ? overIndex : newColumns[overContainerIndex].cards.length, 0, activeCard);
        }
        
        return newColumns;
      }
      return columns;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    
    if (!over) {
      setInitialColumnId(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverACard = over.data.current?.type === 'Card';

    setColumns((columns) => {
      const finalColumn = columns.find(col => col.cards.some(c => c.id === activeId));
      
      if (finalColumn && initialColumnId && finalColumn.id !== initialColumnId) {
        const card = finalColumn.cards.find(c => c.id === activeId);
        const cardName = card ? card.plate : activeId;
        
        toast.success(`Unit ${cardName} dipindahkan ke ${finalColumn.title}`, {
          description: `Status tersimpan di database ERP pada ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
        
        // Persist change to SPK Work Order Database
        try {
          const storedOrders = getStoredWorkOrders();
          const targetOrder = storedOrders.find(o => o.id === activeId || o.vehicle.plate === cardName);
          if (targetOrder) {
            const updatedStage = finalColumn.id as WorkshopKanbanStage;
            const updatedDetailedStage: DetailedRepairStage = 
              updatedStage === 'estimasi' ? 'Bongkar' :
              updatedStage === 'approval' ? 'Bongkar' :
              updatedStage === 'repair' ? 'Ketok' :
              updatedStage === 'painting' ? 'Cat Oven' :
              updatedStage === 'assembly' ? 'Pasang' : 'QC';

            const updatedProgress = 
              updatedStage === 'estimasi' ? 15 :
              updatedStage === 'approval' ? 25 :
              updatedStage === 'repair' ? 50 :
              updatedStage === 'painting' ? 75 :
              updatedStage === 'assembly' ? 90 : 98;

            const updatedStatus: SPKStatus = 
              updatedStage === 'qc' ? 'QC_CHECK' : 
              updatedStage === 'approval' ? 'MENUNGGU_APPROVAL' : 'DALAM_PENGERJAAN';

            const updatedOrders: WorkOrderItem[] = storedOrders.map(o => {
              if (o.id === targetOrder.id) {
                return {
                  ...o,
                  kanbanStage: updatedStage,
                  detailedStage: updatedDetailedStage,
                  progressPercent: updatedProgress,
                  status: updatedStatus,
                  updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };
              }
              return o;
            });
            saveWorkOrdersToStorage(updatedOrders);
          }
        } catch (e) {
          console.error("Error updating work order from kanban drag:", e);
        }

        if (finalColumn.id === 'approval') {
          toast.warning(`Menunggu Approval Asuransi untuk ${cardName}`, {
            description: 'Sistem telah mengirimkan notifikasi ke pihak penjamin.',
          });
        }
        if (finalColumn.id === 'qc') {
          toast.info(`Inspeksi QC ditugaskan untuk ${cardName}`, {
            description: 'Tim QC Officer akan segera melakukan Quality Control.',
          });
        }
      }

      if (isActiveACard && isOverACard && activeId !== overId) {
        const activeContainerIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
        const overContainerIndex = columns.findIndex(col => col.cards.some(c => c.id === overId));

        if (activeContainerIndex !== -1 && overContainerIndex !== -1 && activeContainerIndex === overContainerIndex) {
          const activeIndex = columns[activeContainerIndex].cards.findIndex(c => c.id === activeId);
          const overIndex = columns[activeContainerIndex].cards.findIndex(c => c.id === overId);
          
          const newColumns = [...columns];
          newColumns[activeContainerIndex].cards = arrayMove(newColumns[activeContainerIndex].cards, activeIndex, overIndex);
          return newColumns;
        }
      }
      return columns;
    });

    setInitialColumnId(null);
  };

  // Filter columns based on search
  const isFiltering = searchQuery.trim().length > 0;
  const filteredColumns = columns.map(column => ({
    ...column,
    cards: column.cards.filter(card => 
      card.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
      card.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.model.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }));

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Workshop Board
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Live Kanban Integrated
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Live Production Tracking - Drag & Drop Alur Kerja Bengkel</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-[#1E293B] rounded-lg px-3 py-1.5 flex-1 sm:w-64 border border-slate-700/80 focus-within:border-indigo-500 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Filter no polisi atau customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-300 placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => {
                setColumns(buildKanbanColumnsFromWorkOrders(getStoredWorkOrders()));
                toast.info("Kanban Board Diperbarui dari Database SPK");
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs text-slate-300 font-medium rounded-lg transition-colors flex items-center gap-1"
              title="Refresh Kanban"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                isChatOpen 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Internal Comms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Workshop Metrics Banner */}
      <div className="mb-6 shrink-0 bg-[#1E293B] border border-slate-700/80 rounded-xl p-4 flex items-center shadow-sm overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-3 border-r border-slate-700/80 pr-6 mr-6 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Unit Aktif</p>
            <p className="text-xl font-bold text-white font-mono leading-tight">
              {columns.reduce((acc, col) => acc + col.cards.length, 0)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-1 items-center gap-8 md:gap-12 min-w-max">
          {columns.map(col => (
             <div key={`metric-${col.id}`} className="flex flex-col gap-1">
               <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                     col.id === 'estimasi' ? 'bg-slate-400' :
                     col.id === 'approval' ? 'bg-purple-400' :
                     col.id === 'repair' ? 'bg-blue-400' :
                     col.id === 'painting' ? 'bg-amber-400' :
                     col.id === 'assembly' ? 'bg-indigo-400' :
                     'bg-teal-400'
                  }`}></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{col.title}</span>
               </div>
               <span className="text-lg font-bold text-slate-200 font-mono">
                  {col.cards.length} <span className="text-xs text-slate-600 font-sans font-medium ml-0.5">Unit</span>
               </span>
             </div>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Kanban Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="flex gap-4 h-full min-w-max">
              {filteredColumns.map((column) => (
                <div key={column.id} className="w-[280px] flex flex-col bg-[#1E293B]/50 rounded-xl border border-slate-800/80 shrink-0">
                  {/* Column Header */}
                  <div className={`p-3 border-b border-slate-800/80 flex justify-between items-center bg-[#1E293B] rounded-t-xl border-l-4 ${column.color}`}>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{column.title}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-[#0F172A] px-2 py-0.5 rounded-full border border-slate-700/50">
                      {column.cards.length}
                    </span>
                  </div>
                  
                  {/* Column Body */}
                  <DroppableColumn column={column}>
                    {column.cards.map((card) => (
                      <SortableVehicleCard 
                        key={card.id} 
                        card={card} 
                        columnId={column.id}
                        onClick={() => setSelectedCard({ ...card, statusName: column.title })}
                        disabled={isFiltering}
                      />
                    ))}
                    
                    {column.cards.length === 0 && (
                      <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Kosong</p>
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
              {activeCard ? (
                <div className="bg-[#0F172A] p-3.5 rounded-lg border border-indigo-500 shadow-xl shadow-indigo-500/20 rotate-2 opacity-90 w-[280px]">
                  <VehicleCardContent card={activeCard} columnId={columns.find(c => c.cards.some(card => card.id === activeCard.id))?.id || ''} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 flex-shrink-0 bg-[#1E293B] border border-slate-700/80 rounded-xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700/80 bg-[#0F172A]/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Internal Comms</h3>
                  <p className="text-[10px] text-slate-400">SA & Mekanik Koordinasi</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0B1120]/30">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400">{msg.sender}</span>
                    <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-widest">{msg.role}</span>
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm shadow-sm ${
                    msg.isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.context && (
                      <div className={`text-[10px] font-bold mb-1.5 pb-1.5 border-b ${msg.isMe ? 'border-indigo-400/30 text-indigo-200' : 'border-slate-600 text-indigo-400'}`}>
                        Terkait: {msg.context}
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono">{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700/80 bg-[#1E293B] shrink-0">
              <div className="flex items-end gap-2 bg-[#0F172A] rounded-xl border border-slate-700 p-1.5 focus-within:border-indigo-500 transition-colors">
                <textarea 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ketik pesan koordinasi..."
                  className="w-full bg-transparent border-none text-sm text-slate-300 resize-none max-h-24 min-h-[40px] py-2 px-3 focus:ring-0 focus:outline-none custom-scrollbar"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="w-10 h-10 rounded-lg shrink-0 bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      <VehicleDetailsModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
      />
    </div>
  );
}
