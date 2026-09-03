export interface ExtendedPart {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  category: 'Body Part' | 'Paint & Chemical' | 'Consumable' | 'Electrical' | 'Underbody & Engine' | 'Glass & Trim';
  subCategory?: string;
  compatibleBrands: string[]; // e.g. ['Toyota', 'Daihatsu', 'Universal']
  stockQuantity: number;
  reservedQuantity: number; // Allocated to active SPKs
  minStockLevel: number;
  maxStockLevel: number;
  unit: string; // 'Pcs', 'Kaleng', 'Liter', 'Gram', 'Set', 'Roll', 'Kg'
  unitCost: number; // Purchase price (HPP)
  unitPrice: number; // Selling price to client/insurance
  binLocation: string; // e.g. 'RAK-A1-02', 'LEM-CAT-01', 'RAK-C2-05'
  supplierName: string;
  supplierLeadDays: number;
  batchNumber?: string;
  expiryDate?: string; // ISO date for chemicals
  lastStockOpnameDate?: string;
  lastMovementDate?: string;
  status: 'SAFE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED';
  abcClass: 'A' | 'B' | 'C'; // ABC Inventory Analysis
}

export interface MaterialRequisitionItem {
  id: string;
  partId: number;
  sku: string;
  name: string;
  requestedQty: number;
  issuedQty: number;
  returnedQty: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  status: 'PENDING' | 'ISSUED' | 'PARTIAL' | 'RETURNED';
}

export interface MaterialRequisition {
  id: string;
  requisitionNumber: string; // e.g. 'REQ-2026-0812'
  spkNumber: string; // e.g. 'SPK-2026-0850'
  plateNumber: string;
  vehicleModel: string;
  damageStage: string; // e.g. 'Bongkar', 'Ketok', 'Dempul', 'Cat Oven', 'Poles', 'Pasang'
  requestedByMechanic: string;
  foremanApproval: {
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
  warehouseIssuedBy?: string;
  issuedAt?: string;
  status: 'DRAFT' | 'WAITING_APPROVAL' | 'READY_PICKING' | 'ISSUED' | 'COMPLETED' | 'REJECTED';
  items: MaterialRequisitionItem[];
  totalValue: number;
  notes?: string;
  createdAt: string;
}

export interface PaintFormulaToner {
  tonerSku: string;
  tonerName: string;
  percentageRatio: number; // percentage in formula
  gramsPer100g: number; // Grams needed per 100g mix
  actualGramsMixed?: number;
  unitCostPerGram: number;
}

export interface PaintColorFormula {
  id: string;
  colorCode: string; // e.g. '070', 'NH731P', 'W19', '46G'
  colorName: string; // e.g. 'White Crystal Pearl', 'Crystal Black Pearl'
  carBrand: string; // 'Toyota', 'Honda', 'Mitsubishi', 'Mazda', 'Daihatsu', 'Hyundai'
  paintSystem: 'Basecoat 2-Stage' | 'Basecoat 3-Stage Pearl' | 'Single Stage Solid' | 'Metallic Clear';
  standardBatchSizeGrams: number;
  toners: PaintFormulaToner[];
  recommendedThinnerRatioPercent: number; // e.g. 50%
  recommendedHardenerRatioPercent: number; // e.g. 25% for 2K Clear
}

export interface PaintMixingLog {
  id: string;
  mixLogNumber: string; // e.g. 'MIX-2026-0412'
  spkNumber: string;
  plateNumber: string;
  vehicleModel: string;
  colorCode: string;
  colorName: string;
  panelCount: number;
  panelDescriptions: string[]; // ['Kap Mesin', 'Fender Kiri', 'Bumper Depan']
  targetGrams: number;
  actualGramsProduced: number;
  leftoverGrams: number;
  wastePercentage: number;
  mixedByPainter: string;
  supervisorCheckedBy: string;
  totalCostRp: number;
  costPerPanelRp: number;
  tonerDeductions: {
    tonerSku: string;
    tonerName: string;
    gramsDeducted: number;
    costRp: number;
  }[];
  createdAt: string;
}

export interface StockOpnameItem {
  partId: number;
  sku: string;
  name: string;
  category: string;
  binLocation: string;
  systemQty: number;
  countedQty: number | null; // null if uncounted
  varianceQty: number; // counted - system
  unitCost: number;
  varianceValueRp: number; // varianceQty * unitCost
  varianceReason?: 'RUSAK_PECAH' | 'SALAH_CATAT' | 'HILANG_SELISIH' | 'KADALUWARSA' | 'TIDAK_ADA_SELISIH';
  adjustmentStatus: 'PENDING_AUDIT' | 'APPROVED_ADJUSTED' | 'RECOUNT_REQUESTED';
}

export interface StockOpnameSession {
  id: string;
  sessionCode: string; // e.g. 'OPNAME-2026-AUG'
  title: string;
  startDate: string;
  status: 'IN_PROGRESS' | 'AUDIT_REVIEW' | 'COMPLETED_POSTED';
  blindCountMode: boolean; // Hide system Qty from counters
  conductedBy: string;
  approvedBy?: string;
  totalItemsCounted: number;
  totalItemsWithVariance: number;
  totalNetVarianceValueRp: number;
  items: StockOpnameItem[];
}

export interface StockCardMovement {
  id: string;
  partId: number;
  sku: string;
  partName: string;
  movementType: 'IN_PURCHASE' | 'OUT_SPK' | 'OUT_MIXING' | 'IN_RETURN' | 'ADJUST_OPNAME';
  refNumber: string; // PO Number, SPK Number, Opname Code, etc.
  qtyChange: number; // +10 or -5
  balanceAfter: number;
  unitCost: number;
  totalCostChange: number;
  userPic: string;
  timestamp: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  code: string; // e.g. 'SUP-HND-01'
  name: string;
  category: 'OEM Genuine Parts' | 'Paint & Chemicals' | 'Fast Moving & Consumables' | 'Body Panels & Glass' | 'Tools & Equipment' | 'Oils & Lubricants';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  taxId?: string; // NPWP
  paymentTerms: 'Cash / COD' | 'TOP 14 Hari' | 'TOP 30 Hari' | 'TOP 45 Hari' | 'CBD';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  leadTimeDays: number; // Average delivery lead time in business days
  onTimeDeliveryRate: number; // Percentage e.g. 96%
  qualityRating: number; // e.g. 4.8 / 5.0
  minOrderValueRp: number;
  status: 'PREFERRED' | 'ACTIVE' | 'INACTIVE';
  notes?: string;
  linkedPartSkus: string[]; // List of SKUs supplied
  createdDate: string;
}

export interface SupplierReorderDraft {
  supplierId: string;
  supplierName: string;
  items: {
    partId: number;
    sku: string;
    name: string;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderQty: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }[];
  totalEstimatedCost: number;
  expectedDeliveryDate: string;
  notes?: string;
}

