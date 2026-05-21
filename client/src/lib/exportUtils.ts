import type { SavedStation } from './database.types';
import type { FuelLog } from './database.types';
import type { TripCalculation } from './database.types';

export interface ExportOptions {
  includeSavedStations?: boolean;
  includeFuelLogs?: boolean;
  includeTripCalculations?: boolean;
}

/**
 * Export user data to CSV format
 * Premium feature: Only available to premium subscribers
 */
export async function exportToCSV(
  savedStations: SavedStation[],
  fuelLogs: FuelLog[],
  tripCalculations: TripCalculation[],
  options: ExportOptions = {}
): Promise<Blob> {
  const {
    includeSavedStations = true,
    includeFuelLogs = true,
    includeTripCalculations = true,
  } = options;

  const csvRows: string[] = [];

  // Add timestamp
  csvRows.push(`# Export generated: ${new Date().toISOString()}`);
  csvRows.push(`# User data from FindMyFuel`);

  // Export Saved Stations
  if (includeSavedStations && savedStations.length > 0) {
    csvRows.push('\n# SAVED STATIONS');
    csvRows.push(['id', 'name', 'brand', 'lat', 'lon', 'created_at'].join(','));
    
    for (const station of savedStations) {
      csvRows.push([
        station.id,
        `"${station.name.replace(/"/g, '""')}"`,
        `"${(station.brand || '').replace(/"/g, '""')}"`,
        station.lat.toString(),
        station.lon.toString(),
        station.created_at,
      ].join(','));
    }
  }

  // Export Fuel Logs
  if (includeFuelLogs && fuelLogs.length > 0) {
    csvRows.push('\n# FUEL LOGS');
    csvRows.push(['id', 'station_id', 'filled_at', 'fuel_type', 'amount', 'price', 'currency', 'mileage', 'notes', 'created_at'].join(','));
    
    for (const log of fuelLogs) {
      csvRows.push([
        log.id,
        log.station_id,
        log.filled_at,
        log.fuel_type,
        log.amount.toString(),
        log.price.toString(),
        log.currency,
        log.mileage?.toString() || '',
        `"${(log.notes || '').replace(/"/g, '""')}"`,
        log.created_at,
      ].join(','));
    }
  }

  // Export Trip Calculations
  if (includeTripCalculations && tripCalculations.length > 0) {
    csvRows.push('\n# TRIP CALCULATIONS');
    csvRows.push(['id', 'type', 'created_at', 'distance_km', 'mileage_kmpl', 'fuel_rate', 'budget', 'fuel_needed_l', 'total_cost', 'fuel_affordable_l', 'distance_covered_km', 'country_code', 'currency', 'volume_unit', 'distance_unit'].join(','));
    
    for (const calc of tripCalculations) {
      csvRows.push([
        calc.id,
        calc.type,
        calc.created_at,
        calc.distance?.toString() || '',
        calc.mileage.toString(),
        calc.fuel_rate.toString(),
        calc.budget?.toString() || '',
        calc.fuel_needed?.toString() || '',
        calc.total_cost?.toString() || '',
        calc.fuel_affordable?.toString() || '',
        calc.distance_covered?.toString() || '',
        calc.country_code,
        calc.currency,
        calc.volume_unit,
        calc.distance_unit,
      ].join(','));
    }
  }

  return new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(prefix: string = 'findmyfuel'): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_export_${date}.csv`;
}
