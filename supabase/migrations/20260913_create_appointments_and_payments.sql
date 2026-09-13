-- Migration: Appointments, Payments and RLS Policies
-- Safe idempotent execution: se já existe no supabase então não criará novamente

-- 1. Criação da tabela appointments se não existir
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'completed', 'canceled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_amount NUMERIC DEFAULT 0,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('pix', 'card', 'cash', 'boleto')),
  deposit_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Garantia de colunas caso a tabela já existisse com estrutura parcial
DO $$
BEGIN
  -- salon_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'salon_id') THEN
    ALTER TABLE public.appointments ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;
  END IF;

  -- staff_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'staff_id') THEN
    ALTER TABLE public.appointments ADD COLUMN staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;
  END IF;

  -- service_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'service_id') THEN
    ALTER TABLE public.appointments ADD COLUMN service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
  END IF;

  -- client_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'client_name') THEN
    ALTER TABLE public.appointments ADD COLUMN client_name TEXT NOT NULL DEFAULT 'Cliente';
  END IF;

  -- client_phone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'client_phone') THEN
    ALTER TABLE public.appointments ADD COLUMN client_phone TEXT NOT NULL DEFAULT '';
  END IF;

  -- client_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'client_email') THEN
    ALTER TABLE public.appointments ADD COLUMN client_email TEXT;
  END IF;

  -- start_time
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'start_time') THEN
    ALTER TABLE public.appointments ADD COLUMN start_time TIMESTAMPTZ DEFAULT now();
  END IF;

  -- end_time
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'end_time') THEN
    ALTER TABLE public.appointments ADD COLUMN end_time TIMESTAMPTZ DEFAULT now();
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'status') THEN
    ALTER TABLE public.appointments ADD COLUMN status TEXT DEFAULT 'confirmed';
  END IF;

  -- payment_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'payment_status') THEN
    ALTER TABLE public.appointments ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  -- payment_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'payment_amount') THEN
    ALTER TABLE public.appointments ADD COLUMN payment_amount NUMERIC DEFAULT 0;
  END IF;

  -- payment_method
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'payment_method') THEN
    ALTER TABLE public.appointments ADD COLUMN payment_method TEXT;
  END IF;

  -- deposit_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'deposit_amount') THEN
    ALTER TABLE public.appointments ADD COLUMN deposit_amount NUMERIC DEFAULT 0;
  END IF;

  -- notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'notes') THEN
    ALTER TABLE public.appointments ADD COLUMN notes TEXT;
  END IF;

  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'created_at') THEN
    ALTER TABLE public.appointments ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. Criação da tabela de pagamentos (appointment_payments)
CREATE TABLE IF NOT EXISTS public.appointment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT CHECK (method IN ('pix', 'card', 'boleto')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS nas tabelas
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança RLS para appointments (Idempotentes)

-- Super Admin vê tudo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointments' AND policyname = 'super_admin_all'
  ) THEN
    CREATE POLICY "super_admin_all" ON public.appointments
      FOR ALL USING (auth.jwt()->>'role' = 'super_admin');
  END IF;
END $$;

-- Owner vê apenas do seu salão
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointments' AND policyname = 'owner_salon_only'
  ) THEN
    CREATE POLICY "owner_salon_only" ON public.appointments
      FOR ALL USING (
        salon_id IN (
          SELECT id FROM public.salons WHERE owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employee vê apenas seus agendamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointments' AND policyname = 'employee_own_only'
  ) THEN
    CREATE POLICY "employee_own_only" ON public.appointments
      FOR SELECT USING (
        staff_id IN (
          SELECT id FROM public.staff WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Client não precisa de login (tabela pública: inserção de agendamentos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointments' AND policyname = 'public_insert_appointments'
  ) THEN
    CREATE POLICY "public_insert_appointments" ON public.appointments
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Client e público podem visualizar agendamentos para verificação de horários ocupados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointments' AND policyname = 'public_select_appointments'
  ) THEN
    CREATE POLICY "public_select_appointments" ON public.appointments
      FOR SELECT USING (true);
  END IF;
END $$;

-- 6. Políticas de Segurança RLS para appointment_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointment_payments' AND policyname = 'super_admin_payments_all'
  ) THEN
    CREATE POLICY "super_admin_payments_all" ON public.appointment_payments
      FOR ALL USING (auth.jwt()->>'role' = 'super_admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointment_payments' AND policyname = 'owner_payments_salon_only'
  ) THEN
    CREATE POLICY "owner_payments_salon_only" ON public.appointment_payments
      FOR ALL USING (
        appointment_id IN (
          SELECT a.id FROM public.appointments a
          JOIN public.salons s ON a.salon_id = s.id
          WHERE s.owner_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'appointment_payments' AND policyname = 'public_insert_payments'
  ) THEN
    CREATE POLICY "public_insert_payments" ON public.appointment_payments
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
