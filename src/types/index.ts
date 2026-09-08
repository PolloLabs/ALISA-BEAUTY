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
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'pendente'
  | 'confirmado'
  | 'concluido'
  | 'cancelado';

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
  service_name?: string;
  professional_id?: string;
  professional_name?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  price?: number;
  status: AppointmentStatus;
  notes?: string | null;
  created_at: string;
}

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
