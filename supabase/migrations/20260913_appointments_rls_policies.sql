-- ==============================================================================
-- Migration: Row Level Security (RLS) Policies for 'appointments'
-- ==============================================================================

-- Garantir que a tabela appointments existe e habilitar RLS
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin vê tudo
DROP POLICY IF EXISTS "super_admin_all" ON public.appointments;
CREATE POLICY "super_admin_all" ON public.appointments
  FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

-- 2. Owner vê apenas do seu salão
DROP POLICY IF EXISTS "owner_salon_only" ON public.appointments;
CREATE POLICY "owner_salon_only" ON public.appointments
  FOR ALL USING (
    salon_id IN (
      SELECT id FROM public.salons WHERE owner_id = auth.uid()
    )
  );

-- 3. Employee vê apenas seus agendamentos
DROP POLICY IF EXISTS "employee_own_only" ON public.appointments;
CREATE POLICY "employee_own_only" ON public.appointments
  FOR SELECT USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE profile_id = auth.uid()
    )
  );

-- 4. Client não precisa de login (tabela pública)
-- Inserção pública para agendamentos online
DROP POLICY IF EXISTS "client_public_insert" ON public.appointments;
CREATE POLICY "client_public_insert" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Consulta pública para verificação de horários e disponibilidade
DROP POLICY IF EXISTS "client_public_select" ON public.appointments;
CREATE POLICY "client_public_select" ON public.appointments
  FOR SELECT USING (true);
