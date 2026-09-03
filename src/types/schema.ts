export type Role = 
  | 'Super Admin' 
  | 'Owner' 
  | 'Service Advisor' 
  | 'Estimator' 
  | 'Foreman' 
  | 'Mekanik' 
  | 'Gudang' 
  | 'Purchasing' 
  | 'QC' 
  | 'Finance'
  | 'Customer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: 'Personal' | 'Corporate' | 'Insurance';
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: number;
  customerId: number;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  vin?: string;
  engineNumber?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: number;
  woNumber: string;
  vehicleId: number;
  serviceAdvisorId: number;
  foremanId?: number;
  type: 'Body Repair' | 'General Repair' | 'Maintenance';
  status: 'Estimasi' | 'Menunggu Approval' | 'Proses' | 'Menunggu Part' | 'QC' | 'Selesai' | 'Batal';
  priority: 'Low' | 'Normal' | 'High';
  trackingHash: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionStage {
  id: number;
  workOrderId: number;
  stageName: 'Bongkar' | 'Ketok' | 'Las' | 'Dempul' | 'Epoxy' | 'Cat' | 'Poles' | 'Pasang';
  mechanicId?: number;
  status: 'Pending' | 'In Progress' | 'Paused' | 'Completed';
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PartsInventory {
  id: number;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  unitPrice: number;
}

export interface StockMovement {
  id: number;
  partId: number;
  workOrderId?: number;
  userId: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface QCInspection {
  id: number;
  workOrderId: number;
  inspectorId: number;
  result: 'Pass' | 'Fail' | 'Rework';
  notes?: string;
  inspectedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  tableName: string;
  recordId: number;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  createdAt: string;
}
