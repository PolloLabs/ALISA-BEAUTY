-- Migration: Add business_type column to salons table
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'beauty_salon' 
CHECK (business_type IN ('beauty_salon', 'barbershop', 'unisex', 'nail_studio'));
