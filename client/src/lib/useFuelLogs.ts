import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { createClient } from './supabase';
import type { FuelLog } from './database.types';

export function useFuelLogs() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (isAuthLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          *,
          station:saved_stations(*)
        `)
        .eq('user_id', user.id)
        .order('filled_at', { ascending: false });

      if (error) {
        console.error('Error fetching fuel logs:', error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching fuel logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthLoading, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = useCallback(async (log: {
    station_id: string;
    filled_at?: string;
    fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    amount: number;
    price: number;
    currency: string;
    mileage?: number | null;
    notes?: string | null;
  }) => {
    if (!user) {
      return { error: new Error('You must be logged in to add fuel logs') };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fuel_logs')
        .insert({
          user_id: user.id,
          station_id: log.station_id,
          filled_at: log.filled_at || new Date().toISOString(),
          fuel_type: log.fuel_type || 'petrol',
          amount: log.amount,
          price: log.price,
          currency: log.currency,
          mileage: log.mileage,
          notes: log.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding fuel log:', error);
        return { error };
      }

      await fetchLogs();
      return { data };
    } catch (error) {
      console.error('Error adding fuel log:', error);
      return { error: error as Error };
    }
  }, [user, fetchLogs]);

  const updateLog = useCallback(async (logId: string, updates: Partial<FuelLog>) => {
    if (!user) {
      return { error: new Error('You must be logged in to update fuel logs') };
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fuel_logs')
        .update(updates)
        .eq('id', logId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating fuel log:', error);
        return { error };
      }

      await fetchLogs();
      return { data };
    } catch (error) {
      console.error('Error updating fuel log:', error);
      return { error: error as Error };
    }
  }, [user, fetchLogs]);

  const deleteLog = useCallback(async (logId: string) => {
    if (!user) {
      return { error: new Error('You must be logged in to delete fuel logs') };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('fuel_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting fuel log:', error);
        return { error };
      }

      await fetchLogs();
      return { success: true };
    } catch (error) {
      console.error('Error deleting fuel log:', error);
      return { error: error as Error };
    }
  }, [user, fetchLogs]);

  const getLogsByStation = useCallback((stationId: string) => {
    return logs.filter(log => log.station_id === stationId);
  }, [logs]);

  const getMostRecentLog = useCallback((stationId?: string) => {
    if (stationId) {
      const stationLogs = logs.filter(log => log.station_id === stationId);
      return stationLogs.sort((a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime())[0] || null;
    }
    return logs.sort((a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime())[0] || null;
  }, [logs]);

  return {
    logs,
    loading,
    fetchLogs,
    addLog,
    updateLog,
    deleteLog,
    getLogsByStation,
    getMostRecentLog,
  };
}
