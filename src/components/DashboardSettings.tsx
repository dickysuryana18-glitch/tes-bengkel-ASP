import { useState } from 'react';
import { 
  User, Lock, Bell, Building2, Save, 
  Camera, Mail, Phone, ShieldCheck, 
  Key, Globe, CreditCard
} from 'lucide-react';

type SettingTab = 'profile' | 'security' | 'notifications' | 'workshop';

export function DashboardSettings() {
  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Pengaturan Sistem & Profil
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola preferensi akun, keamanan, dan konfigurasi bengkel</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
        
        {/* LEFT PANE: Settings Navigation */}
        <div className="w-full md:w-64 lg:w-72 flex flex-col bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                DS
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dicky Suryana</p>
                <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-3 space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <User className="w-4 h-4" />
              Profil Akun
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'security' 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Lock className="w-4 h-4" />
              Keamanan & Password
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifikasi
            </button>
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Konfigurasi ERP</p>
              <button 
                onClick={() => setActiveTab('workshop')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'workshop' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Data Bengkel
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Settings Content */}
        <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-y-auto custom-scrollbar flex flex-col">
          
          {activeTab === 'profile' && (
            <div className="p-8 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                Informasi Profil
              </h3>
              
              <div className="flex items-start gap-8 mb-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-[#0F172A] border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer group relative overflow-hidden">
                    <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  </div>
                  <button className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-white transition-colors">
                    Ubah Foto
                  </button>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama Lengkap</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" defaultValue="Dicky Suryana" className="w-full bg-[#0F172A] border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alamat Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="email" defaultValue="dicky@bengkelpro.id" className="w-full bg-[#0F172A] border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nomor Telepon</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="tel" defaultValue="+62 812-3456-7890" className="w-full bg-[#0F172A] border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role Akses (Read-Only)</label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" defaultValue="Super Admin" disabled className="w-full bg-[#0F172A]/50 border border-slate-800 text-sm text-slate-500 rounded-lg pl-10 pr-4 py-2.5 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-8 animate-in fade-in duration-300 max-w-3xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                Keamanan Akun
              </h3>
              
              <div className="space-y-6">
                <div className="bg-[#0F172A] border border-slate-700 p-5 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-3 mb-4">Ubah Password</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password Saat Ini</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password Baru</label>
                      <input type="password" placeholder="Minimal 8 karakter" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Konfirmasi Password Baru</label>
                      <input type="password" placeholder="Ketik ulang password baru" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition-colors border border-slate-700">
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="bg-[#0F172A] border border-slate-700 p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      Two-Factor Authentication (2FA)
                    </h4>
                    <p className="text-xs text-slate-400">Tambahkan lapisan keamanan ekstra menggunakan Google Authenticator.</p>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500/10 text-emerald-400 font-bold text-sm rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                    Aktifkan 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-8 animate-in fade-in duration-300 max-w-3xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                Preferensi Notifikasi
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0F172A] border border-slate-700 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Notifikasi SPK & Estimasi</p>
                    <p className="text-xs text-slate-500 mt-0.5">Kirim email saat ada SPK baru atau persetujuan asuransi.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#0F172A] border border-slate-700 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Alert Stok Menipis</p>
                    <p className="text-xs text-slate-500 mt-0.5">Peringatan saat stok sparepart utama (cat, oli) mencapai batas minimum.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#0F172A] border border-slate-700 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Laporan Shift Mingguan</p>
                    <p className="text-xs text-slate-500 mt-0.5">Terima rekap PDF otomatis setiap hari Senin pagi via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workshop' && (
            <div className="p-8 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Data Profil Bengkel
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-[#0F172A] border border-slate-700 p-5 rounded-xl space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">Identitas Perusahaan</h4>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Bengkel (Resmi)</label>
                      <input type="text" defaultValue="PT AutoCare Jaya Abadi" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NPWP Perusahaan</label>
                      <input type="text" defaultValue="01.234.567.8-901.000" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Lengkap</label>
                      <textarea rows={3} defaultValue="Jl. Jend. Sudirman No. 123, Senayan, Kebayoran Baru, Jakarta Selatan, 12190" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"></textarea>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#0F172A] border border-slate-700 p-5 rounded-xl space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Pajak & Keuangan</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PPN Standar (%)</label>
                        <input type="number" defaultValue="11" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none font-mono" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Default Own Risk (Rp)</label>
                        <input type="text" defaultValue="300.000" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0F172A] border border-slate-700 p-5 rounded-xl space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> API & Integrasi</h4>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Gateway API Key</label>
                      <input type="password" defaultValue="wa_live_892374982347293847" className="w-full bg-[#1E293B] border border-slate-700 text-sm text-slate-500 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:outline-none font-mono" />
                      <p className="text-[10px] text-slate-500">Digunakan untuk mengirim link Customer Tracking via WA otomatis.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
