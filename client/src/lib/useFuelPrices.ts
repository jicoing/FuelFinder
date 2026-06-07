import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { createClient } from './supabase';
import type { FuelPriceReport } from './database.types';

export function useFuelPrices() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<FuelPriceReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNearbyPrices = useCallback(async (lat: number, lon: number, radiusKm = 10) => {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      // Fetch reports from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('fuel_price_reports')
        .select('*')
        .gte('reported_at', sevenDaysAgo)
        .order('reported_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching fuel prices:', error);
        setPrices([]);
      } else {
        // Filter by distance client-side (simple haversine)
        const filtered = (data || []).filter(report => {
          const dist = haversine(lat, lon, report.station_lat, report.station_lon);
          return dist <= radiusKm;
        });
        setPrices(filtered);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reportPrice = useCallback(async (report: {
    station_id?: string | null;
    station_name: string;
    station_lat: number;
    station_lon: number;
    fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    price_per_unit: number;
    currency: string;
  }) => {
    if (!user) return { error: new Error('Must be signed in') };

    try {
      const supabase = createClient();
      if (!supabase) return { error: new Error('Supabase not configured') };

      const { data, error } = await supabase
        .from('fuel_price_reports')
        .insert({
          user_id: user.id,
          station_id: report.station_id || null,
          station_name: report.station_name,
          station_lat: report.station_lat,
          station_lon: report.station_lon,
          fuel_type: report.fuel_type,
          price_per_unit: report.price_per_unit,
          currency: report.currency,
          reported_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return { error };
      // Add to local state
      setPrices(prev => [data, ...prev]);
      return { data };
    } catch (e) {
      return { error: e as Error };
    }
  }, [user]);

  const getStationPrices = useCallback((stationLat: number, stationLon: number) => {
    return prices.filter(p =>
      Math.abs(p.station_lat - stationLat) < 0.001 &&
      Math.abs(p.station_lon - stationLon) < 0.001
    );
  }, [prices]);

  return { prices, loading, fetchNearbyPrices, reportPrice, getStationPrices };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
