export type BookingStatus = 
  | 'MENUNGGU_KONFIRMASI' 
  | 'TERKONFIRMASI' 
  | 'TIBA' 
  | 'PROSES_SPK' 
  | 'BATAL' 
  | 'RESCHEDULE';

export type ServiceCategory = 
  | 'BODY_REPAIR' 
  | 'GENERAL_REPAIR' 
  | 'SERVIS_BERKALA' 
  | 'KLAIM_ASURANSI' 
  | 'DETAILING' 
  | 'AC_KELISTRIKAN';

export type BookingChannel = 
  | 'ONLINE_WEB' 
  | 'WHATSAPP' 
  | 'MOBILE_APP' 
  | 'TELEPON' 
  | 'WALK_IN';

export interface BookingItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  plateNumber: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  serviceCategory: ServiceCategory;
  serviceDetails: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // e.g. "08:30 WIB"
  channel: BookingChannel;
  status: BookingStatus;
  assignedSA: string;
  notes: string;
  estimatedDurationHours: number;
  insuranceCompany?: string;
  isPickupRequired: boolean;
  pickupAddress?: string;
  depositPaid: number;
  createdAt: string;
  checkInTime?: string;
  workOrderId?: string;
  kmCurrent?: number;
}

export const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'BKG-2026-0801',
    customerName: 'Hendra Gunawan',
    customerPhone: '0812-9876-5432',
    customerEmail: 'hendra.gunawan@gmail.com',
    plateNumber: 'B 1982 SSY',
    vehicleModel: 'Toyota Fortuner 2.8 GR Sport',
    vehicleYear: 2023,
    vehicleColor: 'Super White II',
    serviceCategory: 'BODY_REPAIR',
    serviceDetails: 'Perbaikan bumper depan terserempet trotoar & cat panel pintu kiri depan',
    bookingDate: '2026-08-31',
    bookingTime: '08:30 WIB',
    channel: 'WHATSAPP',
    status: 'TERKONFIRMASI',
    assignedSA: 'Rian Hidayat, S.T.',
    notes: 'Pelanggan minta pengerjaan cepat express 2 hari selesai karena unit operasional.',
    estimatedDurationHours: 16,
    insuranceCompany: 'Garda Oto (Astra Buana)',
    isPickupRequired: false,
    depositPaid: 500000,
    createdAt: '2026-08-30 14:22',
  },
  {
    id: 'BKG-2026-0802',
    customerName: 'Siti Rahmawati',
    customerPhone: '0813-1122-3344',
    customerEmail: 'siti.rahma@yahoo.com',
    plateNumber: 'B 1420 WKR',
    vehicleModel: 'Honda HR-V 1.5 Turbo RS',
    vehicleYear: 2022,
    vehicleColor: 'Ignite Red Metallic',
    serviceCategory: 'SERVIS_BERKALA',
    serviceDetails: 'Servis Berkala 40.000 KM + Ganti Oli Full Synthetic & Tune Up Mesin',
    bookingDate: '2026-08-31',
    bookingTime: '09:00 WIB',
    channel: 'ONLINE_WEB',
    status: 'TIBA',
    assignedSA: 'Ahmad Fauzi',
    notes: 'Keluhan bunyi berdecit saat rem mendadak di jalan menurun.',
    estimatedDurationHours: 3,
    isPickupRequired: false,
    depositPaid: 0,
    createdAt: '2026-08-29 19:40',
    checkInTime: '08:50 WIB',
    kmCurrent: 39820,
    workOrderId: 'SPK-2026-0891'
  },
  {
    id: 'BKG-2026-0803',
    customerName: 'PT Samudera Logistik (Bpk. Toni)',
    customerPhone: '0857-8901-2345',
    customerEmail: 'toni.fleet@samuderalogistik.co.id',
    plateNumber: 'B 9044 UXX',
    vehicleModel: 'Mitsubishi Pajero Sport Dakar 4x2',
    vehicleYear: 2021,
    vehicleColor: 'Deep Bronze Metallic',
    serviceCategory: 'KLAIM_ASURANSI',
    serviceDetails: 'Klaim tabrakan belakang: Bagasi penyok, lampu stop kanan pecah, bumper belakang ganti',
    bookingDate: '2026-08-31',
    bookingTime: '10:00 WIB',
    channel: 'TELEPON',
    status: 'MENUNGGU_KONFIRMASI',
    assignedSA: 'Denny Hendrawan',
    notes: 'Surat klaim asuransi ACA sudah terbit No. CLM-2026-ACA-092. Menunggu approval final SPK.',
    estimatedDurationHours: 32,
    insuranceCompany: 'Asuransi Central Asia (ACA)',
    isPickupRequired: true,
    pickupAddress: 'Jl. R.E. Martadinata No. 88, Tanjung Priok, Jakarta Utara',
    depositPaid: 0,
    createdAt: '2026-08-31 07:15',
  },
  {
    id: 'BKG-2026-0804',
    customerName: 'dr. Kevin Sanjaya, Sp.B',
    customerPhone: '0811-3456-7890',
    customerEmail: 'kevin.sanjaya@rsmedika.id',
    plateNumber: 'B 8891 RFS',
    vehicleModel: 'Hyundai Ioniq 5 Signature Long Range',
    vehicleYear: 2023,
    vehicleColor: 'Gravity Gold Matte',
    serviceCategory: 'DETAILING',
    serviceDetails: 'Full Body Ceramic Coating 9H (3 Layers) + Interior Deep Steam Cleaning',
    bookingDate: '2026-08-31',
    bookingTime: '11:00 WIB',
    channel: 'MOBILE_APP',
    status: 'TERKONFIRMASI',
    assignedSA: 'Rian Hidayat, S.T.',
    notes: 'Cat doff / matte membutuhkan compound khusus non-abrasive Nano Car Pro.',
    estimatedDurationHours: 8,
    isPickupRequired: false,
    depositPaid: 1000000,
    createdAt: '2026-08-28 11:10',
  },
  {
    id: 'BKG-2026-0805',
    customerName: 'Farhan Maulana',
    customerPhone: '0818-0987-6543',
    customerEmail: 'farhan.m@gmail.com',
    plateNumber: 'D 1890 SKM',
    vehicleModel: 'Toyota Kijang Innova Zenix 2.0 V CVT',
    vehicleYear: 2024,
    vehicleColor: 'Attitude Black Mica',
    serviceCategory: 'GENERAL_REPAIR',
    serviceDetails: 'Cek Getaran Roda Depan saat Kecepatan > 80 km/jam, Spooring 3D & Balancing',
    bookingDate: '2026-08-31',
    bookingTime: '13:30 WIB',
    channel: 'WHATSAPP',
    status: 'MENUNGGU_KONFIRMASI',
    assignedSA: 'Ahmad Fauzi',
    notes: 'Sudah pernah balance di bengkel lain masih getar, ingin cek bearing dan suspensi.',
    estimatedDurationHours: 2,
    isPickupRequired: false,
    depositPaid: 0,
    createdAt: '2026-08-31 08:00',
  },
  {
    id: 'BKG-2026-0806',
    customerName: 'Anindya Putri',
    customerPhone: '0812-7788-9900',
    customerEmail: 'anindya.p@outlook.com',
    plateNumber: 'B 2334 TZZ',
    vehicleModel: 'Mazda CX-5 GT',
    vehicleYear: 2022,
    vehicleColor: 'Soul Red Crystal Metallic',
    serviceCategory: 'AC_KELISTRIKAN',
    serviceDetails: 'AC Kurang Dingin siang hari, Kuras Freon R134a & ganti Filter Kabin Karbon',
    bookingDate: '2026-08-31',
    bookingTime: '14:30 WIB',
    channel: 'ONLINE_WEB',
    status: 'TERKONFIRMASI',
    assignedSA: 'Denny Hendrawan',
    notes: 'Pelanggan bersedia menunggu di VIP Customer Lounge.',
    estimatedDurationHours: 2,
    isPickupRequired: false,
    depositPaid: 200000,
    createdAt: '2026-08-30 16:45',
  },
  {
    id: 'BKG-2026-0807',
    customerName: 'Budi Hartono (PT Jaya Makmur)',
    customerPhone: '0819-2345-6789',
    customerEmail: 'budi@jayamakmur.co.id',
    plateNumber: 'B 1010 JYM',
    vehicleModel: 'Toyota Hilux Double Cabin 2.4 V 4x4',
    vehicleYear: 2021,
    vehicleColor: 'Silver Metallic',
    serviceCategory: 'BODY_REPAIR',
    serviceDetails: 'Ketok fender kanan & kiri penyok karena muatan proyek + repaint full bak belakang',
    bookingDate: '2026-09-01',
    bookingTime: '08:30 WIB',
    channel: 'WALK_IN',
    status: 'TERKONFIRMASI',
    assignedSA: 'Rian Hidayat, S.T.',
    notes: 'Mobil tambang / operasional, estimasi pengerjaan 4 hari kerja.',
    estimatedDurationHours: 28,
    isPickupRequired: false,
    depositPaid: 1500000,
    createdAt: '2026-08-30 10:15',
  },
  {
    id: 'BKG-2026-0808',
    customerName: 'Clarissa Natalia',
    customerPhone: '0878-1234-9988',
    customerEmail: 'clarissa.n@gmail.com',
    plateNumber: 'B 777 CLN',
    vehicleModel: 'BMW 330i M Sport (G20)',
    vehicleYear: 2023,
    vehicleColor: 'Portimao Blue Metallic',
    serviceCategory: 'KLAIM_ASURANSI',
    serviceDetails: 'Baret sisi kanan akibat tersenggol motor di parkiran mal. Klaim Asuransi Sinarmas.',
    bookingDate: '2026-09-01',
    bookingTime: '10:30 WIB',
    channel: 'WHATSAPP',
    status: 'MENUNGGU_KONFIRMASI',
    assignedSA: 'Ahmad Fauzi',
    notes: 'Pelanggan minta cat oven persis original pabrik standarisasi BMW Glasurit.',
    estimatedDurationHours: 18,
    insuranceCompany: 'Asuransi Sinarmas',
    isPickupRequired: true,
    pickupAddress: 'Apartemen Senopati Suites Tower 2, Jakarta Selatan',
    depositPaid: 0,
    createdAt: '2026-08-31 06:50',
  },
  {
    id: 'BKG-2026-0809',
    customerName: 'Agus Setiawan',
    customerPhone: '0813-8877-6655',
    customerEmail: 'agus.setiawan88@gmail.com',
    plateNumber: 'B 1678 PLQ',
    vehicleModel: 'Honda Brio RS Urbanite',
    vehicleYear: 2022,
    vehicleColor: 'Carnival Yellow',
    serviceCategory: 'SERVIS_BERKALA',
    serviceDetails: 'Ganti Oli Mesin + Filter Oli + Cek Minyak Rem & Aki',
    bookingDate: '2026-08-30',
    bookingTime: '15:00 WIB',
    channel: 'ONLINE_WEB',
    status: 'BATAL',
    assignedSA: 'Denny Hendrawan',
    notes: 'Dibatalkan oleh pelanggan karena ada keperluan dinas luar kota mendadak.',
    estimatedDurationHours: 1.5,
    isPickupRequired: false,
    depositPaid: 0,
    createdAt: '2026-08-28 14:00',
  }
];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, { label: string; badgeColor: string; iconName: string }> = {
  BODY_REPAIR: {
    label: 'Body Repair & Cat',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    iconName: 'Wrench'
  },
  GENERAL_REPAIR: {
    label: 'General Repair / Mesin',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    iconName: 'Cog'
  },
  SERVIS_BERKALA: {
    label: 'Servis Berkala (PM)',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconName: 'CalendarCheck'
  },
  KLAIM_ASURANSI: {
    label: 'Klaim Asuransi',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    iconName: 'ShieldCheck'
  },
  DETAILING: {
    label: 'Detailing & Coating',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    iconName: 'Sparkles'
  },
  AC_KELISTRIKAN: {
    label: 'AC & Kelistrikan',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    iconName: 'Zap'
  }
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; badgeClass: string; desc: string }> = {
  MENUNGGU_KONFIRMASI: {
    label: 'Menunggu Konfirmasi',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse',
    desc: 'Customer mengajukan booking, butuh verifikasi SA'
  },
  TERKONFIRMASI: {
    label: 'Terkonfirmasi (Jadwal Siap)',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    desc: 'Slot kedatangan telah dialokasikan'
  },
  TIBA: {
    label: 'Unit Tiba (Check-In)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    desc: 'Kendaraan sudah masuk workshop gate'
  },
  PROSES_SPK: {
    label: 'Diterbitkan SPK',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    desc: 'Telah diproses ke estimasi / pengerjaan bengkel'
  },
  RESCHEDULE: {
    label: 'Jadwal Ulang',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    desc: 'Permintaan pindah waktu oleh pelanggan'
  },
  BATAL: {
    label: 'Dibatalkan',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    desc: 'Reservasi tidak jadi dilaksanakan'
  }
};

export const TIME_SLOTS = [
  '08:00 WIB',
  '08:30 WIB',
  '09:00 WIB',
  '09:30 WIB',
  '10:00 WIB',
  '10:30 WIB',
  '11:00 WIB',
  '13:00 WIB',
  '13:30 WIB',
  '14:00 WIB',
  '14:30 WIB',
  '15:00 WIB',
  '15:30 WIB',
  '16:00 WIB'
];

export const SERVICE_ADVISORS = [
  'Rian Hidayat, S.T.',
  'Ahmad Fauzi',
  'Denny Hendrawan',
  'Bayu Pratama',
  'Surya Kencana'
];

export const BOOKINGS_STORAGE_KEY = 'autocare_erp_bookings_db_v1';

export function getStoredBookings(): BookingItem[] {
  try {
    const saved = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored bookings:', e);
  }
  // Initialize with INITIAL_BOOKINGS if not found
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
  } catch (e) {
    console.error('Error seeding initial bookings to localStorage:', e);
  }
  return INITIAL_BOOKINGS;
}

export function saveBookingsToStorage(bookings: BookingItem[]): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent('autocare_bookings_updated', { detail: bookings }));
  } catch (e) {
    console.error('Error saving bookings to storage:', e);
  }
}

export function resetBookingsToDefault(): BookingItem[] {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
    window.dispatchEvent(new CustomEvent('autocare_bookings_updated', { detail: INITIAL_BOOKINGS }));
  } catch (e) {
    console.error('Error resetting bookings:', e);
  }
  return INITIAL_BOOKINGS;
}
