import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role } from '../types/schema';
import { AuthUser, ROLE_PERMISSIONS, DEMO_CREDENTIALS, SystemUserAccount, INITIAL_REGISTERED_USERS } from '../types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  registeredUsers: SystemUserAccount[];
  addUser: (newUser: Omit<SystemUserAccount, 'id' | 'createdDate' | 'lastActive'>) => SystemUserAccount;
  updateUser: (updatedUser: SystemUserAccount) => void;
  deleteUser: (userId: string) => void;
  login: (email: string, password?: string, roleOverride?: Role) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: Role) => void;
  hasAccess: (tabId: string) => boolean;
  allowedTabs: string[];
  defaultTab: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'autocare_erp_auth_user';
const USERS_STORAGE_KEY = 'autocare_erp_registered_users';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved auth user', e);
    }
    return null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<SystemUserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load registered users', e);
    }
    return INITIAL_REGISTERED_USERS;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Failed to persist registered users', e);
    }
  }, [registeredUsers]);

  const addUser = (newUserRaw: Omit<SystemUserAccount, 'id' | 'createdDate' | 'lastActive'>): SystemUserAccount => {
    const id = `usr-${Date.now().toString().slice(-4)}`;
    const createdDate = new Date().toISOString().split('T')[0];
    const createdUser: SystemUserAccount = {
      ...newUserRaw,
      id,
      createdDate,
      lastActive: 'Baru Didaftarkan'
    };

    setRegisteredUsers(prev => [createdUser, ...prev]);
    toast.success(`Pengguna ${createdUser.name} berhasil ditambahkan!`, {
      description: `Role: ${createdUser.role} • Email: ${createdUser.email}`
    });
    return createdUser;
  };

  const updateUser = (updatedUser: SystemUserAccount) => {
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    // If currently logged in as this user, update active session state as well
    if (user && (user.email.toLowerCase() === updatedUser.email.toLowerCase() || user.id === updatedUser.id)) {
      setUser({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        title: updatedUser.title,
        department: updatedUser.department,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        workOrderId: updatedUser.workOrderId,
        assignedStages: updatedUser.assignedStages
      });
    }

    toast.success(`Data pengguna ${updatedUser.name} diperbarui.`);
  };

  const deleteUser = (userId: string) => {
    const target = registeredUsers.find(u => u.id === userId);
    if (!target) return;

    if (target.email === 'superadmin@bengkelpro.id' || target.id === 'usr-001') {
      toast.error('Akun Master Super Admin Utama tidak dapat dihapus demi keamanan sistem.');
      return;
    }

    setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
    toast.success(`Pengguna ${target.name} telah dihapus dari sistem.`);
  };

  const login = async (email: string, password?: string, roleOverride?: Role): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If role override is provided (e.g. from customer portal link or developer bypass)
    if (roleOverride) {
      const cred = DEMO_CREDENTIALS[roleOverride];
      const matchingExisting = registeredUsers.find(u => u.role === roleOverride);

      const authUser: AuthUser = {
        id: matchingExisting?.id || `USR-${Date.now().toString().slice(-4)}`,
        name: matchingExisting?.name || cred?.name || email.split('@')[0],
        email: matchingExisting?.email || cred?.email || email,
        role: roleOverride,
        title: matchingExisting?.title || cred?.title || `${roleOverride} Specialist`,
        department: matchingExisting?.department || cred?.dept || 'Bengkel Operations',
        phone: matchingExisting?.phone,
        avatar: matchingExisting?.avatar,
        workOrderId: matchingExisting?.workOrderId || cred?.trackId || 'TRK-2026-8891',
        assignedStages: roleOverride === 'Mekanik' ? ['Bongkar', 'Ketok', 'Dempul', 'Cat', 'Poles'] : undefined
      };

      setUser(authUser);
      toast.success(`Selamat datang, ${authUser.name}!`, {
        description: `Masuk sebagai ${authUser.role} (${authUser.department})`
      });
      return { success: true };
    }

    // 2. Search in registered users
    const matchedAccount = registeredUsers.find(u => 
      u.email.toLowerCase() === cleanEmail || 
      u.name.toLowerCase() === cleanEmail ||
      u.email.split('@')[0].toLowerCase() === cleanEmail
    );

    if (matchedAccount) {
      if (matchedAccount.status === 'INACTIVE' || matchedAccount.status === 'SUSPENDED') {
        toast.error('Akses Akun Dinonaktifkan', {
          description: 'Akun Anda sedang dalam status nonaktif. Hubungi Super Admin / IT.'
        });
        return { success: false, message: 'Akun dinonaktifkan oleh Administrator.' };
      }

      // If password check is enforced:
      if (matchedAccount.password && password && matchedAccount.password !== password.trim()) {
        toast.error('Kata Sandi Salah', {
          description: 'Kata sandi yang Anda masukkan tidak sesuai.'
        });
        return { success: false, message: 'Kata sandi tidak valid.' };
      }

      const authUser: AuthUser = {
        id: matchedAccount.id,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        title: matchedAccount.title || `${matchedAccount.role} Specialist`,
        department: matchedAccount.department || 'Bengkel Operations',
        phone: matchedAccount.phone,
        avatar: matchedAccount.avatar,
        workOrderId: matchedAccount.workOrderId || 'TRK-2026-8891',
        assignedStages: matchedAccount.assignedStages || (matchedAccount.role === 'Mekanik' ? ['Bongkar', 'Ketok', 'Dempul', 'Cat', 'Poles'] : undefined)
      };

      setUser(authUser);
      toast.success(`Selamat datang, ${authUser.name}!`, {
        description: `Masuk sebagai ${authUser.role} (${authUser.department})`
      });
      return { success: true };
    }

    // 3. Fallback demo credential lookup if account not in list but email matches default demo
    const foundDemoRole = (Object.keys(DEMO_CREDENTIALS) as Role[]).find(
      r => DEMO_CREDENTIALS[r].email.toLowerCase() === cleanEmail
    );

    if (foundDemoRole) {
      const cred = DEMO_CREDENTIALS[foundDemoRole];
      const authUser: AuthUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: cred.name,
        email: cred.email,
        role: foundDemoRole,
        title: cred.title,
        department: cred.dept,
        workOrderId: cred.trackId || 'TRK-2026-8891',
        assignedStages: foundDemoRole === 'Mekanik' ? ['Bongkar', 'Ketok', 'Dempul', 'Cat', 'Poles'] : undefined
      };
      setUser(authUser);
      toast.success(`Selamat datang, ${authUser.name}!`, {
        description: `Masuk sebagai ${authUser.role} (${authUser.department})`
      });
      return { success: true };
    }

    // 4. Default / Generic fallback with warning
    toast.error('Akun Tidak Ditemukan', {
      description: 'Email atau username tidak terdaftar di sistem Bengkel Pro.'
    });
    return { success: false, message: 'Email atau username tidak ditemukan.' };
  };

  const logout = () => {
    const prevName = user?.name;
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Sesi telah diakhiri', {
      description: prevName ? `${prevName} berhasil logout.` : 'Anda telah keluar dari sistem Bengkel Pro.'
    });
  };

  const switchRole = (newRole: Role) => {
    const matchingAccount = registeredUsers.find(u => u.role === newRole && u.status === 'ACTIVE');
    const cred = DEMO_CREDENTIALS[newRole];

    const updatedUser: AuthUser = {
      id: matchingAccount?.id || `USR-${Date.now().toString().slice(-4)}`,
      name: matchingAccount?.name || cred?.name || `Pengguna ${newRole}`,
      email: matchingAccount?.email || cred?.email || `${newRole.toLowerCase().replace(/\s+/g, '')}@bengkelpro.id`,
      role: newRole,
      title: matchingAccount?.title || cred?.title || `${newRole} Specialist`,
      department: matchingAccount?.department || cred?.dept || 'Bengkel Operations',
      workOrderId: matchingAccount?.workOrderId || cred?.trackId || 'TRK-2026-8891',
      assignedStages: newRole === 'Mekanik' ? ['Bongkar', 'Ketok', 'Dempul', 'Cat', 'Poles'] : undefined
    };

    setUser(updatedUser);
    toast.success(`Beralih ke Role: ${newRole}`, {
      description: `Sekarang melihat dashboard & otorisasi ${newRole}.`
    });
  };

  const currentRole = user?.role || 'Super Admin';
  const roleConfig = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS['Super Admin'];
  const allowedTabs = roleConfig.allowedTabs;
  const defaultTab = roleConfig.defaultTab;

  const hasAccess = (tabId: string): boolean => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return allowedTabs.includes(tabId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        registeredUsers,
        addUser,
        updateUser,
        deleteUser,
        login,
        logout,
        switchRole,
        hasAccess,
        allowedTabs,
        defaultTab
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
