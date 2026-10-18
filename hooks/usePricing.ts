'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PricingRegion,
  PricingPlan,
  PricingPlanId,
  getPricingPlans,
  getPricingPlan,
  detectPricingRegion,
  getPricingRegionOverride,
  savePricingRegionOverride,
} from '@/lib/pricing';

export interface UsePricingReturn {
  region: PricingRegion;
  isIndia: boolean;
  currency: 'INR' | 'USD';
  symbol: string;
  plans: PricingPlan[];
  hasOverride: boolean;
  setRegion: (region: PricingRegion | 'auto') => void;
  getPlan: (id: PricingPlanId) => PricingPlan;
}

export function usePricing(): UsePricingReturn {
  const [region, setRegionState] = useState<PricingRegion>(() => detectPricingRegion());
  const [hasOverride, setHasOverride] = useState<boolean>(() => getPricingRegionOverride() !== null);

  const refresh = useCallback(() => {
    setRegionState(detectPricingRegion());
    setHasOverride(getPricingRegionOverride() !== null);
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener('dhikrly:pricing-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // If no manual override is active, check Geo-IP in the background
    if (getPricingRegionOverride() === null) {
      fetch('/api/geo')
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (data && typeof data.isIndia === 'boolean') {
            const detected: PricingRegion = data.isIndia ? 'IN' : 'GLOBAL';
            // Only update if still no override
            if (getPricingRegionOverride() === null) {
              setRegionState(detected);
            }
          }
        })
        .catch(() => {
          // Ignore network errors in geo check
        });
    }

    return () => {
      window.removeEventListener('dhikrly:pricing-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  const setRegion = useCallback((target: PricingRegion | 'auto') => {
    savePricingRegionOverride(target);
    setRegionState(detectPricingRegion());
    setHasOverride(target !== 'auto');
  }, []);

  const isIndia = region === 'IN';
  const currency: 'INR' | 'USD' = isIndia ? 'INR' : 'USD';
  const symbol = isIndia ? '₹' : '$';
  const plans = getPricingPlans(region);

  const getPlan = useCallback(
    (id: PricingPlanId) => getPricingPlan(region, id),
    [region]
  );

  return {
    region,
    isIndia,
    currency,
    symbol,
    plans,
    hasOverride,
    setRegion,
    getPlan,
  };
}
