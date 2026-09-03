import { useState, useMemo, FormEvent, useEffect } from 'react';
import { 
  CalendarDays, Search, Filter, Plus, CheckCircle2, Clock, 
  AlertCircle, Phone, MessageSquare, Car, User, 
  ChevronRight, Calendar, ArrowRight, X, Download, 
  ExternalLink, Sparkles, Wrench, ShieldCheck, Cog, 
  Zap, Copy, Check, RotateCcw, Building2, MapPin,
  FileText, Gauge, Send, Eye, Edit3, Trash2, Database,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BookingItem, 
  BookingStatus, 
  ServiceCategory, 
  BookingChannel,
  INITIAL_BOOKINGS, 
  SERVICE_CATEGORY_LABELS, 
  BOOKING_STATUS_CONFIG, 
  TIME_SLOTS, 
  SERVICE_ADVISORS,
  getStoredBookings,
  saveBookingsToStorage,
  resetBookingsToDefault
} from '../data/mockBookings';

interface BookingManagementModuleProps {
  onNavigateToEstimasi?: (bookingData?: BookingItem) => void;
}

export function BookingManagementModule({ onNavigateToEstimasi }: BookingManagementModuleProps) {
  // Load persistent bookings from database/storage
  const [bookings, setBookings] = useState<BookingItem[]>(() => getStoredBookings());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL'); // 'ALL', 'TODAY', 'TOMORROW'
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<BookingItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setBookings(customEvent.detail);
      } else {
        setBookings(getStoredBookings());
      }
    };

    window.addEventListener('autocare_bookings_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('autocare_bookings_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Check-In Form State
  const [checkInKm, setCheckInKm] = useState<number>(45000);
  const [checkInFuel, setCheckInFuel] = useState<string>('3/4');
  const [checkInNotes, setCheckInNotes] = useState<string>('');

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState<string>('2026-09-01');
  const [rescheduleTime, setRescheduleTime] = useState<string>('09:00 WIB');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');

  // Add Booking Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    plateNumber: '',
    vehicleModel: '',
    vehicleYear: 2023,
    vehicleColor: 'Hitam Metalik',
    serviceCategory: 'GENERAL_REPAIR' as ServiceCategory,
    serviceDetails: '',
    bookingDate: '2026-08-31',
    bookingTime: '09:00 WIB',
    channel: 'WHATSAPP' as BookingChannel,
    assignedSA: 'Rian Hidayat, S.T.',
    notes: '',
    insuranceCompany: '',
    isPickupRequired: false,
    pickupAddress: '',
    depositPaid: 0
  });

  // Copied state for WhatsApp preview
  const [copiedText, setCopiedText] = useState(false);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(item => {
      // Search text filter
      const matchesSearch = 
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerPhone.includes(searchQuery);

      if (!matchesSearch) return false;

      // Status filter
      if (selectedStatusTab !== 'ALL') {
        if (selectedStatusTab === 'PENDING' && item.status !== 'MENUNGGU_KONFIRMASI') return false;
        if (selectedStatusTab === 'CONFIRMED' && item.status !== 'TERKONFIRMASI') return false;
        if (selectedStatusTab === 'ARRIVED' && item.status !== 'TIBA' && item.status !== 'PROSES_SPK') return false;
        if (selectedStatusTab === 'CANCELLED' && item.status !== 'BATAL' && item.status !== 'RESCHEDULE') return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && item.serviceCategory !== selectedCategory) {
        return false;
      }

      // Date filter
      if (selectedDateFilter === 'TODAY' && item.bookingDate !== '2026-08-31') return false;
      if (selectedDateFilter === 'TOMORROW' && item.bookingDate !== '2026-09-01') return false;

      return true;
    });
  }, [bookings, searchQuery, selectedStatusTab, selectedCategory, selectedDateFilter]);

  // Metric Calculations
  const stats = useMemo(() => {
    const today = bookings.filter(b => b.bookingDate === '2026-08-31');
    const pending = bookings.filter(b => b.status === 'MENUNGGU_KONFIRMASI');
    const confirmed = bookings.filter(b => b.status === 'TERKONFIRMASI');
    const arrived = bookings.filter(b => b.status === 'TIBA' || b.status === 'PROSES_SPK');
    const totalToday = today.length;
    const capacityTotal = 12; // Max daily booking slots
    const capacityPercent = Math.min(100, Math.round((totalToday / capacityTotal) * 100));

    return {
      todayCount: totalToday,
      pendingCount: pending.length,
      confirmedCount: confirmed.length,
      arrivedCount: arrived.length,
      capacityPercent
    };
  }, [bookings]);

  // Actions
  const handleConfirmBooking = (booking: BookingItem) => {
    const updated = bookings.map(b => {
      if (b.id === booking.id) {
        return { ...b, status: 'TERKONFIRMASI' as BookingStatus };
      }
      return b;
    });
    setBookings(updated);
    saveBookingsToStorage(updated);

    toast.success(`Booking ${booking.id} Terkonfirmasi & Disimpan!`, {
      description: `Jadwal kedatangan ${booking.plateNumber} (${booking.customerName}) telah disetujui di database.`
    });
  };

  const handleOpenCheckIn = (booking: BookingItem) => {
    setSelectedBooking(booking);
    setCheckInKm(booking.kmCurrent || 35000);
    setCheckInFuel('3/4');
    setCheckInNotes('');
    setIsCheckInModalOpen(true);
  };

  const handleCompleteCheckIn = (proceedToEstimasi: boolean) => {
    if (!selectedBooking) return;

    const updatedBooking: BookingItem = {
      ...selectedBooking,
      status: 'TIBA',
      checkInTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      kmCurrent: Number(checkInKm) || selectedBooking.kmCurrent || 40000,
      workOrderId: selectedBooking.workOrderId || `SPK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updated = bookings.map(b => b.id === selectedBooking.id ? updatedBooking : b);
    setBookings(updated);
    saveBookingsToStorage(updated);
    setIsCheckInModalOpen(false);

    toast.success(`Kendaraan ${selectedBooking.plateNumber} Berhasil Check-In!`, {
      description: `Tersimpan ke database gate. No SPK Draf: ${updatedBooking.workOrderId}`
    });

    if (proceedToEstimasi && onNavigateToEstimasi) {
      onNavigateToEstimasi(updatedBooking);
    }
  };

  const handleOpenReschedule = (booking: BookingItem) => {
    setSelectedBooking(booking);
    setRescheduleDate(booking.bookingDate);
    setRescheduleTime(booking.bookingTime);
    setRescheduleReason('');
    setIsRescheduleModalOpen(true);
  };

  const handleSaveReschedule = () => {
    if (!selectedBooking) return;

    const updated = bookings.map(b => {
      if (b.id === selectedBooking.id) {
        return {
          ...b,
          bookingDate: rescheduleDate,
          bookingTime: rescheduleTime,
          status: 'RESCHEDULE' as BookingStatus,
          notes: `${b.notes ? b.notes + ' | ' : ''}Reschedule ke ${rescheduleDate} ${rescheduleTime}: ${rescheduleReason || 'Permintaan pelanggan'}`
        };
      }
      return b;
    });

    setBookings(updated);
    saveBookingsToStorage(updated);
    setIsRescheduleModalOpen(false);
    
    toast.info(`Jadwal Booking ${selectedBooking.id} Tersimpan!`, {
      description: `Jadwal baru: ${rescheduleDate} pukul ${rescheduleTime}`
    });
  };

  const handleCancelBooking = (booking: BookingItem) => {
    const updated = bookings.map(b => {
      if (b.id === booking.id) {
        return { ...b, status: 'BATAL' as BookingStatus };
      }
      return b;
    });
    setBookings(updated);
    saveBookingsToStorage(updated);

    toast.error(`Booking ${booking.id} Dibatalkan`, {
      description: `Status batal tersimpan di database untuk ${booking.plateNumber}.`
    });
  };

  const handleDeleteBooking = (booking: BookingItem) => {
    const updated = bookings.filter(b => b.id !== booking.id);
    setBookings(updated);
    saveBookingsToStorage(updated);
    setIsDeleteModalOpen(false);
    setSelectedBooking(null);

    toast.success(`Booking ${booking.id} Berhasil Dihapus!`, {
      description: `Data reservasi telah dihapus dari database.`
    });
  };

  const handleResetData = () => {
    const resetList = resetBookingsToDefault();
    setBookings(resetList);
    setSearchQuery('');
    setSelectedStatusTab('ALL');
    setSelectedCategory('ALL');
    setSelectedDateFilter('ALL');
    toast.success("Database Booking Direset ke Default", {
      description: "9 reservasi awal berhasil dipulihkan."
    });
  };

  const handleOpenWhatsAppModal = (booking: BookingItem) => {
    setSelectedBooking(booking);
    setIsWhatsAppModalOpen(true);
    setCopiedText(false);
  };

  const generateWhatsAppMessage = (booking: BookingItem) => {
    return `Halo Bapak/Ibu ${booking.customerName},\n\nTerima kasih telah mempercayakan perawatan kendaraan Anda kepada *AutoCare Bengkel Pro*.\n\nBerikut rincian reservasi servis Anda:\n📋 *No. Booking:* ${booking.id}\n🚗 *Kendaraan:* ${booking.vehicleModel} (${booking.plateNumber})\n🔧 *Kategori Layanan:* ${SERVICE_CATEGORY_LABELS[booking.serviceCategory]?.label || booking.serviceCategory}\n📅 *Jadwal Kedatangan:* ${booking.bookingDate} pukul ${booking.bookingTime}\n👨‍🔧 *Service Advisor:* ${booking.assignedSA}\n\n📍 *Lokasi Bengkel:* Jl. Industri Otomotif No. 12, Jakarta (Waze/Google Maps: Bengkel Pro AutoCare)\n\nMohon hadir 10 menit sebelum jam reservasi. Jika ada perubahan jadwal, silakan balas pesan ini.\n\nSalam hangat,\n*Tim Pelayanan AutoCare ERP Bengkel Pro*`;
  };

  const handleCopyWhatsApp = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success("Pesan WhatsApp Berhasil Disalin ke Clipboard!");
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCreateNewBooking = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.plateNumber.trim() || !formData.customerPhone.trim()) {
      toast.error("Mohon lengkapi Data Pelanggan & Plat Nomor!");
      return;
    }

    const currentCount = bookings.length;
    const newId = `BKG-2026-${String(810 + currentCount).padStart(4, '0')}`;
    const newBooking: BookingItem = {
      id: newId,
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerEmail: formData.customerEmail?.trim() || undefined,
      plateNumber: formData.plateNumber.toUpperCase().trim(),
      vehicleModel: formData.vehicleModel.trim() || 'Kendaraan Pelanggan',
      vehicleYear: Number(formData.vehicleYear) || 2023,
      vehicleColor: formData.vehicleColor || 'Hitam Metalik',
      serviceCategory: formData.serviceCategory,
      serviceDetails: formData.serviceDetails.trim() || 'Servis kendaraan & pemeriksaan umum',
      bookingDate: formData.bookingDate || '2026-08-31',
      bookingTime: formData.bookingTime || '09:00 WIB',
      channel: formData.channel,
      status: 'TERKONFIRMASI',
      assignedSA: formData.assignedSA,
      notes: formData.notes.trim(),
      estimatedDurationHours: formData.serviceCategory === 'BODY_REPAIR' ? 24 : 3,
      insuranceCompany: formData.insuranceCompany?.trim() || undefined,
      isPickupRequired: formData.isPickupRequired,
      pickupAddress: formData.pickupAddress?.trim() || undefined,
      depositPaid: Number(formData.depositPaid) || 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // Update state & persist to database storage immediately
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    saveBookingsToStorage(updatedBookings);

    // Clear filters so newly created booking is immediately visible in view
    setSearchQuery('');
    setSelectedStatusTab('ALL');
    setSelectedCategory('ALL');
    setSelectedDateFilter('ALL');
    setHighlightedBookingId(newId);

    // Auto remove highlight after 5 seconds
    setTimeout(() => {
      setHighlightedBookingId(null);
    }, 5000);

    setIsAddModalOpen(false);

    // Reset Form to initial default values
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      plateNumber: '',
      vehicleModel: '',
      vehicleYear: 2023,
      vehicleColor: 'Hitam Metalik',
      serviceCategory: 'GENERAL_REPAIR',
      serviceDetails: '',
      bookingDate: '2026-08-31',
      bookingTime: '09:00 WIB',
      channel: 'WHATSAPP',
      assignedSA: 'Rian Hidayat, S.T.',
      notes: '',
      insuranceCompany: '',
      isPickupRequired: false,
      pickupAddress: '',
      depositPaid: 0
    });

    toast.success(`Booking ${newId} Berhasil Disimpan ke Database!`, {
      description: `Data reservasi atas nama ${newBooking.customerName} (${newBooking.plateNumber}) telah tercatat permanen.`
    });
  };

  const handleExportCSV = () => {
    const headers = ['No Booking', 'Nama Pelanggan', 'No HP', 'Plat Nomor', 'Model Kendaraan', 'Kategori', 'Tanggal', 'Jam', 'Status', 'Service Advisor'];
    const rows = filteredBookings.map(b => [
      b.id,
      `"${b.customerName}"`,
      b.customerPhone,
      b.plateNumber,
      `"${b.vehicleModel}"`,
      b.serviceCategory,
      b.bookingDate,
      b.bookingTime,
      b.status,
      `"${b.assignedSA}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Booking_BengkelPro_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("File CSV Berhasil Diunduh", {
      description: `${filteredBookings.length} data reservasi berhasil diekspor.`
    });
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            Daftar Booking & Reservasi Servis
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-bold">
              Front Office Live
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold" title="Tersimpan secara lokal & real-time">
              <Database className="w-3 h-3 text-emerald-400" />
              Database Tersinkron ({bookings.length} Unit)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola jadwal kedatangan pelanggan, konfirmasi janji temu, dan percepat check-in unit ke gate bengkel
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={handleResetData}
            className="px-2.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold border border-slate-700/80 transition-all flex items-center gap-1.5"
            title="Reset data booking ke data default awal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Default</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            + Buat Booking Baru
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-5 shrink-0">
        
        {/* Card 1: Hari Ini */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Hari Ini</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">{stats.todayCount}</span>
              <span className="text-[10px] text-slate-400">Unit</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Menunggu Konfirmasi */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Perlu Konfirmasi</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-300">{stats.pendingCount}</span>
              <span className="text-[10px] text-amber-400/80">Pending SA</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Terkonfirmasi */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Terkonfirmasi</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-blue-300">{stats.confirmedCount}</span>
              <span className="text-[10px] text-blue-400/80">Siap Datang</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tiba di Bengkel */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Check-In Gate</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{stats.arrivedCount}</span>
              <span className="text-[10px] text-emerald-400/80">Di Workshop</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Car className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Slot Kapasitas */}
        <div className="col-span-2 lg:col-span-1 bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kapasitas Slot</p>
            <span className="text-xs font-bold text-indigo-400">{stats.capacityPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full transition-all duration-500 ${
                stats.capacityPercent > 80 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${stats.capacityPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
            <span>Terisi {stats.todayCount} unit</span>
            <span>Slot maks 12/hari</span>
          </p>
        </div>

      </div>

      {/* Toolbar & Filters */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3 sm:p-4 mb-4 shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          
          {/* Search Box */}
          <div className="flex items-center bg-[#0F172A] rounded-lg px-3 py-2 border border-slate-700 focus-within:border-indigo-500 transition-colors flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Cari no. booking, nama, plat nomor, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none w-full ml-2 text-slate-200 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <select 
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Tanggal</option>
            <option value="TODAY">Hari Ini (31 Agu)</option>
            <option value="TOMORROW">Besok (1 Sep)</option>
          </select>

          {/* Category Filter */}
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Kategori Servis</option>
            <option value="BODY_REPAIR">Body Repair & Cat</option>
            <option value="GENERAL_REPAIR">General Repair / Mesin</option>
            <option value="SERVIS_BERKALA">Servis Berkala (PM)</option>
            <option value="KLAIM_ASURANSI">Klaim Asuransi</option>
            <option value="DETAILING">Detailing & Coating</option>
            <option value="AC_KELISTRIKAN">AC & Kelistrikan</option>
          </select>

        </div>

        {/* Right: Status Filter Tabs & View Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          
          <div className="flex bg-[#0F172A] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedStatusTab('ALL')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedStatusTab === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({bookings.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('PENDING')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedStatusTab === 'PENDING' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({bookings.filter(b => b.status === 'MENUNGGU_KONFIRMASI').length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('CONFIRMED')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedStatusTab === 'CONFIRMED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terkonfirmasi
            </button>
            <button
              onClick={() => setSelectedStatusTab('ARRIVED')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedStatusTab === 'ARRIVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Check-In
            </button>
          </div>

          <div className="flex bg-[#0F172A] p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daftar
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'timeline' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Slot Harian
            </button>
          </div>

        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        
        {viewMode === 'list' ? (
          /* LIST / TABLE VIEW */
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-3">
                  <CalendarDays className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Tidak Ada Data Booking Ditemukan</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Coba ubah kata kunci pencarian, filter status, atau tanggal reservasi.
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedStatusTab('ALL'); setSelectedCategory('ALL'); setSelectedDateFilter('ALL'); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              filteredBookings.map((booking) => {
                const categoryConfig = SERVICE_CATEGORY_LABELS[booking.serviceCategory] || {
                  label: booking.serviceCategory,
                  badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                };
                const statusConfig = BOOKING_STATUS_CONFIG[booking.status] || {
                  label: booking.status,
                  badgeClass: 'bg-slate-700 text-slate-300'
                };

                const isHighlighted = highlightedBookingId === booking.id;

                return (
                  <div 
                    key={booking.id}
                    className={`bg-[#1E293B] hover:bg-[#243147] border rounded-xl p-4 transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm relative ${
                      isHighlighted 
                        ? 'border-indigo-500/80 ring-2 ring-indigo-500/50 bg-indigo-950/20 shadow-lg shadow-indigo-500/10' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md animate-bounce">
                        <Sparkles className="w-3 h-3" />
                        Baru Disimpan di Database
                      </div>
                    )}
                    
                    {/* Left: Plate, Model, Customer, Service Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      
                      {/* Plate Number Badge Box */}
                      <div className="shrink-0 flex flex-col items-center justify-center w-24 bg-[#0F172A] border border-slate-700 rounded-lg p-2 text-center shadow-inner">
                        <span className="text-xs font-black text-white font-mono tracking-wider">{booking.plateNumber}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">{booking.vehicleYear}</span>
                        <span className="text-[8px] text-indigo-400 font-semibold uppercase">{booking.id}</span>
                      </div>

                      {/* Info details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white truncate">{booking.customerName}</h4>
                          
                          {/* Channel Badge */}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {booking.channel}
                          </span>

                          {/* Category Badge */}
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${categoryConfig.badgeColor}`}>
                            {categoryConfig.label}
                          </span>

                          {/* Insurance Tag if available */}
                          {booking.insuranceCompany && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {booking.insuranceCompany}
                            </span>
                          )}

                          {booking.isPickupRequired && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Antar-Jemput
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
                          <span>{booking.vehicleModel}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{booking.vehicleColor}</span>
                        </p>

                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                          <span className="text-slate-500">Keluhan/Layanan:</span> {booking.serviceDetails}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1 text-indigo-300 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {booking.bookingDate} • {booking.bookingTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            SA: <strong className="text-slate-300">{booking.assignedSA}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {booking.customerPhone}
                          </span>
                          {booking.depositPaid > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">
                                DP: Rp {booking.depositPaid.toLocaleString('id-ID')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-end sm:items-center gap-2.5 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                      
                      {/* Status Tag */}
                      <div className="text-right">
                        <span className={`inline-block text-[11px] px-2.5 py-1 rounded-lg border font-bold ${statusConfig.badgeClass}`}>
                          {statusConfig.label}
                        </span>
                        {booking.checkInTime && (
                          <p className="text-[10px] text-emerald-400 mt-0.5">Tiba: {booking.checkInTime}</p>
                        )}
                      </div>

                      {/* Action Buttons Group */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        
                        {/* Pending Confirmation -> Confirm Button */}
                        {booking.status === 'MENUNGGU_KONFIRMASI' && (
                          <button
                            onClick={() => handleConfirmBooking(booking)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="Konfirmasi Booking"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Konfirmasi
                          </button>
                        )}

                        {/* Confirmed / Ready -> Check-In Button */}
                        {booking.status === 'TERKONFIRMASI' && (
                          <button
                            onClick={() => handleOpenCheckIn(booking)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title="Check-In Mobil Tiba di Workshop"
                          >
                            <Car className="w-3.5 h-3.5" />
                            Check-In Gate
                          </button>
                        )}

                        {/* If Arrived -> Open Estimasi / SPK button */}
                        {(booking.status === 'TIBA' || booking.status === 'PROSES_SPK') && onNavigateToEstimasi && (
                          <button
                            onClick={() => onNavigateToEstimasi(booking)}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            title="Buka Estimasi & SPK"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Estimasi & SPK
                          </button>
                        )}

                        {/* WhatsApp Message Reminder Button */}
                        <button
                          onClick={() => handleOpenWhatsAppModal(booking)}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs transition-colors"
                          title="Kirim Konfirmasi / Pengingat WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Reschedule Button */}
                        {booking.status !== 'BATAL' && booking.status !== 'TIBA' && booking.status !== 'PROSES_SPK' && (
                          <button
                            onClick={() => handleOpenReschedule(booking)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition-colors"
                            title="Ubah Jadwal (Reschedule)"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}

                        {/* Detail Modal */}
                        <button
                          onClick={() => { setSelectedBooking(booking); setIsDetailModalOpen(true); }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition-colors"
                          title="Lihat Rincian Reservasi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cancel Button */}
                        {booking.status !== 'BATAL' && booking.status !== 'TIBA' && booking.status !== 'PROSES_SPK' && (
                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs transition-colors"
                            title="Batalkan Booking"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => { setSelectedBooking(booking); setIsDeleteModalOpen(true); }}
                          className="p-1.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/30 rounded-lg text-xs transition-colors"
                          title="Hapus Data Booking dari Database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TIMELINE / SLOT AVAILABILITY VIEW */
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Kapasitas Slot Reservasi — {selectedDateFilter === 'TOMORROW' ? 'Besok (1 Sep 2026)' : 'Hari Ini (31 Agu 2026)'}
                </h3>
                <p className="text-xs text-slate-400">Jadwal pembagian jam kedatangan unit ke stall bengkel</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Maksimal 2 Unit per Slot Jam
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {TIME_SLOTS.map((slot) => {
                const targetDate = selectedDateFilter === 'TOMORROW' ? '2026-09-01' : '2026-08-31';
                const bookedItems = bookings.filter(b => b.bookingTime === slot && b.bookingDate === targetDate && b.status !== 'BATAL');
                const isFull = bookedItems.length >= 2;

                return (
                  <div 
                    key={slot}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFull 
                        ? 'bg-amber-950/20 border-amber-500/30' 
                        : bookedItems.length > 0 
                          ? 'bg-[#0F172A] border-slate-700' 
                          : 'bg-[#0B1120]/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-white">{slot}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        isFull 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : bookedItems.length > 0 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {bookedItems.length}/2 Terisi
                      </span>
                    </div>

                    {bookedItems.length === 0 ? (
                      <div className="py-3 text-center">
                        <p className="text-[11px] text-slate-500 italic">Slot Masih Kosong</p>
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, bookingTime: slot }));
                            setIsAddModalOpen(true);
                          }}
                          className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                        >
                          + Tambah Booking
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bookedItems.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => { setSelectedBooking(item); setIsDetailModalOpen(true); }}
                            className="p-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white font-mono">{item.plateNumber}</span>
                              <span className="text-[9px] text-indigo-400 font-semibold">{item.id}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate mt-0.5">{item.customerName} ({item.vehicleModel})</p>
                            <p className="text-[10px] text-slate-400 truncate">{SERVICE_CATEGORY_LABELS[item.serviceCategory]?.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT BOOKING BARU */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Buat Booking Servis Baru</h3>
                  <p className="text-xs text-slate-400">Input data reservasi pelanggan offline maupun online</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
              
              {/* SECTION: DATA PELANGGAN */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Data Pelanggan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hendra Gunawan" 
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp / HP *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 0812-9876-5432" 
                      value={formData.customerPhone}
                      onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Pelanggan (Opsional)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. hendra@gmail.com" 
                      value={formData.customerEmail}
                      onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: DATA KENDARAAN */}
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Data Kendaraan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Polisi (Plat) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. B 1982 SSY" 
                      value={formData.plateNumber}
                      onChange={e => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Merk & Tipe Kendaraan *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Toyota Fortuner 2.8 VRZ" 
                      value={formData.vehicleModel}
                      onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Warna & Tahun</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Warna" 
                        value={formData.vehicleColor}
                        onChange={e => setFormData({ ...formData, vehicleColor: e.target.value })}
                        className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <input 
                        type="number" 
                        placeholder="Tahun" 
                        value={formData.vehicleYear}
                        onChange={e => setFormData({ ...formData, vehicleYear: Number(e.target.value) })}
                        className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: JADWAL & LAYANAN */}
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Jadwal & Kategori Servis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Layanan *</label>
                    <select 
                      value={formData.serviceCategory}
                      onChange={e => setFormData({ ...formData, serviceCategory: e.target.value as ServiceCategory })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="GENERAL_REPAIR">General Repair / Mesin</option>
                      <option value="BODY_REPAIR">Body Repair & Cat Oven</option>
                      <option value="SERVIS_BERKALA">Servis Berkala (Periodic Maintenance)</option>
                      <option value="KLAIM_ASURANSI">Klaim Asuransi</option>
                      <option value="DETAILING">Detailing & Ceramic Coating</option>
                      <option value="AC_KELISTRIKAN">AC & Kelistrikan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Kanal Booking</label>
                    <select 
                      value={formData.channel}
                      onChange={e => setFormData({ ...formData, channel: e.target.value as BookingChannel })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="WHATSAPP">WhatsApp Assistant</option>
                      <option value="ONLINE_WEB">Website Portal</option>
                      <option value="TELEPON">Telepon / Call In</option>
                      <option value="WALK_IN">Walk-In Customer</option>
                      <option value="MOBILE_APP">Mobile App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Booking *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.bookingDate}
                      onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Slot Waktu Kedatangan *</label>
                    <select 
                      value={formData.bookingTime}
                      onChange={e => setFormData({ ...formData, bookingTime: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Service Advisor (SA)</label>
                    <select 
                      value={formData.assignedSA}
                      onChange={e => setFormData({ ...formData, assignedSA: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {SERVICE_ADVISORS.map(sa => (
                        <option key={sa} value={sa}>{sa}</option>
                      ))}
                    </select>
                  </div>

                  {formData.serviceCategory === 'KLAIM_ASURANSI' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Perusahaan Asuransi</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Garda Oto / ACA / Sinarmas" 
                        value={formData.insuranceCompany}
                        onChange={e => setFormData({ ...formData, insuranceCompany: e.target.value })}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Keluhan / Rincian Pekerjaan</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Ganti oli mesin, cek rem bunyi berdecit, body baret pintu depan" 
                      value={formData.serviceDetails}
                      onChange={e => setFormData({ ...formData, serviceDetails: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: ANTAR JEMPUT & DP */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox"
                    id="isPickup"
                    checked={formData.isPickupRequired}
                    onChange={e => setFormData({ ...formData, isPickupRequired: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="isPickup" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Perlu Layanan Antar-Jemput Unit (Towing / Valet Driver)
                  </label>
                </div>

                {formData.isPickupRequired && (
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Penjemputan</label>
                    <input 
                      type="text" 
                      placeholder="Alamat lengkap lokasi jemput mobil..." 
                      value={formData.pickupAddress}
                      onChange={e => setFormData({ ...formData, pickupAddress: e.target.value })}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  Simpan Booking
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHECK-IN GATE PENERIMAAN MOBIL */}
      {/* ========================================================================= */}
      {isCheckInModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Check-In Unit Gate Masuk</h3>
                  <p className="text-xs text-slate-400">{selectedBooking.plateNumber} • {selectedBooking.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="p-3 bg-[#1E293B] border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">{selectedBooking.vehicleModel}</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{selectedBooking.plateNumber}</span>
                </div>
                <p className="text-xs text-slate-400">{selectedBooking.serviceDetails}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  <Gauge className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  Odometer Masuk (KM) *
                </label>
                <input 
                  type="number"
                  value={checkInKm}
                  onChange={e => setCheckInKm(Number(e.target.value))}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Level Bahan Bakar</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1/4', '1/2', '3/4', 'Full'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCheckInFuel(lvl)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        checkInFuel === lvl
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#1E293B] text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Fisik Penerimaan Awal</label>
                <textarea 
                  rows={2}
                  placeholder="Kondisi barang berharga di mobil, kondisi bodi awal serah terima..."
                  value={checkInNotes}
                  onChange={e => setCheckInNotes(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                Unit akan langsung tercatat aktif di <strong>Monitoring Gate Masuk</strong> dan siap diproses ke <strong>Estimasi & SPK</strong>.
              </div>

            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0B1120]/60 flex items-center justify-between gap-3">
              <button
                onClick={() => handleCompleteCheckIn(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Hanya Check-In
              </button>
              <button
                onClick={() => handleCompleteCheckIn(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Check-In & Lanjut Estimasi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESCHEDULE JADWAL */}
      {/* ========================================================================= */}
      {isRescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reschedule Reservasi</h3>
                  <p className="text-xs text-slate-400">{selectedBooking.id} • {selectedBooking.plateNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Baru *</label>
                <input 
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slot Waktu Baru *</label>
                <select 
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alasan Penjadwalan Ulang</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Pelanggan dinas luar kota / konfirmasi ketersediaan sparepart..."
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0B1120]/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                Simpan Jadwal Baru
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: WHATSAPP CONFIRMATION & REMINDER */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kirim Konfirmasi WhatsApp</h3>
                  <p className="text-xs text-slate-400">Pesan otomatis terformat resmi Bengkel Pro</p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Penerima: <strong className="text-white">{selectedBooking.customerName}</strong> ({selectedBooking.customerPhone})</span>
                <span className="text-emerald-400 font-semibold">Ready to Send</span>
              </div>

              {/* Chat Bubble Preview */}
              <div className="p-4 bg-[#1E293B] border border-slate-800 rounded-xl text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed shadow-inner max-h-64 overflow-y-auto custom-scrollbar">
                {generateWhatsAppMessage(selectedBooking)}
              </div>

            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0B1120]/60 flex items-center justify-between gap-3">
              <button
                onClick={() => handleCopyWhatsApp(generateWhatsAppMessage(selectedBooking))}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedText ? "Tersalin!" : "Salin Pesan"}
              </button>

              <a
                href={`https://wa.me/${selectedBooking.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generateWhatsAppMessage(selectedBooking))}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Buka WhatsApp Web
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAIL SLIP RESERVASI */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Slip Reservasi Servis</h3>
                  <p className="text-xs text-slate-400">Kode: {selectedBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Head Card */}
              <div className="p-4 bg-[#1E293B] border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Plat Nomor Kendaraan</span>
                  <p className="text-xl font-black text-white font-mono">{selectedBooking.plateNumber}</p>
                  <p className="text-xs text-slate-300">{selectedBooking.vehicleModel} ({selectedBooking.vehicleYear})</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[11px] px-2.5 py-1 rounded-lg border font-bold ${BOOKING_STATUS_CONFIG[selectedBooking.status]?.badgeClass}`}>
                    {BOOKING_STATUS_CONFIG[selectedBooking.status]?.label}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Kanal: {selectedBooking.channel}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#0B1120] border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pelanggan</span>
                  <p className="font-bold text-white mt-0.5">{selectedBooking.customerName}</p>
                  <p className="text-slate-400 mt-0.5">{selectedBooking.customerPhone}</p>
                  {selectedBooking.customerEmail && <p className="text-slate-500 mt-0.5">{selectedBooking.customerEmail}</p>}
                </div>

                <div className="p-3 bg-[#0B1120] border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Jadwal & Penanggung Jawab</span>
                  <p className="font-bold text-indigo-300 mt-0.5">{selectedBooking.bookingDate} • {selectedBooking.bookingTime}</p>
                  <p className="text-slate-300 mt-0.5">SA: {selectedBooking.assignedSA}</p>
                  <p className="text-slate-500 text-[11px]">Dibuat: {selectedBooking.createdAt}</p>
                </div>
              </div>

              {/* Layanan & Keluhan */}
              <div className="p-3 bg-[#0B1120] border border-slate-800 rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Rincian Keluhan & Layanan</span>
                <p className="text-slate-200">{selectedBooking.serviceDetails}</p>
                {selectedBooking.notes && (
                  <p className="text-slate-400 italic text-[11px] border-t border-slate-800 pt-1.5 mt-1.5">
                    Catatan Internal: {selectedBooking.notes}
                  </p>
                )}
              </div>

              {selectedBooking.insuranceCompany && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="font-bold text-purple-300">Klaim Asuransi Terintegrasi</p>
                      <p className="text-purple-400/80 text-[11px]">{selectedBooking.insuranceCompany}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.isPickupRequired && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
                  <p className="font-bold text-amber-300 mb-0.5">Layanan Antar-Jemput Unit Aktif</p>
                  <p className="text-amber-400/80 text-[11px]">{selectedBooking.pickupAddress || 'Alamat konfirmasi via telepon'}</p>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0B1120]/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">AutoCare ERP Bengkel Pro Reservasi</span>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: DELETE BOOKING CONFIRMATION */}
      {isDeleteModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-rose-900/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Hapus Data Booking</h3>
                  <p className="text-xs text-rose-400">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setSelectedBooking(null); }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-300">
                Apakah Anda yakin ingin menghapus data booking berikut secara permanen dari database?
              </p>
              
              <div className="p-3 bg-[#1E293B] border border-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Booking:</span>
                  <span className="font-bold text-white font-mono">{selectedBooking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pelanggan:</span>
                  <span className="font-bold text-white">{selectedBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kendaraan:</span>
                  <span className="font-bold text-indigo-400">{selectedBooking.vehicleModel} ({selectedBooking.plateNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jadwal:</span>
                  <span className="text-slate-300">{selectedBooking.bookingDate} • {selectedBooking.bookingTime}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0B1120]/60 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setSelectedBooking(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteBooking(selectedBooking)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Permanen
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
