import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import type { TripCalculationInput, TripCalculationOutput, TripCalculation } from '@/lib/database.types';

export function useTripCalculations() {
  const { user, isPremium } = useAuth();
  const supabase = createClient();
  const [calculations, setCalculations] = useState<TripCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const maxHistory = isPremium ? Infinity : 10;

  useEffect(() => {
    if (user) {
      fetchCalculations();
    } else {
      const localData = localStorage.getItem('tripCalculations');
      if (localData) {
        setCalculations(JSON.parse(localData));
      }
    }
  }, [user]);

  const fetchCalculations = async () => {
    if (!user) return;
    
    console.log("fetchCalculations starting for user:", user.id);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      console.log("fetchCalculations finished. Error:", error, "Data count:", data?.length, "Data:", data);
      if (error) throw error;
      setCalculations(data || []);
    } catch (error) {
      console.error('Error fetching calculations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCalculation = useCallback(async (
    input: TripCalculationInput,
    output: TripCalculationOutput
  ) => {
    const localCalculation = {
      type: input.type,
      timestamp: new Date().toISOString(),
      inputs: {
        distance: input.distance,
        mileage: input.mileage,
        fuelRate: input.fuelRate,
        budget: input.budget,
        country: input.countryCode,
      },
      outputs: output,
    };

    // For non-premium users, check limit
    if (!isPremium && calculations.length >= maxHistory) {
      console.log("saveCalculation blocked: Limit reached. history length:", calculations.length);
      return { error: 'Free tier limit reached. Upgrade to Premium for unlimited history.' };
    }

    if (user) {
      console.log("saveCalculation invoking Supabase insert for user:", user.id);
      const payload = {
        user_id: user.id,
        type: input.type,
        distance: input.distance || null,
        mileage: input.mileage,
        fuel_rate: input.fuelRate,
        budget: input.budget || null,
        fuel_needed: output.fuelNeeded || null,
        total_cost: output.totalCost || null,
        fuel_affordable: output.fuelAffordable || null,
        distance_covered: output.distance || null,
        country_code: input.countryCode,
        currency: input.currency,
        volume_unit: input.volumeUnit,
        distance_unit: input.distanceUnit,
      };
      console.log("Insert payload:", payload);

      try {
        const { data, error } = await supabase.from('trip_calculations').insert(payload).select();
        console.log("Supabase insert response. Error:", error, "Inserted row:", data);

        if (error) throw error;
        await fetchCalculations();
        return { error: null };
      } catch (error: any) {
        console.error('Error saving calculation:', error);
        return { error: error.message || 'Failed to save calculation' };
      }
    } else {
      // Save to localStorage for non-authenticated users
      console.log("saveCalculation storing locally (no authenticated user)");
      const localData = localStorage.getItem('tripCalculations');
      const existing = localData ? JSON.parse(localData) : [];
      const newCalculations = [localCalculation, ...existing].slice(0, maxHistory);
      localStorage.setItem('tripCalculations', JSON.stringify(newCalculations));
      setCalculations(newCalculations);
      return { error: null };
    }
  }, [user, isPremium, calculations.length, maxHistory, supabase]);

  const deleteCalculation = useCallback(async (timestamp: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('trip_calculations')
          .delete()
          .eq('user_id', user.id)
          .eq('created_at', timestamp);

        if (error) throw error;
        await fetchCalculations();
      } catch (error) {
        console.error('Error deleting calculation:', error);
      }
    } else {
      const localData = localStorage.getItem('tripCalculations');
      if (localData) {
        const existing = JSON.parse(localData);
        const filtered = existing.filter((calc: any) => calc.timestamp !== timestamp);
        localStorage.setItem('tripCalculations', JSON.stringify(filtered));
        setCalculations(filtered);
      }
    }
  }, [user, supabase]);

  const deleteAllCalculations = useCallback(async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('trip_calculations')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
        setCalculations([]);
      } catch (error) {
        console.error('Error deleting all calculations:', error);
      }
    } else {
      localStorage.removeItem('tripCalculations');
      setCalculations([]);
    }
  }, [user, supabase]);

  const canSaveMore = calculations.length < maxHistory || isPremium;

  return {
    calculations,
    isLoading,
    saveCalculation,
    deleteCalculation,
    deleteAllCalculations,
    canSaveMore,
    remainingSaves: isPremium ? Infinity : Math.max(0, maxHistory - calculations.length),
  };
}