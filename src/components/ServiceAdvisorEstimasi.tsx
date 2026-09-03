import React, { useState, useEffect } from 'react';
import { 
  Car, User, FileText, Plus, Trash2, CheckCircle2, 
  AlertCircle, Save, Send, Camera, Info, Search,
  QrCode, ExternalLink, Printer, ShieldCheck, MapPin, Sparkles, Check,
  Share2, Eye, Copy, Globe, ShieldAlert, ArrowDownToLine, RefreshCw,
  Clock, Filter, ChevronRight, X, Layers, Building2, Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientEstimatePreview, EstimatePreviewData } from './ClientEstimatePreview';
import { ServiceAdvisorLagAlertsWidget } from './ServiceAdvisorLagAlertsWidget';
import { 
  WorkOrderItem, 
  SPKLineItem, 
  SPKDamagePoint,
  getStoredWorkOrders, 
  saveWorkOrdersToStorage,
  createOrUpdateWorkOrder,
  deleteWorkOrder,
  resetWorkOrdersToDefault,
  ApprovalTier
} from '../data/spkDatabase';
import { getStoredBookings, BookingItem } from '../data/mockBookings';

interface ServiceAdvisorEstimasiProps {
  onNavigateToWorkshop?: () => void;
  onNavigateToMonitoring?: () => void;
}

export function ServiceAdvisorEstimasi({ onNavigateToWorkshop, onNavigateToMonitoring }: ServiceAdvisorEstimasiProps) {
  // Database WorkOrders state
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(() => getStoredWorkOrders());
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [selectedSpkId, setSelectedSpkId] = useState<string | null>(null);

  // Form State
  const [editingSpkNumber, setEditingSpkNumber] = useState<string | null>(null);
  const [linkedBookingId, setLinkedBookingId] = useState<string | undefined>(undefined);

  const [customer, setCustomer] = useState({ 
    name: 'Bambang Pratama', 
    phone: '081289128912', 
    email: 'bambang.pratama@gmail.com',
    type: 'Insurance' as 'Personal' | 'Corporate' | 'Insurance',
    address: 'Jl. Tebet Barat Dalam No. 18, Jakarta Selatan'
  });

  const [vehicle, setVehicle] = useState({ 
    plate: 'B 1420 KLA', 
    brand: 'Honda', 
    model: 'HR-V SE 1.5', 
    color: 'Modern Steel Metallic',
    year: 2022,
    odometerKm: 32000,
    fuelLevel: '1/2'
  });

  const [serviceCategory, setServiceCategory] = useState<'BODY_REPAIR' | 'GENERAL_REPAIR' | 'PERIODIC_MAINTENANCE' | 'INSURANCE_CLAIM' | 'DETAILING' | 'AC_ELECTRICAL'>('BODY_REPAIR');
  const [insuranceCompany, setInsuranceCompany] = useState('Garda Oto (Asuransi Astra)');
  const [insurancePolicy, setInsurancePolicy] = useState('POL-8891289');

  const [damagePoints, setDamagePoints] = useState<SPKDamagePoint[]>([
    { id: 'dp-1', panel: 'Pintu Depan Kanan', severity: 'Penyok Sedang', suggestedAction: 'Ketok & Cat Panel', x: 62, y: 48 },
    { id: 'dp-2', panel: 'Fender Kanan Depan', severity: 'Baret Ringan', suggestedAction: 'Poles & Touch Up Cat', x: 78, y: 42 }
  ]);

  const [lineItems, setLineItems] = useState<SPKLineItem[]>([
    { id: '1', type: 'jasa', description: 'Ketok Magic Pintu Kanan Depan', qty: 1, unitPrice: 350000 },
    { id: '2', type: 'part', description: 'Klip & Karet Pintu Original', qty: 4, unitPrice: 25000, partCode: 'HN-7221-K' },
    { id: '3', type: 'jasa', description: 'Pengecatan Panel Pintu Kanan (Oven Cat)', qty: 1, unitPrice: 750000 },
  ]);

  const [bayLocation, setBayLocation] = useState('Bay Pembongkaran 1');
  const [leadMechanic, setLeadMechanic] = useState('Bambang Sudarso');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('2026-09-04');
  const [notes, setNotes] = useState('Estimasi pengerjaan 2-4 hari kerja setelah persetujuan. Garansi cat oven 6 bulan.');

  const [activeSeverity, setActiveSeverity] = useState<'Baret Ringan' | 'Penyok Sedang' | 'Rusak Parah / Ganti'>('Penyok Sedang');
  const [isSpkGenerated, setIsSpkGenerated] = useState(false);
  const [activeGeneratedSpk, setActiveGeneratedSpk] = useState<WorkOrderItem | null>(null);
  
  // Client Preview Modal & Share Link State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [generatedEstimateLink, setGeneratedEstimateLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBookingImportModal, setShowBookingImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [spkToDelete, setSpkToDelete] = useState<WorkOrderItem | null>(null);
  const [estimateStatus, setEstimateStatus] = useState<'PENDING_CUSTOMER' | 'ACCEPTED' | 'DECLINED'>('PENDING_CUSTOMER');

  // List Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Sync with cross-tab / cross-module storage updates
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<WorkOrderItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setWorkOrders(customEvent.detail);
      } else {
        setWorkOrders(getStoredWorkOrders());
      }
    };

    window.addEventListener('autocare_workorders_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('autocare_workorders_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const addLineItem = (type: 'jasa' | 'part') => {
    const newItem: SPKLineItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      description: type === 'jasa' ? 'Perbaikan Panel Baru' : 'Fast Moving Part',
      qty: 1,
      unitPrice: type === 'jasa' ? 350000 : 150000
    };
    setLineItems([...lineItems, newItem]);
    toast.success(`Item ${type.toUpperCase()} ditambahkan ke rincian.`);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof SPKLineItem, value: any) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const panels = ['Bumper Depan', 'Kap Mesin', 'Fender Depan', 'Pintu Depan', 'Pintu Belakang', 'Bumper Belakang', 'Atap / Roof'];
    const randomPanel = panels[Math.floor(Math.random() * panels.length)];

    const newPoint: SPKDamagePoint = {
      id: `dp-${Date.now()}`,
      panel: randomPanel,
      severity: activeSeverity,
      suggestedAction: activeSeverity === 'Baret Ringan' ? 'Poles & Compound' : activeSeverity === 'Penyok Sedang' ? 'Ketok & Cat Oven' : 'Penggantian Panel Baru',
      x,
      y
    };

    setDamagePoints([...damagePoints, newPoint]);
    toast.info(`Titik Kerusakan Ditandai: ${randomPanel}`, {
      description: `Tingkat: ${activeSeverity} (${x}%, ${y}%)`
    });
  };

  const subtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const ppn = Math.round(subtotal * 0.11);
  const grandTotal = subtotal + ppn;

  // Tiered Approval calculation based on ERP guidelines
  const getApprovalTier = (amount: number): ApprovalTier => {
    if (amount <= 1000000) return 'Auto-Approved';
    if (amount <= 5000000) return 'Foreman Review';
    return 'Workshop Manager Review';
  };

  const currentTier = getApprovalTier(grandTotal);

  // Build WorkOrder object from current form state
  const buildCurrentWorkOrder = (customStatus: WorkOrderItem['status'] = 'DRAFT'): WorkOrderItem => {
    const cleanPlate = (vehicle.plate || 'B1234XXX').replace(/\s/g, '').toUpperCase();
    const currentYear = new Date().getFullYear();
    const count = workOrders.length;
    const spkId = editingSpkNumber || `SPK-${currentYear}-${String(880 + count + 1).padStart(4, '0')}`;
    const trkId = `TRK-${cleanPlate}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      id: spkId,
      spkNumber: spkId,
      trackingId: trkId,
      bookingId: linkedBookingId,
      customer: {
        name: customer.name.trim() || 'Pelanggan Walk-In',
        phone: customer.phone.trim() || '08...',
        email: customer.email?.trim() || undefined,
        type: customer.type,
        address: customer.address?.trim() || undefined
      },
      vehicle: {
        plate: vehicle.plate.toUpperCase().trim() || 'B 1234 XXX',
        brand: vehicle.brand.trim() || 'Toyota',
        model: vehicle.model.trim() || 'Avanza G',
        color: vehicle.color.trim() || 'Hitam Metalik',
        year: Number(vehicle.year) || 2022,
        odometerKm: Number(vehicle.odometerKm) || 30000,
        fuelLevel: vehicle.fuelLevel || '1/2'
      },
      serviceCategory,
      insuranceCompany: customer.type === 'Insurance' ? insuranceCompany : undefined,
      insurancePolicy: customer.type === 'Insurance' ? insurancePolicy : undefined,
      damagePoints,
      lineItems,
      subtotal,
      ppn,
      grandTotal,
      approvalTier: currentTier,
      approvalStatus: customStatus === 'SPK_TERBIT' || customStatus === 'DALAM_PENGERJAAN' ? 'APPROVED' : customStatus === 'MENUNGGU_APPROVAL' ? 'PENDING' : 'DRAFT',
      status: customStatus,
      kanbanStage: customStatus === 'SPK_TERBIT' || customStatus === 'DALAM_PENGERJAAN' ? 'repair' : customStatus === 'MENUNGGU_APPROVAL' ? 'approval' : 'estimasi',
      detailedStage: serviceCategory === 'BODY_REPAIR' ? 'Bongkar' : 'Ketok',
      bayLocation: bayLocation || 'Bay Pembongkaran 1',
      leadMechanic: leadMechanic || 'Bambang Sudarso',
      priority,
      entryDate: new Date().toISOString().substring(0, 10),
      targetDeliveryDate: targetDeliveryDate || '2026-09-04',
      progressPercent: customStatus === 'SPK_TERBIT' ? 10 : 0,
      slaStatus: 'ON_TRACK',
      daysRemaining: 4,
      notes: notes || 'Estimasi pengerjaan unit.',
      history: [
        { 
          stage: 'Penerimaan & Estimasi', 
          date: new Date().toISOString().replace('T', ' ').substring(0, 16), 
          status: 'completed', 
          actor: 'Service Advisor' 
        },
        ...(customStatus === 'SPK_TERBIT' || customStatus === 'DALAM_PENGERJAAN' ? [{
          stage: 'Penerbitan Job Card & SPK',
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'completed' as const,
          actor: 'System AutoCare'
        }] : [])
      ],
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
  };

  const handleSaveDraft = () => {
    if (!vehicle.plate.trim() || !customer.name.trim()) {
      toast.error("Mohon isi minimal Nama Pelanggan dan Plat Nomor!");
      return;
    }
    const order = buildCurrentWorkOrder('DRAFT');
    const updated = createOrUpdateWorkOrder(order);
    setWorkOrders(updated);
    setEditingSpkNumber(order.spkNumber);

    toast.success(`Draf Estimasi ${order.spkNumber} Tersimpan!`, {
      description: `Data estimasi untuk ${order.vehicle.plate} (${order.customer.name}) tersimpan di database.`
    });
  };

  const handleSendToApproval = () => {
    if (!vehicle.plate.trim() || !customer.name.trim()) {
      toast.error("Mohon lengkapi Data Pelanggan dan Kendaraan terlebih dahulu!");
      return;
    }
    const order = buildCurrentWorkOrder('MENUNGGU_APPROVAL');
    const updated = createOrUpdateWorkOrder(order);
    setWorkOrders(updated);
    setEditingSpkNumber(order.spkNumber);

    toast.success(`Estimasi ${order.spkNumber} Diajukan ke Approval Workflow!`, {
      description: `Rute Approval: ${order.approvalTier} (Total: Rp ${order.grandTotal.toLocaleString('id-ID')})`
    });
  };

  const handleGenerateSPK = () => {
    if (!vehicle.plate.trim() || !customer.name.trim()) {
      toast.error("No. Polisi dan Nama Pelanggan harus diisi sebelum menerbitkan SPK.");
      return;
    }

    const order = buildCurrentWorkOrder('SPK_TERBIT');
    const updated = createOrUpdateWorkOrder(order);
    setWorkOrders(updated);
    setActiveGeneratedSpk(order);
    setIsSpkGenerated(true);

    toast.success(`Job Card & SPK ${order.spkNumber} Berhasil Diterbitkan & Disimpan!`, {
      description: `Unit resmi terdaftar di database Workshop Kanban & Monitoring Unit.`
    });
  };

  const handleLoadSpkToForm = (order: WorkOrderItem) => {
    setEditingSpkNumber(order.spkNumber);
    setLinkedBookingId(order.bookingId);
    setCustomer({
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email || '',
      type: order.customer.type,
      address: order.customer.address || ''
    });
    setVehicle({
      plate: order.vehicle.plate,
      brand: order.vehicle.brand,
      model: order.vehicle.model,
      color: order.vehicle.color,
      year: order.vehicle.year,
      odometerKm: order.vehicle.odometerKm || 30000,
      fuelLevel: order.vehicle.fuelLevel || '1/2'
    });
    setServiceCategory(order.serviceCategory);
    setInsuranceCompany(order.insuranceCompany || 'Garda Oto (Asuransi Astra)');
    setInsurancePolicy(order.insurancePolicy || '');
    setDamagePoints(order.damagePoints || []);
    setLineItems(order.lineItems || []);
    setBayLocation(order.bayLocation || 'Bay Pembongkaran 1');
    setLeadMechanic(order.leadMechanic || 'Bambang Sudarso');
    setPriority(order.priority || 'normal');
    setTargetDeliveryDate(order.targetDeliveryDate || '2026-09-04');
    setNotes(order.notes || '');
    setActiveTab('form');

    toast.info(`Work Order ${order.spkNumber} Dimuat ke Formulir`, {
      description: `${order.vehicle.plate} • ${order.customer.name}`
    });
  };

  const handleCreateNewSpk = () => {
    setEditingSpkNumber(null);
    setLinkedBookingId(undefined);
    setCustomer({
      name: '',
      phone: '',
      email: '',
      type: 'Personal',
      address: ''
    });
    setVehicle({
      plate: '',
      brand: '',
      model: '',
      color: '',
      year: 2023,
      odometerKm: 35000,
      fuelLevel: '1/2'
    });
    setDamagePoints([]);
    setLineItems([
      { id: '1', type: 'jasa', description: 'Inspeksi & Diagnosa Awal', qty: 1, unitPrice: 150000 }
    ]);
    setNotes('Estimasi pengerjaan standar AutoCare ERP.');
    setActiveTab('form');
    toast.success("Formulir SPK Baru Disiapkan");
  };

  const handleImportBooking = (booking: BookingItem) => {
    setLinkedBookingId(booking.id);
    setCustomer({
      name: booking.customerName,
      phone: booking.customerPhone,
      email: booking.customerEmail || '',
      type: booking.insuranceCompany ? 'Insurance' : 'Personal',
      address: booking.pickupAddress || ''
    });
    setVehicle({
      plate: booking.plateNumber,
      brand: booking.vehicleModel.split(' ')[0] || 'Kendaraan',
      model: booking.vehicleModel,
      color: booking.vehicleColor,
      year: booking.vehicleYear,
      odometerKm: 40000,
      fuelLevel: '3/4'
    });
    setServiceCategory(booking.serviceCategory);
    if (booking.insuranceCompany) {
      setInsuranceCompany(booking.insuranceCompany);
      setInsurancePolicy(`POL-${booking.plateNumber.replace(/\s/g, '')}-2026`);
    }
    if (booking.assignedSA) {
      setLeadMechanic(booking.assignedSA);
    }
    setNotes(booking.notes || `Ditarik dari Booking ${booking.id} (${booking.serviceDetails})`);
    setShowBookingImportModal(false);
    setActiveTab('form');

    toast.success(`Data Booking ${booking.id} Berhasil Diimpor!`, {
      description: `Pelanggan: ${booking.customerName} (${booking.plateNumber})`
    });
  };

  const handleDeleteSpkConfirm = (order: WorkOrderItem) => {
    const updated = deleteWorkOrder(order.id);
    setWorkOrders(updated);
    setShowDeleteModal(false);
    setSpkToDelete(null);

    if (editingSpkNumber === order.spkNumber) {
      handleCreateNewSpk();
    }

    toast.success(`Work Order ${order.spkNumber} Berhasil Dihapus!`, {
      description: `Data telah dihapus dari database.`
    });
  };

  const handleResetData = () => {
    const defaults = resetWorkOrdersToDefault();
    setWorkOrders(defaults);
    toast.success("Database SPK Direset ke Default", {
      description: "Data draf dan SPK awal berhasil dipulihkan."
    });
  };

  // Preview Helpers
  const buildPreviewData = (): EstimatePreviewData => {
    const cleanPlate = (vehicle.plate || 'UNIT').replace(/\s/g, '').toUpperCase();
    const estId = editingSpkNumber || `EST-${cleanPlate}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      estimateId: estId,
      customer: {
        name: customer.name || 'Pelanggan Bengkel Pro',
        phone: customer.phone || '08...',
        type: customer.type || 'Personal'
      },
      vehicle: {
        plate: vehicle.plate || 'B 1234 XXX',
        brand: vehicle.brand || 'Toyota',
        model: vehicle.model || 'Avanza G',
        color: vehicle.color || 'Hitam Metalik'
      },
      insurancePolicy: customer.type === 'Insurance' ? insurancePolicy : undefined,
      damagePoints,
      lineItems,
      notes: notes || 'Estimasi pengerjaan 2-4 hari kerja setelah persetujuan. Garansi cat oven 6 bulan.',
      createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', 23:59 WIB',
      status: estimateStatus
    };
  };

  const handleOpenClientPreview = () => {
    const previewData = buildPreviewData();
    localStorage.setItem('bengkelpro_active_estimate_preview', JSON.stringify(previewData));
    setIsPreviewModalOpen(true);
  };

  const handleGeneratePublicLink = () => {
    const previewData = buildPreviewData();
    localStorage.setItem('bengkelpro_active_estimate_preview', JSON.stringify(previewData));
    const origin = window.location.origin;
    const path = window.location.pathname;
    const publicUrl = `${origin}${path}?estimate=${encodeURIComponent(previewData.estimateId)}`;
    setGeneratedEstimateLink(publicUrl);
    setShowShareModal(true);
    toast.success("Link Client Preview berhasil digenerate!");
  };

  // Filtered SPK List
  const filteredWorkOrders = workOrders.filter(wo => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      wo.spkNumber.toLowerCase().includes(q) ||
      wo.vehicle.plate.toLowerCase().includes(q) ||
      wo.customer.name.toLowerCase().includes(q) ||
      wo.vehicle.model.toLowerCase().includes(q) ||
      (wo.insuranceCompany && wo.insuranceCompany.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return wo.status === statusFilter;
  });

  // Client Preview Full-screen View
  if (isPreviewModalOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B1120] overflow-y-auto">
        <ClientEstimatePreview 
          data={buildPreviewData()}
          onBackToErp={() => setIsPreviewModalOpen(false)}
          onStatusChange={(newStatus) => {
            setEstimateStatus(newStatus);
            if (newStatus === 'ACCEPTED') {
              toast.success("Status Estimasi diperbarui: Disetujui Pelanggan!");
            }
          }}
        />
      </div>
    );
  }

  // Generated SPK Job Card Success Screen
  if (isSpkGenerated && activeGeneratedSpk) {
    const trackingUrl = `https://bengkelpro.id/track?track=${activeGeneratedSpk.trackingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}&color=4338CA&bgcolor=F1F5F9&margin=10`;

    return (
      <div className="p-4 sm:p-6 h-full flex flex-col max-w-4xl mx-auto items-center justify-center animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#1E293B] border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500"></div>
          
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-1">Job Card & SPK Berhasil Disimpan & Diterbitkan!</h2>
          <p className="text-slate-400 mb-6 max-w-md text-sm">
            Work Order <span className="font-bold text-indigo-400 font-mono">{activeGeneratedSpk.spkNumber}</span> untuk unit <span className="font-bold text-white">{activeGeneratedSpk.vehicle.plate}</span> a.n <span className="font-bold text-white">{activeGeneratedSpk.customer.name}</span> telah tercatat di database ERP.
          </p>
          
          <div className="bg-[#0F172A] border border-slate-700 p-6 rounded-xl flex flex-col sm:flex-row items-center gap-6 w-full max-w-2xl mb-6">
            <div className="shrink-0 bg-[#F1F5F9] p-3 rounded-xl border-4 border-indigo-500/20 shadow-lg">
              <img src={qrCodeUrl} alt="Tracking QR Code" className="w-32 h-32 object-contain rounded" />
            </div>
            <div className="flex-1 text-left space-y-3 w-full text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-indigo-400" /> Customer Tracking Portal Token
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-mono font-bold text-lg bg-indigo-500/10 px-3 py-1 rounded border border-indigo-500/20">{activeGeneratedSpk.trackingId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div><span className="text-slate-500">Mekanik Lead:</span> <strong className="text-white">{activeGeneratedSpk.leadMechanic}</strong></div>
                <div><span className="text-slate-500">Lokasi Bay:</span> <strong className="text-white">{activeGeneratedSpk.bayLocation}</strong></div>
                <div><span className="text-slate-500">Grand Total:</span> <strong className="text-emerald-400 font-mono">Rp {activeGeneratedSpk.grandTotal.toLocaleString('id-ID')}</strong></div>
                <div><span className="text-slate-500">Target Delivery:</span> <strong className="text-white">{activeGeneratedSpk.targetDeliveryDate}</strong></div>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => {
                     navigator.clipboard.writeText(trackingUrl);
                     toast.success("Link Tracker disalin ke clipboard!");
                  }}
                  className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" /> Salin Link Pelacak
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full max-w-2xl">
            <button 
              onClick={() => {
                setIsSpkGenerated(false);
                setActiveGeneratedSpk(null);
                handleCreateNewSpk();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl transition-colors text-xs"
            >
              + Buat SPK Baru
            </button>

            <button 
              onClick={() => {
                setIsSpkGenerated(false);
                setActiveTab('list');
              }}
              className="flex-1 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Lihat Daftar Semua SPK ({workOrders.length})
            </button>

            <button 
              onClick={() => {
                toast.success(`Mencetak Job Card SPK ${activeGeneratedSpk.spkNumber}`, {
                  description: "Dokumen Job Card & Barcode siap dikirim ke printer workshop."
                });
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Printer className="w-4 h-4" /> Cetak Job Card & Barcode
            </button>
          </div>
        </div>
      </div>
    );
  }

  const storedBookings = getStoredBookings();

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Estimasi Biaya & Penerbitan SPK
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">
                Reception & Estimation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                Database Tersinkron ({workOrders.length} SPK)
              </span>
            </h2>
            {editingSpkNumber && (
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
                Mengedit: {editingSpkNumber}
              </span>
            )}
            {linkedBookingId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                Link Booking: {linkedBookingId}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Penerimaan unit kendaraan, inspeksi visual titik kerusakan bodi, kalkulasi otomatis jasa & part, alur approval, dan penerbitan SPK
          </p>
        </div>
        
        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          
          {/* Toggle Tab Form / List */}
          <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'form' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Formulir SPK
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Daftar SPK ({workOrders.length})
            </button>
          </div>

          {/* Import from Booking button */}
          <button 
            onClick={() => setShowBookingImportModal(true)}
            className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Impor data pelanggan & kendaraan langsung dari jadwal Booking / Gate Masuk"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            Tarik Booking
          </button>

          {/* Client Preview Mode Button */}
          <button 
            onClick={handleOpenClientPreview}
            className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            title="Buka tampilan persetujuan estimasi dari sudut pandang pelanggan"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            Client Preview
          </button>

          {/* Share Public Link Button */}
          <button 
            onClick={handleGeneratePublicLink}
            className="px-3 py-2 bg-slate-800 text-xs text-slate-200 font-bold rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Generate link publik untuk dikirimkan via WhatsApp / SMS ke pelanggan"
          >
            <Share2 className="w-4 h-4 text-teal-400" />
            Bagi Link
          </button>

          <button 
            onClick={handleSaveDraft}
            className="px-3.5 py-2 bg-slate-800 text-xs text-slate-300 font-bold rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Simpan Draft
          </button>
          
          <button 
            onClick={handleSendToApproval}
            className="px-3.5 py-2 bg-purple-600 text-xs text-white font-bold rounded-lg shadow-sm hover:bg-purple-500 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            Ajukan Approval
          </button>
        </div>
      </div>

      {/* Service Advisor Real-time Delay & SLA Anomaly Alert Notification Widget */}
      <div className="mb-6">
        <ServiceAdvisorLagAlertsWidget />
      </div>

      {/* VIEW 1: DAFTAR SEMUA SPK & WORK ORDER */}
      {activeTab === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari No SPK, Plat Nomor, Pelanggan, Asuransi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="hidden sm:flex items-center gap-1 bg-[#0F172A] p-1 rounded-lg border border-slate-800 text-[11px]">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'DRAFT', label: 'Draf' },
                  { id: 'MENUNGGU_APPROVAL', label: 'Approval' },
                  { id: 'SPK_TERBIT', label: 'SPK Terbit' },
                  { id: 'DALAM_PENGERJAAN', label: 'Dalam Pengerjaan' },
                  { id: 'SELESAI', label: 'Selesai' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      statusFilter === tab.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleResetData}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1"
                title="Reset database SPK ke default"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={handleCreateNewSpk}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                + Buat SPK Baru
              </button>
            </div>
          </div>

          {/* SPK Cards / Table */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#0F172A]/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">No. SPK & Tracking</th>
                    <th className="px-4 py-3">Kendaraan & Plat</th>
                    <th className="px-4 py-3">Pelanggan & Asuransi</th>
                    <th className="px-4 py-3">Tahap & Bay</th>
                    <th className="px-4 py-3">Mekanik Lead</th>
                    <th className="px-4 py-3 text-right">Grand Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredWorkOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Tidak ada data SPK yang sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkOrders.map(order => {
                      const statusBadge = 
                        order.status === 'SPK_TERBIT' || order.status === 'DALAM_PENGERJAAN' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        order.status === 'MENUNGGU_APPROVAL' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        order.status === 'QC_CHECK' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' :
                        order.status === 'SELESAI' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        'bg-slate-700/50 text-slate-400 border-slate-600/30';

                      return (
                        <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-white font-mono">{order.spkNumber}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{order.trackingId}</div>
                            {order.bookingId && (
                              <span className="text-[9px] text-amber-400 font-semibold">Ref: {order.bookingId}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-indigo-400 font-mono">{order.vehicle.plate}</div>
                            <div className="text-slate-300">{order.vehicle.model} ({order.vehicle.year})</div>
                            <div className="text-[10px] text-slate-500">{order.vehicle.color}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{order.customer.name}</div>
                            <div className="text-[10px] text-slate-400">{order.customer.phone}</div>
                            {order.insuranceCompany && (
                              <span className="inline-block mt-0.5 text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">
                                {order.insuranceCompany}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                              {order.detailedStage}
                            </div>
                            <div className="text-[10px] text-slate-400">{order.bayLocation}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-200">{order.leadMechanic}</div>
                            <div className="text-[10px] text-slate-500">Target: {order.targetDeliveryDate}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                            Rp {order.grandTotal.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleLoadSpkToForm(order)}
                                className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                                title="Buka & Edit SPK"
                              >
                                Buka
                              </button>
                              <button
                                onClick={() => {
                                  setActiveGeneratedSpk(order);
                                  setIsSpkGenerated(true);
                                }}
                                className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                                title="Lihat Job Card / QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSpkToDelete(order);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/20 rounded transition-colors"
                                title="Hapus SPK dari Database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FORM ESTIMASI & PENERBITAN SPK */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 animate-in fade-in duration-200">
          
          {/* LEFT PANE: FORMS */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Data Pelanggan & Kendaraan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Customer Data */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 border-b border-slate-800 bg-[#0F172A]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Data Pelanggan & Penjamin</h3>
                  </div>
                  <button
                    onClick={() => setShowBookingImportModal(true)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <ArrowDownToLine className="w-3 h-3" /> Tarik Booking
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nama Pelanggan</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama pelanggan..."
                      value={customer.name}
                      onChange={(e) => setCustomer({...customer, name: e.target.value})}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">No. HP / WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="08..."
                        value={customer.phone}
                        onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Tipe Pembayaran</label>
                      <select 
                        value={customer.type}
                        onChange={(e) => setCustomer({...customer, type: e.target.value as any})}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                      >
                        <option value="Personal">Personal / Cash</option>
                        <option value="Insurance">Klaim Asuransi</option>
                        <option value="Corporate">Fleet / Perusahaan</option>
                      </select>
                    </div>
                  </div>
                  {customer.type === 'Insurance' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block">Perusahaan Asuransi</label>
                        <input 
                          type="text" 
                          placeholder="Garda Oto, ACA, Sinarmas..."
                          value={insuranceCompany}
                          onChange={(e) => setInsuranceCompany(e.target.value)}
                          className="w-full bg-[#0F172A] border border-indigo-500/40 rounded-lg px-3 py-2 text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block">No. Polis / Klaim</label>
                        <input 
                          type="text" 
                          placeholder="POL-12345..."
                          value={insurancePolicy}
                          onChange={(e) => setInsurancePolicy(e.target.value)}
                          className="w-full bg-[#0F172A] border border-indigo-500/40 rounded-lg px-3 py-2 text-sm text-indigo-300 focus:border-indigo-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Data */}
              <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 border-b border-slate-800 bg-[#0F172A]/50 flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Data Kendaraan</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">No. Polisi</label>
                      <input 
                        type="text" 
                        placeholder="B 1234 ABC"
                        value={vehicle.plate}
                        onChange={(e) => setVehicle({...vehicle, plate: e.target.value.toUpperCase()})}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Warna Kendaraan</label>
                      <input 
                        type="text" 
                        placeholder="Hitam Metalik"
                        value={vehicle.color}
                        onChange={(e) => setVehicle({...vehicle, color: e.target.value})}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Merek</label>
                      <input 
                        type="text" 
                        placeholder="Honda / Toyota"
                        value={vehicle.brand}
                        onChange={(e) => setVehicle({...vehicle, brand: e.target.value})}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Model / Tipe</label>
                      <input 
                        type="text" 
                        placeholder="CR-V Turbo / Fortuner"
                        value={vehicle.model}
                        onChange={(e) => setVehicle({...vehicle, model: e.target.value})}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Visual Damage Marking (Walkaround 360) */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-[#0F172A]/50 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Inspeksi & Penandaan Kerusakan Bodi</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Tingkat Kerusakan:</span>
                  {(['Baret Ringan', 'Penyok Sedang', 'Rusak Parah / Ganti'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setActiveSeverity(sev)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                        activeSeverity === sev 
                          ? sev === 'Baret Ringan' ? 'bg-amber-500 text-slate-950 font-extrabold' : sev === 'Penyok Sedang' ? 'bg-indigo-500 text-white' : 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
                  <span>Klik pada visual denah mobil di bawah untuk menempatkan pin kerusakan:</span>
                  <span className="font-mono text-indigo-400 font-bold">{damagePoints.length} Titik Ditandai</span>
                </div>

                {/* Car Body Visual Canvas */}
                <div 
                  onClick={handleDiagramClick}
                  className="relative bg-[#0B1120] border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl h-56 flex items-center justify-center cursor-crosshair overflow-hidden select-none transition-colors"
                >
                  {/* Visual Wireframe Car Representation */}
                  <div className="w-[85%] h-[75%] border border-slate-700/80 rounded-2xl relative flex items-center justify-between px-10 bg-slate-900/40">
                    {/* Front */}
                    <div className="w-16 h-28 border border-slate-700 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono font-bold">
                      DEPAN
                      <span className="text-[8px] text-slate-600">Bumper / Kap</span>
                    </div>
                    
                    {/* Cabin / Doors */}
                    <div className="flex-1 mx-6 h-36 border border-slate-700/80 rounded-xl flex items-center justify-around text-[10px] text-slate-500 font-mono font-bold">
                      <div className="text-center">
                        <span>PINTU KIRI</span>
                        <p className="text-[8px] text-slate-600">Depan / Belakang</p>
                      </div>
                      <div className="w-px h-24 bg-slate-800"></div>
                      <div className="text-center">
                        <span>PINTU KANAN</span>
                        <p className="text-[8px] text-slate-600">Depan / Belakang</p>
                      </div>
                    </div>

                    {/* Rear */}
                    <div className="w-16 h-28 border border-slate-700 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono font-bold">
                      BELAKANG
                      <span className="text-[8px] text-slate-600">Bagasi / Bumper</span>
                    </div>
                  </div>

                  {/* Placed Damage Pins */}
                  {damagePoints.map((dp, idx) => (
                    <div
                      key={dp.id}
                      style={{ left: `${dp.x}%`, top: `${dp.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white shadow-lg animate-bounce ${
                        dp.severity === 'Baret Ringan' ? 'bg-amber-500 ring-2 ring-amber-300' :
                        dp.severity === 'Penyok Sedang' ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-rose-600 ring-2 ring-rose-400'
                      }`}
                      title={`${dp.panel} (${dp.severity})`}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>

                {/* Damage Points List */}
                {damagePoints.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {damagePoints.map((dp, idx) => (
                      <div key={dp.id} className="p-2.5 bg-[#0F172A] border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 font-mono font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-white">{dp.panel}</p>
                            <p className="text-[10px] text-slate-400">{dp.severity} — {dp.suggestedAction}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setDamagePoints(damagePoints.filter(p => p.id !== dp.id))}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rincian Biaya / Line Items */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-800 bg-[#0F172A]/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Rincian Perbaikan (Jasa & Sparepart)</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addLineItem('jasa')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] font-bold text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> + JASA
                  </button>
                  <button 
                    onClick={() => addLineItem('part')}
                    className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded text-[10px] font-bold text-indigo-400 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> + PART
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#0F172A]/80">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Tipe</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi Pekerjaan / Part</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Qty</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-40 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-40 text-right">Subtotal</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded border ${
                            item.type === 'jasa' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            placeholder={item.type === 'jasa' ? 'Nama perbaikan...' : 'Cari nama sparepart...'}
                            className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:bg-[#0F172A] transition-all"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 text-sm text-center text-slate-200 focus:outline-none focus:bg-[#0F172A] transition-all"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            <span className="text-slate-500 text-xs mr-2">Rp</span>
                            <input 
                              type="number" 
                              min="0"
                              step="1000"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                              className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 text-sm text-right text-slate-200 focus:outline-none focus:bg-[#0F172A] transition-all font-mono"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="text-sm font-bold text-slate-300 font-mono">
                            Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button 
                            onClick={() => removeLineItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: WORKSHOP ALLOCATION & SUMMARY */}
          <div className="space-y-6">
            
            {/* Workshop Production Assignment */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Alokasi Workshop & Mekanik</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Kategori Pekerjaan</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as any)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BODY_REPAIR">Body Repair & Cat Oven</option>
                    <option value="GENERAL_REPAIR">General Repair / Mesin</option>
                    <option value="PERIODIC_MAINTENANCE">Servis Berkala & Tune Up</option>
                    <option value="INSURANCE_CLAIM">Klaim Asuransi</option>
                    <option value="DETAILING">Detailing & Coating 9H</option>
                    <option value="AC_ELECTRICAL">AC & Kelistrikan</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Mekanik / SA Lead</label>
                    <select
                      value={leadMechanic}
                      onChange={(e) => setLeadMechanic(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Bambang Sudarso">Bambang Sudarso</option>
                      <option value="Budi Santoso">Budi Santoso</option>
                      <option value="Ahmad Fauzi">Ahmad Fauzi</option>
                      <option value="Dedi Kusnadi">Dedi Kusnadi</option>
                      <option value="Joko Triono">Joko Triono</option>
                      <option value="Bayu Pratama">Bayu Pratama</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Bay Lokasi</label>
                    <select
                      value={bayLocation}
                      onChange={(e) => setBayLocation(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Bay Pembongkaran 1">Bay Pembongkaran 1</option>
                      <option value="Bay Ketok 1">Bay Ketok 1</option>
                      <option value="Bay Dempul 3">Bay Dempul 3</option>
                      <option value="Bay Oven Cat 2">Bay Oven Cat 2</option>
                      <option value="Bay Detailing 1">Bay Detailing 1</option>
                      <option value="Bay Final Assembly">Bay Final Assembly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Prioritas SPK</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="low">Low (Santai)</option>
                      <option value="normal">Normal</option>
                      <option value="high">High (Urgent / VIP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Target Delivery</label>
                    <input
                      type="date"
                      value={targetDeliveryDate}
                      onChange={(e) => setTargetDeliveryDate(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alur Approval Berjenjang */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Rute Persetujuan (Tiered Approval)</h3>
              </div>
              
              <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-lg space-y-2 text-xs">
                <p className="text-slate-400 font-medium">Berdasarkan Total Nilai Estimasi:</p>
                <div className="p-2.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  {currentTier} (Total: Rp {grandTotal.toLocaleString('id-ID')})
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • Tier 1 (&le; 1 Jt): Auto-Approved sistem.<br/>
                  • Tier 2 (1 Jt - 5 Jt): Wajib paraf Kepala Regu / Foreman.<br/>
                  • Tier 3 (&gt; 5 Jt): Wajib otorisasi Workshop Manager & Owner.
                </p>
              </div>
            </div>

            {/* Kalkulasi Total */}
            <div className="bg-[#1E293B] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Ringkasan Biaya Estimasi</h3>
              </div>
              
              <div className="p-4 space-y-3 font-mono">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-sans">Subtotal Jasa & Part</span>
                  <span className="text-slate-200">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-sans">PPN (11%)</span>
                  <span className="text-slate-200">Rp {ppn.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="h-px w-full bg-slate-800 my-1 border-t border-dashed border-slate-700"></div>
                
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Grand Total</span>
                  <span className="text-xl font-bold text-indigo-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="p-4 bg-[#0F172A]/80 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Katalog harga part tervalidasi dengan Master Gudang</span>
                </div>
                <button 
                  onClick={handleGenerateSPK}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Konfirmasi & Terbitkan SPK (Job Card)
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: IMPORT FROM BOOKING / CHECK-IN */}
      {showBookingImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tarik Data dari Jadwal Booking / Check-in</h3>
                  <p className="text-xs text-slate-400">Pilih kendaraan pelanggan untuk mengisi formulir SPK otomatis</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBookingImportModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {storedBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Belum ada data booking di sistem. Silakan buat booking baru di menu Booking.
                </div>
              ) : (
                storedBookings.map(bkg => (
                  <div
                    key={bkg.id}
                    className="p-3 bg-[#1E293B] hover:bg-[#243147] border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-400">{bkg.plateNumber}</span>
                        <span className="text-white font-bold">{bkg.customerName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {bkg.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {bkg.vehicleModel} • {bkg.serviceCategory} • {bkg.bookingDate} {bkg.bookingTime}
                      </p>
                      {bkg.insuranceCompany && (
                        <p className="text-indigo-300 text-[10px]">Asuransi: {bkg.insuranceCompany}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleImportBooking(bkg)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      Pilih & Isi Form
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE SPK CONFIRMATION */}
      {showDeleteModal && spkToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-rose-900/50 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Work Order SPK</h3>
                <p className="text-xs text-rose-400">Data akan dihapus permanen dari database</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin menghapus SPK <strong className="text-white font-mono">{spkToDelete.spkNumber}</strong> untuk kendaraan <strong className="text-indigo-400">{spkToDelete.vehicle.plate}</strong> ({spkToDelete.customer.name})?
            </p>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setSpkToDelete(null); }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteSpkConfirm(spkToDelete)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SHARE PUBLIC LINK MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Link Estimasi Publik Pelanggan</h3>
                  <p className="text-xs text-slate-400">Persetujuan estimasi online langsung dari smartphone pelanggan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedEstimateLink} 
                  className="w-full bg-transparent text-xs text-indigo-300 font-mono outline-none truncate"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedEstimateLink);
                    toast.success("Link berhasil disalin ke clipboard!");
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
