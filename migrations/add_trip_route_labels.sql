-- Add optional route labels to trip_calculations so Travel Planner trips
-- can display "Origin -> Destination" in the calculation history.
-- These columns are nullable; existing rows and the other calculator tabs
-- are unaffected.

ALTER TABLE public.trip_calculations
  ADD COLUMN IF NOT EXISTS origin_label TEXT;

ALTER TABLE public.trip_calculations
  ADD COLUMN IF NOT EXISTS destination_label TEXT;
