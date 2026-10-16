'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle,
  Flashlight,
  HelpCircle,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SwitchCamera,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, SETTINGS_KEY } from '@/lib/storage';
import {
  COMMON_ADDITIVES,
  analyzeProductByBarcode,
  lookupAdditive,
  type AdditiveInfo,
  type AnalyzedProduct,
} from '@/lib/halalData';

export default function HalalScannerPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedProduct, setAnalyzedProduct] = useState<AnalyzedProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Camera Barcode Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);
  const scanLoopRef = useRef<number | null>(null);
  const readerRef = useRef<any>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Clean up camera stream and readers when component unmounts
  useEffect(() => {
    return () => {
      isScanningRef.current = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const attachStreamToVideo = async (video: HTMLVideoElement, stream: MediaStream) => {
    // Crucial for iOS Safari / WebKit: configure inline and muted BEFORE assigning srcObject
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    (video as any).webkitPlaysInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const tryPlay = async () => {
      try {
        await video.play();
        setVideoPlaying(true);
        setCameraLoading(false);
        startBarcodeDetection(video, stream);
      } catch (playErr) {
        console.warn('Video play deferred or requires user tap:', playErr);
        setCameraLoading(false);
      }
    };

    video.onloadedmetadata = () => {
      tryPlay();
    };
    video.oncanplay = () => {
      tryPlay();
    };
    video.onplaying = () => {
      setVideoPlaying(true);
      setCameraLoading(false);
    };

    // Immediate attempt without waiting for async metadata
    await tryPlay();
  };

  // Re-attach video stream whenever isScanning transitions to true
  useEffect(() => {
    if (isScanning && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        attachStreamToVideo(videoRef.current, streamRef.current);
      }
    }
  }, [isScanning]);

  const startBarcodeDetection = async (video: HTMLVideoElement, stream: MediaStream) => {
    // 1. Try native Web BarcodeDetector if available (Chromium / Edge / Android)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });

        const detectFrame = async () => {
          if (!isScanningRef.current || !videoRef.current) {
            return;
          }

          const v = videoRef.current;
          if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
            try {
              const barcodes = await barcodeDetector.detect(v);
              if (barcodes.length > 0 && isScanningRef.current) {
                const detected = barcodes[0].rawValue;
                if (detected) {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try {
                      navigator.vibrate(200);
                    } catch {}
                  }
                  stopCameraScanner();
                  setBarcodeInput(detected);
                  handleAnalyzeBarcode(detected);
                  return;
                }
              }
            } catch {
              // Frame dropped, proceed to next
            }
          }

          if (isScanningRef.current) {
            scanLoopRef.current = requestAnimationFrame(detectFrame);
          }
        };

        scanLoopRef.current = requestAnimationFrame(detectFrame);
        return;
      } catch (err) {
        console.warn('Native BarcodeDetector loop error, trying ZXing:', err);
      }
    }

    // 2. Fallback to ZXing BrowserMultiFormatReader (works in iOS Safari, Firefox, macOS)
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      if (!isScanningRef.current) return;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      reader.decodeFromStream(stream, video, (result, err) => {
        if (result && isScanningRef.current) {
          const detected = result.getText();
          if (detected) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try {
                navigator.vibrate(200);
              } catch {}
            }
            stopCameraScanner();
            setBarcodeInput(detected);
            handleAnalyzeBarcode(detected);
          }
        }
      });
    } catch (zxingErr) {
      console.warn('ZXing live stream decoder error:', zxingErr);
    }
  };

  const startCameraScanner = async (preferredFacing: 'environment' | 'user' = facingMode) => {
    setErrorMsg('');
    setCameraLoading(true);
    setVideoPlaying(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraLoading(false);
      setErrorMsg('Camera access is not supported by your browser or environment. You can enter or upload barcodes below.');
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch {}
      readerRef.current = null;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        // Ideal facing mode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: preferredFacing ? { ideal: preferredFacing } : 'environment',
          },
          audio: false,
        });
      } catch (idealErr) {
        console.warn('Ideal camera constraints failed, attempting fallback:', idealErr);
        // Fallback to basic video stream (essential for desktop webcams)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      // Check flashlight/torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const caps = (videoTrack.getCapabilities?.() as any) || {};
        setTorchSupported(!!caps.torch);
        setTorchOn(false);
      }

      streamRef.current = stream;
      isScanningRef.current = true;
      setIsScanning(true);

      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, stream);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraLoading(false);
      setIsScanning(false);
      isScanningRef.current = false;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser or device settings.');
      } else {
        setErrorMsg('Could not access camera. Please check device permissions or enter barcode manually.');
      }
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraScanner(nextMode);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && (track.getCapabilities?.() as any)?.torch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch toggle error:', e);
      }
    }
  };

  const stopCameraScanner = () => {
    isScanningRef.current = false;
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch {}
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setCameraLoading(false);
    setVideoPlaying(false);
    setTorchOn(false);
    setTorchSupported(false);
  };

  const handleBarcodeImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setAnalyzing(true);

    let detectedCode = '';

    // 1. Try native BarcodeDetector if available
    try {
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
        const imageBitmap = await createImageBitmap(file);
        const barcodes = await barcodeDetector.detect(imageBitmap);

        if (barcodes.length > 0 && barcodes[0].rawValue) {
          detectedCode = barcodes[0].rawValue;
        }
      }
    } catch (nativeErr) {
      console.warn('Native image detection failed:', nativeErr);
    }

    // 2. Fallback to ZXing BrowserMultiFormatReader
    if (!detectedCode) {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        const reader = new BrowserMultiFormatReader();
        const objectUrl = URL.createObjectURL(file);
        try {
          const result = await reader.decodeFromImageUrl(objectUrl);
          if (result && result.getText()) {
            detectedCode = result.getText();
          }
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (zxingErr) {
        console.warn('ZXing image decode error:', zxingErr);
      }
    }

    setAnalyzing(false);
    event.target.value = '';

    if (detectedCode) {
      setBarcodeInput(detectedCode);
      await handleAnalyzeBarcode(detectedCode);
    } else {
      setErrorMsg('No barcode recognized in the uploaded photo. Please ensure the barcode numbers and lines are sharp and well-lit, or type the numbers below.');
    }
  };

  const handleAnalyzeBarcode = async (codeToScan?: string) => {
    const code = codeToScan || barcodeInput.trim();
    if (!code) {
      setErrorMsg('Please enter a barcode or scan with camera.');
      return;
    }

    setErrorMsg('');
    setAnalyzing(true);
    setAnalyzedProduct(null);

    try {
      const product = await analyzeProductByBarcode(code);
      setAnalyzedProduct(product);
    } catch (err: any) {
      setErrorMsg(err.message || 'Product lookup failed. Check barcode and connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Filter dictionary additives
  const searchResults = searchQuery.trim()
    ? Object.values(COMMON_ADDITIVES).filter((a) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
        );
      })
    : [];

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-sm dark:bg-[#14211e]`;

  return (
    <AppShell active="halal" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),64rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>HALAL INGREDIENT & ADDITIVE SCANNER</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
            Halal Food Scanner
          </h1>
          <p className="mt-1 text-sm text-[var(--app-muted)] max-w-2xl">
            Scan packaged food barcodes or search E-numbers to identify Halal, Mushbooh (doubtful),
            and Haram additives according to authentic Islamic dietary jurisprudence.
          </p>
        </header>

        {/* Scanner & Manual Barcode Input Card */}
        <section className={`${cardClass} mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                Scan Product Barcode
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Use your device camera or enter the 8–13 digit UPC/EAN code from any packaging.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="barcode-file-upload"
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-line)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm"
              >
                <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Snap / Upload Photo</span>
                <input
                  id="barcode-file-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleBarcodeImageUpload}
                  className="hidden"
                />
              </label>

              {!isScanning ? (
                <button
                  type="button"
                  onClick={() => startCameraScanner()}
                  disabled={cameraLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 disabled:opacity-50"
                >
                  {cameraLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <span>{cameraLoading ? 'Starting Camera…' : 'Open Camera Scanner'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all"
                >
                  <X className="h-4 w-4" />
                  <span>Close Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Camera Viewport */}
          {isScanning && (
            <div className="mb-6 relative w-full aspect-video max-h-96 rounded-3xl overflow-hidden border border-emerald-500/40 bg-neutral-950 mx-auto shadow-xl">
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (node && streamRef.current && node.srcObject !== streamRef.current) {
                    attachStreamToVideo(node, streamRef.current);
                  }
                }}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Tap to Play / Activate Overlay if browser delayed autoplay */}
              {!videoPlaying && !cameraLoading && (
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current
                        .play()
                        .then(() => setVideoPlaying(true))
                        .catch(console.warn);
                    }
                  }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white p-4 text-center cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-500/30 flex items-center justify-center mb-3 animate-pulse border border-emerald-400/40">
                    <Play className="h-6 w-6 text-emerald-400 fill-emerald-400 ml-0.5" />
                  </div>
                  <span className="text-sm font-bold text-white">Tap to start camera feed</span>
                  <span className="text-xs text-white/70 mt-1">Browser requires direct touch to activate stream</span>
                </button>
              )}

              {/* Camera Loading Overlay */}
              {cameraLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 text-white">
                  <RefreshCw className="h-7 w-7 animate-spin text-emerald-400 mb-2" />
                  <span className="text-xs font-bold">Warming up camera…</span>
                </div>
              )}

              {/* Top Controls Overlay */}
              <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Scanner
                </span>

                <div className="flex items-center gap-2">
                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      title={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold border transition-all ${
                        torchOn
                          ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-md'
                          : 'bg-black/60 backdrop-blur-md text-white border-white/20 hover:bg-black/80'
                      }`}
                    >
                      <Flashlight className="h-3.5 w-3.5" />
                      <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Flip between front and rear camera"
                    className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/20 hover:bg-black/80 transition-all"
                  >
                    <SwitchCamera className="h-3.5 w-3.5" />
                    <span>Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCameraScanner}
                    title="Close camera"
                    className="rounded-full bg-black/60 backdrop-blur-md p-1.5 text-white/80 hover:text-white hover:bg-black/90 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scanning Target Reticle */}
              <div className="absolute inset-x-8 inset-y-10 sm:inset-x-16 sm:inset-y-12 border-2 border-emerald-400/90 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                <span className="text-[11px] font-bold bg-black/75 px-3 py-1 rounded-full text-white shadow-sm border border-emerald-500/30">
                  Point at barcode on packaging
                </span>
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
              </div>
            </div>
          )}

          {/* Manual Input Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)]" />
              <input
                type="text"
                placeholder="Enter product barcode (e.g. 5000159461122)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeBarcode()}
                className="w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 pl-10 pr-4 py-3 text-xs font-semibold outline-none transition-colors focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              disabled={analyzing || !barcodeInput.trim()}
              onClick={() => handleAnalyzeBarcode()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50 dark:bg-emerald-400 dark:text-emerald-950"
            >
              {analyzing ? 'Checking Ingredients...' : 'Analyze Product'}
            </button>
          </div>

          {/* Sample Barcode Quick Clicks */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--app-muted)]">
            <span>Try sample barcodes:</span>
            <button
              type="button"
              onClick={() => {
                setBarcodeInput('5000159461122');
                handleAnalyzeBarcode('5000159461122');
              }}
              className="underline hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Snickers Bar
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setBarcodeInput('4001686301264');
                handleAnalyzeBarcode('4001686301264');
              }}
              className="underline hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Haribo Gummy (Gelatin test)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setBarcodeInput('5449000000996');
                handleAnalyzeBarcode('5449000000996');
              }}
              className="underline hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Coca-Cola Classic
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Product Scan Result */}
        {analyzedProduct && (
          <section className={`${cardClass} mb-8`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[var(--app-line)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                  Barcode: {analyzedProduct.barcode}
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-[var(--app-ink)]">
                  {analyzedProduct.name}
                </h2>
                {analyzedProduct.brand && (
                  <p className="text-xs text-[var(--app-muted)]">Brand: {analyzedProduct.brand}</p>
                )}
              </div>

              {/* Status Verdict Badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-extrabold text-sm shadow-sm ${
                  analyzedProduct.overallStatus === 'halal'
                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                    : analyzedProduct.overallStatus === 'mushbooh'
                      ? 'border border-amber-500/30 bg-amber-500/20 text-amber-800 dark:text-amber-200'
                      : 'border border-red-500/30 bg-red-500/20 text-red-800 dark:text-red-200'
                }`}
              >
                {analyzedProduct.overallStatus === 'halal' && (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>PERMISSIBLE (HALAL)</span>
                  </>
                )}
                {analyzedProduct.overallStatus === 'mushbooh' && (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span>DOUBTFUL (MUSHBOOH)</span>
                  </>
                )}
                {analyzedProduct.overallStatus === 'haram' && (
                  <>
                    <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span>PROHIBITED (HARAM)</span>
                  </>
                )}
              </div>
            </div>

            {/* Verdict Explanation */}
            <div className="my-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--app-line)] text-xs leading-relaxed text-[var(--app-ink)]">
              <strong>Assessment:</strong> {analyzedProduct.statusSummary}
            </div>

            {/* Flagged Additives Breakdown */}
            {analyzedProduct.flaggedAdditives.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] mb-3">
                  Flagged Additives & Substances ({analyzedProduct.flaggedAdditives.length})
                </h3>
                <div className="space-y-2.5">
                  {analyzedProduct.flaggedAdditives.map((item) => (
                    <div
                      key={item.code}
                      className={`p-3.5 rounded-2xl border ${
                        item.status === 'haram'
                          ? 'border-red-500/30 bg-red-500/10'
                          : item.status === 'mushbooh'
                            ? 'border-amber-500/30 bg-amber-500/10'
                            : 'border-emerald-500/30 bg-emerald-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[var(--app-ink)]">
                            {item.code}: {item.name}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              item.status === 'haram'
                                ? 'bg-red-500 text-white'
                                : item.status === 'mushbooh'
                                  ? 'bg-amber-500 text-stone-950'
                                  : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--app-muted)]">{item.category}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">
                        <strong>Source:</strong> {item.source}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--app-ink)] font-medium">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Ingredients List */}
            {analyzedProduct.ingredientsText && (
              <div className="mt-6 border-t border-[var(--app-line)] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                  Ingredients List
                </h3>
                <p className="text-xs text-[var(--app-muted)] leading-relaxed italic">
                  {analyzedProduct.ingredientsText}
                </p>
              </div>
            )}
          </section>
        )}

        {/* E-Number Dictionary / Lookup Section */}
        <section className={cardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                Instant E-Number & Additive Search
              </h2>
              <p className="text-xs text-[var(--app-muted)]">
                Look up any European food code or additive name (e.g., E120, E471, Gelatin, Carmine).
              </p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)]" />
            <input
              type="text"
              placeholder="Search code or ingredient (e.g. E120, E471, rennet, shellac)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 pl-10 pr-4 py-3 text-xs font-semibold outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          {searchQuery.trim() ? (
            <div className="space-y-3">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.code}
                    className="p-4 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-[var(--app-ink)]">
                          {item.code}: {item.name}
                        </strong>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            item.status === 'haram'
                              ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                              : item.status === 'mushbooh'
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--app-muted)] mt-1">
                        <strong>Category:</strong> {item.category} · <strong>Source:</strong>{' '}
                        {item.source}
                      </p>
                      <p className="text-xs text-[var(--app-ink)] mt-1 leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[var(--app-muted)] border border-dashed rounded-2xl">
                  No additive matching “{searchQuery}” in the quick reference database.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(COMMON_ADDITIVES)
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.code}
                    onClick={() => setSearchQuery(item.code)}
                    className="p-3.5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 cursor-pointer hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-[var(--app-ink)]">
                        {item.code}
                      </strong>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          item.status === 'haram'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                            : item.status === 'mushbooh'
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--app-ink)] font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[var(--app-muted)] truncate">{item.category}</p>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
