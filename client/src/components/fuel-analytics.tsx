import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  startOfDay, 
  subMonths, 
  subDays, 
  isSameMonth, 
  isSameDay,
  eachDayOfInterval,
  eachMonthOfInterval
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelLog } from '@/lib/database.types';
import { Fuel, DollarSign, Activity, TrendingUp } from 'lucide-react';

interface FuelAnalyticsProps {
  logs: FuelLog[];
  currency: string;
  stationId?: string | null;
}

export function FuelAnalytics({ logs, currency, stationId }: FuelAnalyticsProps) {
  const filteredLogs = useMemo(() => {
    if (!stationId) return logs;
    return logs.filter(log => log.station_id === stationId);
  }, [logs, stationId]);

  const dailyData = useMemo(() => {
    if (!filteredLogs.length) return [];

    const end = new Date();
    const start = subDays(end, 30);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayLogs = filteredLogs.filter(log => isSameDay(new Date(log.filled_at), day));
      return {
        date: format(day, 'MMM dd'),
        amount: dayLogs.reduce((sum, log) => sum + log.amount, 0),
        spent: dayLogs.reduce((sum, log) => sum + log.price, 0),
      };
    });
  }, [filteredLogs]);

  const refinedMonthlyData = useMemo(() => {
    if (!filteredLogs.length) return [];

    const end = new Date();
    const start = subMonths(end, 11);
    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
      const monthLogs = filteredLogs.filter(log => isSameMonth(new Date(log.filled_at), month));
      return {
        name: format(month, 'MMM'),
        amount: parseFloat(monthLogs.reduce((sum, log) => sum + log.amount, 0).toFixed(2)),
        spent: parseFloat(monthLogs.reduce((sum, log) => sum + log.price, 0).toFixed(2)),
      };
    });
  }, [filteredLogs]);

  const metrics = useMemo(() => {
    const totalFuel = filteredLogs.reduce((sum, log) => sum + log.amount, 0);
    const totalSpent = filteredLogs.reduce((sum, log) => sum + log.price, 0);
    const avgPrice = totalFuel > 0 ? totalSpent / totalFuel : 0;
    
    const logsWithMileage = filteredLogs.filter(l => l.mileage !== null && l.mileage !== undefined);
    const avgMileage = logsWithMileage.length > 0 
      ? logsWithMileage.reduce((sum, log) => sum + (log.mileage || 0), 0) / logsWithMileage.length 
      : 0;

    return { totalFuel, totalSpent, avgPrice, avgMileage };
  }, [filteredLogs]);

  if (filteredLogs.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No data for analytics</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {stationId 
              ? "This station doesn't have any fuel logs yet."
              : "Start adding fuel logs to see your consumption and spending patterns over time."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Fuel className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Avg Price</span>
            </div>
            <p className="text-2xl font-bold">{currency}{metrics.avgPrice.toFixed(2)}/L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Avg Log</span>
            </div>
            <p className="text-2xl font-bold">{(metrics.totalFuel / filteredLogs.length).toFixed(1)} L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Total Logs</span>
            </div>
            <p className="text-2xl font-bold">{filteredLogs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Efficiency</span>
            </div>
            <p className="text-2xl font-bold">{metrics.avgMileage > 0 ? `${metrics.avgMileage.toFixed(1)} km/L` : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Usage Charts</h3>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Consumption (Last 30 Days)</CardTitle>
              <CardDescription>Amount of fuel filled per day</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}L`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    strokeWidth={2}
                    name="Fuel (L)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fuel Consumption</CardTitle>
                <CardDescription>Monthly fuel volume</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={refinedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      name="Fuel (L)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fuel Spending</CardTitle>
                <CardDescription>Monthly expenditure</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={refinedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${currency}${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="spent" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6 }}
                      name="Spent"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
