import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { createClient } from './supabase';
import type { SavedStation } from './database.types';

const FREE_TIER_MAX_SAVED_STATIONS = 5;

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message?: unknown }).message || fallback));
  }
  return new Error(fallback);
}

export function useSavedStations() {
  const { user, isLoading: isAuthLoading, isPremium } = useAuth();
  const [savedStations, setSavedStations] = useState<SavedStation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedStations = useCallback(async () => {
    if (isAuthLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setSavedStations([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        return { error: new Error('Supabase is not configured') };
      }

      const { data, error } = await supabase
        .from('saved_stations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved stations:', error);
        setSavedStations([]);
      } else {
        setSavedStations(data || []);
      }
    } catch (error) {
      console.error('Error fetching saved stations:', error);
      setSavedStations([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthLoading, user]);

  useEffect(() => {
    fetchSavedStations();
  }, [fetchSavedStations]);

  const saveStation = useCallback(async (station: { name: string; brand?: string; lat: number; lon: number }) => {
    if (!user) {
      return { error: new Error('You must be logged in to save stations') };
    }

    // Enforce free tier limit
    if (!isPremium && savedStations.length >= FREE_TIER_MAX_SAVED_STATIONS) {
      return { error: new Error(`Free tier limit of ${FREE_TIER_MAX_SAVED_STATIONS} saved stations reached. Upgrade to Premium for unlimited stations.`) };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('saved_stations')
        .insert({
          user_id: user.id,
          name: station.name,
          brand: station.brand || null,
          lat: station.lat,
          lon: station.lon,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving station:', error);
        return { error: toError(error, 'Failed to save station') };
      }

      await fetchSavedStations();
      return { data };
    } catch (error) {
      console.error('Error saving station:', error);
      return { error: toError(error, 'Failed to save station') };
    }
  }, [user, isPremium, savedStations.length, fetchSavedStations]);

  const removeStation = useCallback(async (stationId: string) => {
    if (!user) {
      return { error: new Error('You must be logged in to remove stations') };
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        return { error: new Error('Supabase is not configured') };
      }

      const { error } = await supabase
        .from('saved_stations')
        .delete()
        .eq('id', stationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing station:', error);
        return { error: toError(error, 'Failed to remove station') };
      }

      await fetchSavedStations();
      return { success: true };
    } catch (error) {
      console.error('Error removing station:', error);
      return { error: toError(error, 'Failed to remove station') };
    }
   }, [user, fetchSavedStations]);

  const canSaveMore = isPremium || savedStations.length < FREE_TIER_MAX_SAVED_STATIONS;
  const remainingSaves = isPremium ? Infinity : Math.max(0, FREE_TIER_MAX_SAVED_STATIONS - savedStations.length);

  return {
    savedStations,
    loading,
    saveStation,
    removeStation,
    refetch: fetchSavedStations,
    canSaveMore,
    remainingSaves,
  };
}
