-- Migration: Add payment and deposit columns to salons table
-- Safe execution: se já existe no supabase então não criará novamente

-- 1. Criação da tabela com os campos requeridos caso ainda não exista
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  payment_enabled BOOLEAN DEFAULT false,
  deposit_percentage NUMERIC DEFAULT 30,
  full_payment_discount NUMERIC DEFAULT 5,
  require_deposit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Caso a tabela já exista, adiciona apenas as colunas ausentes
DO $$
BEGIN
  -- payment_enabled (boolean, default false)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'payment_enabled'
  ) THEN
    ALTER TABLE public.salons ADD COLUMN payment_enabled BOOLEAN DEFAULT false;
  END IF;

  -- deposit_percentage (numeric, default 30)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'deposit_percentage'
  ) THEN
    ALTER TABLE public.salons ADD COLUMN deposit_percentage NUMERIC DEFAULT 30;
  END IF;

  -- full_payment_discount (numeric, default 5)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'full_payment_discount'
  ) THEN
    ALTER TABLE public.salons ADD COLUMN full_payment_discount NUMERIC DEFAULT 5;
  END IF;

  -- require_deposit (boolean, default false)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'require_deposit'
  ) THEN
    ALTER TABLE public.salons ADD COLUMN require_deposit BOOLEAN DEFAULT false;
  END IF;
END $$;
