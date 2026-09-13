-- Migration: Payments table with gateway integration and RLS
-- Safe idempotent execution

-- 1. Criação da tabela payments se não existir
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('pix', 'card', 'boleto')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Garantir colunas caso a tabela já existisse
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'appointment_id') THEN
    ALTER TABLE public.payments ADD COLUMN appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount') THEN
    ALTER TABLE public.payments ADD COLUMN amount NUMERIC NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'method') THEN
    ALTER TABLE public.payments ADD COLUMN method TEXT NOT NULL DEFAULT 'pix';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'status') THEN
    ALTER TABLE public.payments ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'transaction_id') THEN
    ALTER TABLE public.payments ADD COLUMN transaction_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'paid_at') THEN
    ALTER TABLE public.payments ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'created_at') THEN
    ALTER TABLE public.payments ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança RLS para payments

-- Super Admin vê tudo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'super_admin_payments_all'
  ) THEN
    CREATE POLICY "super_admin_payments_all" ON public.payments
      FOR ALL USING (auth.jwt()->>'role' = 'super_admin');
  END IF;
END $$;

-- Owner vê apenas do seu salão
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'owner_payments_salon_only'
  ) THEN
    CREATE POLICY "owner_payments_salon_only" ON public.payments
      FOR ALL USING (
        appointment_id IN (
          SELECT a.id FROM public.appointments a
          JOIN public.salons s ON a.salon_id = s.id
          WHERE s.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Employee vê apenas dos seus agendamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'employee_payments_own_only'
  ) THEN
    CREATE POLICY "employee_payments_own_only" ON public.payments
      FOR SELECT USING (
        appointment_id IN (
          SELECT a.id FROM public.appointments a
          JOIN public.staff st ON a.staff_id = st.id
          WHERE st.profile_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Inserção pública para gateway / checkout online do cliente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'public_insert_payments'
  ) THEN
    CREATE POLICY "public_insert_payments" ON public.payments
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Consulta pública para verificação de status do pagamento do agendamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'public_select_payments'
  ) THEN
    CREATE POLICY "public_select_payments" ON public.payments
      FOR SELECT USING (true);
  END IF;
END $$;
