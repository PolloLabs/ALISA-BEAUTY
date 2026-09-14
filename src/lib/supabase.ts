import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, Professional, Service } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial initial mock data for ALISA - BelezaFlow
export const initialServices: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Feminino + Escova Modelada',
    category: 'Cabelo',
    duration_minutes: 60,
    price: 130.0,
    description: 'Lavagem especial, corte personalizado e finalização com escova.',
  },
  {
    id: 'srv-2',
    name: 'Manicure e Pedicure Completa',
    category: 'Unhas',
    duration_minutes: 75,
    price: 75.0,
    description: 'Cutilagem russa, esmaltação e hidratação com parafina.',
  },
  {
    id: 'srv-3',
    name: 'Design de Sobrancelhas + Henna',
    category: 'Sobrancelhas',
    duration_minutes: 40,
    price: 60.0,
    description: 'Mapeamento facial e alinhamento do olhar com aplicação de henna premium.',
  },
  {
    id: 'srv-4',
    name: 'Coloração & Mechas Iluminadas',
    category: 'Cabelo',
    duration_minutes: 150,
    price: 280.0,
    description: 'Técnica morena iluminada ou loiro dos sonhos com tratamento pós-química.',
  },
  {
    id: 'srv-5',
    name: 'Limpeza de Pele Profunda',
    category: 'Estética',
    duration_minutes: 90,
    price: 160.0,
    description: 'Higienização, vapor de ozônio, extração suave e máscara calmante.',
  },
  {
    id: 'srv-6',
    name: 'Alongamento em Fibra de Vidro',
    category: 'Unhas',
    duration_minutes: 120,
    price: 190.0,
    description: 'Extensão natural e resistente com acabamento impecável.',
  },
];

export const initialProfessionals: Professional[] = [
  {
    id: 'pro-1',
    name: 'Alisa K.',
    role: 'Master Stylist & Colorista',
    phone: '(11) 98765-4321',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    specialties: ['Corte', 'Coloração', 'Mechas'],
    rating: 4.9,
  },
  {
    id: 'pro-2',
    name: 'Beatriz Lima',
    role: 'Nail Designer & Manicure',
    phone: '(11) 97654-3210',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    specialties: ['Unhas em Gel', 'Esmaltação em Gel', 'Pedicure'],
    rating: 4.8,
  },
  {
    id: 'pro-3',
    name: 'Camila Rocha',
    role: 'Lash & Brow Designer',
    phone: '(11) 96543-2109',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    specialties: ['Sobrancelhas', 'Henna', 'Lash Lifting'],
    rating: 5.0,
  },
  {
    id: 'pro-4',
    name: 'Juliana Mendes',
    role: 'Esteticista Facial',
    phone: '(11) 95432-1098',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    specialties: ['Limpeza de Pele', 'Hidratação Facial', 'Massagem'],
    rating: 4.9,
  },
];

const today = new Date().toISOString().split('T')[0];

export const initialAppointments: Appointment[] = [];

