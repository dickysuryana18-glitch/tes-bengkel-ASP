import { useState, FormEvent } from 'react';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, 
  ArrowRight, ShieldAlert, ArrowUpRight,
  Sparkles, CheckCircle2, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Silakan masukkan email atau username.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  const handleCustomerPortalDirect = async () => {
    setIsLoading(true);
    await login('customer@bengkelpro.id', 'cust123', 'Customer');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-200 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-teal-500 to-amber-500 w-full" />

      {/* Main Login Workspace - Clean Centered Layout */}
      <div className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-10 md:py-16 flex flex-col justify-center">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
              B
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Bengkel Pro <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-normal">ERP v3.4</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">AutoCare Enterprise Body & General Repair Management</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2">
            Sistem ERP Terpadu untuk Manajemen Bengkel, Estimasi Kerusakan, SPK Kanban, Gudang Material & Finansial.
          </p>
        </div>

        {/* Clean Login Card */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/50 relative overflow-hidden backdrop-blur">
          
          {/* Top Subtle Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Masuk ke Sistem</h2>
              <p className="text-xs text-slate-400">Masukkan kredensial akun untuk mengakses modul</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email atau Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="contoh: nama@bengkelpro.id"
                  required
                  className="w-full bg-[#0B1120] border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Kata Sandi
                </label>
                <span className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
                  Lupa sandi?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan kata sandi"
                  required
                  className="w-full bg-[#0B1120] border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Bengkel Pro</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Client Live Tracking Link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Pelanggan ingin melihat status perbaikan kendaraan?
            </p>
            <button
              type="button"
              onClick={handleCustomerPortalDirect}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>Buka Portal Tracking Pelanggan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Security / System Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Zero Stock Leakage Security</span>
          </span>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#0F172A]/80 py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AutoCare ERP (Bengkel Pro). Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Privasi & Keamanan</span>
            <span>•</span>
            <span>Audit Trail Log Enforced</span>
            <span>•</span>
            <span>Multi-Branch SCM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
