export interface TierConfig {
  name: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    maxSavedStations: number;
    maxTripHistory: number;
    canExportData: boolean;
    canSyncAcrossDevices: boolean;
    prioritySupport: boolean;
  };
}

export const FREE_TIER: TierConfig = {
  name: 'Free',
  price: 0,
  priceId: '',
  features: [
    'Search nearby fuel stations',
    'Basic trip calculator',
    '10 saved trip calculations',
    'Save up to 5 favorite stations',
  ],
  limits: {
    maxSavedStations: 5,
    maxTripHistory: 10,
    canExportData: false,
    canSyncAcrossDevices: false,
    prioritySupport: false,
  },
};

export const PREMIUM_TIER: TierConfig = {
  name: 'Premium',
  price: 1.49,
  priceId: 'premium_lifetime',
  features: [
    'Everything in Free',
    'Unlimited saved stations',
    'Unlimited trip history',
    'Export data to CSV',
    'Sync across devices',
    'Priority support',
    'Early access to new features',
    'Lifetime access - one-time payment',
  ],
  limits: {
    maxSavedStations: Infinity,
    maxTripHistory: Infinity,
    canExportData: true,
    canSyncAcrossDevices: true,
    prioritySupport: true,
  },
};

export const TIER_COMPARISON = [FREE_TIER, PREMIUM_TIER];

export function canUseFeature(
  currentStationsCount: number,
  currentHistoryCount: number,
  feature: keyof TierConfig['limits']
): { allowed: boolean; current: number; limit: number | 'unlimited' } {
  const isPremium = true; // This should come from auth context in actual usage

  // For now, return based on premium status
  if (isPremium) {
    return { allowed: true, current: currentStationsCount, limit: 'unlimited' };
  }

  switch (feature) {
    case 'maxSavedStations':
      return {
        allowed: currentStationsCount < FREE_TIER.limits.maxSavedStations,
        current: currentStationsCount,
        limit: FREE_TIER.limits.maxSavedStations,
      };
    case 'maxTripHistory':
      return {
        allowed: currentHistoryCount < FREE_TIER.limits.maxTripHistory,
        current: currentHistoryCount,
        limit: FREE_TIER.limits.maxTripHistory,
      };
    default:
      return { allowed: isPremium, current: 0, limit: 'unlimited' };
  }
}