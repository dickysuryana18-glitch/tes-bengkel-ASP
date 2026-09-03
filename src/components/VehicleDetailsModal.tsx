import { X, User, Calendar, PenTool, Clock, ExternalLink, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VehicleHistory {
  stage: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
}

interface VehicleCardExtended {
  id: string;
  plate: string;
  customer: string;
  model: string;
  time: string;
  priority: 'low' | 'normal' | 'high';
  progress?: number;
  info?: string;
  mechanic?: string;
  notes?: string;
  history?: VehicleHistory[];
  statusName?: string;
}

interface VehicleDetailsModalProps {
  card: VehicleCardExtended | null;
  onClose: () => void;
}

export function VehicleDetailsModal({ card, onClose }: VehicleDetailsModalProps) {
  if (!card) return null;

  const handleExportPDF = () => {
    if (!card) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('AutoCare ERP', 14, 22);
    
    doc.setFontSize(14);
    doc.text('Vehicle Maintenance Log', 14, 30);
    
    // Vehicle Info
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Plate Number: ${card.plate}`, 14, 42);
    doc.text(`Customer: ${card.customer}`, 14, 48);
    doc.text(`Vehicle Model: ${card.model}`, 14, 54);
    doc.text(`Assigned Mechanic: ${card.mechanic || 'Belum di-assign'}`, 14, 60);
    
    // Notes
    doc.text('Current Stage Notes:', 14, 70);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(card.notes || 'Tidak ada catatan khusus untuk tahapan ini.', 14, 76, { maxWidth: 180 });
    
    // History Table
    const tableData = (card.history || []).map(step => [
      step.date,
      step.stage,
      step.status.toUpperCase()
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['Date', 'Stage / Process', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 10 },
    });
    
    doc.save(`AutoCare_${card.plate.replace(/\s/g, '')}_Log.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-sm">
      <div className="bg-[#0F172A] border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#1E293B]/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold font-mono text-indigo-400">{card.plate}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700">
                {card.statusName || 'Active Detail'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{card.customer} &bull; {card.model}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Details & Notes */}
            <div className="space-y-6">
              
              {/* Mechanic */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Assigned Mechanic</h3>
                <div className="flex items-center gap-3 p-3 bg-[#1E293B] border border-slate-800 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{card.mechanic || 'Belum di-assign'}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Teknisi Utama</p>
                  </div>
                </div>
              </div>

              {/* Current Stage Notes */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Current Stage Notes</h3>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="flex gap-2 items-start">
                    <PenTool className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-100/90 leading-relaxed">
                      {card.notes || 'Tidak ada catatan khusus untuk tahapan ini.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Widget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#1E293B] border border-slate-800 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Time In Stage</p>
                  <p className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {card.time}
                  </p>
                </div>
                <div className="p-3 bg-[#1E293B] border border-slate-800 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Priority</p>
                  <p className={`text-sm font-bold uppercase ${card.priority === 'high' ? 'text-red-400' : 'text-slate-200'}`}>
                    {card.priority}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: History Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Vehicle History
              </h3>
              
              <div className="relative pl-3 border-l border-slate-800 ml-2 space-y-6">
                {(card.history || []).map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[17.5px] w-3 h-3 rounded-full border-2 border-[#0F172A] ${
                      step.status === 'completed' ? 'bg-teal-500' :
                      step.status === 'current' ? 'bg-amber-500 ring-2 ring-amber-500/30' :
                      'bg-slate-700'
                    }`}></div>
                    
                    {/* Content */}
                    <div className="pl-4">
                      <p className={`text-sm font-bold ${
                        step.status === 'completed' ? 'text-slate-300' :
                        step.status === 'current' ? 'text-amber-400' :
                        'text-slate-600'
                      }`}>
                        {step.stage}
                      </p>
                      <p className={`text-[10px] font-mono mt-0.5 ${
                        step.status === 'completed' ? 'text-slate-500' :
                        step.status === 'current' ? 'text-amber-500/70' :
                        'text-slate-700'
                      }`}>
                        {step.date}
                      </p>
                    </div>
                  </div>
                ))}

                {(!card.history || card.history.length === 0) && (
                  <p className="text-sm text-slate-500 pl-3">History tracking tidak tersedia untuk unit ini.</p>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#1E293B]/50 flex justify-between items-center gap-3">
          <div className="flex gap-3">
            <button 
              onClick={() => window.open(`/?track=${card.id}`, '_blank')}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Customer Tracking Link
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer">
              Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
