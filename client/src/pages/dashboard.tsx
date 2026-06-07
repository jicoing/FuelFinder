import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, TrendingUp, TrendingDown, Activity, DollarSign, Gauge, Route } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useFuelLogs } from '@/lib/useFuelLogs';
import { useCountryPreference, countryData } from '@/hooks/use-country-preference';
import { FuelAnalytics } from '@/components/fuel-analytics';
import { AuthModal } from '@/components/auth-modal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const { logs, loading } = useFuelLogs();
  const { country } = useCountryPreference();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const currency = useMemo(() => {
    return (countryData as any)[country || 'IN']?.currency || '₹';
  }, [country]);

  const stats = useMemo(() => {
    if (!logs.length) return null;

    const totalFuel = logs.reduce((s, l) => s + l.amount, 0);
    const totalSpent = logs.reduce((s, l) => s + l.price, 0);
    const totalDistance = logs.reduce((s, l) => s + (l.mileage || 0), 0);
    const avgPricePerL = totalFuel > 0 ? totalSpent / totalFuel : 0;
    const efficiency = totalFuel > 0 && totalDistance > 0 ? totalDistance / totalFuel : 0;
    const costPerKm = totalDistance > 0 ? totalSpent / totalDistance : 0;

    // Monthly comparison
    const now = new Date();
    const thisMonth = logs.filter(l => {
      const d = new Date(l.filled_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = logs.filter(l => {
      const d = new Date(l.filled_at);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    });

    const thisMonthSpent = thisMonth.reduce((s, l) => s + l.price, 0);
    const lastMonthSpent = lastMonth.reduce((s, l) => s + l.price, 0);
    const monthlyChange = lastMonthSpent > 0 ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;

    return {
      totalFuel: totalFuel.toFixed(1),
      totalSpent: totalSpent.toFixed(0),
      totalDistance: totalDistance.toFixed(0),
      avgPricePerL: avgPricePerL.toFixed(2),
      efficiency: efficiency.toFixed(1),
      costPerKm: costPerKm.toFixed(2),
      thisMonthSpent: thisMonthSpent.toFixed(0),
      monthlyChange: monthlyChange.toFixed(1),
      totalLogs: logs.length,
    };
  }, [logs]);

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <Gauge className="w-16 h-16 text-muted-foreground opacity-30" />
            <h2 className="text-2xl font-bold">Fuel Efficiency Dashboard</h2>
            <p className="text-muted-foreground max-w-sm">Sign in to track your fuel efficiency, spending patterns, and savings over time.</p>
            <Button onClick={() => setIsAuthOpen(true)}>Sign In</Button>
            <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-24 animate-pulse bg-muted/30" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Efficiency Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your fuel consumption & spending insights</p>
        </div>
        {stats && (
          <Badge variant="outline" className={`${parseFloat(stats.monthlyChange) <= 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {parseFloat(stats.monthlyChange) <= 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
            {Math.abs(parseFloat(stats.monthlyChange))}% vs last month
          </Badge>
        )}
      </div>

      {stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Efficiency</span>
                </div>
                <p className="text-2xl font-bold">{stats.efficiency} km/L</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Cost/km</span>
                </div>
                <p className="text-2xl font-bold">{currency}{stats.costPerKm}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Fuel className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Avg Price</span>
                </div>
                <p className="text-2xl font-bold">{currency}{stats.avgPricePerL}/L</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Route className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Total Distance</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalDistance} km</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Total Fuel</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalFuel} L</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">This Month</span>
                </div>
                <p className="text-2xl font-bold">{currency}{stats.thisMonthSpent}</p>
              </CardContent>
            </Card>
          </div>

          <FuelAnalytics logs={logs} currency={currency} />
        </>
      ) : (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <Activity className="w-12 h-12 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold">No fuel logs yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Start adding fuel logs when you fill up to see your efficiency metrics and spending trends.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
