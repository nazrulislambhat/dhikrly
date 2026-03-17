/* eslint-disable react-hooks/static-components */
'use client';

import { useState } from 'react';
import type { Dua, Category } from '@/types';

interface AddDuaModalProps {
  dark: boolean;
  onAdd: (dua: Dua) => void;
  onClose: () => void;
}

const SESSIONS = ['Morning', 'Evening', 'After Ṣalāh', 'Anytime'];
const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'quran', label: "Qur'ān" },
  { key: 'athkar', label: 'Athkār' },
  { key: 'dua', label: "Du'ā" },
];

interface FormState {
  title: string;
  titleAr: string;
  ar: string;
  en: string;
  transliteration: string;
  category: Category;
  sessions: string[];
  count: string;
  priority: boolean;
}

const EMPTY: FormState = {
  title: '',
  titleAr: '',
  ar: '',
  en: '',
  transliteration: '',
  category: 'dua',
  sessions: ['Anytime'],
  count: '',
  priority: false,
};

export default function AddDuaModal({ dark, onAdd, onClose }: AddDuaModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.ar.trim()) e.ar = 'Required';
    if (!form.en.trim()) e.en = 'Required';
    if (form.sessions.length === 0) e.sessions = 'Select at least one';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newDua: Dua = {
      id: `custom-${Date.now()}`,
      category: form.category,
      session: form.sessions,
      priority: form.priority,
      count: form.count || '1×',
      title: form.title.trim(),
      titleAr: form.titleAr.trim(),
      transliteration: form.transliteration.trim(),
      en: form.en.trim(),
      ar: form.ar.trim(),
      custom: true,
    };
    onAdd(newDua);
    onClose();
  };

  const toggleSession = (s: string) => {
    setForm((prev) => ({
      ...prev,
      sessions: prev.sessions.includes(s)
        ? prev.sessions.filter((x) => x !== s)
        : [...prev.sessions, s],
    }));
  };

  const overlay = dark
    ? 'bg-[#0c1a2e]/80 backdrop-blur-sm'
    : 'bg-stone-900/40 backdrop-blur-sm';
  const panel = dark
    ? 'bg-[#111f33] border-white/10'
    : 'bg-white border-stone-200';
  const inputBase = dark
    ? 'bg-white/5 border-white/10 text-stone-200 placeholder-stone-600 focus:border-amber-400/50'
    : 'bg-stone-50 border-stone-200 text-stone-700 placeholder-stone-400 focus:border-amber-400';
  const label = dark ? 'text-stone-400' : 'text-stone-500';
  const errCls = 'text-red-400 text-[10px] mt-0.5';

  const Field = ({
    id,
    label: lbl,
    placeholder,
    multiline,
    dir,
  }: {
    id: keyof FormState;
    label: string;
    placeholder: string;
    multiline?: boolean;
    dir?: string;
  }) => (
    <div className="mb-3">
      <label className={`mb-1 block text-[11px] uppercase tracking-wide ${label}`}>
        {lbl}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={form[id] as string}
          onChange={(e) =>
            setForm((p) => ({ ...p, [id]: e.target.value }))
          }
          placeholder={placeholder}
          dir={dir}
          className={`w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${inputBase} ${
            dir === 'rtl' ? 'font-arabic leading-loose' : ''
          }`}
        />
      ) : (
        <input
          type="text"
          value={form[id] as string}
          onChange={(e) =>
            setForm((p) => ({ ...p, [id]: e.target.value }))
          }
          placeholder={placeholder}
          dir={dir}
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${inputBase} ${
            dir === 'rtl' ? 'font-arabic' : ''
          }`}
        />
      )}
      {errors[id] && <p className={errCls}>{errors[id]}</p>}
    </div>
  );

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl ${panel}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            className={`font-serif text-lg font-semibold ${
              dark ? 'text-stone-100' : 'text-stone-800'
            }`}
          >
            Add Custom Du`ā
          </h2>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              dark
                ? 'text-stone-500 hover:bg-white/5 hover:text-stone-300'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            ✕
          </button>
        </div>

        <Field id="title" label="English Title *" placeholder="e.g. Dua before eating" />
        <Field
          id="titleAr"
          label="Arabic Title"
          placeholder="بسم الله"
          dir="rtl"
        />
        <Field
          id="ar"
          label="Arabic Text *"
          placeholder="اللَّهُمَّ ..."
          multiline
          dir="rtl"
        />
        <Field
          id="en"
          label="English Translation *"
          placeholder="O Allah..."
          multiline
        />
        <Field
          id="transliteration"
          label="Transliteration"
          placeholder="Allāhumma..."
          multiline
        />
        <Field
          id="count"
          label="Count / Occasion"
          placeholder="e.g. 3× after every meal"
        />

        {/* Category */}
        <div className="mb-3">
          <label className={`mb-1.5 block text-[11px] uppercase tracking-wide ${label}`}>
            Category
          </label>
          <div className="flex gap-2">
            {CATEGORIES.map(({ key, label: lbl }) => (
              <button
                key={key}
                onClick={() => setForm((p) => ({ ...p, category: key }))}
                className={`flex-1 rounded-xl border py-2 text-[12px] transition-all ${
                  form.category === key
                    ? dark
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : 'border-amber-400/50 bg-amber-50 text-amber-700'
                    : dark
                      ? 'border-white/[0.07] text-stone-500 hover:text-stone-300'
                      : 'border-stone-200 text-stone-400 hover:text-stone-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-4">
          <label
            className={`mb-1.5 block text-[11px] uppercase tracking-wide ${label}`}
          >
            Session(s) *
          </label>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSession(s)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition-all ${
                  form.sessions.includes(s)
                    ? dark
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : 'border-amber-400/50 bg-amber-50 text-amber-700'
                    : dark
                      ? 'border-white/[0.07] text-stone-500 hover:text-stone-300'
                      : 'border-stone-200 text-stone-400 hover:text-stone-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.sessions && <p className={errCls}>{errors.sessions}</p>}
        </div>

        {/* Priority toggle */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setForm((p) => ({ ...p, priority: !p.priority }))}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              form.priority
                ? dark
                  ? 'bg-amber-500'
                  : 'bg-amber-500'
                : dark
                  ? 'bg-stone-700'
                  : 'bg-stone-200'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.priority ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-[12px] ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
            Mark as priority (★)
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 rounded-xl py-2.5 text-sm transition-all ${
              dark
                ? 'border border-white/10 text-stone-400 hover:text-stone-200'
                : 'border border-stone-200 text-stone-500 hover:text-stone-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
              dark
                ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            }`}
          >
            Add Du`ā
          </button>
        </div>
      </div>
    </div>
  );
}
