/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

export default function BottomNavWrapper() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Read dark mode from localStorage
    try {
      const s = JSON.parse(localStorage.getItem('duas_settings_v3') ?? '{}');
      setDark(s.dark !== false);
    } catch { /* */ }

    // Watch for dark mode changes via class on <html>
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return <BottomNav dark={dark} />;
}
