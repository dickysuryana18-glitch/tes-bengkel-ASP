import { useState } from 'react';
import { 
  Activity, Search, Filter, History, Database,
  User, ShieldAlert, ArrowRight, Calendar, Clock
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'LOGIN';
  module: string;
  targetId: string;
  details: string;
  ipAddress: string;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '26 Oct 2023, 10:45:12',
    user: 'Andi Owner',
    role: 'Owner',
    action: 'APPROVE',
    module: 'Purchasing',
    targetId: 'PO-2310-088',
    details: 'Approved Purchase Order for PT Honda Prospect Parts',
    ipAddress: '192.168.1.105'
  },
  {
    id: 'log-002',
    timestamp: '26 Oct 2023, 10:42:05',
    user: 'Budi Foreman',
    role: 'Foreman',
    action: 'UPDATE',
    module: 'Workshop',
    targetId: 'SPK-2310-045',
    details: 'Moved vehicle B 1234 ABC from "Repair" to "Painting"',
    ipAddress: '192.168.1.112'
  },
  {
    id: 'log-003',
    timestamp: '26 Oct 2023, 10:30:00',
    user: 'Rina Finance',
    role: 'Finance',
    action: 'CREATE',
    module: 'Invoice',
    targetId: 'INV-2310-048',
    details: 'Generated invoice for WO-2310-048 (CV Makmur Bersama)',
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log-004',
    timestamp: '26 Oct 2023, 10:15:22',
    user: 'Ahmad Gudang',
    role: 'Gudang',
    action: 'UPDATE',
    module: 'Inventory',
    targetId: 'ITEM-OIL-TMO',
    details: 'Deducted 4 units of TMO 10W-40. Triggered by WO-2310-048',
    ipAddress: '192.168.1.115'
  },
  {
    id: 'log-005',
    timestamp: '26 Oct 2023, 09:45:10',
    user: 'Dicky Suryana',
    role: 'Super Admin',
    action: 'DELETE',
    module: 'RBAC',
    targetId: 'USER-099',
    details: 'Removed system access for user "Joko Ex-Mekanik"',
    ipAddress: '10.0.0.5'
  },
  {
    id: 'log-006',
    timestamp: '26 Oct 2023, 08:05:00',
    user: 'Siti Advisor',
    role: 'Service Advisor',
    action: 'CREATE',
    module: 'Estimasi',
    targetId: 'EST-2310-090',
    details: 'Created new estimation for walk-in customer (L 1111 ZZ)',
    ipAddress: '192.168.1.102'
  },
  {
    id: 'log-007',
    timestamp: '26 Oct 2023, 07:55:10',
    user: 'Siti Advisor',
    role: 'Service Advisor',
    action: 'LOGIN',
    module: 'Auth',
    targetId: 'AUTH-SESSION',
    details: 'User authenticated successfully',
    ipAddress: '192.168.1.102'
  }
];

export function AuditTrailModule() {
  const [logs] = useState<AuditLog[]>(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(search.toLowerCase()) || 
      log.targetId.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-widest">Create</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 uppercase tracking-widest">Update</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 uppercase tracking-widest">Delete</span>;
      case 'APPROVE':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 uppercase tracking-widest">Approve</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400 font-bold border border-slate-500/20 uppercase tracking-widest">Login</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Audit Trail (System Logs)
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">Compliance</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Lacak dan pantau semua aktivitas sistem, mutasi data, dan otorisasi pengguna</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-700 transition-all flex items-center gap-2">
            <Database className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-indigo-500 transition-colors w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari user, ID target, atau detail aksi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-300 placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-[#0F172A] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="CREATE">CREATE (Buat)</option>
              <option value="UPDATE">UPDATE (Ubah)</option>
              <option value="DELETE">DELETE (Hapus)</option>
              <option value="APPROVE">APPROVE (Acc)</option>
              <option value="LOGIN">LOGIN (Otentikasi)</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#1E293B] shadow-sm z-10">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-48">Timestamp</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-48">Pengguna</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Aksi</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Modul</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail & Target</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {log.timestamp.split(',')[0]}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {log.timestamp.split(',')[1]}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-slate-200">{log.user}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{log.role}</p>
                  </td>
                  <td className="px-4 py-3">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-300">
                    {log.module}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target ID:</span>
                       <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{log.targetId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium text-sm">Tidak ada log aktivitas yang sesuai dengan filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
}
