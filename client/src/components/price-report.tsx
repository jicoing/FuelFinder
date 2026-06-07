import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Clock, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { useFuelPrices } from '@/lib/useFuelPrices';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { FuelPriceReport } from '@/lib/database.types';

interface ReportPriceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  station: { name: string; lat: number; lon: number; id?: string } | null;
  currency: string;
}

export function ReportPriceDialog({ isOpen, onOpenChange, station, currency }: ReportPriceDialogProps) {
  const { user } = useAuth();
  const { reportPrice } = useFuelPrices();
  const { toast } = useToast();
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station || !price) return;

    setSubmitting(true);
    const result = await reportPrice({
      station_id: station.id || null,
      station_name: station.name,
      station_lat: station.lat,
      station_lon: station.lon,
      fuel_type: fuelType,
      price_per_unit: parseFloat(price),
      currency,
    });
    setSubmitting(false);

    if (result?.error) {
      toast({ title: 'Failed to report price', description: String(result.error.message || result.error), variant: 'destructive' });
    } else {
      toast({ title: 'Price reported!', description: `${currency}${price}/L for ${fuelType} at ${station.name}` });
      setPrice('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Report Fuel Price</DialogTitle>
          <DialogDescription>
            Help others by sharing the current price at {station?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Fuel Type</Label>
              <Select value={fuelType} onValueChange={(v: any) => setFuelType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Price per Litre ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 105.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !price || !user}>
              {submitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
              Submit Price
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PriceDisplayProps {
  reports: FuelPriceReport[];
  currency: string;
}

export function StationPriceDisplay({ reports, currency }: PriceDisplayProps) {
  if (!reports.length) return null;

  const latestPetrol = reports.find(r => r.fuel_type === 'petrol');
  const latestDiesel = reports.find(r => r.fuel_type === 'diesel');

  const timeAgo = (dateStr: string) => {
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (hrs < 1) return 'just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {latestPetrol && (
        <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-400 border-green-500/20 px-2.5 py-1">
          <DollarSign className="w-3 h-3" />
          Petrol: {currency}{latestPetrol.price_per_unit}/L
          <span className="text-[10px] text-muted-foreground ml-1">
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />{timeAgo(latestPetrol.reported_at)}
          </span>
        </Badge>
      )}
      {latestDiesel && (
        <Badge variant="outline" className="gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20 px-2.5 py-1">
          <DollarSign className="w-3 h-3" />
          Diesel: {currency}{latestDiesel.price_per_unit}/L
          <span className="text-[10px] text-muted-foreground ml-1">
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />{timeAgo(latestDiesel.reported_at)}
          </span>
        </Badge>
      )}
    </div>
  );
}
