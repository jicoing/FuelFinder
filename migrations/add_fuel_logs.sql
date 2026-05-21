-- Create fuel_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES saved_stations(id) ON DELETE CASCADE,
  filled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')) DEFAULT 'petrol',
  amount NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  mileage NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add currency column if table exists but column doesn't
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT '$';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fuel_logs_user_id ON fuel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_station_id ON fuel_logs(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_filled_at ON fuel_logs(filled_at DESC);

-- Enable Row Level Security
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow re-running
DROP POLICY IF EXISTS "Users can view their own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can insert their own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can update their own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can delete their own fuel logs" ON fuel_logs;

-- Create RLS policies
CREATE POLICY "Users can view their own fuel logs" ON fuel_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fuel logs" ON fuel_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fuel logs" ON fuel_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fuel logs" ON fuel_logs
  FOR DELETE USING (auth.uid() = user_id);
