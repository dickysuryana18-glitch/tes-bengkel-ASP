import { useState, useEffect } from 'react';
import { 
  Package, FileText, Palette, ClipboardCheck, TrendingUp, 
  History, AlertTriangle, ShieldCheck, Plus, Search, Filter, 
  QrCode, Printer, RotateCcw, Droplet, ArrowDownRight, ArrowUpRight, 
  Sparkles, CheckCircle2, DollarSign, Layers, Building2
} from 'lucide-react';
import { 
  ExtendedPart, 
  MaterialRequisition, 
  PaintColorFormula, 
  PaintMixingLog, 
  StockOpnameSession,
  StockCardMovement,
  Supplier,
  SupplierReorderDraft
} from '../types/inventory';
import { 
  INITIAL_EXTENDED_PARTS, 
  INITIAL_REQUISITIONS, 
  INITIAL_COLOR_FORMULAS, 
  INITIAL_MIXING_LOGS, 
  INITIAL_OPNAME_SESSIONS, 
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS
} from '../data/inventoryData';
import { InventoryCatalog } from './inventory/InventoryCatalog';
import { MaterialRequisitionFlow } from './inventory/MaterialRequisitionFlow';
import { PaintMixingModule } from './inventory/PaintMixingModule';
import { StockOpnameModule } from './inventory/StockOpnameModule';
import { BarcodeScannerModal } from './inventory/BarcodeScannerModal';
import { SupplierManagementModule } from './inventory/SupplierManagementModule';
import { toast } from 'sonner';

export function InventoryModule() {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'REQUISITIONS' | 'PAINT_MIXING' | 'OPNAME' | 'STOCK_CARD' | 'SUPPLIERS'>('CATALOG');

  // Master State with LocalStorage Persistence
  const [parts, setParts] = useState<ExtendedPart[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_parts');
    return saved ? JSON.parse(saved) : INITIAL_EXTENDED_PARTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_requisitions');
    return saved ? JSON.parse(saved) : INITIAL_REQUISITIONS;
  });

  const [colorFormulas, setColorFormulas] = useState<PaintColorFormula[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_formulas');
    return saved ? JSON.parse(saved) : INITIAL_COLOR_FORMULAS;
  });

  const [mixingLogs, setMixingLogs] = useState<PaintMixingLog[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_mixing_logs');
    return saved ? JSON.parse(saved) : INITIAL_MIXING_LOGS;
  });

  const [opnameSessions, setOpnameSessions] = useState<StockOpnameSession[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_opname');
    return saved ? JSON.parse(saved) : INITIAL_OPNAME_SESSIONS;
  });

  const [stockMovements, setStockMovements] = useState<StockCardMovement[]>(() => {
    const saved = localStorage.getItem('autocare_inventory_movements');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  // Modal Scanner State
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeModalMode, setBarcodeModalMode] = useState<'SCAN' | 'INTAKE' | 'ALLOCATION' | 'RELOCATE' | 'PRINT_LABEL'>('SCAN');
  const [barcodeModalPart, setBarcodeModalPart] = useState<ExtendedPart | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('autocare_inventory_parts', JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem('autocare_inventory_requisitions', JSON.stringify(requisitions));
  }, [requisitions]);

  useEffect(() => {
    localStorage.setItem('autocare_inventory_mixing_logs', JSON.stringify(mixingLogs));
  }, [mixingLogs]);

  useEffect(() => {
    localStorage.setItem('autocare_inventory_opname', JSON.stringify(opnameSessions));
  }, [opnameSessions]);

  useEffect(() => {
    localStorage.setItem('autocare_inventory_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('autocare_inventory_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Overall Warehouse Stats
  const totalSkuCount = parts.length;
  const totalStockAssetValue = parts.reduce((sum, p) => sum + (p.stockQuantity * p.unitCost), 0);
  const lowStockCount = parts.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0).length;
  const outOfStockCount = parts.filter(p => p.stockQuantity === 0).length;
  const pendingRequisitionsCount = requisitions.filter(r => r.status === 'WAITING_APPROVAL' || r.status === 'READY_PICKING').length;
  const expiringSoonCount = parts.filter(p => {
    if (!p.expiryDate) return false;
    const daysLeft = (new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysLeft <= 60;
  }).length;

  // Handler for direct Stock IN / OUT from catalog
  const handleStockMovement = (
    type: 'IN' | 'OUT',
    part: ExtendedPart,
    amount: number,
    refNumber: string,
    notes: string
  ) => {
    const newQty = type === 'IN' ? part.stockQuantity + amount : part.stockQuantity - amount;
    const updatedStatus = newQty === 0 ? 'OUT_OF_STOCK' : newQty <= part.minStockLevel ? 'LOW_STOCK' : 'SAFE';

    // Update part
    setParts(parts.map(p => p.id === part.id ? {
      ...p,
      stockQuantity: newQty,
      status: updatedStatus,
      lastMovementDate: new Date().toISOString()
    } : p));

    // Append to Stock Card Movement
    const movement: StockCardMovement = {
      id: `mov-${Date.now()}`,
      partId: part.id,
      sku: part.sku,
      partName: part.name,
      movementType: type === 'IN' ? 'IN_PURCHASE' : 'OUT_SPK',
      refNumber: refNumber || (type === 'IN' ? 'PO-MANUAL' : 'SPK-DIRECT'),
      qtyChange: type === 'IN' ? amount : -amount,
      balanceAfter: newQty,
      unitCost: part.unitCost,
      totalCostChange: (type === 'IN' ? amount : -amount) * part.unitCost,
      userPic: 'Gunawan Prasetyo (Gudang)',
      timestamp: new Date().toISOString(),
      notes: notes || (type === 'IN' ? 'Penerimaan Stok Manual' : `Pengeluaran untuk ${refNumber}`)
    };

    setStockMovements([movement, ...stockMovements]);
    toast.success(`Mutasi ${type} ${amount} ${part.unit} untuk ${part.sku} berhasil dicatat.`);
  };

  // Handler for adding a new part
  const handleAddNewPart = (newPart: ExtendedPart) => {
    setParts([...parts, newPart]);
    // Log movement
    const movement: StockCardMovement = {
      id: `mov-${Date.now()}`,
      partId: newPart.id,
      sku: newPart.sku,
      partName: newPart.name,
      movementType: 'IN_PURCHASE',
      refNumber: 'INITIAL-STOCK',
      qtyChange: newPart.stockQuantity,
      balanceAfter: newPart.stockQuantity,
      unitCost: newPart.unitCost,
      totalCostChange: newPart.stockQuantity * newPart.unitCost,
      userPic: 'Gunawan Prasetyo (Gudang)',
      timestamp: new Date().toISOString(),
      notes: 'Pencatatan SKU Master Baru'
    };
    setStockMovements([movement, ...stockMovements]);
  };

  // Handler for issuing a requisition from Gudang
  const handleIssueRequisition = (reqId: string) => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req) return;

    // Deduct stock for all items
    const updatedParts = [...parts];
    const newMovements: StockCardMovement[] = [];

    req.items.forEach(item => {
      const pIdx = updatedParts.findIndex(p => p.id === item.partId || p.sku === item.sku);
      if (pIdx !== -1) {
        const currentP = updatedParts[pIdx];
        const newStock = Math.max(0, currentP.stockQuantity - item.requestedQty);
        updatedParts[pIdx] = {
          ...currentP,
          stockQuantity: newStock,
          reservedQuantity: Math.max(0, currentP.reservedQuantity - item.requestedQty),
          status: newStock === 0 ? 'OUT_OF_STOCK' : newStock <= currentP.minStockLevel ? 'LOW_STOCK' : 'SAFE',
          lastMovementDate: new Date().toISOString()
        };

        newMovements.push({
          id: `mov-${Date.now()}-${item.id}`,
          partId: currentP.id,
          sku: currentP.sku,
          partName: currentP.name,
          movementType: 'OUT_SPK',
          refNumber: req.requisitionNumber,
          qtyChange: -item.requestedQty,
          balanceAfter: newStock,
          unitCost: currentP.unitCost,
          totalCostChange: -item.requestedQty * currentP.unitCost,
          userPic: 'Gunawan Prasetyo (Gudang)',
          timestamp: new Date().toISOString(),
          notes: `Pengeluaran ${req.spkNumber} (${req.plateNumber})`
        });
      }
    });

    setParts(updatedParts);
    setStockMovements([...newMovements, ...stockMovements]);

    // Update requisition status
    setRequisitions(requisitions.map(r => r.id === reqId ? {
      ...r,
      status: 'ISSUED',
      warehouseIssuedBy: 'Gunawan Prasetyo (Gudang)',
      issuedAt: new Date().toISOString(),
      items: r.items.map(it => ({ ...it, issuedQty: it.requestedQty, status: 'ISSUED' }))
    } : r));

    toast.success(`Bon ${req.requisitionNumber} berhasil dikeluarkan dan stok gudang terpotong.`);
  };

  // Handler for approving requisition by Foreman
  const handleApproveRequisition = (reqId: string, foremanName: string) => {
    setRequisitions(requisitions.map(r => r.id === reqId ? {
      ...r,
      status: 'READY_PICKING',
      foremanApproval: {
        isApproved: true,
        approvedBy: foremanName,
        approvedAt: new Date().toISOString()
      }
    } : r));
    toast.success(`Bon permintaan disetujui Foreman! Siap diambil di loket Gudang.`);
  };

  // Handler for creating new requisition
  const handleCreateRequisition = (newReq: MaterialRequisition) => {
    setRequisitions([newReq, ...requisitions]);
  };

  // Handler for returning unused materials
  const handleReturnItems = (reqId: string, returnedItems: { itemId: string; returnQty: number; reason: string }[]) => {
    const req = requisitions.find(r => r.id === reqId);
    if (!req) return;

    const updatedParts = [...parts];
    const newMovements: StockCardMovement[] = [];

    const updatedReqItems = req.items.map(it => {
      const matchReturn = returnedItems.find(x => x.itemId === it.id);
      if (matchReturn && matchReturn.returnQty > 0) {
        const pIdx = updatedParts.findIndex(p => p.id === it.partId || p.sku === it.sku);
        if (pIdx !== -1) {
          const currentP = updatedParts[pIdx];
          const newStock = currentP.stockQuantity + matchReturn.returnQty;
          updatedParts[pIdx] = {
            ...currentP,
            stockQuantity: newStock,
            status: newStock <= currentP.minStockLevel ? 'LOW_STOCK' : 'SAFE',
            lastMovementDate: new Date().toISOString()
          };

          newMovements.push({
            id: `mov-ret-${Date.now()}-${it.id}`,
            partId: currentP.id,
            sku: currentP.sku,
            partName: currentP.name,
            movementType: 'IN_RETURN',
            refNumber: req.requisitionNumber,
            qtyChange: matchReturn.returnQty,
            balanceAfter: newStock,
            unitCost: currentP.unitCost,
            totalCostChange: matchReturn.returnQty * currentP.unitCost,
            userPic: 'Gunawan Prasetyo (Gudang)',
            timestamp: new Date().toISOString(),
            notes: `Retur sisa ${req.spkNumber}: ${matchReturn.reason}`
          });
        }

        return {
          ...it,
          returnedQty: it.returnedQty + matchReturn.returnQty,
          status: 'RETURNED' as const
        };
      }
      return it;
    });

    setParts(updatedParts);
    setStockMovements([...newMovements, ...stockMovements]);
    setRequisitions(requisitions.map(r => r.id === reqId ? {
      ...r,
      items: updatedReqItems,
      status: 'COMPLETED'
    } : r));
  };

  // Handler for completing paint mixing batch
  const handleCompleteMixing = (log: PaintMixingLog) => {
    setMixingLogs([log, ...mixingLogs]);

    // Deduct grams from raw toners
    const updatedParts = [...parts];
    const newMovements: StockCardMovement[] = [];

    log.tonerDeductions.forEach(td => {
      const pIdx = updatedParts.findIndex(p => p.sku === td.tonerSku);
      if (pIdx !== -1) {
        const currentP = updatedParts[pIdx];
        const newGrams = Math.max(0, currentP.stockQuantity - td.gramsDeducted);
        updatedParts[pIdx] = {
          ...currentP,
          stockQuantity: newGrams,
          status: newGrams <= currentP.minStockLevel ? 'LOW_STOCK' : 'SAFE',
          lastMovementDate: new Date().toISOString()
        };

        newMovements.push({
          id: `mov-mix-${Date.now()}-${td.tonerSku}`,
          partId: currentP.id,
          sku: currentP.sku,
          partName: currentP.name,
          movementType: 'OUT_MIXING',
          refNumber: log.mixLogNumber,
          qtyChange: -td.gramsDeducted,
          balanceAfter: newGrams,
          unitCost: currentP.unitCost,
          totalCostChange: -td.costRp,
          userPic: log.mixedByPainter,
          timestamp: new Date().toISOString(),
          notes: `Mixing ${log.colorCode} untuk ${log.spkNumber} (${log.panelCount} Panel)`
        });
      }
    });

    setParts(updatedParts);
    setStockMovements([...newMovements, ...stockMovements]);
  };

  // Handler for stock opname adjustments posting
  const handleApplyOpnameAdjustments = (sessionId: string, items: any[]) => {
    const updatedParts = [...parts];
    const newMovements: StockCardMovement[] = [];

    items.forEach(item => {
      if (item.countedQty !== null && item.varianceQty !== 0) {
        const pIdx = updatedParts.findIndex(p => p.id === item.partId);
        if (pIdx !== -1) {
          const currentP = updatedParts[pIdx];
          updatedParts[pIdx] = {
            ...currentP,
            stockQuantity: item.countedQty,
            status: item.countedQty === 0 ? 'OUT_OF_STOCK' : item.countedQty <= currentP.minStockLevel ? 'LOW_STOCK' : 'SAFE',
            lastStockOpnameDate: new Date().toISOString().split('T')[0],
            lastMovementDate: new Date().toISOString()
          };

          newMovements.push({
            id: `mov-opn-${Date.now()}-${item.partId}`,
            partId: currentP.id,
            sku: currentP.sku,
            partName: currentP.name,
            movementType: 'ADJUST_OPNAME',
            refNumber: sessionId,
            qtyChange: item.varianceQty,
            balanceAfter: item.countedQty,
            unitCost: currentP.unitCost,
            totalCostChange: item.varianceValueRp,
            userPic: 'Hendra Wijaya (Manager)',
            timestamp: new Date().toISOString(),
            notes: `Penyesuaian Opname: ${item.varianceReason || 'Selisih Fisik'}`
          });
        }
      }
    });

    setParts(updatedParts);
    setStockMovements([...newMovements, ...stockMovements]);
    setOpnameSessions(opnameSessions.map(s => s.id === sessionId ? {
      ...s,
      status: 'COMPLETED_POSTED',
      approvedBy: 'Hendra Wijaya (Workshop Manager)',
      items
    } : s));
  };

  const handleCreateOpnameSession = (newSession: StockOpnameSession) => {
    setOpnameSessions([newSession, ...opnameSessions]);
  };

  // Supplier Management Handlers
  const handleAddSupplier = (newSup: Supplier) => {
    setSuppliers([newSup, ...suppliers]);
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter(s => s.id !== supplierId));
    toast.success('Supplier berhasil dihapus dari daftar.');
  };

  const handleLinkPartToSupplier = (supplierId: string, partSku: string) => {
    setSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        if (!s.linkedPartSkus.includes(partSku)) {
          return { ...s, linkedPartSkus: [...s.linkedPartSkus, partSku] };
        }
      }
      return s;
    }));
  };

  const handleUnlinkPartFromSupplier = (supplierId: string, partSku: string) => {
    setSuppliers(suppliers.map(s => {
      if (s.id === supplierId) {
        return { ...s, linkedPartSkus: s.linkedPartSkus.filter(sku => sku !== partSku) };
      }
      return s;
    }));
  };

  const handleTriggerSupplierReorder = (draft: SupplierReorderDraft) => {
    // Notify purchasing & stock movement queue
    toast.success(`Draft Reorder PO dikirim ke Modul Purchasing (${draft.items.length} item) - Total: Rp ${draft.totalEstimatedCost.toLocaleString('id-ID')}`, {
      description: `Pemasok: ${draft.supplierName} • Estimasi Tiba: ${draft.expectedDeliveryDate}`
    });
  };

  const handleOpenBarcode = (
    part?: ExtendedPart, 
    mode: 'SCAN' | 'INTAKE' | 'ALLOCATION' | 'RELOCATE' | 'PRINT_LABEL' = 'SCAN'
  ) => {
    setBarcodeModalPart(part || null);
    setBarcodeModalMode(mode);
    setBarcodeModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col w-full min-w-0 max-w-[1680px] mx-auto animate-in fade-in duration-300 gap-4 sm:gap-5">
      
      {/* Top Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold font-mono">
              WAREHOUSE & MATERIAL MANAGEMENT
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-bold">
              ZERO STOCK LEAKAGE
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Gudang, Material & Laboratorium Cat
          </h2>
          <p className="text-xs text-slate-400">
            Sistem barcode scanner kamera, penerimaan PO otomatis, alokasi material SPK presisi & pencetakan label thermal
          </p>
        </div>

        {/* Action Buttons for Scanner & Inbound/Outbound */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenBarcode(undefined, 'SCAN')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            title="Buka Kamera Barcode Scanner"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Barcode Kamera</span>
          </button>
          
          <button
            onClick={() => handleOpenBarcode(undefined, 'INTAKE')}
            className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Penerimaan Barang Masuk via Barcode"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Inbound Intake</span>
          </button>

          <button
            onClick={() => handleOpenBarcode(undefined, 'ALLOCATION')}
            className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/40 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Alokasi Part ke SPK via Barcode"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Alokasi SPK</span>
          </button>

          <button
            onClick={() => handleOpenBarcode(undefined, 'PRINT_LABEL')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Cetak Label Barcode Zebra/TSC"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Cetak Label</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total SKU</span>
          </div>
          <p className="text-xl font-bold text-white font-mono">{totalSkuCount}</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Aset Gudang (HPP)</span>
          </div>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            Rp {(totalStockAssetValue / 1000000).toFixed(1)}M
          </p>
        </div>

        <div className="bg-[#1E293B] border border-amber-500/30 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-400/80 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Low Stock Buffer</span>
          </div>
          <p className="text-xl font-bold text-amber-400 font-mono">{lowStockCount} SKU</p>
        </div>

        <div className="bg-[#1E293B] border border-red-500/30 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 text-red-400/80 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Stok Kosong</span>
          </div>
          <p className="text-xl font-bold text-red-400 font-mono">{outOfStockCount} SKU</p>
        </div>

        <div className="bg-[#1E293B] border border-blue-500/30 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Bon Permintaan SPK</span>
          </div>
          <p className="text-xl font-bold text-blue-400 font-mono">{pendingRequisitionsCount} Menunggu</p>
        </div>

        <div className="bg-[#1E293B] border border-purple-500/30 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Droplet className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Bahan Expire &lt;60h</span>
          </div>
          <p className="text-xl font-bold text-purple-400 font-mono">{expiringSoonCount} Item</p>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar border-b border-slate-800 pb-2 shrink-0 w-full">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Katalog Stok & Bin Rack ({parts.length})
        </button>

        <button
          onClick={() => setActiveTab('REQUISITIONS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'REQUISITIONS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bon Permintaan Part SPK ({requisitions.length})
          {pendingRequisitionsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
              {pendingRequisitionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PAINT_MIXING')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'PAINT_MIXING'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          Laboratorium Cat & Mixing Gram
        </button>

        <button
          onClick={() => setActiveTab('OPNAME')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'OPNAME'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Stock Opname & Audit Fisik
        </button>

        <button
          onClick={() => setActiveTab('STOCK_CARD')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'STOCK_CARD'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Kartu Stok & Mutasi Audit ({stockMovements.length})
        </button>

        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'SUPPLIERS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-[#1E293B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Mitra Supplier & Vendor ({suppliers.length})
          {suppliers.some(s => parts.some(p => (s.linkedPartSkus.includes(p.sku) || p.supplierName.toLowerCase() === s.name.toLowerCase()) && p.stockQuantity <= p.minStockLevel)) && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
              Reorder
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex flex-col min-w-0 w-full">
        {activeTab === 'CATALOG' && (
          <InventoryCatalog
            parts={parts}
            onStockMovement={handleStockMovement}
            onAddNewPart={handleAddNewPart}
            onOpenBarcodeModal={handleOpenBarcode}
          />
        )}

        {activeTab === 'REQUISITIONS' && (
          <MaterialRequisitionFlow
            requisitions={requisitions}
            parts={parts}
            onIssueRequisition={handleIssueRequisition}
            onApproveRequisition={handleApproveRequisition}
            onCreateRequisition={handleCreateRequisition}
            onReturnItems={handleReturnItems}
          />
        )}

        {activeTab === 'PAINT_MIXING' && (
          <PaintMixingModule
            formulas={colorFormulas}
            mixingLogs={mixingLogs}
            parts={parts}
            onCompleteMixing={handleCompleteMixing}
          />
        )}

        {activeTab === 'OPNAME' && (
          <StockOpnameModule
            sessions={opnameSessions}
            parts={parts}
            onApplyOpnameAdjustments={handleApplyOpnameAdjustments}
            onCreateSession={handleCreateOpnameSession}
          />
        )}

        {activeTab === 'STOCK_CARD' && (
          <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-[#0F172A]/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Kartu Stok Digital & Immutable Audit Log Mutasi Gudang
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Setiap pergerakan barang (Masuk PO, Keluar SPK, Mixing Cat, Retur, dan Opname) tercatat permanen.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Total Transaksi: {stockMovements.length}</span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0F172A]/90 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-bold">Waktu & PIC</th>
                    <th className="px-4 py-3 font-bold">SKU / Nama Part</th>
                    <th className="px-4 py-3 font-bold text-center">Tipe Mutasi</th>
                    <th className="px-4 py-3 font-bold text-center">No. Referensi (SPK/PO)</th>
                    <th className="px-4 py-3 font-bold text-center">Jumlah</th>
                    <th className="px-4 py-3 font-bold text-center">Sisa Saldo</th>
                    <th className="px-4 py-3 font-bold text-right">Nilai Mutasi (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {stockMovements.map(mov => (
                    <tr key={mov.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">
                          {new Date(mov.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(mov.timestamp).toLocaleDateString('id-ID')} • {mov.userPic}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-indigo-400 text-[11px]">{mov.sku}</p>
                        <p className="font-semibold text-slate-200">{mov.partName}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          mov.movementType === 'IN_PURCHASE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : mov.movementType === 'OUT_SPK'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : mov.movementType === 'OUT_MIXING'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : mov.movementType === 'IN_RETURN'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                          {mov.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-300">
                        {mov.refNumber}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold">
                        <span className={mov.qtyChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {mov.qtyChange > 0 ? `+${mov.qtyChange}` : mov.qtyChange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {mov.balanceAfter}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={mov.totalCostChange > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                          Rp {Math.abs(mov.totalCostChange).toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'SUPPLIERS' && (
          <SupplierManagementModule
            suppliers={suppliers}
            parts={parts}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onLinkPartToSupplier={handleLinkPartToSupplier}
            onUnlinkPartFromSupplier={handleUnlinkPartFromSupplier}
            onTriggerReorder={handleTriggerSupplierReorder}
          />
        )}
      </div>

      {/* Global Barcode & QR Scanner / Printer Modal */}
      <BarcodeScannerModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        parts={parts}
        mode={barcodeModalMode}
        initialPart={barcodeModalPart}
        onStockMovement={handleStockMovement}
        onSelectPart={(p) => {
          toast.success(`Part terpilih: [${p.sku}] ${p.name} di lokasi ${p.binLocation}`);
        }}
      />
    </div>
  );
}
