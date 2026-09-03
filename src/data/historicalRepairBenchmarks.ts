export interface StageBenchmark {
  stageId: string;
  stageName: string;
  historicalAvgHours: number; // Historical mean duration in hours
  slaWarningThresholdHours: number; // When warning alert triggers
  slaCriticalThresholdHours: number; // When critical alert triggers
  standardDeviationHours: number;
}

export interface DamageClassBenchmark {
  damageClass: 'RINGAN' | 'SEDANG' | 'BERAT' | 'GENERAL_REPAIR';
  label: string;
  description: string;
  totalHistoricalAvgDays: number;
  stages: StageBenchmark[];
}

export const HISTORICAL_BENCHMARKS: Record<string, DamageClassBenchmark> = {
  RINGAN: {
    damageClass: 'RINGAN',
    label: 'Body Repair Ringan (1 - 2 Panel)',
    description: 'Baret, goresan, penyok ringan tanpa struktur sasis (misal: cat bumper/fender).',
    totalHistoricalAvgDays: 2.5,
    stages: [
      { stageId: 'Bongkar', stageName: 'Bongkar / Disassembly', historicalAvgHours: 2.0, slaWarningThresholdHours: 3.5, slaCriticalThresholdHours: 5.0, standardDeviationHours: 0.8 },
      { stageId: 'Ketok', stageName: 'Ketok Magic / Body Alignment', historicalAvgHours: 4.5, slaWarningThresholdHours: 7.0, slaCriticalThresholdHours: 10.0, standardDeviationHours: 1.2 },
      { stageId: 'Dempul', stageName: 'Dempul & Epoksi Primer', historicalAvgHours: 6.0, slaWarningThresholdHours: 9.0, slaCriticalThresholdHours: 12.0, standardDeviationHours: 1.5 },
      { stageId: 'Cat Oven', stageName: 'Pengecatan Oven & Clear Coat', historicalAvgHours: 8.0, slaWarningThresholdHours: 12.0, slaCriticalThresholdHours: 16.0, standardDeviationHours: 2.0 },
      { stageId: 'Poles', stageName: 'Detailing, Polishing & Finishing', historicalAvgHours: 4.0, slaWarningThresholdHours: 6.0, slaCriticalThresholdHours: 8.0, standardDeviationHours: 1.0 },
      { stageId: 'Pasang', stageName: 'Pemasangan Aksesoris & Panel', historicalAvgHours: 2.5, slaWarningThresholdHours: 4.0, slaCriticalThresholdHours: 6.0, standardDeviationHours: 0.9 },
      { stageId: 'QC', stageName: 'Quality Control & Final Test', historicalAvgHours: 2.0, slaWarningThresholdHours: 3.0, slaCriticalThresholdHours: 4.5, standardDeviationHours: 0.5 },
    ]
  },
  SEDANG: {
    damageClass: 'SEDANG',
    label: 'Body Repair Sedang (3 - 5 Panel / Sasis Ringan)',
    description: 'Penyok pintu beruntun, kap mesin, fender & penggantian beberapa komponen.',
    totalHistoricalAvgDays: 5.0,
    stages: [
      { stageId: 'Bongkar', stageName: 'Bongkar / Disassembly', historicalAvgHours: 6.0, slaWarningThresholdHours: 9.0, slaCriticalThresholdHours: 14.0, standardDeviationHours: 1.8 },
      { stageId: 'Ketok', stageName: 'Ketok & Penarikan Bodi', historicalAvgHours: 16.0, slaWarningThresholdHours: 24.0, slaCriticalThresholdHours: 36.0, standardDeviationHours: 4.0 },
      { stageId: 'Dempul', stageName: 'Dempul, Pengeringan & Epoksi', historicalAvgHours: 18.0, slaWarningThresholdHours: 26.0, slaCriticalThresholdHours: 38.0, standardDeviationHours: 4.5 },
      { stageId: 'Cat Oven', stageName: 'Pengecatan Multistage & Oven', historicalAvgHours: 16.0, slaWarningThresholdHours: 22.0, slaCriticalThresholdHours: 32.0, standardDeviationHours: 3.8 },
      { stageId: 'Poles', stageName: 'Poles 3-Step & Detailing', historicalAvgHours: 8.0, slaWarningThresholdHours: 12.0, slaCriticalThresholdHours: 16.0, standardDeviationHours: 2.0 },
      { stageId: 'Pasang', stageName: 'Perakitan Kembali & Fitting', historicalAvgHours: 6.0, slaWarningThresholdHours: 9.0, slaCriticalThresholdHours: 13.0, standardDeviationHours: 1.5 },
      { stageId: 'QC', stageName: 'Quality Control & Uji Jalan', historicalAvgHours: 4.0, slaWarningThresholdHours: 6.0, slaCriticalThresholdHours: 8.0, standardDeviationHours: 1.0 },
    ]
  },
  BERAT: {
    damageClass: 'BERAT',
    label: 'Body Repair Berat / Heavy Collision (>5 Panel & Sasis)',
    description: 'Kerusakan tabrakan parah, penarikan sasis dozer, ganti airbag & ruang mesin.',
    totalHistoricalAvgDays: 12.0,
    stages: [
      { stageId: 'Bongkar', stageName: 'Bongkar Total & Evaluasi Mesin', historicalAvgHours: 16.0, slaWarningThresholdHours: 24.0, slaCriticalThresholdHours: 36.0, standardDeviationHours: 4.5 },
      { stageId: 'Ketok', stageName: 'Tarik Sasis Dozer & Las Ketok', historicalAvgHours: 48.0, slaWarningThresholdHours: 72.0, slaCriticalThresholdHours: 96.0, standardDeviationHours: 12.0 },
      { stageId: 'Dempul', stageName: 'Dempul Halus Seluruh Bodi', historicalAvgHours: 36.0, slaWarningThresholdHours: 52.0, slaCriticalThresholdHours: 72.0, standardDeviationHours: 8.0 },
      { stageId: 'Cat Oven', stageName: 'Pengecatan Total Full Body Oven', historicalAvgHours: 28.0, slaWarningThresholdHours: 40.0, slaCriticalThresholdHours: 56.0, standardDeviationHours: 6.5 },
      { stageId: 'Poles', stageName: 'Poles & Nano Ceramic Finish', historicalAvgHours: 12.0, slaWarningThresholdHours: 18.0, slaCriticalThresholdHours: 24.0, standardDeviationHours: 3.0 },
      { stageId: 'Pasang', stageName: 'Pasang Kelistrikan, Kaca & Interior', historicalAvgHours: 18.0, slaWarningThresholdHours: 26.0, slaCriticalThresholdHours: 36.0, standardDeviationHours: 4.0 },
      { stageId: 'QC', stageName: 'QC Komprehensif, Scan ECU & Test', historicalAvgHours: 8.0, slaWarningThresholdHours: 12.0, slaCriticalThresholdHours: 16.0, standardDeviationHours: 2.0 },
    ]
  },
  GENERAL_REPAIR: {
    damageClass: 'GENERAL_REPAIR',
    label: 'General Repair & Tune Up Mesin / Kaki-kaki',
    description: 'Servis transmisi, rem, overhaul mesin, kelistrikan dan kaki-kaki kendaraan.',
    totalHistoricalAvgDays: 2.0,
    stages: [
      { stageId: 'Diagnosa', stageName: 'Scan OBD & Diagnosa Mesin', historicalAvgHours: 2.0, slaWarningThresholdHours: 3.5, slaCriticalThresholdHours: 5.0, standardDeviationHours: 0.6 },
      { stageId: 'Bongkar', stageName: 'Bongkar Part & Komponen', historicalAvgHours: 4.0, slaWarningThresholdHours: 6.5, slaCriticalThresholdHours: 9.0, standardDeviationHours: 1.0 },
      { stageId: 'Penggantian', stageName: 'Penggantian Sparepart & Kalibrasi', historicalAvgHours: 6.0, slaWarningThresholdHours: 9.0, slaCriticalThresholdHours: 14.0, standardDeviationHours: 1.8 },
      { stageId: 'Pasang', stageName: 'Pemasangan & Pengisian Fluida', historicalAvgHours: 3.0, slaWarningThresholdHours: 5.0, slaCriticalThresholdHours: 7.0, standardDeviationHours: 0.9 },
      { stageId: 'QC', stageName: 'Dyno / Road Test & Final Check', historicalAvgHours: 2.0, slaWarningThresholdHours: 3.0, slaCriticalThresholdHours: 4.5, standardDeviationHours: 0.5 },
    ]
  }
};

export type LagSeverity = 'CRITICAL_LAG' | 'MODERATE_LAG' | 'SLIGHT_DELAY' | 'ON_TRACK';

export interface RepairLagAlert {
  id: string;
  spkNumber: string;
  plateNumber: string;
  vehicleModel: string;
  customerName: string;
  customerPhone: string;
  serviceAdvisorName: string;
  assignedForeman: string;
  insuranceName: string;
  damageClass: 'RINGAN' | 'SEDANG' | 'BERAT' | 'GENERAL_REPAIR';
  currentStage: string;
  bayLocation: string;
  
  // Timing metrics
  stageEnteredAt: string; // ISO string
  stageElapsedHours: number; // Actual hours in current stage
  historicalAvgStageHours: number; // Benchmark mean
  slaWarningHours: number;
  slaCriticalHours: number;
  
  lagDurationHours: number; // Actual - Historical
  lagPercentage: number; // ((Actual - Hist) / Hist) * 100
  severity: LagSeverity;
  
  // Overall Vehicle Schedule
  repairStartedAt: string;
  originalPromisedDate: string; // Date string
  projectedNewDeliveryDate: string; // Predicted delayed date
  totalScheduleDelayDays: number;
  
  // Root cause analysis & AI context
  rootCauseCategory: 'SPAREPART_WAIT' | 'REWORK_DEFECT' | 'BAY_BOTTLENECK' | 'FOREMAN_REALLOCATION' | 'INSURANCE_APPROVAL' | 'UNFORESEEN_DAMAGE';
  rootCauseDescription: string;
  recommendedAction: string;
  customerNoticeSuggested: string;
  
  // Action status by Service Advisor
  saActionStatus: 'UNACKNOWLEDGED' | 'CUSTOMER_NOTIFIED' | 'ESCALATED_FOREMAN' | 'ETA_RESCHEDULED' | 'RESOLVED';
  lastActionAt?: string;
  actionNotes?: string;
  isSnoozed?: boolean;
  snoozedUntil?: string;
}

export const INITIAL_REPAIR_LAG_ALERTS: RepairLagAlert[] = [
  {
    id: 'lag-alert-001',
    spkNumber: 'SPK-2026-0850',
    plateNumber: 'D 1209 XYZ',
    vehicleModel: 'Mitsubishi Pajero Sport Dakar 4x4',
    customerName: 'Bambang Sudibyo',
    customerPhone: '081122334455',
    serviceAdvisorName: 'Doni Pratama, S.T.',
    assignedForeman: 'Ahmad Fauzi',
    insuranceName: 'Sinarmas MSIG (Klaim Komprehensif)',
    damageClass: 'SEDANG',
    currentStage: 'Ketok',
    bayLocation: 'Bay Ketok 1 (Heavy Rig)',
    stageEnteredAt: '2026-08-23T08:30:00.000Z',
    stageElapsedHours: 46.5,
    historicalAvgStageHours: 16.0,
    slaWarningHours: 24.0,
    slaCriticalHours: 36.0,
    lagDurationHours: 30.5,
    lagPercentage: 190.6,
    severity: 'CRITICAL_LAG',
    repairStartedAt: '2026-08-20',
    originalPromisedDate: '2026-08-26',
    projectedNewDeliveryDate: '2026-08-29',
    totalScheduleDelayDays: 3,
    rootCauseCategory: 'SPAREPART_WAIT',
    rootCauseDescription: 'Unit tertahan di tahap Ketok melebihi rata-rata historis (46.5 jam vs rata-rata 16 jam). Menunggu panel apron depan & dudukan radiator OEM dari distributor.',
    recommendedAction: 'Eskalasi ke bagian Purchasing untuk mempercepat kiriman part atau pinjam part donor. Update pelanggan bahwa estimasi penyerahan mundur ke 29 Agustus.',
    customerNoticeSuggested: 'Yth. Bpk. Bambang, kami informasikan bahwa perbaikan Pajero Sport D 1209 XYZ memerlukan waktu tambahan estimasi 3 hari karena penyesuaian part presisi OEM. Mohon maaf atas keterlambatan ini, progres dapat dipantau di portal tracking kami.',
    saActionStatus: 'UNACKNOWLEDGED'
  },
  {
    id: 'lag-alert-002',
    spkNumber: 'SPK-2026-0875',
    plateNumber: 'B 2341 TZA',
    vehicleModel: 'Honda CR-V Turbo Prestige 2022',
    customerName: 'Siti Aminah',
    customerPhone: '081398712345',
    serviceAdvisorName: 'Doni Pratama, S.T.',
    assignedForeman: 'Dedi Kusnadi',
    insuranceName: 'Asuransi ACA',
    damageClass: 'SEDANG',
    currentStage: 'Dempul',
    bayLocation: 'Bay Dempul 3',
    stageEnteredAt: '2026-08-25T10:00:00.000Z',
    stageElapsedHours: 29.0,
    historicalAvgStageHours: 18.0,
    slaWarningHours: 26.0,
    slaCriticalHours: 38.0,
    lagDurationHours: 11.0,
    lagPercentage: 61.1,
    severity: 'MODERATE_LAG',
    repairStartedAt: '2026-08-22',
    originalPromisedDate: '2026-08-27',
    projectedNewDeliveryDate: '2026-08-28',
    totalScheduleDelayDays: 1,
    rootCauseCategory: 'REWORK_DEFECT',
    rootCauseDescription: 'Lapisan dempul pintu kiri belakang mengalami pinhole akibat kelembapan cuaca pagi kemarin, memerlukan pengamplasan ulang & epoksi tambahan.',
    recommendedAction: 'Percepat pemanasan infra-red curing dempul agar masuk booth Cat Oven sore ini. Informasikan SA untuk pantau QC Cat besok.',
    customerNoticeSuggested: 'Yth. Ibu Siti Aminah, proses dempul Honda CR-V B 2341 TZA saat ini sedang tahap penghalusan presisi lapisan epoksi anti-karat sebelum pengecatan oven.',
    saActionStatus: 'UNACKNOWLEDGED'
  },
  {
    id: 'lag-alert-003',
    spkNumber: 'SPK-2026-0844',
    plateNumber: 'B 8899 MKW',
    vehicleModel: 'Toyota Yaris Cross HEV',
    customerName: 'Hendro Santoso',
    customerPhone: '081711223344',
    serviceAdvisorName: 'Rina Oktaviani, S.Kom',
    assignedForeman: 'Budi Santoso',
    insuranceName: 'Garda Oto (Astra)',
    damageClass: 'RINGAN',
    currentStage: 'Cat Oven',
    bayLocation: 'Booth Oven Cat 1',
    stageEnteredAt: '2026-08-26T07:00:00.000Z',
    stageElapsedHours: 13.5,
    historicalAvgStageHours: 8.0,
    slaWarningHours: 12.0,
    slaCriticalHours: 16.0,
    lagDurationHours: 5.5,
    lagPercentage: 68.7,
    severity: 'MODERATE_LAG',
    repairStartedAt: '2026-08-24',
    originalPromisedDate: '2026-08-27',
    projectedNewDeliveryDate: '2026-08-28',
    totalScheduleDelayDays: 1,
    rootCauseCategory: 'BAY_BOTTLENECK',
    rootCauseDescription: 'Antrean oven cat tertahan karena pembersihan nozzle spray gun & filter udara spray booth cat.',
    recommendedAction: 'Jadwalkan unit masuk spray booth cat giliran pertama pukul 14:00. Poles malam hari jika diperlukan.',
    customerNoticeSuggested: 'Yth. Bpk. Hendro Santoso, pengerjaan pengecatan oven Yaris Cross B 8899 MKW dijadwalkan selesai hari ini dan masuk proses detailing/poles besok pagi.',
    saActionStatus: 'CUSTOMER_NOTIFIED',
    lastActionAt: '2026-08-27T08:15:00.000Z',
    actionNotes: 'Sudah chat WA ke pak Hendro bahwa unit dipoles besok pagi.'
  },
  {
    id: 'lag-alert-004',
    spkNumber: 'SPK-2026-0892',
    plateNumber: 'B 9912 KAA',
    vehicleModel: 'Hyundai Ioniq 5 Signature EV',
    customerName: 'Kevin Leonardo',
    customerPhone: '081809090909',
    serviceAdvisorName: 'Doni Pratama, S.T.',
    assignedForeman: 'Rian Pratama',
    insuranceName: 'Personal / Non-Asuransi',
    damageClass: 'RINGAN',
    currentStage: 'Poles',
    bayLocation: 'Bay Detailing & Polish',
    stageEnteredAt: '2026-08-27T06:00:00.000Z',
    stageElapsedHours: 4.2,
    historicalAvgStageHours: 4.0,
    slaWarningHours: 6.0,
    slaCriticalHours: 8.0,
    lagDurationHours: 0.2,
    lagPercentage: 5.0,
    severity: 'ON_TRACK',
    repairStartedAt: '2026-08-25',
    originalPromisedDate: '2026-08-27',
    projectedNewDeliveryDate: '2026-08-27',
    totalScheduleDelayDays: 0,
    rootCauseCategory: 'BAY_BOTTLENECK',
    rootCauseDescription: 'Pengerjaan sesuai estimasi waktu historis, tahap finishing compound 3-step hampir selesai.',
    recommendedAction: 'Siapkan form serah terima unit dan cek kelengkapan dokumen garansi cat.',
    customerNoticeSuggested: 'Yth. Bpk. Kevin, Hyundai Ioniq 5 B 9912 KAA sedang tahap inspeksi akhir QC dan dapat diambil sore ini sesuai janji.',
    saActionStatus: 'UNACKNOWLEDGED'
  }
];

export function calculateStageLag(
  damageClass: 'RINGAN' | 'SEDANG' | 'BERAT' | 'GENERAL_REPAIR',
  stageName: string,
  elapsedHours: number
): {
  historicalAvg: number;
  slaWarning: number;
  slaCritical: number;
  lagHours: number;
  lagPercent: number;
  severity: LagSeverity;
} {
  const benchmarkGroup = HISTORICAL_BENCHMARKS[damageClass] || HISTORICAL_BENCHMARKS.SEDANG;
  const stageBm = benchmarkGroup.stages.find(s => s.stageId.toLowerCase() === stageName.toLowerCase() || s.stageName.toLowerCase().includes(stageName.toLowerCase())) || benchmarkGroup.stages[0];

  const historicalAvg = stageBm.historicalAvgHours;
  const slaWarning = stageBm.slaWarningThresholdHours;
  const slaCritical = stageBm.slaCriticalThresholdHours;
  const lagHours = Math.max(0, elapsedHours - historicalAvg);
  const lagPercent = Math.round(((elapsedHours - historicalAvg) / historicalAvg) * 100);

  let severity: LagSeverity = 'ON_TRACK';
  if (elapsedHours >= slaCritical) {
    severity = 'CRITICAL_LAG';
  } else if (elapsedHours >= slaWarning) {
    severity = 'MODERATE_LAG';
  } else if (elapsedHours > historicalAvg) {
    severity = 'SLIGHT_DELAY';
  }

  return {
    historicalAvg,
    slaWarning,
    slaCritical,
    lagHours,
    lagPercent,
    severity
  };
}
