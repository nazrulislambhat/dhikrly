'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle,
  HelpCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCameraScanner = async () => {
    setErrorMsg('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported by your browser. Please enter barcode manually.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if BarcodeDetector is available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        });

        const scanFrame = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              stopCameraScanner();
              setBarcodeInput(detected);
              handleAnalyzeBarcode(detected);
              return;
            }
          } catch {
            // detection frame error
          }
          if (isScanning) requestAnimationFrame(scanFrame);
        };
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setErrorMsg('Could not access camera. Please check permissions or enter barcode manually.');
      setIsScanning(false);
    }
  };

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
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

            <div className="flex items-center gap-2">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                >
                  <Camera className="h-4 w-4" />
                  <span>Open Camera Scanner</span>
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
            <div className="mb-6 relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black aspect-video max-h-80 mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-12 inset-y-12 border-2 border-emerald-400/80 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                <span className="text-xs font-bold bg-black/60 px-3 py-1 rounded-full text-white">
                  Align Barcode Inside Frame
                </span>
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
          <section className={`${cardClass} mb-8 animate-fade-in`}>
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
