'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getProStatus,
  saveProStatus,
  applyPromoCode,
  type ProStatus,
  type ProTier,
} from '@/lib/proStorage';

export function usePro() {
  const [status, setStatus] = useState<ProStatus>({ isPro: false, tier: 'free' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatus(getProStatus());

    const handleUpdate = () => setStatus(getProStatus());
    window.addEventListener('dhikrly:pro-updated', handleUpdate);
    return () => window.removeEventListener('dhikrly:pro-updated', handleUpdate);
  }, []);

  const activateTier = useCallback((tier: ProTier) => {
    const expiresAt = new Date();
    if (tier === 'monthly') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (tier === 'annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const newStatus: ProStatus = {
      isPro: tier !== 'free',
      tier,
      activatedAt: new Date().toISOString(),
      expiresAt: tier === 'lifetime' || tier === 'free' ? undefined : expiresAt.toISOString(),
    };
    saveProStatus(newStatus);
    setStatus(newStatus);
  }, []);

  const deactivatePro = useCallback(() => {
    const freeStatus: ProStatus = { isPro: false, tier: 'free' };
    saveProStatus(freeStatus);
    setStatus(freeStatus);
  }, []);

  const redeemCode = useCallback((code: string) => {
    const res = applyPromoCode(code);
    if (res.success) {
      setStatus(getProStatus());
    }
    return res;
  }, []);

  return {
    isPro: mounted ? status.isPro : false,
    tier: mounted ? status.tier : 'free',
    status: mounted ? status : { isPro: false, tier: 'free' as const },
    activateTier,
    deactivatePro,
    redeemCode,
    mounted,
  };
}
