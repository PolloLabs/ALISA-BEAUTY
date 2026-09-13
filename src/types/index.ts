export type UserRole = 'super_admin' | 'owner' | 'employee' | 'client';
export type BusinessType = 'beauty_salon' | 'barbershop' | 'unisex' | 'nail_studio';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Salon {
  id: string;
  owner_id: string;
  name: string;
  business_type?: BusinessType;
  logo_url: string | null;
  primary_color: string | null;
  address: string | null;
  phone: string | null;
  open_time: string;
  close_time: string;
  is_active: boolean;
  payment_enabled?: boolean;
  deposit_percentage?: number;
  full_payment_discount?: number;
  require_deposit?: boolean;
  created_at: string;
  slug?: string;
}

export interface Staff {
  id: string;
  salon_id: string;
  profile_id: string;
  job_title: string | null;
  commission_rate: number;
  is_active: boolean;
}

export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'canceled'
  | 'pendente'
  | 'confirmado'
  | 'concluido'
  | 'cancelado';

export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type PaymentMethod = 'pix' | 'card' | 'cash' | 'boleto';

export interface Service {
  id: string;
  salon_id?: string;
  name: string;
  category?: 'Cabelo' | 'Unhas' | 'Estética' | 'Maquiagem' | 'Sobrancelhas' | string;
  duration_minutes: number;
  price: number;
  description?: string | null;
  is_active?: boolean;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  specialties: string[];
  rating: number;
}

export interface Appointment {
  id: string;
  salon_id?: string;
  staff_id?: string;
  service_id?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  start_time?: string;
  end_time?: string;
  status: AppointmentStatus;
  payment_status?: PaymentStatus;
  payment_amount?: number;
  payment_method?: PaymentMethod;
  deposit_amount?: number;
  notes?: string | null;
  created_at: string;
  // Campos auxiliares / legados para compatibilidade
  service_name?: string;
  professional_id?: string;
  professional_name?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  duration_minutes?: number;
  price?: number;
}

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  method: 'pix' | 'card' | 'boleto';
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export type AppointmentPayment = Payment;

export interface SalonStats {
  todayRevenue: number;
  monthRevenue: number;
  todayAppointmentsCount: number;
  pendingCount: number;
  completedCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  salon_name: string;
}
