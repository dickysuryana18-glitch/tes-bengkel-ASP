// AutoCare ERP - Centralized SPK / Work Order Persistent Database Engine
import { BookingItem, getStoredBookings } from './mockBookings';

export type SPKStatus = 
  | 'DRAFT' 
  | 'MENUNGGU_APPROVAL' 
  | 'SPK_TERBIT' 
  | 'DALAM_PENGERJAAN' 
  | 'QC_CHECK' 
  | 'INVOICED' 
  | 'SELESAI' 
  | 'BATAL';

export type WorkshopKanbanStage = 
  | 'estimasi' 
  | 'approval' 
  | 'repair' 
  | 'painting' 
  | 'assembly' 
  | 'qc'
  | 'ready';

export type DetailedRepairStage = 
  | 'Bongkar' 
  | 'Ketok' 
  | 'Las' 
  | 'Dempul' 
  | 'Cat Oven' 
  | 'Poles' 
  | 'Pasang' 
  | 'QC' 
  | 'Siap Ambil';

export type ApprovalTier = 
  | 'Auto-Approved' 
  | 'Foreman Review' 
  | 'Workshop Manager Review';

export interface SPKLineItem {
  id: string;
  type: 'jasa' | 'part';
  description: string;
  qty: number;
  unitPrice: number;
  partCode?: string;
}

export interface SPKDamagePoint {
  id: string;
  panel: string;
  severity: 'Baret Ringan' | 'Penyok Sedang' | 'Rusak Parah / Ganti';
  suggestedAction: string;
  x: number;
  y: number;
}

export interface WorkOrderHistory {
  stage: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
  note?: string;
  actor?: string;
}

export interface WorkOrderItem {
  id: string; // e.g. 'SPK-2026-0881'
  spkNumber: string;
  trackingId: string; // e.g. 'TRK-B1982SSY-881'
  bookingId?: string; // e.g. 'BKG-2026-0801'
  
  customer: {
    name: string;
    phone: string;
    email?: string;
    type: 'Personal' | 'Corporate' | 'Insurance';
    address?: string;
  };
  
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    color: string;
    year: number;
    odometerKm?: number;
    fuelLevel?: string;
    vin?: string;
  };
  
  serviceCategory: 'BODY_REPAIR' | 'GENERAL_REPAIR' | 'PERIODIC_MAINTENANCE' | 'INSURANCE_CLAIM' | 'DETAILING' | 'AC_ELECTRICAL';
  insuranceCompany?: string;
  insurancePolicy?: string;
  
  damagePoints: SPKDamagePoint[];
  lineItems: SPKLineItem[];
  
  subtotal: number;
  ppn: number;
  grandTotal: number;
  
  approvalTier: ApprovalTier;
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  
  status: SPKStatus;
  kanbanStage: WorkshopKanbanStage;
  detailedStage: DetailedRepairStage;
  
  bayLocation: string;
  leadMechanic: string;
  priority: 'low' | 'normal' | 'high';
  
  entryDate: string;
  targetDeliveryDate: string;
  actualDeliveryDate?: string;
  progressPercent: number;
  slaStatus: 'ON_TRACK' | 'WARNING' | 'OVERDUE';
  daysRemaining: number;
  
  notes: string;
  history: WorkOrderHistory[];
  
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_WORK_ORDERS: WorkOrderItem[] = [
  {
    id: 'SPK-2026-0881',
    spkNumber: 'SPK-2026-0881',
    trackingId: 'TRK-B1982SSY-881',
    bookingId: 'BKG-2026-0801',
    customer: {
      name: 'Hendra Gunawan',
      phone: '081289128912',
      email: 'hendra.gunawan@gmail.com',
      type: 'Insurance',
      address: 'Jl. Boulevard Raya Blok A4 No. 12, Kelapa Gading, Jakarta Utara'
    },
    vehicle: {
      plate: 'B 1982 SSY',
      brand: 'Toyota',
      model: 'Fortuner GR Sport 2.8',
      color: 'Attitude Black Mica',
      year: 2023,
      odometerKm: 34500,
      fuelLevel: '3/4'
    },
    serviceCategory: 'BODY_REPAIR',
    insuranceCompany: 'Garda Oto (Asuransi Astra)',
    insurancePolicy: 'POL-GO-2026-98127',
    damagePoints: [
      { id: 'dp-1', panel: 'Pintu Kanan Depan', severity: 'Penyok Sedang', suggestedAction: 'Ketok & Cat Oven', x: 62, y: 48 },
      { id: 'dp-2', panel: 'Fender Kanan Depan', severity: 'Baret Ringan', suggestedAction: 'Poles & Cat Touch Up', x: 78, y: 42 }
    ],
    lineItems: [
      { id: 'li-1', type: 'jasa', description: 'Ketok Magic Pintu Depan Kanan', qty: 1, unitPrice: 450000 },
      { id: 'li-2', type: 'jasa', description: 'Pengecatan Oven Panel Pintu Kanan', qty: 1, unitPrice: 950000 },
      { id: 'li-3', type: 'jasa', description: 'Pengecatan Oven Fender Depan Kanan', qty: 1, unitPrice: 850000 },
      { id: 'li-4', type: 'part', description: 'Klip & Karet Pelindung Pintu OEM', qty: 4, unitPrice: 35000, partCode: 'TY-67881-KKP' }
    ],
    subtotal: 2390000,
    ppn: 262900,
    grandTotal: 2652900,
    approvalTier: 'Foreman Review',
    approvalStatus: 'APPROVED',
    approvedBy: 'Budi Foreman',
    approvedAt: '2026-08-20 10:15',
    status: 'DALAM_PENGERJAAN',
    kanbanStage: 'painting',
    detailedStage: 'Cat Oven',
    bayLocation: 'Bay Oven Cat 2',
    leadMechanic: 'Budi Santoso',
    priority: 'normal',
    entryDate: '2026-08-20',
    targetDeliveryDate: '2026-08-28',
    progressPercent: 75,
    slaStatus: 'ON_TRACK',
    daysRemaining: 1,
    notes: 'Proses bake clear coat 60°C selama 45 menit. Finishing anti gores.',
    history: [
      { stage: 'Check-in & Penerimaan Unit', date: '2026-08-20 08:30', status: 'completed', actor: 'Service Advisor' },
      { stage: 'Estimasi & Inspeksi Visual', date: '2026-08-20 09:15', status: 'completed', actor: 'Estimator' },
      { stage: 'Approval Klaim Asuransi', date: '2026-08-20 10:15', status: 'completed', actor: 'Garda Oto' },
      { stage: 'Ketok & Penyelarasan Panel', date: '2026-08-22 14:00', status: 'completed', actor: 'Bambang S.' },
      { stage: 'Dempul & Primer Epoxy', date: '2026-08-24 16:30', status: 'completed', actor: 'Dedi K.' },
      { stage: 'Pengecatan Ruang Oven', date: '2026-08-26 11:00', status: 'current', actor: 'Budi S.' },
      { stage: 'Polishing & Finishing Detailing', date: '2026-08-27 10:00', status: 'pending' },
      { stage: 'Quality Control (QC)', date: '2026-08-28 09:00', status: 'pending' }
    ],
    createdAt: '2026-08-20 08:30',
    updatedAt: '2026-08-26 11:00'
  },
  {
    id: 'SPK-2026-0875',
    spkNumber: 'SPK-2026-0875',
    trackingId: 'TRK-B2341TZA-875',
    bookingId: 'BKG-2026-0803',
    customer: {
      name: 'Siti Aminah',
      phone: '081398712345',
      email: 'siti.aminah@yahoo.com',
      type: 'Insurance',
      address: 'Jl. Anggrek Cendrawasih No. 45, Kebon Jeruk, Jakarta Barat'
    },
    vehicle: {
      plate: 'B 2341 TZA',
      brand: 'Honda',
      model: 'CR-V Turbo Prestige',
      color: 'Platinum White Pearl',
      year: 2022,
      odometerKm: 28900,
      fuelLevel: '1/2'
    },
    serviceCategory: 'BODY_REPAIR',
    insuranceCompany: 'Asuransi ACA',
    insurancePolicy: 'POL-ACA-887192',
    damagePoints: [
      { id: 'dp-3', panel: 'Pintu Kiri Belakang', severity: 'Penyok Sedang', suggestedAction: 'Dempul & Cat', x: 38, y: 52 },
      { id: 'dp-4', panel: 'Fender Kiri Belakang', severity: 'Baret Ringan', suggestedAction: 'Cat Oven', x: 25, y: 55 }
    ],
    lineItems: [
      { id: 'li-5', type: 'jasa', description: 'Perbaikan Pintu Kiri Belakang', qty: 1, unitPrice: 650000 },
      { id: 'li-6', type: 'jasa', description: 'Pengecatan Panel 2 Bagian (Oven)', qty: 2, unitPrice: 900000 },
      { id: 'li-7', type: 'part', description: 'Emblem CR-V Prestige OEM', qty: 1, unitPrice: 280000, partCode: 'HN-EMB-CRV' }
    ],
    subtotal: 2730000,
    ppn: 300300,
    grandTotal: 3030300,
    approvalTier: 'Foreman Review',
    approvalStatus: 'APPROVED',
    approvedBy: 'Budi Foreman',
    approvedAt: '2026-08-18 11:30',
    status: 'DALAM_PENGERJAAN',
    kanbanStage: 'repair',
    detailedStage: 'Dempul',
    bayLocation: 'Bay Dempul 3',
    leadMechanic: 'Dedi Kusnadi',
    priority: 'normal',
    entryDate: '2026-08-18',
    targetDeliveryDate: '2026-08-27',
    progressPercent: 55,
    slaStatus: 'WARNING',
    daysRemaining: 0,
    notes: 'Penghalusan dempul panel pintu kiri belakang & fender.',
    history: [
      { stage: 'Check-in Gate', date: '2026-08-18 09:00', status: 'completed' },
      { stage: 'Estimasi & Foto Kerusakan', date: '2026-08-18 09:40', status: 'completed' },
      { stage: 'Approval ACA', date: '2026-08-18 11:30', status: 'completed' },
      { stage: 'Proses Dempul', date: '2026-08-20 14:00', status: 'current' }
    ],
    createdAt: '2026-08-18 09:00',
    updatedAt: '2026-08-25 14:00'
  },
  {
    id: 'SPK-2026-0850',
    spkNumber: 'SPK-2026-0850',
    trackingId: 'TRK-D1209XYZ-850',
    bookingId: 'BKG-2026-0804',
    customer: {
      name: 'Bambang Sudibyo',
      phone: '081122334455',
      type: 'Personal',
      address: 'Jl. Riau No. 88, Bandung'
    },
    vehicle: {
      plate: 'D 1209 XYZ',
      brand: 'Mitsubishi',
      model: 'Pajero Sport Dakar 4x2',
      color: 'Deep Bronze Metallic',
      year: 2021,
      odometerKm: 52000,
      fuelLevel: 'Full'
    },
    serviceCategory: 'BODY_REPAIR',
    damagePoints: [
      { id: 'dp-5', panel: 'Fender Kanan Depan', severity: 'Rusak Parah / Ganti', suggestedAction: 'Ganti Baru & Cat Oven', x: 80, y: 40 }
    ],
    lineItems: [
      { id: 'li-8', type: 'part', description: 'Fender Kanan Depan Original Pajero', qty: 1, unitPrice: 3850000, partCode: 'MIT-5220-R' },
      { id: 'li-9', type: 'jasa', description: 'Bongkar Pasang & Setting Sasis', qty: 1, unitPrice: 850000 },
      { id: 'li-10', type: 'jasa', description: 'Pengecatan Oven Fender Depan', qty: 1, unitPrice: 950000 }
    ],
    subtotal: 5650000,
    ppn: 621500,
    grandTotal: 6271500,
    approvalTier: 'Workshop Manager Review',
    approvalStatus: 'APPROVED',
    approvedBy: 'Andi Owner (Manager)',
    approvedAt: '2026-08-15 09:00',
    status: 'DALAM_PENGERJAAN',
    kanbanStage: 'repair',
    detailedStage: 'Ketok',
    bayLocation: 'Bay Ketok 1',
    leadMechanic: 'Ahmad Fauzi',
    priority: 'high',
    entryDate: '2026-08-14',
    targetDeliveryDate: '2026-08-25',
    progressPercent: 40,
    slaStatus: 'OVERDUE',
    daysRemaining: -2,
    notes: 'Menunggu kiriman panel fender original dari supplier.',
    history: [
      { stage: 'Check-in Reception', date: '2026-08-14 10:00', status: 'completed' },
      { stage: 'Approval Manager', date: '2026-08-15 09:00', status: 'completed' },
      { stage: 'Ketok & Setting Body', date: '2026-08-16 08:30', status: 'current' }
    ],
    createdAt: '2026-08-14 10:00',
    updatedAt: '2026-08-26 09:30'
  },
  {
    id: 'SPK-2026-0892',
    spkNumber: 'SPK-2026-0892',
    trackingId: 'TRK-B9912KAA-892',
    bookingId: 'BKG-2026-0805',
    customer: {
      name: 'Kevin Leonardo',
      phone: '081809090909',
      type: 'Personal',
      address: 'Apartemen Menteng Park Tower Diamond, Jakarta Pusat'
    },
    vehicle: {
      plate: 'B 9912 KAA',
      brand: 'Hyundai',
      model: 'Ioniq 5 Signature Long Range',
      color: 'Gravity Gold Matte',
      year: 2023,
      odometerKm: 18000,
      fuelLevel: '80%'
    },
    serviceCategory: 'DETAILING',
    damagePoints: [],
    lineItems: [
      { id: 'li-11', type: 'jasa', description: 'Full Body Paint Correction (3 Steps)', qty: 1, unitPrice: 2500000 },
      { id: 'li-12', type: 'jasa', description: 'Nano Ceramic Coating 9H (3 Layers)', qty: 1, unitPrice: 3500000 },
      { id: 'li-13', type: 'jasa', description: 'Interior Deep Cleaning & Leather Care', qty: 1, unitPrice: 850000 }
    ],
    subtotal: 6850000,
    ppn: 753500,
    grandTotal: 7603500,
    approvalTier: 'Workshop Manager Review',
    approvalStatus: 'APPROVED',
    approvedBy: 'Budi Foreman',
    approvedAt: '2026-08-22 09:00',
    status: 'DALAM_PENGERJAAN',
    kanbanStage: 'assembly',
    detailedStage: 'Poles',
    bayLocation: 'Bay Detailing 1',
    leadMechanic: 'Joko Triono',
    priority: 'normal',
    entryDate: '2026-08-22',
    targetDeliveryDate: '2026-08-29',
    progressPercent: 90,
    slaStatus: 'ON_TRACK',
    daysRemaining: 2,
    notes: 'Aplikasi layer ke-3 ceramic coating ruang steril temperatur 22°C.',
    history: [
      { stage: 'Check-in Detailing', date: '2026-08-22 08:30', status: 'completed' },
      { stage: 'Paint Correction Polish', date: '2026-08-23 09:00', status: 'completed' },
      { stage: 'Nano Coating Application', date: '2026-08-25 10:00', status: 'current' }
    ],
    createdAt: '2026-08-22 08:30',
    updatedAt: '2026-08-26 14:00'
  },
  {
    id: 'SPK-2026-0840',
    spkNumber: 'SPK-2026-0840',
    trackingId: 'TRK-B1420KLA-840',
    bookingId: 'BKG-2026-0807',
    customer: {
      name: 'Bambang Pratama',
      phone: '081289128912',
      type: 'Insurance',
      address: 'Jl. Tebet Barat Dalam No. 18, Jakarta Selatan'
    },
    vehicle: {
      plate: 'B 1420 KLA',
      brand: 'Honda',
      model: 'HR-V SE 1.5',
      color: 'Modern Steel Metallic',
      year: 2022,
      odometerKm: 32000,
      fuelLevel: '1/2'
    },
    serviceCategory: 'BODY_REPAIR',
    insuranceCompany: 'Garda Oto (Asuransi Astra)',
    insurancePolicy: 'POL-8891289',
    damagePoints: [
      { id: 'dp-6', panel: 'Pintu Kanan Depan', severity: 'Penyok Sedang', suggestedAction: 'Ketok & Cat Panel', x: 62, y: 48 },
      { id: 'dp-7', panel: 'Fender Kanan Depan', severity: 'Baret Ringan', suggestedAction: 'Poles & Touch Up Cat', x: 78, y: 42 }
    ],
    lineItems: [
      { id: 'li-14', type: 'jasa', description: 'Ketok Magic Pintu Kanan Depan', qty: 1, unitPrice: 350000 },
      { id: 'li-15', type: 'part', description: 'Klip & Karet Pintu Original', qty: 4, unitPrice: 25000, partCode: 'HN-7221-K' },
      { id: 'li-16', type: 'jasa', description: 'Pengecatan Panel Pintu Kanan (Oven Cat)', qty: 1, unitPrice: 750000 }
    ],
    subtotal: 1200000,
    ppn: 132000,
    grandTotal: 1332000,
    approvalTier: 'Foreman Review',
    approvalStatus: 'APPROVED',
    status: 'SPK_TERBIT',
    kanbanStage: 'estimasi',
    detailedStage: 'Bongkar',
    bayLocation: 'Bay Pembongkaran 1',
    leadMechanic: 'Bambang Sudarso',
    priority: 'normal',
    entryDate: '2026-08-31',
    targetDeliveryDate: '2026-09-04',
    progressPercent: 15,
    slaStatus: 'ON_TRACK',
    daysRemaining: 4,
    notes: 'Unit baru saja diterbitkan SPK. Dijadwalkan mulai bongkar panel pintu.',
    history: [
      { stage: 'Estimasi & Registrasi SPK', date: '2026-08-31 08:30', status: 'completed', actor: 'Service Advisor' },
      { stage: 'Penerbitan Job Card', date: '2026-08-31 09:00', status: 'completed', actor: 'System' }
    ],
    createdAt: '2026-08-31 08:30',
    updatedAt: '2026-08-31 09:00'
  }
];

export const WORK_ORDERS_STORAGE_KEY = 'autocare_erp_work_orders_db_v1';
export const AUDIT_LOGS_STORAGE_KEY = 'autocare_erp_audit_logs_db_v1';

export function getStoredWorkOrders(): WorkOrderItem[] {
  try {
    const saved = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored work orders:', e);
  }
  // Initialize with INITIAL_WORK_ORDERS if not found
  try {
    localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_WORK_ORDERS));
  } catch (e) {
    console.error('Error seeding initial work orders to localStorage:', e);
  }
  return INITIAL_WORK_ORDERS;
}

export function saveWorkOrdersToStorage(orders: WorkOrderItem[]): void {
  try {
    localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('autocare_workorders_updated', { detail: orders }));
  } catch (e) {
    console.error('Error saving work orders to storage:', e);
  }
}

export function addAuditLogEntry(entry: {
  user: string;
  role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'LOGIN';
  module: string;
  targetId: string;
  details: string;
}): void {
  try {
    const savedLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    let logs = savedLogs ? JSON.parse(savedLogs) : [];
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...entry,
      ipAddress: '192.168.1.100'
    };
    logs = [newLog, ...logs];
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('autocare_audit_updated', { detail: logs }));
  } catch (e) {
    console.error('Error writing audit log:', e);
  }
}

export function createOrUpdateWorkOrder(order: WorkOrderItem, actorName = 'Service Advisor', actorRole = 'Service Advisor'): WorkOrderItem[] {
  const currentOrders = getStoredWorkOrders();
  const existingIndex = currentOrders.findIndex(o => o.id === order.id || o.spkNumber === order.spkNumber);
  
  let updatedOrders: WorkOrderItem[];
  if (existingIndex >= 0) {
    updatedOrders = currentOrders.map((o, idx) => idx === existingIndex ? { ...order, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : o);
    addAuditLogEntry({
      user: actorName,
      role: actorRole,
      action: 'UPDATE',
      module: 'Estimasi & SPK',
      targetId: order.spkNumber,
      details: `Memperbarui Work Order ${order.spkNumber} (${order.vehicle.plate} - ${order.customer.name}) status: ${order.status}`
    });
  } else {
    updatedOrders = [order, ...currentOrders];
    addAuditLogEntry({
      user: actorName,
      role: actorRole,
      action: 'CREATE',
      module: 'Estimasi & SPK',
      targetId: order.spkNumber,
      details: `Menerbitkan SPK Baru ${order.spkNumber} untuk ${order.vehicle.plate} (${order.customer.name}) - Total: Rp ${order.grandTotal.toLocaleString('id-ID')}`
    });
  }

  saveWorkOrdersToStorage(updatedOrders);
  return updatedOrders;
}

export function deleteWorkOrder(orderId: string, actorName = 'Service Advisor', actorRole = 'Service Advisor'): WorkOrderItem[] {
  const currentOrders = getStoredWorkOrders();
  const updatedOrders = currentOrders.filter(o => o.id !== orderId);
  saveWorkOrdersToStorage(updatedOrders);

  addAuditLogEntry({
    user: actorName,
    role: actorRole,
    action: 'DELETE',
    module: 'Estimasi & SPK',
    targetId: orderId,
    details: `Menghapus Work Order ${orderId} dari database.`
  });

  return updatedOrders;
}

export function resetWorkOrdersToDefault(): WorkOrderItem[] {
  try {
    localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_WORK_ORDERS));
    window.dispatchEvent(new CustomEvent('autocare_workorders_updated', { detail: INITIAL_WORK_ORDERS }));
  } catch (e) {
    console.error('Error resetting work orders:', e);
  }
  return INITIAL_WORK_ORDERS;
}
