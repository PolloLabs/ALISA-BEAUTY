import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appointment, AppointmentStatus, Professional, Service, Salon } from '../types';
import { initialAppointments, initialProfessionals, initialServices, isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface SalonContextType {
  salon: Salon | null;
  loading: boolean;
  refreshSalon: () => Promise<void>;
  updateSalon: (data: Partial<Salon>) => Promise<boolean>;
  createSalon: (data: Partial<Salon>) => Promise<Salon | null>;

  // Contexto operacional existente (serviços, agendamentos, equipe)
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Promise<boolean>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  addService: (service: Omit<Service, 'id'>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
  isSupabaseActive: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

export const SalonContext = createContext<SalonContextType | undefined>(undefined);

const LOCAL_STORAGE_SALON_KEY = 'belezaflow_active_salon';
const LOCAL_STORAGE_KEY_APPOINTMENTS = 'belezaflow_appointments';
const LOCAL_STORAGE_KEY_SERVICES = 'belezaflow_services';

export const SalonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de agendamento e serviços
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SERVICES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialServices;
      }
    }
    return initialServices;
  });

  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    try {
      const raw = localStorage.getItem('belezaflow_staff');
      if (raw) {
        const staffList = JSON.parse(raw);
        if (Array.isArray(staffList) && staffList.length > 0) {
          interface RawStaff {
            id: string;
            full_name?: string;
            name?: string;
            job_title?: string;
            role?: string;
            phone?: string;
            avatar_url?: string;
            avatar?: string;
            is_active?: boolean;
          }
          return (staffList as RawStaff[])
            .filter((s) => s.is_active !== false)
            .map((s) => ({
              id: s.id,
              name: s.full_name || s.name || 'Profissional',
              role: s.job_title || s.role || 'Especialista',
              phone: s.phone || '',
              avatar: s.avatar_url || s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              specialties: [s.job_title || 'Atendimento'],
              rating: 5.0,
            }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialProfessionals;
  });

  useEffect(() => {
    const handleSyncStaff = () => {
      try {
        const raw = localStorage.getItem('belezaflow_staff');
        if (raw) {
          const staffList = JSON.parse(raw);
          if (Array.isArray(staffList) && staffList.length > 0) {
            interface RawStaff {
              id: string;
              full_name?: string;
              name?: string;
              job_title?: string;
              role?: string;
              phone?: string;
              avatar_url?: string;
              avatar?: string;
              is_active?: boolean;
            }
            setProfessionals(
              (staffList as RawStaff[])
                .filter((s) => s.is_active !== false)
                .map((s) => ({
                  id: s.id,
                  name: s.full_name || s.name || 'Profissional',
                  role: s.job_title || s.role || 'Especialista',
                  phone: s.phone || '',
                  avatar: s.avatar_url || s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  specialties: [s.job_title || 'Atendimento'],
                  rating: 5.0,
                }))
            );
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar profissionais:', err);
      }
    };

    window.addEventListener('storage', handleSyncStaff);
    window.addEventListener('staff_updated', handleSyncStaff);
    return () => {
      window.removeEventListener('storage', handleSyncStaff);
      window.removeEventListener('staff_updated', handleSyncStaff);
    };
  }, []);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialAppointments;
      }
    }
    return initialAppointments;
  });

  // Atualiza cor dinâmica global no CSS root
  const applyPrimaryColor = (color: string | null | undefined) => {
    const targetColor = color && color.trim() ? color : '#f43f5e';
    document.documentElement.style.setProperty('--primary-color', targetColor);
  };

  const fetchSalon = async () => {
    if (!user) {
      setSalon(null);
      setLoading(false);
      applyPrimaryColor('#f43f5e');
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('salons')
            .select(`
              *,
              staff(profile_id)
            `)
            .or(`owner_id.eq.${user.id}`)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { staff: _, ...salonData } = data as Record<string, unknown>;
            const parsedSalon = salonData as unknown as Salon;
            setSalon(parsedSalon);
            localStorage.setItem(LOCAL_STORAGE_SALON_KEY, JSON.stringify(parsedSalon));
            applyPrimaryColor(parsedSalon.primary_color);
            return;
          }
        } catch (dbErr) {
          console.warn('Erro ao consultar Supabase para salão:', dbErr);
        }
      }

      // Modo local / fallback com dados salvos no navegador
      const savedSalon = localStorage.getItem(LOCAL_STORAGE_SALON_KEY);
      if (savedSalon) {
        try {
          const parsed = JSON.parse(savedSalon) as Salon;
          setSalon(parsed);
          applyPrimaryColor(parsed.primary_color);
          return;
        } catch {
          // prossegue para criar padrão
        }
      }

      // Se o usuário tem um nome de salão vinculado ao seu perfil, inicializa automaticamente
      if (user.salonName) {
        const defaultSalon: Salon = {
          id: 'salon-' + (user.id || 'default'),
          owner_id: user.id || 'user-1',
          name: user.salonName,
          business_type: 'beauty_salon',
          logo_url: null,
          primary_color: '#d946ef',
          address: 'Av. Paulista, 1000 - São Paulo, SP',
          phone: '(11) 98765-4321',
          open_time: '08:00',
          close_time: '19:00',
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setSalon(defaultSalon);
        localStorage.setItem(LOCAL_STORAGE_SALON_KEY, JSON.stringify(defaultSalon));
        applyPrimaryColor(defaultSalon.primary_color);
      } else {
        setSalon(null);
      }
    } catch (error) {
      console.error('Erro ao buscar salão:', error);
      setSalon(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalon();
  }, [user]);

  const refreshSalon = async () => {
    setLoading(true);
    await fetchSalon();
  };

  const updateSalon = async (data: Partial<Salon>): Promise<boolean> => {
    if (!salon) return false;

    const updated: Salon = {
      ...salon,
      ...data,
    };

    setSalon(updated);
    localStorage.setItem(LOCAL_STORAGE_SALON_KEY, JSON.stringify(updated));

    if (updated.primary_color) {
      applyPrimaryColor(updated.primary_color);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('salons')
          .update({
            name: updated.name,
            business_type: updated.business_type || 'beauty_salon',
            logo_url: updated.logo_url,
            primary_color: updated.primary_color,
            address: updated.address,
            phone: updated.phone,
            open_time: updated.open_time,
            close_time: updated.close_time,
          })
          .eq('id', salon.id);
      } catch (err) {
        console.error('Erro ao atualizar salão no Supabase:', err);
      }
    }

    return true;
  };

  const createSalon = async (data: Partial<Salon>): Promise<Salon | null> => {
    const newSalon: Salon = {
      id: 'salon-' + Date.now(),
      owner_id: user?.id || 'owner-1',
      name: data.name || 'Meu Salão',
      business_type: data.business_type || 'beauty_salon',
      logo_url: data.logo_url || null,
      primary_color: data.primary_color || '#d946ef',
      address: data.address || '',
      phone: data.phone || '',
      open_time: data.open_time || '08:00',
      close_time: data.close_time || '19:00',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data: inserted, error } = await supabase
          .from('salons')
          .insert([
            {
              owner_id: user.id,
              name: newSalon.name,
              business_type: newSalon.business_type,
              logo_url: newSalon.logo_url,
              primary_color: newSalon.primary_color,
              address: newSalon.address,
              phone: newSalon.phone,
              open_time: newSalon.open_time,
              close_time: newSalon.close_time,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (!error && inserted) {
          const createdDbSalon = inserted as Salon;
          setSalon(createdDbSalon);
          localStorage.setItem(LOCAL_STORAGE_SALON_KEY, JSON.stringify(createdDbSalon));
          applyPrimaryColor(createdDbSalon.primary_color);
          return createdDbSalon;
        }
      } catch (err) {
        console.error('Erro ao inserir salão no Supabase:', err);
      }
    }

    setSalon(newSalon);
    localStorage.setItem(LOCAL_STORAGE_SALON_KEY, JSON.stringify(newSalon));
    applyPrimaryColor(newSalon.primary_color);
    return newSalon;
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SERVICES, JSON.stringify(services));
  }, [services]);

  const addAppointment = async (newAptData: Omit<Appointment, 'id' | 'created_at'>): Promise<boolean> => {
    const newAppointment: Appointment = {
      ...newAptData,
      id: 'apt-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    showToast('Agendamento realizado com sucesso!');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').insert([newAppointment]);
      } catch (err) {
        console.error('Error inserting into Supabase:', err);
      }
    }

    return true;
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus): Promise<boolean> => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );

    const statusLabels: Record<AppointmentStatus, string> = {
      confirmado: 'Agendamento confirmado!',
      concluido: 'Atendimento concluído!',
      cancelado: 'Agendamento cancelado.',
      pendente: 'Marcado como pendente.',
      confirmed: 'Agendamento confirmado!',
      completed: 'Atendimento concluído!',
      canceled: 'Agendamento cancelado.',
      pending: 'Marcado como pendente.',
    };
    showToast(statusLabels[status] || 'Status atualizado!');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').update({ status }).eq('id', id);
      } catch (err) {
        console.error('Error updating status in Supabase:', err);
      }
    }

    return true;
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
    showToast('Agendamento removido.');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('appointments').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting from Supabase:', err);
      }
    }

    return true;
  };

  const addService = async (serviceData: Omit<Service, 'id'>): Promise<boolean> => {
    const newService: Service = {
      ...serviceData,
      id: 'srv-' + Date.now(),
    };

    setServices((prev) => [...prev, newService]);
    showToast('Novo serviço cadastrado!');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('services').insert([newService]);
      } catch (err) {
        console.error('Error adding service in Supabase:', err);
      }
    }

    return true;
  };

  const deleteService = async (id: string): Promise<boolean> => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('Serviço removido.');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('services').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting service in Supabase:', err);
      }
    }

    return true;
  };

  const contextValue = React.useMemo<SalonContextType>(
    () => ({
      salon,
      loading,
      refreshSalon,
      updateSalon,
      createSalon,
      services,
      professionals,
      appointments,
      selectedDate,
      setSelectedDate,
      addAppointment,
      updateAppointmentStatus,
      deleteAppointment,
      addService,
      deleteService,
      isSupabaseActive: isSupabaseConfigured,
      toastMessage,
      showToast,
    }),
    [
      salon,
      loading,
      services,
      professionals,
      appointments,
      selectedDate,
      toastMessage,
    ]
  );

  return (
    <SalonContext.Provider value={contextValue}>
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};
