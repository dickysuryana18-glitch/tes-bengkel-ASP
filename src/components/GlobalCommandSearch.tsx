import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Users, Car, Package, Clock, ShieldCheck, 
  ChevronRight, ArrowRight, CornerDownLeft, X, Sparkles,
  Phone, MessageSquare, AlertTriangle, CheckCircle2, Wrench,
  Tag, ExternalLink, Copy, Check, History, Trash2, ArrowUpRight,
  Filter, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export type SearchCategory = 'all' | 'clients' | 'spk' | 'inventory';

export interface SearchResultClient {
  type: 'client';
  id: string;
  name: string;
  phone: string;
  email: string;
  membershipTier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  clientType: 'Personal' | 'Corporate' | 'Insurance';
  vehicles: string[];
  totalVisits: number;
}

export interface SearchResultSPK {
  type: 'spk';
  id: string;
  spkNumber: string;
  plateNumber: string;
  vehicleModel: string;
  customerName: string;
  insuranceName: string;
  currentStage: string;
  bayLocation: string;
  leadMechanic: string;
  progressPercent: number;
  slaStatus: 'ON_TRACK' | 'WARNING' | 'OVERDUE';
  daysRemaining: number;
}

export interface SearchResultInventory {
  type: 'inventory';
  id: number;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  unitPrice: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export type SearchItem = SearchResultClient | SearchResultSPK | SearchResultInventory;

export interface RecentSearchEntry {
  id: string;
  kind: 'query' | 'item';
  queryText?: string;
  category?: SearchCategory;
  item?: SearchItem;
  timestamp: number;
}

// Comprehensive Mock Data for Global Search Index
const MOCK_CLIENTS: SearchResultClient[] = [
  {
    type: 'client',
    id: 'CUST-001',
    name: 'Hendra Gunawan',
    phone: '0812-9876-5432',
    email: 'hendra.gunawan@gmail.com',
    membershipTier: 'PLATINUM',
    clientType: 'Personal',
    vehicles: ['B 1982 SSY (Fortuner)', 'B 1001 HG (Alphard)'],
    totalVisits: 14
  },
  {
    type: 'client',
    id: 'CUST-002',
    name: 'Siti Aminah',
    phone: '0813-1122-3344',
    email: 'siti.aminah@corp.co.id',
    membershipTier: 'GOLD',
    clientType: 'Insurance',
    vehicles: ['B 2341 TZA (CR-V Turbo)'],
    totalVisits: 7
  },
  {
    type: 'client',
    id: 'CUST-003',
    name: 'Bambang Pratama',
    phone: '0812-8912-8912',
    email: 'bambang.pratama@outlook.com',
    membershipTier: 'SILVER',
    clientType: 'Insurance',
    vehicles: ['B 1420 KLA (HR-V SE)'],
    totalVisits: 4
  },
  {
    type: 'client',
    id: 'CUST-004',
    name: 'PT Graha Prima Logistik',
    phone: '0811-9988-7766',
    email: 'fleet@grahaprima.com',
    membershipTier: 'PLATINUM',
    clientType: 'Corporate',
    vehicles: ['B 9081 GHL (Hilux)', 'B 9082 GHL (Hilux)', 'B 9083 GHL (Dyna)'],
    totalVisits: 28
  },
  {
    type: 'client',
    id: 'CUST-005',
    name: 'Maya Kusuma Wardhani',
    phone: '0817-4455-6677',
    email: 'maya.kusuma@gmail.com',
    membershipTier: 'GOLD',
    clientType: 'Personal',
    vehicles: ['B 8899 MKW (Yaris Cross)', 'B 1234 MK (Civic RS)'],
    totalVisits: 6
  },
  {
    type: 'client',
    id: 'CUST-006',
    name: 'Denny Kurniawan',
    phone: '0818-7766-5544',
    email: 'denny.kurnia@techindo.co.id',
    membershipTier: 'BRONZE',
    clientType: 'Personal',
    vehicles: ['D 1209 XYZ (Pajero Sport)'],
    totalVisits: 2
  }
];

const MOCK_SPK: SearchResultSPK[] = [
  {
    type: 'spk',
    id: 'spk-1',
    spkNumber: 'SPK-2026-0881',
    plateNumber: 'B 1982 SSY',
    vehicleModel: 'Toyota Fortuner GR Sport 2.8',
    customerName: 'Hendra Gunawan',
    insuranceName: 'Garda Oto (Asuransi Astra)',
    currentStage: 'Cat Oven',
    bayLocation: 'Bay Oven Cat 2',
    leadMechanic: 'Budi Santoso',
    progressPercent: 75,
    slaStatus: 'ON_TRACK',
    daysRemaining: 1
  },
  {
    type: 'spk',
    id: 'spk-2',
    spkNumber: 'SPK-2026-0875',
    plateNumber: 'B 2341 TZA',
    vehicleModel: 'Honda CR-V Turbo Prestige',
    customerName: 'Siti Aminah',
    insuranceName: 'Asuransi ACA',
    currentStage: 'Dempul',
    bayLocation: 'Bay Dempul 3',
    leadMechanic: 'Dedi Kusnadi',
    progressPercent: 55,
    slaStatus: 'WARNING',
    daysRemaining: 0
  },
  {
    type: 'spk',
    id: 'spk-3',
    spkNumber: 'SPK-2026-0850',
    plateNumber: 'D 1209 XYZ',
    vehicleModel: 'Mitsubishi Pajero Sport Dakar',
    customerName: 'Denny Kurniawan',
    insuranceName: 'Jasindo Auto',
    currentStage: 'Ketok Magic',
    bayLocation: 'Bay Body Ketok 1',
    leadMechanic: 'Agus Riyadi',
    progressPercent: 35,
    slaStatus: 'OVERDUE',
    daysRemaining: -2
  },
  {
    type: 'spk',
    id: 'spk-4',
    spkNumber: 'SPK-2026-0892',
    plateNumber: 'B 1420 KLA',
    vehicleModel: 'Honda HR-V SE 1.5 CVT',
    customerName: 'Bambang Pratama',
    insuranceName: 'Garda Oto (Deductible Rp 300rb)',
    currentStage: 'Bongkar & Ketok',
    bayLocation: 'Bay Bongkar 2',
    leadMechanic: 'Rian Pratama',
    progressPercent: 20,
    slaStatus: 'ON_TRACK',
    daysRemaining: 3
  },
  {
    type: 'spk',
    id: 'spk-5',
    spkNumber: 'SPK-2026-0844',
    plateNumber: 'B 8899 MKW',
    vehicleModel: 'Toyota Yaris Cross HEV',
    customerName: 'Maya Kusuma Wardhani',
    insuranceName: 'Personal / Cash',
    currentStage: 'Poles & Detailing',
    bayLocation: 'Bay Poles 1',
    leadMechanic: 'Wawan Hermawan',
    progressPercent: 90,
    slaStatus: 'ON_TRACK',
    daysRemaining: 1
  },
  {
    type: 'spk',
    id: 'spk-6',
    spkNumber: 'SPK-2026-0830',
    plateNumber: 'B 9081 GHL',
    vehicleModel: 'Toyota Hilux 4x4 Double Cabin',
    customerName: 'PT Graha Prima Logistik',
    insuranceName: 'Sinarmas Fleet Insurance',
    currentStage: 'Final QC & Cuci',
    bayLocation: 'Bay QC 1',
    leadMechanic: 'Eko Prasetyo',
    progressPercent: 95,
    slaStatus: 'ON_TRACK',
    daysRemaining: 0
  }
];

const MOCK_INVENTORY: SearchResultInventory[] = [
  {
    type: 'inventory',
    id: 1,
    sku: 'BPR-FR-CRV22',
    name: 'Bumper Depan Honda CR-V 2022 Original',
    category: 'Body Part',
    stockQuantity: 2,
    minStockLevel: 3,
    unitPrice: 2500000,
    status: 'LOW_STOCK'
  },
  {
    type: 'inventory',
    id: 2,
    sku: 'PNT-CLR-HS',
    name: 'Clear Coat HS Premium 1L (Sikkens Autoclear)',
    category: 'Paint & Refinish',
    stockQuantity: 15,
    minStockLevel: 5,
    unitPrice: 450000,
    status: 'IN_STOCK'
  },
  {
    type: 'inventory',
    id: 3,
    sku: 'MSK-TP-2IN',
    name: 'Masking Tape 2 Inch 3M Heat Resistant 120C',
    category: 'Consumable',
    stockQuantity: 42,
    minStockLevel: 20,
    unitPrice: 15000,
    status: 'IN_STOCK'
  },
  {
    type: 'inventory',
    id: 4,
    sku: 'HMP-FR-PJR',
    name: 'Headlamp Kanan Pajero Sport Dakar Bi-LED',
    category: 'Electrical & Lamp',
    stockQuantity: 0,
    minStockLevel: 1,
    unitPrice: 3200000,
    status: 'OUT_OF_STOCK'
  },
  {
    type: 'inventory',
    id: 5,
    sku: 'CLP-PL-100',
    name: 'Klip Plastik Bumper Universal (Pack 100 Pcs)',
    category: 'Consumable',
    stockQuantity: 5,
    minStockLevel: 10,
    unitPrice: 55000,
    status: 'LOW_STOCK'
  },
  {
    type: 'inventory',
    id: 6,
    sku: 'FND-LH-INZ',
    name: 'Fender Kiri Toyota Kijang Innova Zenix',
    category: 'Body Part',
    stockQuantity: 4,
    minStockLevel: 2,
    unitPrice: 1850000,
    status: 'IN_STOCK'
  },
  {
    type: 'inventory',
    id: 7,
    sku: 'PNT-BS-BLK',
    name: 'Basecoat Jet Black Metallic 209 (1 Liter)',
    category: 'Paint & Refinish',
    stockQuantity: 8,
    minStockLevel: 3,
    unitPrice: 320000,
    status: 'IN_STOCK'
  },
  {
    type: 'inventory',
    id: 8,
    sku: 'BRK-PAD-FTN',
    name: 'Brake Pad Depan Toyota Fortuner Genuine Part',
    category: 'General Repair',
    stockQuantity: 1,
    minStockLevel: 3,
    unitPrice: 850000,
    status: 'LOW_STOCK'
  }
];

const INITIAL_RECENT_SEARCHES: RecentSearchEntry[] = [
  {
    id: 'recent-1',
    kind: 'item',
    item: MOCK_SPK[0],
    timestamp: Date.now() - 1000 * 60 * 8 // 8 mins ago
  },
  {
    id: 'recent-2',
    kind: 'query',
    queryText: 'Hendra Gunawan',
    category: 'clients',
    timestamp: Date.now() - 1000 * 60 * 25 // 25 mins ago
  },
  {
    id: 'recent-3',
    kind: 'item',
    item: MOCK_INVENTORY[0],
    timestamp: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
  },
  {
    id: 'recent-4',
    kind: 'query',
    queryText: 'Clear Coat Sikkens',
    category: 'inventory',
    timestamp: Date.now() - 1000 * 60 * 60 * 5 // 5 hours ago
  }
];

const POPULAR_TAG_SUGGESTIONS = [
  { tag: 'Client', prefix: '#client', icon: Users, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { tag: 'Order', prefix: '#order', icon: Car, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { tag: 'Part', prefix: '#part', icon: Package, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { tag: 'Fortuner', prefix: 'Fortuner', icon: Search, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { tag: 'Bumper', prefix: 'Bumper', icon: Search, color: 'text-slate-300 bg-slate-800 border-slate-700' },
  { tag: 'Garda Oto', prefix: 'Garda Oto', icon: ShieldCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { tag: 'Cat Oven', prefix: 'Cat Oven', icon: Sparkles, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
];

interface GlobalCommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export function GlobalCommandSearch({ isOpen, onClose, onNavigateTab }: GlobalCommandSearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  
  // Persistent Recent Searches State
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>(() => {
    try {
      const saved = localStorage.getItem('bengkelpro_search_history_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_RECENT_SEARCHES;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bengkelpro_search_history_v1', JSON.stringify(recentSearches));
    } catch {
      // Ignore
    }
  }, [recentSearches]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
      setShowHistoryDropdown(false);
    } else {
      setQuery('');
      setCategory('all');
    }
  }, [isOpen]);

  // Parse tag prefixes typed by the user (e.g. #client, #order, #part, #spk)
  const effectiveCategory = useMemo<SearchCategory>(() => {
    const qLower = query.toLowerCase().trim();
    if (qLower.startsWith('#client') || qLower.startsWith('@client') || qLower.startsWith('client:')) {
      return 'clients';
    }
    if (qLower.startsWith('#order') || qLower.startsWith('#spk') || qLower.startsWith('@order') || qLower.startsWith('order:')) {
      return 'spk';
    }
    if (qLower.startsWith('#part') || qLower.startsWith('#item') || qLower.startsWith('@part') || qLower.startsWith('part:')) {
      return 'inventory';
    }
    return category;
  }, [query, category]);

  // Clean query string (strip tag prefix if present for actual text search)
  const cleanSearchQuery = useMemo(() => {
    let q = query.trim();
    const prefixes = ['#client', '@client', 'client:', '#order', '#spk', '@order', 'order:', '#part', '#item', '@part', 'part:'];
    for (const p of prefixes) {
      if (q.toLowerCase().startsWith(p)) {
        q = q.slice(p.length).trim();
        break;
      }
    }
    return q.toLowerCase();
  }, [query]);

  // Filter items across clients, active SPK, and inventory
  const filteredItems = useMemo<SearchItem[]>(() => {
    const q = cleanSearchQuery;

    let clientMatches = MOCK_CLIENTS;
    let spkMatches = MOCK_SPK;
    let inventoryMatches = MOCK_INVENTORY;

    if (q) {
      clientMatches = MOCK_CLIENTS.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.clientType.toLowerCase().includes(q) ||
        c.vehicles.some(v => v.toLowerCase().includes(q))
      );

      spkMatches = MOCK_SPK.filter(s => 
        s.spkNumber.toLowerCase().includes(q) ||
        s.plateNumber.toLowerCase().includes(q) ||
        s.vehicleModel.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.insuranceName.toLowerCase().includes(q) ||
        s.currentStage.toLowerCase().includes(q) ||
        s.leadMechanic.toLowerCase().includes(q) ||
        s.bayLocation.toLowerCase().includes(q)
      );

      inventoryMatches = MOCK_INVENTORY.filter(i => 
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }

    if (effectiveCategory === 'clients') return clientMatches;
    if (effectiveCategory === 'spk') return spkMatches;
    if (effectiveCategory === 'inventory') return inventoryMatches;

    // Default 'all': combine all
    return [...spkMatches, ...clientMatches, ...inventoryMatches];
  }, [cleanSearchQuery, effectiveCategory]);

  // Record a search query or item selection into history
  const addRecentSearch = (entry: Omit<RecentSearchEntry, 'id' | 'timestamp'>) => {
    setRecentSearches(prev => {
      const newEntry: RecentSearchEntry = {
        ...entry,
        id: `recent-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: Date.now()
      };

      // Filter out duplicate entries
      const filtered = prev.filter(item => {
        if (entry.kind === 'query') {
          return !(item.kind === 'query' && item.queryText?.toLowerCase() === entry.queryText?.toLowerCase());
        }
        if (entry.kind === 'item' && entry.item && item.kind === 'item' && item.item) {
          return item.item.id !== entry.item.id;
        }
        return true;
      });

      return [newEntry, ...filtered].slice(0, 12);
    });
  };

  const handleDeleteHistoryItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentSearches(prev => prev.filter(item => item.id !== id));
    toast.success("Riwayat pencarian dihapus");
  };

  const handleClearAllHistory = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentSearches([]);
    toast.success("Seluruh riwayat pencarian telah dibersihkan");
  };

  // Reset selectedIndex when results or category change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category, showHistoryDropdown]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showHistoryDropdown) {
          setShowHistoryDropdown(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxLen = showHistoryDropdown ? recentSearches.length : filteredItems.length;
        if (maxLen > 0) {
          setSelectedIndex(prev => (prev < maxLen - 1 ? prev + 1 : 0));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const maxLen = showHistoryDropdown ? recentSearches.length : filteredItems.length;
        if (maxLen > 0) {
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxLen - 1));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (showHistoryDropdown) {
          const selectedHistory = recentSearches[selectedIndex];
          if (selectedHistory) {
            handleSelectHistoryEntry(selectedHistory);
          }
        } else {
          const selected = filteredItems[selectedIndex];
          if (selected) {
            handleSelectResult(selected);
          } else if (query.trim()) {
            addRecentSearch({
              kind: 'query',
              queryText: query.trim(),
              category: effectiveCategory
            });
            toast.info(`Mencari "${query.trim()}"...`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, recentSearches, showHistoryDropdown, selectedIndex, query, effectiveCategory]);

  const handleSelectResult = (item: SearchItem) => {
    // Add to history
    addRecentSearch({
      kind: 'item',
      item
    });

    if (item.type === 'client') {
      onNavigateTab('crm');
      toast.success(`Membuka profil CRM pelanggan: ${item.name}`, {
        description: `Kendaraan: ${item.vehicles.join(', ')}`
      });
    } else if (item.type === 'spk') {
      onNavigateTab('monitoring');
      toast.success(`Membuka monitoring Work Order: ${item.spkNumber}`, {
        description: `Unit: ${item.plateNumber} (${item.vehicleModel}) - Tahap: ${item.currentStage}`
      });
    } else if (item.type === 'inventory') {
      onNavigateTab('inventory');
      toast.success(`Membuka manajemen stok sparepart: ${item.name}`, {
        description: `SKU: ${item.sku} | Stok: ${item.stockQuantity} unit`
      });
    }
    onClose();
  };

  const handleSelectHistoryEntry = (entry: RecentSearchEntry) => {
    if (entry.kind === 'query' && entry.queryText) {
      setQuery(entry.queryText);
      if (entry.category) setCategory(entry.category);
      setShowHistoryDropdown(false);
      inputRef.current?.focus();
      toast.info(`Mengulang pencarian: "${entry.queryText}"`);
    } else if (entry.kind === 'item' && entry.item) {
      handleSelectResult(entry.item);
    }
  };

  const handleSelectTagSuggestion = (prefix: string) => {
    if (prefix === '#client') {
      setCategory('clients');
      setQuery('#client ');
    } else if (prefix === '#order') {
      setCategory('spk');
      setQuery('#order ');
    } else if (prefix === '#part') {
      setCategory('inventory');
      setQuery('#part ');
    } else {
      setQuery(prefix);
    }
    setShowHistoryDropdown(false);
    inputRef.current?.focus();
  };

  const handleCopyText = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} disalin ke clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDays = Math.floor(diffHour / 24);
    return `${diffDays} hari lalu`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#131D33] relative">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (showHistoryDropdown && e.target.value.trim()) {
                setShowHistoryDropdown(false);
              }
            }}
            onFocus={() => {
              if (!query.trim() && recentSearches.length > 0) {
                setShowHistoryDropdown(true);
              }
            }}
            placeholder="Cari SPK (#order), customer (#client), part (#part), atau no. polisi..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />

          {/* History Dropdown Toggle Button */}
          <button
            onClick={() => setShowHistoryDropdown(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showHistoryDropdown
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Buka / Tutup Riwayat Pencarian"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Riwayat</span>
            {recentSearches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 font-mono text-slate-300">
                {recentSearches.length}
              </span>
            )}
          </button>

          {query && (
            <button 
              onClick={() => {
                setQuery('');
                setCategory('all');
                setShowHistoryDropdown(true);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Categories & Tag Chips Filter Bar */}
        <div className="px-4 py-2.5 bg-[#0B1120] border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 pr-1">
              <Tag className="w-3 h-3 text-indigo-400" /> Kategori:
            </span>

            {/* All Category Tag */}
            <button
              onClick={() => {
                setCategory('all');
                setShowHistoryDropdown(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                effectiveCategory === 'all' && !showHistoryDropdown
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Semua ({MOCK_SPK.length + MOCK_CLIENTS.length + MOCK_INVENTORY.length})
            </button>

            {/* Client Tag */}
            <button
              onClick={() => {
                setCategory('clients');
                setShowHistoryDropdown(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border ${
                effectiveCategory === 'clients' && !showHistoryDropdown
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30 font-bold'
                  : 'text-purple-300/80 bg-purple-950/20 hover:bg-purple-950/40 border-purple-800/40'
              }`}
              title="Filter khusus data Pelanggan & CRM (#client)"
            >
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-bold">Client</span>
              <span className="text-[10px] opacity-75 font-mono">({MOCK_CLIENTS.length})</span>
            </button>

            {/* Order (SPK) Tag */}
            <button
              onClick={() => {
                setCategory('spk');
                setShowHistoryDropdown(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border ${
                effectiveCategory === 'spk' && !showHistoryDropdown
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sm shadow-sky-600/30 font-bold'
                  : 'text-sky-300/80 bg-sky-950/20 hover:bg-sky-950/40 border-sky-800/40'
              }`}
              title="Filter khusus Work Order SPK & Progres Repair (#order)"
            >
              <Car className="w-3.5 h-3.5 text-sky-300" />
              <span className="font-bold">Order</span>
              <span className="text-[10px] opacity-75 font-mono">({MOCK_SPK.length})</span>
            </button>

            {/* Part (Inventory) Tag */}
            <button
              onClick={() => {
                setCategory('inventory');
                setShowHistoryDropdown(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 border ${
                effectiveCategory === 'inventory' && !showHistoryDropdown
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/30 font-bold'
                  : 'text-emerald-300/80 bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-800/40'
              }`}
              title="Filter khusus Stok Sparepart & Bahan Cat (#part)"
            >
              <Package className="w-3.5 h-3.5 text-emerald-300" />
              <span className="font-bold">Part</span>
              <span className="text-[10px] opacity-75 font-mono">({MOCK_INVENTORY.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-slate-400 hidden md:block">
              Hasil: <strong className="text-white font-mono">{filteredItems.length}</strong>
            </span>
          </div>
        </div>

        {/* Quick Popular Search Tag Chips (Shown below categories) */}
        <div className="px-4 py-2 bg-[#0B1120]/90 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold shrink-0">
            Saran Cepat:
          </span>
          {POPULAR_TAG_SUGGESTIONS.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSelectTagSuggestion(item.prefix)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1 transition-colors shrink-0 hover:scale-105 ${item.color}`}
              >
                <IconComponent className="w-3 h-3" />
                <span>{item.tag}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN BODY: History Dropdown View vs Search Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-[260px]">
          {/* HISTORY DROPDOWN VIEW */}
          {showHistoryDropdown ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Riwayat Pencarian Terakhir
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">({recentSearches.length})</span>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">Belum ada riwayat pencarian</p>
                  <p className="text-xs text-slate-500">Pencarian dan data yang Anda buka akan otomatis tersimpan di sini</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recentSearches.map((entry, index) => {
                    const isSelected = index === selectedIndex;

                    if (entry.kind === 'query' && entry.queryText) {
                      return (
                        <div
                          key={entry.id}
                          data-index={index}
                          onClick={() => handleSelectHistoryEntry(entry)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-amber-950/30 border-amber-500/40 shadow-sm'
                              : 'bg-[#1E293B]/40 border-slate-800/80 hover:bg-[#1E293B] hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                              <Search className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-200 truncate">
                                  &quot;{entry.queryText}&quot;
                                </span>
                                {entry.category && entry.category !== 'all' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                    {entry.category === 'clients' ? 'Client' : entry.category === 'spk' ? 'Order' : 'Part'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(entry.timestamp)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-indigo-400 group-hover:underline flex items-center gap-0.5 font-medium">
                              Cari Ulang <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(entry.id, e)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                              title="Hapus riwayat ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (entry.kind === 'item' && entry.item) {
                      const it = entry.item;
                      return (
                        <div
                          key={entry.id}
                          data-index={index}
                          onClick={() => handleSelectHistoryEntry(entry)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/40 shadow-sm'
                              : 'bg-[#1E293B]/40 border-slate-800/80 hover:bg-[#1E293B] hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              it.type === 'client' 
                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                : it.type === 'spk'
                                ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {it.type === 'client' && <Users className="w-4 h-4" />}
                              {it.type === 'spk' && <Car className="w-4 h-4" />}
                              {it.type === 'inventory' && <Package className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">
                                  {it.type === 'client' ? it.name : it.type === 'spk' ? `${it.spkNumber} - ${it.plateNumber}` : it.name}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  it.type === 'client'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : it.type === 'spk'
                                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {it.type === 'client' ? 'Client' : it.type === 'spk' ? 'Order' : 'Part'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {it.type === 'client' && `Kendaraan: ${it.vehicles.join(', ')}`}
                                {it.type === 'spk' && `${it.vehicleModel} • Stage: ${it.currentStage}`}
                                {it.type === 'inventory' && `SKU: ${it.sku} • Stok: ${it.stockQuantity}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              {formatTimeAgo(entry.timestamp)}
                            </span>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(entry.id, e)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                              title="Hapus riwayat ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          ) : (
            /* SEARCH RESULTS LIST VIEW */
            filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-medium text-slate-400">Tidak ada hasil yang cocok dengan &quot;{query}&quot;</p>
                <p className="text-xs text-slate-500">Coba gunakan tag seperti <strong>#client</strong>, <strong>#order</strong>, atau <strong>#part</strong></p>
                <button
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                    setShowHistoryDropdown(true);
                  }}
                  className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" /> Lihat Riwayat Pencarian
                </button>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;

                if (item.type === 'spk') {
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-500/50 shadow-md'
                          : 'bg-[#1E293B]/60 border-slate-800/80 hover:bg-[#1E293B] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                          <Car className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                              <Car className="w-3 h-3" /> Order
                            </span>
                            <span className="text-xs font-bold text-white font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                              {item.spkNumber}
                            </span>
                            <span className="text-xs font-bold text-sky-300">
                              {item.plateNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Tahap: {item.currentStage}
                            </span>
                            {item.slaStatus === 'OVERDUE' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> SLA Lewat ({Math.abs(item.daysRemaining)}h)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-medium truncate">
                            {item.vehicleModel} • <span className="text-slate-400">Pemilik: {item.customerName}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span>Lokasi: <strong className="text-slate-300">{item.bayLocation}</strong></span>
                            <span>Mekanik: <strong className="text-slate-300">{item.leadMechanic}</strong></span>
                            <span>Asuransi: <strong className="text-sky-400">{item.insuranceName}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right side stats & action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                              <div 
                                className="bg-sky-500 h-full rounded-full" 
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-sky-400">{item.progressPercent}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400">Monitoring Unit</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleCopyText(e, item.spkNumber, 'Nomor SPK')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Salin No. SPK"
                          >
                            {copiedId === item.spkNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleSelectResult(item)}
                            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            Buka <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === 'client') {
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/50 shadow-md'
                          : 'bg-[#1E293B]/60 border-slate-800/80 hover:bg-[#1E293B] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Client
                            </span>
                            <span className="text-xs font-bold text-white">
                              {item.name}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              item.membershipTier === 'PLATINUM' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : item.membershipTier === 'GOLD'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                            }`}>
                              {item.membershipTier} Tier
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                              {item.clientType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">
                            Kendaraan: <span className="text-slate-200 font-semibold">{item.vehicles.join(', ')}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span>Telp: <strong className="text-slate-300">{item.phone}</strong></span>
                            <span>Email: <strong className="text-slate-300">{item.email}</strong></span>
                            <span>Kunjungan: <strong className="text-purple-300">{item.totalVisits} kali</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right side actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const cleanPhone = item.phone.replace(/[^0-9]/g, '');
                            window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}`, '_blank');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Chat WhatsApp Pelanggan"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => handleSelectResult(item)}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          Lihat CRM <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }

                if (item.type === 'inventory') {
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
                          : 'bg-[#1E293B]/60 border-slate-800/80 hover:bg-[#1E293B] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Package className="w-3 h-3" /> Part
                            </span>
                            <span className="text-xs font-bold text-emerald-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                              {item.sku}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                              {item.category}
                            </span>
                            <span>Harga: <strong className="text-white font-mono">Rp {item.unitPrice.toLocaleString('id-ID')}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Stock level indicator & button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <div className="text-left sm:text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.status === 'IN_STOCK'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'LOW_STOCK'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {item.status === 'IN_STOCK' ? 'Stok Aman' : item.status === 'LOW_STOCK' ? 'Stok Menipis' : 'Stok Kosong'}
                          </span>
                          <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                            Tersedia: {item.stockQuantity} unit <span className="text-[10px] text-slate-500">(Min: {item.minStockLevel})</span>
                          </p>
                        </div>

                        <button
                          onClick={() => handleSelectResult(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          Buka Stok <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )
          )}
        </div>

        {/* Keyboard Shortcuts Footer */}
        <div className="p-3 bg-[#0B1120] border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↓</kbd>
              Navigasi
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">ENTER</kbd>
              Pilih Item
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">ESC</kbd>
              Tutup
            </span>
          </div>

          <div className="text-slate-500 text-[10px] flex items-center gap-2">
            <span>Tags: <code className="text-purple-400">#client</code>, <code className="text-sky-400">#order</code>, <code className="text-emerald-400">#part</code></span>
            <span>• AutoCare ERP</span>
          </div>
        </div>

      </div>
    </div>
  );
}
