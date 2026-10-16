'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ALL_SURAHS,
  addReadingLog,
  batchSetSurahsCompleted,
  getQuranTrackerData,
  toggleSurahCompleted,
  type SurahMeta,
} from '@/lib/quranTracker';

interface QuranTrackerModalProps {
  dark: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialSurahNumber?: number;
  initialTab?: 'log' | 'checklist';
}

export default function QuranTrackerModal({
  dark,
  isOpen,
  onClose,
  onSaved,
  initialSurahNumber = 1,
  initialTab = 'log',
}: QuranTrackerModalProps) {
  const [activeTab, setActiveTab] = useState<'log' | 'checklist'>(initialTab);
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(initialSurahNumber);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(() => {
    const s = ALL_SURAHS.find((surah) => surah.number === initialSurahNumber);
    return s ? s.numberOfAyahs : 7;
  });
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isCompletedSurah, setIsCompletedSurah] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [checklistSearch, setChecklistSearch] = useState<string>('');

  const [trackerData, setTrackerData] = useState(() => getQuranTrackerData());

  useEffect(() => {
    if (isOpen) {
      setTrackerData(getQuranTrackerData());
      if (initialTab) setActiveTab(initialTab);
      if (initialSurahNumber) {
        setSelectedSurahNum(initialSurahNumber);
        const s = ALL_SURAHS.find((surah) => surah.number === initialSurahNumber);
        setFromAyah(1);
        setToAyah(s ? s.numberOfAyahs : 7);
      }
    }
  }, [isOpen, initialTab, initialSurahNumber]);

  const selectedSurah = useMemo(
    () => ALL_SURAHS.find((s) => s.number === selectedSurahNum) || ALL_SURAHS[0],
    [selectedSurahNum],
  );

  const filteredSurahs = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return ALL_SURAHS;
    return ALL_SURAHS.filter(
      (s) =>
        s.number.toString() === q ||
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q),
    );
  }, [searchFilter]);

  const checklistSurahs = useMemo(() => {
    const q = checklistSearch.trim().toLowerCase();
    if (!q) return ALL_SURAHS;
    return ALL_SURAHS.filter(
      (s) =>
        s.number.toString() === q ||
        s.englishName.toLowerCase().includes(q) ||
        s.name.includes(q),
    );
  }, [checklistSearch]);

  if (!isOpen) return null;

  const handleSurahChange = (num: number) => {
    setSelectedSurahNum(num);
    const s = ALL_SURAHS.find((surah) => surah.number === num);
    if (s) {
      setFromAyah(1);
      setToAyah(s.numberOfAyahs);
      setIsCompletedSurah(true);
    }
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    addReadingLog({
      surahNumber: selectedSurah.number,
      fromAyah,
      toAyah,
      date,
      isCompletedSurah,
      notes: notes.trim() || undefined,
    });
    setTrackerData(getQuranTrackerData());
    if (onSaved) onSaved();
    onClose();
  };

  const handleToggleSurah = (num: number) => {
    toggleSurahCompleted(num);
    setTrackerData(getQuranTrackerData());
    if (onSaved) onSaved();
  };

  const handleBatchCheckFirst5 = () => {
    batchSetSurahsCompleted([1, 2, 3, 4, 5], true);
    setTrackerData(getQuranTrackerData());
    if (onSaved) onSaved();
  };

  const handleBatchCheckJuz30 = () => {
    // Surahs 78 to 114
    const juz30 = Array.from({ length: 114 - 78 + 1 }, (_, i) => 78 + i);
    batchSetSurahsCompleted(juz30, true);
    setTrackerData(getQuranTrackerData());
    if (onSaved) onSaved();
  };

  const modalBg = dark
    ? 'bg-[#14211e] border-white/10 text-stone-100'
    : 'bg-white border-stone-200 text-stone-900';

  const inputBg = dark
    ? 'bg-black/20 border-white/10 text-stone-100 placeholder-stone-500 focus:border-emerald-400'
    : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400 focus:border-emerald-600';

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${modalBg}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-inherit px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Qur’an Reading Tracker</h2>
              <p className="text-xs text-[var(--app-muted)]">
                Track your Khatm progress & record reading sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-inherit px-5 pt-2 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('log')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'log'
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            + Log Reading Session
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Offline Surahs Checklist</span>
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
              {trackerData.completedSurahs.length}/114
            </span>
          </button>
        </div>

        {/* Tab 1: Log Specific Reading (From Ayah to To Ayah) */}
        {activeTab === 'log' ? (
          <form onSubmit={handleSaveLog} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Surah Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1.5">
                Select Surah
              </label>
              <div className="relative">
                <select
                  value={selectedSurahNum}
                  onChange={(e) => handleSurahChange(parseInt(e.target.value, 10))}
                  className={`w-full appearance-none rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition-colors pr-10 ${inputBg}`}
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.number} value={s.number} className="text-stone-900 bg-white dark:bg-[#14211e] dark:text-stone-100">
                      {s.number}. {s.englishName} ({s.name}) — {s.numberOfAyahs} Ayahs
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              </div>
            </div>

            {/* Selected Surah Preview Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Surah #{selectedSurah.number} · {selectedSurah.revelationType}
                </span>
                <h3 className="text-sm font-bold text-[var(--app-ink)] mt-0.5">
                  {selectedSurah.englishName} ({selectedSurah.englishNameTranslation})
                </h3>
              </div>
              <div className="text-right">
                <span className="font-arabic text-xl font-bold text-emerald-700 dark:text-emerald-300 block">
                  {selectedSurah.name}
                </span>
                <span className="text-[11px] text-[var(--app-muted)] font-medium">
                  {selectedSurah.numberOfAyahs} Total Ayahs
                </span>
              </div>
            </div>

            {/* Ayah Range (From & To) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] mb-1">
                  From Ayah
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedSurah.numberOfAyahs}
                  value={fromAyah}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    setFromAyah(Math.max(1, Math.min(v, selectedSurah.numberOfAyahs)));
                  }}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-sm font-semibold ${inputBg}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] mb-1">
                  To Ayah
                </label>
                <input
                  type="number"
                  min={fromAyah}
                  max={selectedSurah.numberOfAyahs}
                  value={toAyah}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || fromAyah;
                    setToAyah(Math.max(fromAyah, Math.min(v, selectedSurah.numberOfAyahs)));
                  }}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-sm font-semibold ${inputBg}`}
                  required
                />
              </div>
            </div>

            {/* Quick Ayah Jump Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--app-muted)] mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => {
                  setFromAyah(1);
                  setToAyah(selectedSurah.numberOfAyahs);
                  setIsCompletedSurah(true);
                }}
                className="rounded-xl border border-[var(--app-line)] px-2.5 py-1 text-xs font-medium hover:bg-emerald-500/10 transition-colors"
              >
                Full Surah (1–{selectedSurah.numberOfAyahs})
              </button>
              <button
                type="button"
                onClick={() => setToAyah(Math.min(selectedSurah.numberOfAyahs, fromAyah + 9))}
                className="rounded-xl border border-[var(--app-line)] px-2.5 py-1 text-xs font-medium hover:bg-emerald-500/10 transition-colors"
              >
                +10 Ayahs
              </button>
              <button
                type="button"
                onClick={() => setToAyah(Math.min(selectedSurah.numberOfAyahs, fromAyah + 19))}
                className="rounded-xl border border-[var(--app-line)] px-2.5 py-1 text-xs font-medium hover:bg-emerald-500/10 transition-colors"
              >
                +20 Ayahs
              </button>
            </div>

            {/* Date & Completion Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[var(--app-muted)] mb-1">
                  Reading Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full rounded-2xl border px-3 py-2 text-xs font-semibold ${inputBg}`}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="markCompleteSurah"
                  checked={isCompletedSurah}
                  onChange={(e) => setIsCompletedSurah(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="markCompleteSurah"
                  className="text-xs font-semibold text-[var(--app-ink)] cursor-pointer select-none"
                >
                  Mark entire Surah as completed
                </label>
              </div>
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[var(--app-muted)] mb-1">
                Reflection / Session Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Read after Fajr, completed with translation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`w-full rounded-2xl border px-3.5 py-2 text-xs ${inputBg}`}
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full cursor-pointer rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Save Reading ({toAyah - fromAyah + 1} Ayahs)</span>
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Offline Surahs Checklist */
          <div className="flex-1 flex flex-col overflow-hidden p-5">
            {/* Explainer & Batch Presets */}
            <div className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
              <div className="text-xs">
                <strong className="text-emerald-800 dark:text-emerald-300">
                  Read Surahs offline?
                </strong>
                <p className="text-[var(--app-muted)] text-[11px] mt-0.5">
                  Check off any completed Surahs below to instantly update your Khatm progress.
                </p>
              </div>

              {/* Quick Batch Add */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleBatchCheckFirst5}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  + First 5 Surahs
                </button>
                <button
                  type="button"
                  onClick={handleBatchCheckJuz30}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  + Juz 30 (Amma)
                </button>
              </div>
            </div>

            {/* Search Input for Checklist */}
            <div className="relative mb-3 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search Surah by name or number (e.g. Baqarah, Yasin, 18)..."
                value={checklistSearch}
                onChange={(e) => setChecklistSearch(e.target.value)}
                className={`w-full rounded-xl border pl-9 pr-3 py-1.5 text-xs ${inputBg}`}
              />
            </div>

            {/* 114 Surahs Checklist Grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checklistSurahs.map((surah) => {
                const isCompleted = trackerData.completedSurahs.includes(surah.number);
                return (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => handleToggleSurah(surah.number)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                        : 'border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-ink)] hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`grid h-6 w-6 place-items-center rounded-lg text-[10px] font-extrabold ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-black/5 dark:bg-white/5 text-[var(--app-muted)]'
                        }`}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : surah.number}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold truncate">
                          {surah.englishName}
                        </span>
                        <span className="block text-[10px] text-[var(--app-muted)]">
                          {surah.numberOfAyahs} Ayahs · {surah.revelationType}
                        </span>
                      </div>
                    </div>
                    <span className="font-arabic text-sm font-bold text-emerald-800 dark:text-emerald-300 ml-2 shrink-0">
                      {surah.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-inherit flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-[var(--app-muted)]">
                Completed: {trackerData.completedSurahs.length} of 114 Surahs
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
