import { useState, useMemo, FormEvent } from 'react';
import { 
  ShieldCheck, Shield, UserCog, Check, X, Search, 
  Save, AlertTriangle, Key, Users, UserPlus, Trash2, 
  Edit3, Lock, Mail, Phone, Building2, CheckCircle2, 
  XCircle, Filter, Sparkles, RefreshCw, Eye, EyeOff, 
  Smartphone, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { Role } from '../types/schema';
import { SystemUserAccount, ROLE_PERMISSIONS } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ALL_ROLES: Role[] = [
  'Super Admin', 
  'Owner', 
  'Service Advisor', 
  'Estimator', 
  'Foreman', 
  'Mekanik', 
  'Gudang', 
  'Purchasing', 
  'QC', 
  'Finance', 
  'Customer'
];

const MODULE_LIST = [
  { id: 'booking', name: 'Daftar Booking & Reservasi Servis', dept: 'Front Office' },
  { id: 'estimasi', name: 'Estimasi Kerusakan & SPK', dept: 'Front Office' },
  { id: 'crm', name: 'CRM & Riwayat Pelanggan', dept: 'Front Office' },
  { id: 'monitoring', name: 'Monitoring Status Unit & SLA', dept: 'Operations' },
  { id: 'workshop', name: 'Workshop Kanban & Pengerjaan', dept: 'Production' },
  { id: 'floor_layout', name: 'Floor Layout Editor & Stall', dept: 'Production' },
  { id: 'inventory', name: 'Gudang Material & Suku Cadang', dept: 'Supply Chain' },
  { id: 'purchasing', name: 'Purchasing (PO) & Vendor SCM', dept: 'Supply Chain' },
  { id: 'qc', name: 'Inspeksi QC & Final Pass', dept: 'Quality' },
  { id: 'invoice', name: 'Kasir, Invoice & Billing', dept: 'Finance' },
  { id: 'claims', name: 'Klaim Asuransi & Own Risk', dept: 'Finance' },
  { id: 'payroll', name: 'HR, Payroll & Komisi Mekanik', dept: 'Management' },
  { id: 'mobile-tech', name: 'PWA Mobile Teknisi Workshop', dept: 'Production' },
  { id: 'rbac', name: 'Role & Hak Akses (Master Data)', dept: 'IT Admin' },
  { id: 'audit', name: 'Audit Trail & Log Aktivitas', dept: 'IT Admin' },
  { id: 'settings', name: 'Pengaturan Bengkel & Sistem', dept: 'IT Admin' }
];

const BRANCH_OPTIONS = [
  'Kantor Pusat & Workshop Utama',
  'Cabang 1 - Jakarta Selatan',
  'Cabang 2 - BSD Serpong',
  'Cabang 3 - Bandung Soekarno-Hatta',
  'Gudang Sentral Logistik'
];

const ROLE_DEFAULT_PERMISSIONS: Record<Role, Record<string, { Read: boolean; Write: boolean; Delete: boolean; Approve: boolean }>> = {
  'Super Admin': {
    all: { Read: true, Write: true, Delete: true, Approve: true }
  },
  'Owner': {
    dashboard: { Read: true, Write: false, Delete: false, Approve: true },
    booking: { Read: true, Write: false, Delete: false, Approve: false },
    monitoring: { Read: true, Write: false, Delete: false, Approve: false },
    workshop: { Read: true, Write: false, Delete: false, Approve: false },
    invoice: { Read: true, Write: false, Delete: false, Approve: true },
    payroll: { Read: true, Write: false, Delete: false, Approve: true },
    audit: { Read: true, Write: false, Delete: false, Approve: false },
    settings: { Read: true, Write: true, Delete: false, Approve: true }
  },
  'Service Advisor': {
    booking: { Read: true, Write: true, Delete: false, Approve: true },
    estimasi: { Read: true, Write: true, Delete: false, Approve: true },
    crm: { Read: true, Write: true, Delete: false, Approve: false },
    monitoring: { Read: true, Write: true, Delete: false, Approve: false },
    workshop: { Read: true, Write: false, Delete: false, Approve: false },
    invoice: { Read: true, Write: true, Delete: false, Approve: false },
    claims: { Read: true, Write: true, Delete: false, Approve: false }
  },
  'Estimator': {
    estimasi: { Read: true, Write: true, Delete: false, Approve: true },
    monitoring: { Read: true, Write: false, Delete: false, Approve: false },
    inventory: { Read: true, Write: false, Delete: false, Approve: false },
    claims: { Read: true, Write: true, Delete: false, Approve: false }
  },
  'Foreman': {
    workshop: { Read: true, Write: true, Delete: false, Approve: true },
    floor_layout: { Read: true, Write: true, Delete: false, Approve: true },
    monitoring: { Read: true, Write: true, Delete: false, Approve: false },
    qc: { Read: true, Write: true, Delete: false, Approve: false },
    'mobile-tech': { Read: true, Write: true, Delete: false, Approve: false }
  },
  'Mekanik': {
    'mobile-tech': { Read: true, Write: true, Delete: false, Approve: false },
    workshop: { Read: true, Write: false, Delete: false, Approve: false },
    payroll: { Read: true, Write: false, Delete: false, Approve: false }
  },
  'Gudang': {
    inventory: { Read: true, Write: true, Delete: false, Approve: true },
    purchasing: { Read: true, Write: true, Delete: false, Approve: false }
  },
  'Purchasing': {
    purchasing: { Read: true, Write: true, Delete: false, Approve: true },
    inventory: { Read: true, Write: false, Delete: false, Approve: false },
    invoice: { Read: true, Write: false, Delete: false, Approve: false }
  },
  'QC': {
    qc: { Read: true, Write: true, Delete: false, Approve: true },
    monitoring: { Read: true, Write: false, Delete: false, Approve: false },
    workshop: { Read: true, Write: false, Delete: false, Approve: false }
  },
  'Finance': {
    invoice: { Read: true, Write: true, Delete: false, Approve: true },
    claims: { Read: true, Write: true, Delete: false, Approve: true },
    payroll: { Read: true, Write: true, Delete: false, Approve: true },
    dashboard: { Read: true, Write: false, Delete: false, Approve: false }
  },
  'Customer': {
    'customer-portal': { Read: true, Write: false, Delete: false, Approve: true }
  }
};

export function RoleManagementModule() {
  const { registeredUsers, addUser, updateUser, deleteUser } = useAuth();
  
  const [selectedUser, setSelectedUser] = useState<SystemUserAccount | null>(() => {
    return registeredUsers[0] || null;
  });
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUserAccount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // New User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Service Advisor' as Role,
    title: 'Service Advisor Front Office',
    department: 'Front Office & CRM',
    phone: '+62 812-',
    branch: 'Cabang 1 - Jakarta Selatan',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  });

  // Custom permissions for the currently selected user
  const [customPermissions, setCustomPermissions] = useState<Record<string, Record<string, boolean>>>({});

  // Synchronize custom permissions when selectedUser changes
  const activeUser = useMemo(() => {
    if (!selectedUser) return null;
    return registeredUsers.find(u => u.id === selectedUser.id) || registeredUsers[0] || null;
  }, [selectedUser, registeredUsers]);

  const filteredUsers = useMemo(() => {
    return registeredUsers.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase());
      
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchBranch = branchFilter === 'ALL' || u.branch === branchFilter;

      return matchSearch && matchRole && matchStatus && matchBranch;
    });
  }, [registeredUsers, search, roleFilter, statusFilter, branchFilter]);

  // Overall Stats
  const totalUsers = registeredUsers.length;
  const activeCount = registeredUsers.filter(u => u.status === 'ACTIVE').length;
  const adminCount = registeredUsers.filter(u => u.role === 'Super Admin' || u.role === 'Owner').length;
  const techCount = registeredUsers.filter(u => u.role === 'Foreman' || u.role === 'Mekanik' || u.role === 'QC').length;

  const handleRoleChangeDirect = (newRole: Role) => {
    if (!activeUser) return;
    const defaultTitle = `${newRole} Specialist`;
    const defaultDept = ROLE_PERMISSIONS[newRole]?.description ? newRole : 'Operasional Bengkel';

    const updated: SystemUserAccount = {
      ...activeUser,
      role: newRole,
      title: activeUser.title || defaultTitle,
      department: activeUser.department || defaultDept
    };
    updateUser(updated);
    setSelectedUser(updated);
  };

  const handleToggleStatus = (target: SystemUserAccount) => {
    if (target.role === 'Super Admin' && target.id === 'usr-001') {
      toast.error('Akun Super Admin Utama harus selalu aktif.');
      return;
    }
    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated: SystemUserAccount = { ...target, status: newStatus };
    updateUser(updated);
    if (selectedUser?.id === target.id) {
      setSelectedUser(updated);
    }
  };

  const togglePermission = (modId: string, action: 'Read' | 'Write' | 'Delete' | 'Approve') => {
    if (!activeUser || activeUser.role === 'Super Admin') return;

    setCustomPermissions(prev => {
      const userModPerms = prev[modId] || { Read: false, Write: false, Delete: false, Approve: false };
      const nextModPerms = {
        ...userModPerms,
        [action]: !userModPerms[action]
      };

      const nextAll = {
        ...prev,
        [modId]: nextModPerms
      };

      // Also persist to the user account
      const updatedUser: SystemUserAccount = {
        ...activeUser,
        customPermissions: nextAll
      };
      updateUser(updatedUser);

      return nextAll;
    });
  };

  const getPermissionValue = (modId: string, action: 'Read' | 'Write' | 'Delete' | 'Approve', userRole: Role) => {
    if (userRole === 'Super Admin') return true;

    // Check custom permissions first
    if (activeUser?.customPermissions?.[modId]?.[action] !== undefined) {
      return activeUser.customPermissions[modId][action];
    }
    if (customPermissions[modId]?.[action] !== undefined) {
      return customPermissions[modId][action];
    }

    // Default permission rules from role matrix
    const roleDef = ROLE_DEFAULT_PERMISSIONS[userRole];
    if (roleDef?.all) return roleDef.all[action] || false;
    if (roleDef?.[modId]) return roleDef[modId][action] || false;

    // Fallback based on tab allowance
    const allowedTabs = ROLE_PERMISSIONS[userRole]?.allowedTabs || [];
    if (action === 'Read') {
      return allowedTabs.includes(modId);
    }
    return false;
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'Service Advisor',
      title: 'Service Advisor Front Office',
      department: 'Front Office & CRM',
      phone: '+62 812-',
      branch: 'Cabang 1 - Jakarta Selatan',
      status: 'ACTIVE'
    });
    setIsAddModalOpen(true);
  };

  // Save New User
  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Mohon lengkapi nama, email, dan kata sandi.');
      return;
    }

    // Check email uniqueness
    const exists = registeredUsers.some(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
    if (exists) {
      toast.error('Email ini sudah terdaftar. Gunakan alamat email lain.');
      return;
    }

    const created = addUser({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      role: formData.role,
      title: formData.title.trim() || `${formData.role} Specialist`,
      department: formData.department.trim() || 'Bengkel Operations',
      phone: formData.phone.trim(),
      branch: formData.branch,
      status: formData.status
    });

    setIsAddModalOpen(false);
    setSelectedUser(created);
  };

  // Open Edit Modal
  const openEditModal = (user: SystemUserAccount) => {
    setUserToEdit(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      title: user.title,
      department: user.department,
      phone: user.phone || '',
      branch: user.branch,
      status: user.status
    });
    setIsEditModalOpen(true);
  };

  // Save Edit User
  const handleSaveEditUser = (e: FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Nama dan email wajib diisi.');
      return;
    }

    const updated: SystemUserAccount = {
      ...userToEdit,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim() || userToEdit.password,
      role: formData.role,
      title: formData.title.trim(),
      department: formData.department.trim(),
      phone: formData.phone.trim(),
      branch: formData.branch,
      status: formData.status
    };

    updateUser(updated);
    if (selectedUser?.id === userToEdit.id) {
      setSelectedUser(updated);
    }
    setIsEditModalOpen(false);
    setUserToEdit(null);
  };

  // Confirm Delete
  const handleExecuteDelete = (userId: string) => {
    deleteUser(userId);
    setDeleteConfirmId(null);
    if (selectedUser?.id === userId) {
      const remaining = registeredUsers.filter(u => u.id !== userId);
      setSelectedUser(remaining[0] || null);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Role & Hak Akses (RBAC)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">
              Master Data Pengguna
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola direktori staf, penambahan akun login, hak otorisasi modul, dan pemisahan wewenang operasional.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={openAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 shrink-0">
        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalUsers}</h3>
            <p className="text-[10px] text-indigo-400 mt-0.5">Semua Cabang Bengkel</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pengguna Aktif</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</h3>
            <p className="text-[10px] text-emerald-400/80 mt-0.5">Akses Login Terbuka</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tim Workshop</p>
            <h3 className="text-2xl font-black text-cyan-400 mt-1">{techCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Foreman, Teknisi, QC</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Executive & Admin</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">{adminCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Super Admin & Owner</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
        
        {/* LEFT PANE: User Directory & Filters */}
        <div className="w-full lg:w-[420px] flex flex-col bg-[#1E293B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden shrink-0">
          
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/70 space-y-3">
            <div className="flex items-center bg-[#0B1120] rounded-xl px-3 py-2 border border-slate-700/80 focus-within:border-indigo-500 transition-colors">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Cari nama, email, role, posisi..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-200 placeholder:text-slate-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#0B1120] border border-slate-700/80 text-slate-300 text-[11px] rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Peran (11 Role)</option>
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0B1120] border border-slate-700/80 text-slate-300 text-[11px] rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif (Bisa Login)</option>
                <option value="INACTIVE">Nonaktif</option>
                <option value="SUSPENDED">Ditangguhkan</option>
              </select>
            </div>
          </div>
          
          {/* User List Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">Tidak ada pengguna yang cocok.</p>
                <button 
                  onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = activeUser?.id === user.id;
                const roleConfig = ROLE_PERMISSIONS[user.role];

                return (
                  <div 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-600/10' 
                        : 'bg-[#0F172A]/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                            {user.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${roleConfig?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {user.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[130px]">{user.branch}</span>
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${
                        user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {user.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Counter */}
          <div className="p-3 border-t border-slate-800 bg-[#0F172A]/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{totalUsers}</strong> pengguna</span>
            <button 
              onClick={openAddModal}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Baru</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANE: User Profile & Permission Matrix */}
        <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-0">
          {activeUser ? (
            <>
              {/* Selected User Header Card */}
              <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#0F172A]/90 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-xl font-black text-indigo-400 shadow-md">
                    {activeUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{activeUser.name}</h3>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${ROLE_PERMISSIONS[activeUser.role]?.badgeColor}`}>
                        {activeUser.role}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        activeUser.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {activeUser.status === 'ACTIVE' ? 'Akun Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {activeUser.email}
                      </span>
                      {activeUser.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {activeUser.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {activeUser.branch}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                  <button
                    onClick={() => openEditModal(activeUser)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Akun</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(activeUser)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeUser.status === 'ACTIVE'
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {activeUser.status === 'ACTIVE' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Nonaktifkan</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>

                  {activeUser.role !== 'Super Admin' && (
                    <button
                      onClick={() => setDeleteConfirmId(activeUser.id)}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Role Switcher Banner */}
              <div className="p-4 bg-[#0F172A]/50 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-slate-400 font-semibold">Ubah Role Sistem:</span>
                  <select 
                    value={activeUser.role}
                    onChange={(e) => handleRoleChangeDirect(e.target.value as Role)}
                    className="bg-[#0B1120] border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span>Scope Tugas: </span>
                  <strong className="text-indigo-300">{ROLE_PERMISSIONS[activeUser.role]?.description}</strong>
                </div>
              </div>

              {/* Role Special Banner */}
              {activeUser.role === 'Super Admin' && (
                <div className="mx-6 mt-4 p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-start gap-3 text-xs text-slate-300 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-indigo-400 block mb-0.5">Akses Penuh Sistem (Super Administrator)</strong>
                    Akun dengan role Super Admin memiliki hak ases tak terbatas ke semua modul operasional, gudang, SPK, finansial, dan audit log. Matrix otorisasi di bawah ini terkunci pada status Full Access.
                  </p>
                </div>
              )}

              {/* RBAC Permission Matrix Table */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      Matrix Hak Akses Modul ({MODULE_LIST.length} Modul)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tentukan wewenang Read (Lihat), Write (Edit/Tambah), Delete (Hapus), dan Approve (Otorisasi SPK/PO/Invoice).
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-teal-400">
                      <Check className="w-3.5 h-3.5" /> Diizinkan
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <X className="w-3.5 h-3.5" /> Dibatasi
                    </span>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#0F172A]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800/60 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="px-4 py-3 w-5/12">Nama Modul & Departemen</th>
                        <th className="px-3 py-3 text-center w-1/12">Read (Lihat)</th>
                        <th className="px-3 py-3 text-center w-1/12">Write (Ubah)</th>
                        <th className="px-3 py-3 text-center w-1/12">Delete (Hapus)</th>
                        <th className="px-3 py-3 text-center w-1/12">Approve (Acc)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {MODULE_LIST.map((mod) => {
                        const isSuperAdmin = activeUser.role === 'Super Admin';

                        return (
                          <tr key={mod.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-200">{mod.name}</div>
                              <span className="text-[10px] text-slate-500">{mod.dept}</span>
                            </td>
                            
                            {(['Read', 'Write', 'Delete', 'Approve'] as const).map(action => {
                              const hasAccess = getPermissionValue(mod.id, action, activeUser.role);

                              return (
                                <td key={action} className="px-3 py-3.5 text-center">
                                  <button 
                                    type="button"
                                    disabled={isSuperAdmin}
                                    onClick={() => togglePermission(mod.id, action)}
                                    className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                      isSuperAdmin 
                                        ? 'bg-indigo-500/20 text-indigo-400 cursor-not-allowed opacity-60' 
                                        : hasAccess
                                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 cursor-pointer shadow-sm'
                                          : 'bg-[#0B1120] text-slate-600 border border-slate-800 hover:bg-slate-800 hover:text-slate-400 cursor-pointer'
                                    }`}
                                    title={`${action} ${mod.name}`}
                                  >
                                    {hasAccess ? <Check className="w-4 h-4" /> : <X className="w-3 h-3" />}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
              <UserCog className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm font-medium">Pilih salah satu pengguna di sebelah kiri untuk melihat dan mengatur hak akses.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
            
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tambah Pengguna Baru</h3>
                  <p className="text-xs text-slate-400">Daftarkan akun staf baru untuk login ke sistem Bengkel Pro</p>
                </div>
              </div>

              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendro Pratama, S.T."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Akun Login <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@bengkelpro.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kata Sandi Awal <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#0B1120] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Peran / Role Sistem <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as Role;
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        title: `${newRole} Specialist`,
                        department: newRole === 'Mekanik' || newRole === 'Foreman' ? 'Workshop Floor' : 'Front Office & Operasional'
                      });
                    }}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="+62 812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departemen / Posisi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Body & Paint Line 1"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cabang Penempatan
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {BRANCH_OPTIONS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Pengguna */}
      {isEditModalOpen && userToEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
            
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Profil Pengguna</h3>
                  <p className="text-xs text-slate-400">Perbarui data kredensial, role, dan penempatan cabang</p>
                </div>
              </div>

              <button 
                onClick={() => { setIsEditModalOpen(false); setUserToEdit(null); }}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ganti Kata Sandi (Opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak diubah"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Peran / Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">Aktif (Bisa Login)</option>
                    <option value="INACTIVE">Nonaktif</option>
                    <option value="SUSPENDED">Ditangguhkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departemen / Posisi
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cabang
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {BRANCH_OPTIONS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setUserToEdit(null); }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus User */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-black/80">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Hapus Pengguna?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Apakah Anda yakin ingin menghapus akun ini dari direktori sistem? Tindakan ini akan mencabut seluruh akses login dan otorisasi pengguna tersebut.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleExecuteDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Pengguna</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
