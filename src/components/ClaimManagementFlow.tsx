import { useState } from 'react';
import { 
  ShieldCheck, FileText, Search, User, Car, CheckCircle2, 
  XCircle, FileImage, ClipboardSignature, Building, Clock, FileBadge
} from 'lucide-react';

interface Claim {
  id: string;
  claimNumber: string;
  insuranceName: string;
  customerName: string;
  plate: string;
  model: string;
  dateFiled: string;
  status: 'Waiting Survey' | 'Waiting Approval' | 'Approved' | 'Rejected' | 'In Progress';
  ownRiskFee: number;
  incidentDetail: string;
}

const MOCK_CLAIMS: Claim[] = [
  {
    id: 'c1',
    claimNumber: 'CLM-2310-001',
    insuranceName: 'Allianz',
    customerName: 'Budi Santoso',
    plate: 'B 1234 ABC',
    model: 'Honda CR-V',
    dateFiled: '12 Oct 2023',
    status: 'Waiting Approval',
    ownRiskFee: 300000,
    incidentDetail: 'Bemper depan penyok menabrak tiang saat parkir.'
  },
  {
    id: 'c2',
    claimNumber: 'CLM-2310-002',
    insuranceName: 'Garda Oto',
    customerName: 'Siti Aminah',
    plate: 'D 8899 XZ',
    model: 'Toyota Innova',
    dateFiled: '11 Oct 2023',
    status: 'Approved',
    ownRiskFee: 300000,
    incidentDetail: 'Terserempet motor di sisi kiri pintu penumpang.'
  },
  {
    id: 'c3',
    claimNumber: 'CLM-2310-003',
    insuranceName: 'Sinar Mas',
    customerName: 'Rian Pratama',
    plate: 'L 9982 ZX',
    model: 'Mitsubishi Pajero',
    dateFiled: '10 Oct 2023',
    status: 'Waiting Survey',
    ownRiskFee: 600000,
    incidentDetail: 'Kecelakaan beruntun, kerusakan kap mesin dan gril.'
  }
];

export function ClaimManagementFlow() {
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(MOCK_CLAIMS[0]);
  const [search, setSearch] = useState('');

  const filteredClaims = claims.filter(c => 
    c.claimNumber.toLowerCase().includes(search.toLowerCase()) || 
    c.plate.toLowerCase().includes(search.toLowerCase()) ||
    c.insuranceName.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (newStatus: Claim['status']) => {
    if (!selectedClaim) return;

    const updatedClaim = { ...selectedClaim, status: newStatus };
    setClaims(prev => prev.map(c => c.id === selectedClaim.id ? updatedClaim : c));
    setSelectedClaim(updatedClaim);
  };

  const getStatusBadge = (status: Claim['status']) => {
    switch (status) {
      case 'Waiting Survey':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-slate-500/20 text-slate-400 font-bold border border-slate-500/30 uppercase tracking-widest">Wait Survey</span>;
      case 'Waiting Approval':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30 uppercase tracking-widest">Wait Approval</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 uppercase tracking-widest">Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 uppercase tracking-widest">Rejected</span>;
      case 'In Progress':
        return <span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 uppercase tracking-widest">In Progress</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Claim Management
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">Asuransi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Kelola data klaim, survei, dan Own Risk (OR) asuransi</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
        
        {/* LEFT PANE: Claims List */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden shrink-0 max-h-56 md:max-h-none">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Daftar Klaim</h3>
            <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-indigo-500 transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari SPK, Nopol, Asuransi..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-300 placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {filteredClaims.map(claim => {
              const isSelected = selectedClaim?.id === claim.id;

              return (
                <div 
                  key={claim.id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                      : 'bg-[#0F172A] border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-mono font-bold text-indigo-400 tracking-tight uppercase">
                      {claim.claimNumber}
                    </span>
                    {getStatusBadge(claim.status)}
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-slate-200 font-bold uppercase">{claim.plate}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> {claim.insuranceName}
                    </p>
                  </div>
                </div>
              )
            })}
            
            {filteredClaims.length === 0 && (
              <div className="text-center p-6 text-slate-500 text-sm">
                Data klaim tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Claim Details */}
        <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
          {selectedClaim ? (
            <>
              {/* Header Info */}
              <div className="p-6 border-b border-slate-800 bg-[#0F172A]/80 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    selectedClaim.status === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-mono font-bold text-white uppercase">{selectedClaim.claimNumber}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                        <Building className="w-4 h-4" />
                        {selectedClaim.insuranceName}
                      </span>
                      <span className="text-sm font-medium text-slate-400 flex items-center gap-1 border-l border-slate-700 pl-3">
                        <Clock className="w-3.5 h-3.5" />
                        Diajukan: {selectedClaim.dateFiled}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                   {getStatusBadge(selectedClaim.status)}
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col lg:flex-row gap-6">
                
                {/* Left Col: Info & Detail */}
                <div className="flex-1 space-y-6">
                  {/* Customer Info Box */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[#0F172A] border border-slate-700/50 rounded-xl">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Tertanggung</p>
                      <p className="text-sm font-bold text-slate-200">{selectedClaim.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Car className="w-3 h-3" /> Kendaraan</p>
                      <p className="text-sm font-bold text-slate-200 uppercase font-mono">{selectedClaim.plate}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedClaim.model}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Kronologi & Detail Kerusakan
                    </h3>
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                      {selectedClaim.incidentDetail}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-slate-500" />
                      Dokumen Asuransi
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-slate-700 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors">
                        <FileBadge className="w-6 h-6 text-indigo-400 mb-2" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Polis Asuransi</span>
                        <span className="text-[9px] text-slate-500 mt-1">polis.pdf</span>
                      </div>
                      <div className="border border-slate-700 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors">
                        <Car className="w-6 h-6 text-teal-400 mb-2" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Foto STNK</span>
                        <span className="text-[9px] text-slate-500 mt-1">stnk.jpg</span>
                      </div>
                      <div className="border border-slate-700 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors bg-slate-800/20">
                         <FileImage className="w-6 h-6 text-slate-500 mb-2" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Baru</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Col: Action & OR */}
                <div className="w-full lg:w-80 shrink-0 space-y-6">
                  
                  {/* OR Box */}
                  <div className="bg-[#0F172A] border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/30">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <ClipboardSignature className="w-3.5 h-3.5" /> Biaya Own Risk (OR)
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-slate-400">Total OR</span>
                        <span className="text-lg font-bold text-indigo-400 font-mono">Rp {selectedClaim.ownRiskFee.toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Ditagihkan ke Pelanggan (Tertanggung).</p>
                    </div>
                  </div>

                  {/* Actions Box */}
                  <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Aksi Asuransi</h3>
                    
                    {selectedClaim.status === 'Waiting Survey' && (
                      <button 
                        onClick={() => handleStatusChange('Waiting Approval')}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        Tandai Selesai Survei
                      </button>
                    )}

                    {selectedClaim.status === 'Waiting Approval' && (
                      <div className="space-y-3">
                         <button 
                          onClick={() => handleStatusChange('Approved')}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Setujui Klaim (SPK Turun)
                        </button>
                        <button 
                          onClick={() => handleStatusChange('Rejected')}
                          className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Tolak Klaim
                        </button>
                      </div>
                    )}

                    {selectedClaim.status === 'Approved' && (
                      <button 
                        onClick={() => handleStatusChange('In Progress')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        Generate Work Order (WO)
                      </button>
                    )}

                    {(selectedClaim.status === 'In Progress' || selectedClaim.status === 'Rejected') && (
                      <div className="text-center p-3 rounded-lg border border-slate-700 bg-slate-800/30">
                        <p className="text-xs font-medium text-slate-400">Tidak ada aksi lanjutan yang tersedia untuk status ini.</p>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
              <ShieldCheck className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-sm font-medium">Pilih klaim asuransi untuk melihat detail dan mengelola status.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
