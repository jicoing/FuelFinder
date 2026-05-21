import { useAuth } from './auth-context';
import { createClient } from './supabase';
import { exportToCSV, downloadBlob, generateExportFilename } from './exportUtils';
import type { SavedStation } from './database.types';
import type { FuelLog } from './database.types';
import type { TripCalculation } from './database.types';
import { useToast } from '@/hooks/use-toast';

export function useDataExport() {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();

  const exportData = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to export your data.',
        variant: 'destructive',
      });
      return;
    }

    if (!isPremium) {
      toast({
        title: 'Premium Feature',
        description: 'Data export is available only to Premium subscribers.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const supabase = createClient();
      
      const [stationsResult, logsResult, calculationsResult] = await Promise.all([
        supabase.from('saved_stations').select('*').eq('user_id', user.id),
        supabase.from('fuel_logs').select('*').eq('user_id', user.id),
        supabase.from('trip_calculations').select('*').eq('user_id', user.id),
      ]);

      if (stationsResult.error) throw stationsResult.error;
      if (logsResult.error) throw logsResult.error;
      if (calculationsResult.error) throw calculationsResult.error;

      const blob = await exportToCSV(
        stationsResult.data || [],
        logsResult.data || [],
        calculationsResult.data || []
      );
      
      const filename = generateExportFilename('findmyfuel_data');
      downloadBlob(blob, filename);
      
      toast({
        title: 'Export successful',
        description: `Exported ${stationsResult.data?.length || 0} stations, ${logsResult.data?.length || 0} logs, ${calculationsResult.data?.length || 0} calculations.`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  return { exportData };
}
