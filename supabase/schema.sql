-- FuelFinder Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
    subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
    customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trip_calculations table
CREATE TABLE IF NOT EXISTS public.trip_calculations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('distanceToCost', 'budgetToDistance')),
    distance NUMERIC,
    mileage NUMERIC NOT NULL,
    fuel_rate NUMERIC NOT NULL,
    budget NUMERIC,
    fuel_needed NUMERIC,
    total_cost NUMERIC,
    fuel_affordable NUMERIC,
    distance_covered NUMERIC,
    country_code TEXT NOT NULL,
    currency TEXT NOT NULL,
    volume_unit TEXT NOT NULL,
    distance_unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_stations table
CREATE TABLE IF NOT EXISTS public.saved_stations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_calculations_user_id ON public.trip_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_calculations_created_at ON public.trip_calculations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_stations_user_id ON public.saved_stations(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trip calculations policies
CREATE POLICY "Users can view their own calculations" ON public.trip_calculations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations" ON public.trip_calculations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations" ON public.trip_calculations
    FOR DELETE USING (auth.uid() = user_id);

-- Saved stations policies
CREATE POLICY "Users can view their own stations" ON public.saved_stations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stations" ON public.saved_stations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stations" ON public.saved_stations
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant access to storage bucket (if using avatars)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Avatar view" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');