import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { 
  Camera, CameraOff, Zap, ZapOff, RefreshCw, Upload, 
  Volume2, VolumeX, AlertCircle, CheckCircle2, QrCode, 
  Barcode, Smartphone, Sparkles, SwitchCamera
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { toast } from 'sonner';

interface CameraBarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
  className?: string;
}

export function CameraBarcodeScanner({
  onScanSuccess,
  isActive,
  className = ''
}: CameraBarcodeScannerProps) {
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-barcode-reader-view';
  const lastScanTimestamp = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play audio beep sound
  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(950, audioCtx.currentTime); // 950 Hz crisp confirmation beep
      oscillator.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.08);

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before user interaction
    }

    // Trigger haptic vibration on mobile devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        // Ignore vibration errors
      }
    }
  };

  // Enumerate cameras
  useEffect(() => {
    if (!isActive) return;

    let mounted = true;
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (mounted && cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
          // Prefer back/environment camera if available
          const backCamera = cameras.find(c => 
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCamera ? backCamera.id : cameras[0].id);
        }
      })
      .catch((err) => {
        console.warn('Unable to get cameras list:', err);
      });

    return () => {
      mounted = false;
    };
  }, [isActive]);

  // Start / Stop Scanner
  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setIsProcessing(true);

        // Ensure DOM element is present
        const container = document.getElementById(readerElementId);
        if (!container) {
          setIsProcessing(false);
          return;
        }

        // Clean up existing instance if any
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch (e) {
            console.warn('Error clearing previous scanner:', e);
          }
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdgePercentage = 0.75;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: Math.min(qrboxSize, 380),
              height: Math.min(Math.floor(qrboxSize * 0.7), 240)
            };
          },
          aspectRatio: 1.333
        };

        const successCallback = (decodedText: string) => {
          const now = Date.now();
          // Debounce same code scan within 1.5 seconds to prevent spamming
          if (now - lastScanTimestamp.current < 1500 && lastScannedCode === decodedText) {
            return;
          }

          lastScanTimestamp.current = now;
          setLastScannedCode(decodedText);
          playBeepSound();
          onScanSuccess(decodedText);
        };

        const cameraConfig = selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: facingMode };

        await html5QrCode.start(
          cameraConfig,
          config,
          successCallback,
          () => {
            // Scanner frame decoding error (expected on empty frames)
          }
        );

        if (isMounted) {
          setIsCameraRunning(true);
          setIsProcessing(false);

          // Check torch capability
          try {
            const track = (html5QrCode as any).getRunningTrackCameraCapabilities?.();
            if (track && track.torchFeature?.().isSupported?.()) {
              setHasTorchSupport(true);
            }
          } catch {
            setHasTorchSupport(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Camera Scanner start error:', err);
          setIsCameraRunning(false);
          setIsProcessing(false);
          
          const errMsg = err?.message || String(err);
          if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
            setCameraError('Izin akses kamera ditolak. Mohon aktifkan izin kamera di pengaturan browser.');
          } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
            setCameraError('Kamera tidak ditemukan pada perangkat ini. Gunakan upload gambar atau input manual.');
          } else {
            setCameraError('Gagal menghubungkan ke kamera perangkat: ' + errMsg);
          }
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isActive, selectedCameraId, facingMode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraRunning(false);
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !isCameraRunning) return;
    try {
      const nextState = !isTorchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
      toast.info(nextState ? 'Senter kamera aktif' : 'Senter kamera mati');
    } catch {
      toast.error('Perangkat tidak mendukung kontrol senter kamera');
    }
  };

  const handleSwitchCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setSelectedCameraId('');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A
          ],
          verbose: false
        });
      }

      const decodedText = await scanner.scanFile(file, true);
      playBeepSound();
      setLastScannedCode(decodedText);
      onScanSuccess(decodedText);
      toast.success(`Berhasil memindai file barcode: ${decodedText}`);
    } catch {
      toast.error('Tidak dapat mendeteksi Barcode/QR Code pada gambar ini.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative flex flex-col items-center overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 ${className}`}>
      
      {/* Scanner Viewport Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Html5Qrcode video mount element */}
        <div 
          id={readerElementId} 
          className="w-full h-full object-cover flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Custom High-Tech Laser Reticle / Overlay */}
        {isCameraRunning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            
            {/* Darkened surrounding vignette */}
            <div className="absolute inset-0 bg-slate-950/25"></div>

            {/* Central Target Viewfinder Box */}
            <div className="relative w-[280px] sm:w-[320px] h-[160px] sm:h-[180px] border-2 border-indigo-500/40 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden">
              
              {/* Corner Targets */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>

              {/* Animated Horizontal Laser Scan Line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-[bounce_2s_infinite]"></div>

              {/* Sub-center helper reticle */}
              <div className="w-12 h-12 border border-dashed border-indigo-300/40 rounded-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80 animate-ping"></div>
              </div>

              {/* Watermark instruction */}
              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
                  Arahkan Barcode / QR Code ke Area Ini
                </span>
              </div>
            </div>

            {/* Status Pill on Top */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE CAM ACTIVE</span>
            </div>
          </div>
        )}

        {/* Error or Fallback View */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
              <CameraOff className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Terkendala</h4>
            <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">{cameraError}</p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  setSelectedCameraId('');
                  setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Kamera Lain
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Foto Barcode
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isProcessing && !cameraError && !isCameraRunning && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Menginisialisasi modul kamera & scanner...</p>
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="w-full bg-[#1E293B] border-t border-slate-800 p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Left: Device Selector or Switcher */}
        <div className="flex items-center gap-2">
          {availableCameras.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 max-w-[170px] sm:max-w-[200px] truncate focus:outline-none focus:border-indigo-500 font-mono"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSwitchCameraFacing}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors text-[11px]"
              title="Ganti kamera Depan / Belakang"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-indigo-400" />
              <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
            </button>
          )}

          {/* Flashlight button */}
          {hasTorchSupport && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-1.5 rounded-lg border transition-colors ${
                isTorchOn 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Nyalakan / Matikan Senter"
            >
              {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Right: Audio toggle, Upload file, & Last scan indicator */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled 
                ? 'bg-slate-900 text-indigo-400 border-slate-700' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Suara beep aktif' : 'Suara beep senyap'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1 text-[11px] transition-colors"
            title="Scan dari file gambar atau foto"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Foto</span>
          </button>

          {lastScannedCode && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] text-emerald-400 font-mono max-w-[130px] truncate">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lastScannedCode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
