-- Fuel Price Reports (Crowdsourcing)
-- Users can report current fuel prices at any station

CREATE TABLE IF NOT EXISTS public.fuel_price_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.saved_stations(id) ON DELETE SET NULL,
    station_name TEXT NOT NULL,
    station_lat NUMERIC NOT NULL,
    station_lon NUMERIC NOT NULL,
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
    price_per_unit NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT '₹',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_price_reports_station ON fuel_price_reports(station_lat, station_lon);
CREATE INDEX IF NOT EXISTS idx_fuel_price_reports_time ON fuel_price_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_price_reports_user ON fuel_price_reports(user_id);

ALTER TABLE fuel_price_reports ENABLE ROW LEVEL SECURITY;

-- Everyone can read price reports
CREATE POLICY "Anyone can view fuel price reports" ON fuel_price_reports
    FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Users can insert price reports" ON fuel_price_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete their own reports" ON fuel_price_reports
    FOR DELETE USING (auth.uid() = user_id);
