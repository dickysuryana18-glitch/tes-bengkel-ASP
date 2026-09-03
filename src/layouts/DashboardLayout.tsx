import { ReactNode, useState, useEffect } from "react";
import { 
  Search, Bell, Sun, Moon, 
  Menu, ChevronLeft, Shield,
  ShieldAlert, LogOut,
  ChevronDown, X, CheckCircle2, Smartphone, Users,
  LayoutDashboard, FileSpreadsheet, Activity, Kanban,
  LayoutGrid, Boxes, ShoppingCart, ShieldCheck,
  Receipt, Wallet, Clock, Settings, LucideIcon,
  CalendarDays
} from "lucide-react";
import { GlobalCommandSearch } from "../components/GlobalCommandSearch";
import { ServiceAdvisorLagAlertModal } from "../components/ServiceAdvisorLagAlertModal";
import { INITIAL_REPAIR_LAG_ALERTS, RepairLagAlert } from "../data/historicalRepairBenchmarks";
import { useAuth } from "../context/AuthContext";
import { ROLE_PERMISSIONS } from "../types/auth";

interface NavItemConfig {
  id: string;
  label: string;
  shortLabel: string;
  section: 'Operasional' | 'Inventory & SCM' | 'Finansial & Mitra' | 'SDM & Mekanik' | 'Sistem & Audit';
  icon: LucideIcon;
  badge?: string;
  activeColor?: string;
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  // Operasional
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'DB', section: 'Operasional', icon: LayoutDashboard },
  { id: 'booking', label: 'Daftar Booking', shortLabel: 'BKG', section: 'Operasional', icon: CalendarDays, badge: 'Live' },
  { id: 'estimasi', label: 'Estimasi & SPK', shortLabel: 'SPK', section: 'Operasional', icon: FileSpreadsheet },
  { id: 'monitoring', label: 'Monitoring Unit', shortLabel: 'MON', section: 'Operasional', icon: Activity },
  { id: 'workshop', label: 'Workshop Board', shortLabel: 'WS', section: 'Operasional', icon: Kanban },
  { id: 'floor_layout', label: 'Floor Layout Editor', shortLabel: 'LAY', section: 'Operasional', icon: LayoutGrid },
  { id: 'qc', label: 'Quality Control (QC)', shortLabel: 'QC', section: 'Operasional', icon: CheckCircle2, activeColor: 'teal' },

  // Inventory & SCM
  { id: 'inventory', label: 'Gudang, Material & Lab Cat', shortLabel: 'GDG', section: 'Inventory & SCM', icon: Boxes, badge: 'Lab Cat' },
  { id: 'purchasing', label: 'Purchasing (PO)', shortLabel: 'PO', section: 'Inventory & SCM', icon: ShoppingCart },

  // Finansial & Mitra
  { id: 'claims', label: 'Klaim Asuransi', shortLabel: 'CLM', section: 'Finansial & Mitra', icon: ShieldCheck },
  { id: 'invoice', label: 'Invoice & Pembayaran', shortLabel: 'INV', section: 'Finansial & Mitra', icon: Receipt },

  // SDM & Mekanik
  { id: 'payroll', label: 'Kinerja & Payroll', shortLabel: 'HR', section: 'SDM & Mekanik', icon: Wallet },
  { id: 'mobile-tech', label: 'Mobile Tech App', shortLabel: 'MOB', section: 'SDM & Mekanik', icon: Smartphone, badge: 'PWA' },

  // Sistem & Audit
  { id: 'rbac', label: 'Role & Hak Akses', shortLabel: 'RBAC', section: 'Sistem & Audit', icon: Shield },
  { id: 'audit', label: 'Audit Trail Log', shortLabel: 'LOG', section: 'Sistem & Audit', icon: Clock },
  { id: 'settings', label: 'Pengaturan Bengkel', shortLabel: 'SET', section: 'Sistem & Audit', icon: Settings },
];

const SECTIONS: Array<'Operasional' | 'Inventory & SCM' | 'Finansial & Mitra' | 'SDM & Mekanik' | 'Sistem & Audit'> = [
  'Operasional',
  'Inventory & SCM',
  'Finansial & Mitra',
  'SDM & Mekanik',
  'Sistem & Audit'
];

export function DashboardLayout({ children, activeTab = 'dashboard', onTabChange }: { children: ReactNode, activeTab?: string, onTabChange?: (tab: string) => void }) {
  const { user, logout, hasAccess } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLagAlertOpen, setIsLagAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unresolvedLagCount, setUnresolvedLagCount] = useState(2);

  // Load unresolved lag count
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_sa_repair_lag_alerts');
      const alerts: RepairLagAlert[] = saved ? JSON.parse(saved) : INITIAL_REPAIR_LAG_ALERTS;
      const count = alerts.filter(a => a.severity === 'CRITICAL_LAG' && a.saActionStatus !== 'RESOLVED').length;
      setUnresolvedLagCount(count);
    } catch (e) {
      setUnresolvedLagCount(2);
    }
  }, [isLagAlertOpen]);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('erp-theme') as 'dark' | 'light';
    if (saved) setTheme(saved);
  }, []);

  // Global keyboard shortcut for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('erp-theme', newTheme);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const currentRole = user?.role || 'Super Admin';
  const roleBadgeStyle = ROLE_PERMISSIONS[currentRole]?.badgeColor || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'BP';

  return (
    <div className={`h-screen w-full font-sans flex overflow-hidden ${theme === 'light' ? 'light-mode' : ''} bg-[#0B1120] text-slate-200`}>
      {/* Light Mode Global CSS Overrides */}
      {theme === 'light' && (
        <style>{`
          .light-mode {
            background-color: #F8FAFC !important;
            color: #0F172A !important;
          }
          .light-mode [class*="bg-[#0B1120]"] { background-color: #F8FAFC !important; }
          .light-mode [class*="bg-[#0F172A]"] { background-color: #FFFFFF !important; }
          .light-mode [class*="bg-[#1E293B]"] { background-color: #F1F5F9 !important; }
          
          /* Backgrounds with opacity */
          .light-mode [class*="bg-[#0F172A]/50"] { background-color: rgba(255, 255, 255, 0.5) !important; }
          .light-mode [class*="bg-[#0F172A]/80"] { background-color: rgba(255, 255, 255, 0.8) !important; }
          .light-mode [class*="bg-[#0F172A]/95"] { background-color: rgba(255, 255, 255, 0.95) !important; }
          .light-mode [class*="bg-[#0F172A]/20"] { background-color: rgba(255, 255, 255, 0.2) !important; }
          .light-mode [class*="bg-slate-800/50"] { background-color: rgba(226, 232, 240, 0.5) !important; }
          .light-mode [class*="bg-slate-800/80"] { background-color: rgba(226, 232, 240, 0.8) !important; }
          .light-mode [class*="bg-slate-800/40"] { background-color: rgba(226, 232, 240, 0.4) !important; }
          .light-mode [class*="bg-slate-800/20"] { background-color: rgba(226, 232, 240, 0.2) !important; }

          /* Specific Slate Backgrounds */
          .light-mode [class~="bg-slate-800"] { background-color: #E2E8F0 !important; }
          .light-mode [class~="bg-slate-700"] { background-color: #CBD5E1 !important; }
          .light-mode [class~="hover:bg-slate-800"]:hover { background-color: #CBD5E1 !important; }
          .light-mode [class~="hover:bg-slate-700"]:hover { background-color: #94A3B8 !important; }

          /* Text Colors */
          .light-mode [class~="text-white"] { color: #0F172A !important; }
          .light-mode [class~="text-slate-200"] { color: #1E293B !important; }
          .light-mode [class~="text-slate-300"] { color: #334155 !important; }
          .light-mode [class~="text-slate-400"] { color: #475569 !important; }
          .light-mode [class~="text-slate-500"] { color: #64748B !important; }
          .light-mode [class~="text-slate-600"] { color: #94A3B8 !important; }
          .light-mode [class~="hover:text-white"]:hover { color: #0F172A !important; }

          /* Protect specific text */
          .light-mode [class*="bg-indigo-600"] [class~="text-white"],
          .light-mode [class*="bg-indigo-600"][class~="text-white"],
          .light-mode [class*="bg-teal-600"] [class~="text-white"],
          .light-mode [class*="bg-teal-600"][class~="text-white"],
          .light-mode [class*="bg-slate-800"] [class~="text-white"] {
            color: #FFFFFF !important;
          }

          /* Border Colors */
          .light-mode [class~="border-slate-800"] { border-color: #E2E8F0 !important; }
          .light-mode [class~="border-slate-700"] { border-color: #CBD5E1 !important; }
          .light-mode [class~="border-slate-600"] { border-color: #94A3B8 !important; }

          .light-mode [class~="divide-slate-800"] > :not([hidden]) ~ :not([hidden]) { border-color: #E2E8F0 !important; }
          .light-mode [class*="divide-slate-800/50"] > :not([hidden]) ~ :not([hidden]) { border-color: rgba(226, 232, 240, 0.5) !important; }

          /* Brand Colors Contrast tweaks */
          .light-mode [class*="text-indigo-400"] { color: #4338CA !important; }
          .light-mode [class*="text-teal-400"] { color: #0F766E !important; }
          .light-mode [class*="text-amber-400"] { color: #B45309 !important; }
          .light-mode [class*="text-rose-400"] { color: #BE123C !important; }
          .light-mode [class*="text-emerald-400"] { color: #047857 !important; }
          .light-mode [class*="text-purple-400"] { color: #7E22CE !important; }
          .light-mode [class*="text-blue-400"] { color: #1D4ED8 !important; }
          
          /* Custom overrides for specific elements */
          .light-mode input, .light-mode select, .light-mode textarea {
            color: #0F172A !important;
            background-color: #FFFFFF !important;
          }
          .light-mode input::placeholder, .light-mode textarea::placeholder {
            color: #64748B !important;
          }
          .light-mode .custom-scrollbar::-webkit-scrollbar-track { background: #F1F5F9 !important; }
          .light-mode .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1 !important; }
          .light-mode .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8 !important; }
        `}</style>
      )}

      {/* Mobile Drawer Backdrop with Smooth Opacity Transition */}
      <div 
        className={`fixed inset-0 z-40 bg-black/75 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar: Pure GPU-accelerated Transform on Mobile, Smooth Width Transition on Desktop */}
      <aside className={`
        bg-[#0F172A] flex flex-col z-50 select-none
        max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-72 max-lg:max-w-[85vw] max-lg:shadow-2xl max-lg:border-r max-lg:border-slate-800 max-lg:transition-transform max-lg:duration-300 max-lg:ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isSidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full max-lg:pointer-events-none'}
        lg:relative lg:inset-auto lg:h-full lg:shadow-none lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isSidebarOpen 
          ? 'lg:w-64 lg:border-r lg:border-slate-800' 
          : 'lg:w-0 lg:border-r-0 lg:overflow-hidden lg:pointer-events-none'}
      `}>
        
        {/* Fixed Width Inner Container to Guarantee Zero Content Reflow / Layout Jitter during Transition */}
        <div className="w-72 lg:w-64 h-full flex flex-col shrink-0 overflow-hidden">
          
          {/* Brand Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 shrink-0">
                B
              </div>
              <div className="truncate">
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">Bengkel Pro</h1>
                <p className="text-[10px] text-slate-500">AutoCare Enterprise ERP</p>
              </div>
            </div>

            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
              title="Tutup Menu Sidebar"
            >
              <X className="w-4 h-4 lg:hidden" />
              <ChevronLeft className="w-4 h-4 hidden lg:block" />
            </button>
          </div>
          
          {/* Navigation Menu Filtered by Active Role - No Visible Scrollbar */}
          <nav className="flex-1 px-3 space-y-5 overflow-y-auto pt-4 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((sectionName) => {
              const items = ALL_NAV_ITEMS.filter(item => item.section === sectionName && hasAccess(item.id));
              if (items.length === 0) return null;

              return (
                <div key={sectionName}>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-2">
                    {sectionName}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const isActive = activeTab === item.id;
                      const isTeal = item.activeColor === 'teal';
                      const Icon = item.icon;

                      return (
                        <li
                          key={item.id}
                          onClick={() => {
                            if (onTabChange) onTabChange(item.id);
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          className={`px-3 py-2 text-xs sm:text-sm font-medium cursor-pointer rounded-lg transition-all flex items-center justify-between group ${
                            isActive
                              ? isTeal 
                                ? 'bg-teal-600/15 border-l-2 border-teal-500 text-teal-400 font-bold shadow-sm shadow-teal-500/10'
                                : 'bg-indigo-600/15 border-l-2 border-indigo-500 text-indigo-400 font-bold shadow-sm shadow-indigo-500/10'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'
                          }`}
                          title={item.label}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive 
                                ? isTeal ? 'text-teal-400' : 'text-indigo-400'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
          
          {/* User Card & Logout in Sidebar Footer */}
          <div className="p-3 border-t border-slate-800 bg-[#0B1120]/40 shrink-0">
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="overflow-hidden truncate">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase tracking-wider ${roleBadgeStyle}`}>
                    {currentRole}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Keluar / Logout Sesi"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-[#0F172A]/80 backdrop-blur shrink-0 z-10">
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button to Toggle Sidebar */}
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-700/60 cursor-pointer shrink-0"
              title={isSidebarOpen ? "Sembunyikan Sidebar" : "Buka Sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Quick Search with Ctrl+K Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative w-36 sm:w-60 md:w-80 bg-[#0B1120] hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg pl-8 sm:pl-9 pr-2.5 py-1.5 text-xs text-left text-slate-400 hover:text-slate-300 transition-all flex items-center justify-between group shadow-inner"
              title="Pencarian Global Cepat (Ctrl + K)"
            >
              <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span className="truncate pr-2">Cari SPK, no. polisi...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 bg-slate-800/80 border border-slate-700/80 rounded group-hover:border-indigo-500/50 group-hover:bg-indigo-950/40 transition-colors shrink-0">
                <span className="text-[9px]">Ctrl</span> K
              </kbd>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Service Advisor Lag Alert Button */}
            {hasAccess('monitoring') && (
              <button 
                onClick={() => setIsLagAlertOpen(true)}
                className="p-2 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg text-rose-300 hover:text-white transition-colors border border-rose-800/60 relative group"
                title="Alert Keterlambatan SPK (SLA Delay Warning)"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                {unresolvedLagCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 border-2 border-[#0F172A] animate-ping"></span>
                )}
                {unresolvedLagCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 border-2 border-[#0F172A]"></span>
                )}
              </button>
            )}

            <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-800/70 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700/60"
              title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <div className="h-6 w-px bg-slate-800"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-1 py-1 pr-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-[10px] text-indigo-400 font-medium truncate max-w-[120px]">{currentRole}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Menu Popup */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-white">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleBadgeStyle}`}>
                        {currentRole}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    {hasAccess('settings') && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onTabChange) onTabChange('settings');
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pengaturan Akun</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0B1120] custom-scrollbar">
          {children}
        </div>

        {/* Global Keyboard Shortcut (Ctrl+K) Command Search Palette */}
        <GlobalCommandSearch 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
          onNavigateTab={(tab) => onTabChange && onTabChange(tab)} 
        />

        {/* Service Advisor Repair Delay & SLA Anomaly Alert Modal */}
        <ServiceAdvisorLagAlertModal
          isOpen={isLagAlertOpen}
          onClose={() => setIsLagAlertOpen(false)}
          onNavigateToSpk={(spk) => {
            setIsLagAlertOpen(false);
            if (onTabChange) onTabChange('monitoring');
          }}
        />

      </main>
    </div>
  );
}

