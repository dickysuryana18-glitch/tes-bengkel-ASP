import { Role } from './schema';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  title: string;
  phone?: string;
  department: string;
  workOrderId?: string; // For customer role
  assignedStages?: string[]; // For mechanic role
}

export interface RoleNavigationRule {
  allowedTabs: string[];
  defaultTab: string;
  badgeColor: string;
  description: string;
}

export const ROLE_PERMISSIONS: Record<Role, RoleNavigationRule> = {
  'Super Admin': {
    allowedTabs: [
      'dashboard', 'booking', 'estimasi', 'monitoring', 'workshop', 
      'floor_layout', 'qc', 'inventory', 'purchasing', 
      'claims', 'invoice', 'payroll', 'mobile-tech', 'rbac', 'audit', 'settings'
    ],
    defaultTab: 'dashboard',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Akses penuh ke semua modul operasional, finansial, RBAC, dan audit sistem.'
  },
  'Owner': {
    allowedTabs: [
      'dashboard', 'booking', 'monitoring', 'workshop', 'inventory', 'purchasing', 'claims', 'invoice', 
      'payroll', 'audit', 'settings'
    ],
    defaultTab: 'dashboard',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Executive dashboard, KPI workshop, laba rugi, audit log, dan monitoring unit.'
  },
  'Service Advisor': {
    allowedTabs: [
      'booking', 'estimasi', 'monitoring', 'workshop', 'inventory', 'claims', 'invoice'
    ],
    defaultTab: 'booking',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Penerimaan kendaraan, booking reservasi, estimasi biaya, penerbitan SPK, interaksi pelanggan, & SLA monitoring.'
  },
  'Estimator': {
    allowedTabs: [
      'booking', 'estimasi', 'monitoring', 'inventory', 'claims'
    ],
    defaultTab: 'estimasi',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Kalkulasi kerusakan panel, part breakdown, foto damage appraisal, dan integrasi klaim asuransi.'
  },
  'Foreman': {
    allowedTabs: [
      'booking', 'workshop', 'floor_layout', 'monitoring', 'inventory', 'qc', 'mobile-tech'
    ],
    defaultTab: 'workshop',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    description: 'Manajemen alur kerja bengkel (Kanban), pembagian manpower teknisi, stall layout, dan supervisi QC.'
  },
  'Mekanik': {
    allowedTabs: [
      'mobile-tech', 'workshop', 'payroll'
    ],
    defaultTab: 'mobile-tech',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'PWA Mobile Teknisi, update progress stage pengerjaan (Bongkar/Ketok/Cat/Poles), dan rekap jam kerja/payroll.'
  },
  'Gudang': {
    allowedTabs: [
      'inventory', 'purchasing'
    ],
    defaultTab: 'inventory',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Barcode/QR scanner kamera, penerimaan PO Inbound, alokasi material terkunci SPK, dan cetak label thermal.'
  },
  'Purchasing': {
    allowedTabs: [
      'purchasing', 'inventory', 'invoice'
    ],
    defaultTab: 'purchasing',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Purchase Order (PO), pengadaan sparepart & bahan cat, negosiasi supplier vendor, dan matching faktur.'
  },
  'QC': {
    allowedTabs: [
      'qc', 'monitoring', 'workshop'
    ],
    defaultTab: 'qc',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Inspeksi checklist kualitas (Pass/Fail/Rework), thickness meter cat, gap panel, test drive, dan final pass.'
  },
  'Finance': {
    allowedTabs: [
      'invoice', 'claims', 'payroll', 'dashboard'
    ],
    defaultTab: 'invoice',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40',
    description: 'Kasir pembayaran SPK, split bill asuransi (own risk), monitoring piutang (AR), dan disbursement komisi/payroll.'
  },
  'Customer': {
    allowedTabs: [
      'customer-portal'
    ],
    defaultTab: 'customer-portal',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Portal live tracking progres perbaikan unit, galeri foto pengerjaan, approval estimasi, dan invoice.'
  }
};

export const DEMO_CREDENTIALS: Record<Role, { email: string; name: string; title: string; dept: string; defaultPass: string; trackId?: string }> = {
  'Super Admin': {
    email: 'superadmin@bengkelpro.id',
    name: 'Dicky Suryana, S.T.',
    title: 'Lead System Architect & Super Admin',
    dept: 'IT & Management Executive',
    defaultPass: 'admin123'
  },
  'Owner': {
    email: 'owner@bengkelpro.id',
    name: 'Ir. Bambang Wijaya',
    title: 'Workshop Owner & President Director',
    dept: 'Executive Board',
    defaultPass: 'owner123'
  },
  'Service Advisor': {
    email: 'sa@bengkelpro.id',
    name: 'Siti Sarah, S.E.',
    title: 'Senior Service Advisor',
    dept: 'Front Office & Customer Service',
    defaultPass: 'sa123'
  },
  'Estimator': {
    email: 'estimator@bengkelpro.id',
    name: 'Doni Pratama',
    title: 'Lead Damage & Insurance Estimator',
    dept: 'Body Repair Estimation',
    defaultPass: 'est123'
  },
  'Foreman': {
    email: 'foreman@bengkelpro.id',
    name: 'Budi Santoso',
    title: 'Head Workshop Foreman',
    dept: 'Production Workshop Floor',
    defaultPass: 'foreman123'
  },
  'Mekanik': {
    email: 'mekanik@bengkelpro.id',
    name: 'Agus Setiawan',
    title: 'Master Technician (Body & Paint)',
    dept: 'Workshop Workshop Line 2',
    defaultPass: 'mekanik123'
  },
  'Gudang': {
    email: 'gudang@bengkelpro.id',
    name: 'Ahmad Fauzi',
    title: 'Head of Spareparts & Material Warehouse',
    dept: 'Inventory & Supply Chain',
    defaultPass: 'gudang123'
  },
  'Purchasing': {
    email: 'purchasing@bengkelpro.id',
    name: 'Dewi Lestari, S.Ak.',
    title: 'Procurement & Vendor Specialist',
    dept: 'Purchasing & SCM',
    defaultPass: 'purchasing123'
  },
  'QC': {
    email: 'qc@bengkelpro.id',
    name: 'Hendro Wijaya',
    title: 'Quality Control Lead Inspector',
    dept: 'Quality Assurance & Delivery',
    defaultPass: 'qc123'
  },
  'Finance': {
    email: 'finance@bengkelpro.id',
    name: 'Rina Kusuma, S.Ak.',
    title: 'Chief Financial Officer & Cashier',
    dept: 'Finance, Billing & Insurance Settlement',
    defaultPass: 'finance123'
  },
  'Customer': {
    email: 'customer@bengkelpro.id',
    name: 'Dr. Irwan Santoso (VIP Customer)',
    title: 'Pemilik Kendaraan B 1234 ABC',
    dept: 'Pelanggan Individu / Asuransi Astra',
    defaultPass: 'cust123',
    trackId: 'TRK-2026-8891'
  }
};

export interface SystemUserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  title: string;
  department: string;
  phone?: string;
  branch: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastActive: string;
  createdDate: string;
  avatar?: string;
  workOrderId?: string;
  assignedStages?: string[];
  customPermissions?: Record<string, Record<string, boolean>>;
}

export const INITIAL_REGISTERED_USERS: SystemUserAccount[] = [
  {
    id: 'usr-001',
    name: 'Dicky Suryana, S.T.',
    email: 'superadmin@bengkelpro.id',
    password: 'admin123',
    role: 'Super Admin',
    title: 'Lead System Architect & Super Admin',
    department: 'IT & Management Executive',
    phone: '+62 812-9988-7711',
    branch: 'Kantor Pusat & Workshop Utama',
    status: 'ACTIVE',
    lastActive: 'Aktif saat ini',
    createdDate: '2025-01-01'
  },
  {
    id: 'usr-002',
    name: 'Ir. Bambang Wijaya',
    email: 'owner@bengkelpro.id',
    password: 'owner123',
    role: 'Owner',
    title: 'Workshop Owner & President Director',
    department: 'Executive Board',
    phone: '+62 811-2233-4455',
    branch: 'Kantor Pusat & Workshop Utama',
    status: 'ACTIVE',
    lastActive: '15 menit lalu',
    createdDate: '2025-01-05'
  },
  {
    id: 'usr-003',
    name: 'Siti Sarah, S.E.',
    email: 'sa@bengkelpro.id',
    password: 'sa123',
    role: 'Service Advisor',
    title: 'Senior Service Advisor',
    department: 'Front Office & Customer Service',
    phone: '+62 813-4455-6677',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE',
    lastActive: '1 jam lalu',
    createdDate: '2025-01-10'
  },
  {
    id: 'usr-004',
    name: 'Doni Pratama',
    email: 'estimator@bengkelpro.id',
    password: 'est123',
    role: 'Estimator',
    title: 'Lead Damage & Insurance Estimator',
    department: 'Body Repair Estimation',
    phone: '+62 818-7766-5544',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE',
    lastActive: '2 jam lalu',
    createdDate: '2025-01-12'
  },
  {
    id: 'usr-005',
    name: 'Budi Santoso',
    email: 'foreman@bengkelpro.id',
    password: 'foreman123',
    role: 'Foreman',
    title: 'Head Workshop Foreman',
    department: 'Production Workshop Floor',
    phone: '+62 821-3344-5566',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE',
    lastActive: '30 menit lalu',
    createdDate: '2025-01-15'
  },
  {
    id: 'usr-006',
    name: 'Agus Setiawan',
    email: 'mekanik@bengkelpro.id',
    password: 'mekanik123',
    role: 'Mekanik',
    title: 'Master Technician (Body & Paint)',
    department: 'Workshop Line 2',
    phone: '+62 856-1122-3344',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE',
    lastActive: '45 menit lalu',
    createdDate: '2025-01-20',
    assignedStages: ['Bongkar', 'Ketok', 'Dempul', 'Cat', 'Poles']
  },
  {
    id: 'usr-007',
    name: 'Ahmad Fauzi',
    email: 'gudang@bengkelpro.id',
    password: 'gudang123',
    role: 'Gudang',
    title: 'Head of Spareparts & Material Warehouse',
    department: 'Inventory & Supply Chain',
    phone: '+62 878-9900-1122',
    branch: 'Gudang Sentral Logistik',
    status: 'ACTIVE',
    lastActive: '10 menit lalu',
    createdDate: '2025-01-22'
  },
  {
    id: 'usr-008',
    name: 'Dewi Lestari, S.Ak.',
    email: 'purchasing@bengkelpro.id',
    password: 'purchasing123',
    role: 'Purchasing',
    title: 'Procurement & Vendor Specialist',
    department: 'Purchasing & SCM',
    phone: '+62 812-7788-9900',
    branch: 'Kantor Pusat & Workshop Utama',
    status: 'ACTIVE',
    lastActive: '3 jam lalu',
    createdDate: '2025-01-25'
  },
  {
    id: 'usr-009',
    name: 'Hendro Wijaya',
    email: 'qc@bengkelpro.id',
    password: 'qc123',
    role: 'QC',
    title: 'Quality Control Lead Inspector',
    department: 'Quality Assurance & Delivery',
    phone: '+62 813-8899-0011',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE',
    lastActive: '1 jam lalu',
    createdDate: '2025-01-28'
  },
  {
    id: 'usr-010',
    name: 'Rina Kusuma, S.Ak.',
    email: 'finance@bengkelpro.id',
    password: 'finance123',
    role: 'Finance',
    title: 'Chief Financial Officer & Cashier',
    department: 'Finance, Billing & Insurance Settlement',
    phone: '+62 819-3344-5566',
    branch: 'Kantor Pusat & Workshop Utama',
    status: 'ACTIVE',
    lastActive: '20 menit lalu',
    createdDate: '2025-02-01'
  },
  {
    id: 'usr-011',
    name: 'Dr. Irwan Santoso (VIP Customer)',
    email: 'customer@bengkelpro.id',
    password: 'cust123',
    role: 'Customer',
    title: 'Pemilik Kendaraan B 1234 ABC',
    department: 'Pelanggan Individu / Asuransi Astra',
    phone: '+62 811-9900-1122',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE',
    lastActive: 'Kemarin',
    createdDate: '2025-02-15',
    workOrderId: 'TRK-2026-8891'
  }
];
