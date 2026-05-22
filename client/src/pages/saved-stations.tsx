import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Fuel,
  MapPin,
  Navigation,
  Calendar,
  DollarSign,
  Plus,
  History,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useSavedStations } from '@/lib/useSavedStations';
import { useFuelLogs } from '@/lib/useFuelLogs';
import { useCountryPreference } from '@/hooks/use-country-preference';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function SavedStationsPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { savedStations, loading: stationsLoading, removeStation } = useSavedStations();
  const { logs, loading: logsLoading, addLog, deleteLog } = useFuelLogs();
  const { country } = useCountryPreference();
  const { toast } = useToast();

  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    filled_at: new Date().toISOString().slice(0, 16),
    fuel_type: 'petrol' as const,
    amount: '',
    price: '',
    mileage: '',
    notes: '',
  });

  const metrics = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        totalFuel: 0,
        totalStations: 0,
        totalDistance: 0,
        totalSpent: 0,
        avgPricePerL: 0,
      };
    }

    const totalFuel = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
    const stationIds = new Set(logs.map(log => log.station_id).filter(Boolean));
    const totalStations = stationIds.size;

    // Sum all individual mileage entries (distance between fill-ups)
    const totalDistance = logs.reduce((sum, log) => sum + (log.mileage || 0), 0);

    const totalSpent = logs.reduce((sum, log) => sum + (log.price || 0), 0);
    const avgPricePerL = totalFuel > 0 ? totalSpent / totalFuel : 0;

    return { totalFuel, totalStations, totalDistance, totalSpent, avgPricePerL };
  }, [logs]);

  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md p-8 text-center">
          <CardContent className="pt-6">
            <Fuel className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your saved stations and fuel logs.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loading = stationsLoading || logsLoading;

  const getLogsForStation = (stationId: string) => {
    return logs.filter(log => log.station_id === stationId);
  };

  const getLastFill = (stationId: string) => {
    const stationLogs = getLogsForStation(stationId);
    if (stationLogs.length === 0) return null;
    return stationLogs.sort((a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime())[0];
  };

  // Get currency symbol based on selected country
  const getCurrency = () => {
    if (!country) return '$';
    const countryData: Record<string, string> = {
      US: '$', IN: '₹', UK: '£', CA: 'CAD', AU: 'AUD',
      DE: '€', NO: 'NOK', JP: '¥', CN: '¥', SA: 'SAR',
      AE: 'AED', LK: 'LKR', NG: '₦', IR: 'rial', VE: 'Bs'
    };
    return countryData[country] || '$';
  };

  const currency = getCurrency();

  const handleOpenAddLog = (stationId: string) => {
    setSelectedStation(stationId);
    setIsAddLogOpen(true);
    setFormData({
      filled_at: new Date().toISOString().slice(0, 16),
      fuel_type: 'petrol',
      amount: '',
      price: '',
      mileage: '',
      notes: '',
    });
  };

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;

    setIsSubmitting(true);
    try {
      const result = await addLog({
        station_id: selectedStation,
        filled_at: formData.filled_at,
        fuel_type: formData.fuel_type,
        amount: parseFloat(formData.amount),
        price: parseFloat(formData.price),
        currency: currency,
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        notes: formData.notes || null,
      });

      if (result?.error) {
        toast({
          title: 'Failed to add fuel log',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fuel log added',
          description: 'Your fill-up has been recorded.',
        });
        setIsAddLogOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    const result = await deleteLog(logId);
    if (result?.error) {
      toast({
        title: 'Failed to delete log',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Log deleted',
        description: 'The fuel log has been deleted.',
      });
    }
  };

  const handleRemoveStation = async (stationId: string) => {
    if (!confirm('Are you sure you want to remove this station? This will also delete all associated fuel logs.')) return;
    const result = await removeStation(stationId);
    if (result?.error) {
      toast({
        title: 'Failed to remove station',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Station removed',
        description: 'The station has been removed from your list.',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full w-full bg-background text-foreground flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Saved Stations</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage your fuel logs
                </p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  <Fuel className="w-4 h-4 mr-2" />
                  Back to Map
                </Button>
              </Link>
            </div>

            {user && !logsLoading && logs.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Fuel className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Fuel</p>
                    <p className="text-xl font-bold">{metrics.totalFuel.toFixed(1)} L</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <MapPin className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stations</p>
                    <p className="text-xl font-bold">{metrics.totalStations}</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Navigation className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Distance</p>
                    <p className="text-xl font-bold">{metrics.totalDistance.toFixed(1)} km</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <DollarSign className="w-5 h-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Spent</p>
                    <p className="text-xl font-bold">{currency}{metrics.totalSpent.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : savedStations.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent className="pt-6">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">No Saved Stations</h2>
                  <p className="text-muted-foreground mb-6">
                    Save gas stations from the map to track your fuel purchases.
                  </p>
                  <Link href="/">
                    <Button>Explore Map</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {savedStations.map((station) => {
                  const lastFill = getLastFill(station.id);
                  const stationLogs = getLogsForStation(station.id);

                  return (
                    <Card key={station.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                              <Fuel className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{station.name}</h3>
                              {station.brand && (
                                <Badge variant="outline" className="mt-1">
                                  {station.brand}
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {station.lat.toFixed(4)}, {station.lon.toFixed(4)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAddLog(station.id)}
                              className="gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Add Log
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStation(station.id);
                                setIsHistoryOpen(true);
                              }}
                              className="gap-1"
                            >
                              <History className="w-4 h-4" />
                              History
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveStation(station.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {lastFill && (
                          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex items-center gap-2 text-sm text-primary mb-2">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Last Fill</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium">{formatDate(lastFill.filled_at)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Fuel Type</p>
                                <p className="font-medium capitalize">{lastFill.fuel_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Amount</p>
                                <p className="font-medium">{lastFill.amount} L</p>
                              </div>
                               <div>
                                 <p className="text-muted-foreground">Total</p>
                                 <p className="font-medium flex items-center gap-1">
                                   <span className="text-sm">{lastFill.currency}</span>
                                   {lastFill.price.toFixed(2)}
                                 </p>
                               </div>
                            </div>
                            {lastFill.mileage && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Mileage: </span>
                                <span className="font-medium">{lastFill.mileage} km</span>
                              </div>
                            )}
                            {lastFill.notes && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Notes: </span>
                                <span className="font-medium">{lastFill.notes}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {stationLogs.length > 0 && !lastFill && (
                          <p className="text-sm text-muted-foreground mt-3">
                            {stationLogs.length} log(s) on file
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Add Log Dialog */}
      <Dialog open={isAddLogOpen} onOpenChange={setIsAddLogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Fuel Log</DialogTitle>
            <DialogDescription>
              Record a fuel fill-up at this station.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLog}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="filled_at">Date & Time</Label>
                <Input
                  id="filled_at"
                  type="datetime-local"
                  value={formData.filled_at}
                  onChange={(e) => setFormData({ ...formData, filled_at: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Select
                  value={formData.fuel_type}
                  onValueChange={(value: any) => setFormData({ ...formData, fuel_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (L)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Total Price ({currency})</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              <div className="grid gap-2">
                <Label htmlFor="mileage">Mileage (km, optional)</Label>
                <Input
                  id="mileage"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddLogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                Save Log
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Fuel History</DialogTitle>
            <DialogDescription>
              All fuel logs for this station.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {selectedStation && (() => {
              const stationLogs = getLogsForStation(selectedStation).sort(
                (a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime()
              );
              const station = savedStations.find(s => s.id === selectedStation);

              return (
                <>
                  {stationLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No fuel logs yet for this station.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stationLogs.map((log) => (
                        <Card key={log.id} className="p-4">
                          <CardContent className="p-0">
                            <div className="flex items-start justify-between">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-medium">{formatDate(log.filled_at)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Fuel Type</p>
                                  <p className="font-medium capitalize">{log.fuel_type}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Amount</p>
                                  <p className="font-medium">{log.amount} L</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total</p>
                                  <p className="font-medium flex items-center gap-1">
                                    <span className="text-sm">{log.currency || currency}</span>
                                    {log.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteLog(log.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {log.mileage && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Mileage: </span>
                                <span className="font-medium">{log.mileage} km</span>
                              </div>
                            )}
                            {log.notes && (
                              <div className="mt-1 text-sm">
                                <span className="text-muted-foreground">Notes: </span>
                                <span className="font-medium">{log.notes}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
