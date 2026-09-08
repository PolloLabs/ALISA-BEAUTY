import { useState, useEffect, useCallback } from 'react'
import { supabase, initialAppointments } from '@/lib/supabase'
import { useSalon } from '@/hooks/useSalon'
import { Appointment } from '@/types'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

export interface AppointmentWithDetails extends Appointment {
  service_name?: string
  service_price?: number
  service_duration?: number
  staff_name?: string
}

export interface UseAppointmentsOptions {
  date?: Date
  staffId?: string
  status?: string
}

export interface UseAppointmentsReturn {
  appointments: AppointmentWithDetails[]
  loading: boolean
  refetch: () => Promise<void>
  createAppointment: (data: {
    staff_id: string
    service_id: string
    client_name: string
    client_phone: string
    date: string // YYYY-MM-DD
    time: string // HH:mm
    notes?: string
  }) => Promise<boolean>
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<boolean>
  cancelAppointment: (id: string) => Promise<boolean>
  getStaffBlockings: (staffId: string, date: Date) => Promise<any[]>
}

const LOCAL_STORAGE_KEY = 'belezaflow_appointments'

function getLocalAppointments(salonId: string): AppointmentWithDetails[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const list = JSON.parse(raw) as AppointmentWithDetails[]
      return list.filter((a) => !a.salon_id || a.salon_id === salonId)
    }
  } catch (e) {
    console.error('Error reading local appointments:', e)
  }
  return initialAppointments.map((a) => ({
    ...a,
    salon_id: salonId,
    start_time: a.date && a.time ? `${a.date}T${a.time}:00` : new Date().toISOString(),
    end_time: a.date && a.time ? `${a.date}T${a.time}:00` : new Date().toISOString(),
    staff_name: a.professional_name || 'Profissional',
    service_price: a.price,
    service_duration: a.duration_minutes,
  }))
}

function saveLocalAppointments(list: AppointmentWithDetails[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Error saving local appointments:', e)
  }
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const { salon } = useSalon()
  const { date, staffId, status } = options

  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const salonId = salon?.id
  const dateStr = date ? format(date, 'yyyy-MM-dd') : undefined

  const fetchAppointments = useCallback(async () => {
    if (!salonId) {
      setAppointments([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (supabase) {
        let query = supabase
          .from('appointments')
          .select(`
            *,
            services:service_id (name, price, duration_minutes),
            staff:staff_id (
              id,
              commission_rate,
              profiles:profile_id (full_name)
            )
          `)
          .eq('salon_id', salonId)
          .order('start_time', { ascending: true })

        // Filtro por data
        if (dateStr) {
          query = query.gte('start_time', `${dateStr}T00:00:00`)
            .lte('start_time', `${dateStr}T23:59:59`)
        }

        // Filtro por profissional
        if (staffId && staffId !== 'all' && staffId !== 'todos') {
          query = query.eq('staff_id', staffId)
        }

        // Filtro por status
        if (status && status !== 'all' && status !== 'todos') {
          query = query.eq('status', status)
        }

        const { data, error } = await query

        if (!error && data) {
          // Transforma dados
          const transformed: AppointmentWithDetails[] = data.map((item: any) => ({
            ...item,
            service_name: item.services?.name || item.service_name || 'Serviço',
            service_price: item.services?.price ?? item.price ?? 0,
            service_duration: item.services?.duration_minutes ?? item.duration_minutes ?? 30,
            staff_name: item.staff?.profiles?.full_name || item.professional_name || 'Profissional',
            price: item.services?.price ?? item.price ?? 0,
            duration_minutes: item.services?.duration_minutes ?? item.duration_minutes ?? 30,
            time: item.start_time ? item.start_time.substring(11, 16) : item.time,
            date: item.start_time ? item.start_time.substring(0, 10) : item.date,
          }))

          setAppointments(transformed)
          return
        }
      }

      // Fallback local se Supabase não responder ou tabela não configurada
      let local = getLocalAppointments(salonId)

      if (dateStr) {
        local = local.filter((a) => {
          if (a.start_time?.startsWith(dateStr)) return true
          if (a.date === dateStr) return true
          return false
        })
      }

      if (staffId && staffId !== 'all' && staffId !== 'todos') {
        local = local.filter((a) => a.staff_id === staffId || a.professional_id === staffId)
      }

      if (status && status !== 'all' && status !== 'todos') {
        local = local.filter((a) => a.status === status)
      }

      setAppointments(local)
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error)
      const local = getLocalAppointments(salonId)
      setAppointments(local)
    } finally {
      setLoading(false)
    }
  }, [salonId, dateStr, staffId, status])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const createAppointment = async (data: {
    staff_id: string
    service_id: string
    client_name: string
    client_phone: string
    date: string
    time: string
    notes?: string
  }) => {
    if (!salon) return false

    try {
      let durationMinutes = 30
      let serviceName = 'Serviço'
      let servicePrice = 0

      if (supabase) {
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('name, price, duration_minutes')
          .eq('id', data.service_id)
          .maybeSingle()

        if (!serviceError && service) {
          durationMinutes = service.duration_minutes
          serviceName = service.name
          servicePrice = service.price
        }
      }

      // Calcula horários
      const startDate = new Date(`${data.date}T${data.time}:00`)
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000)

      if (supabase) {
        const { error } = await supabase.from('appointments').insert({
          salon_id: salon.id,
          staff_id: data.staff_id,
          service_id: data.service_id,
          client_name: data.client_name,
          client_phone: data.client_phone,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: 'confirmed',
          notes: data.notes || null,
        })

        if (!error) {
          await fetchAppointments()
          toast.success('Agendamento criado com sucesso!')
          return true
        }
      }

      // Fallback local
      const current = getLocalAppointments(salon.id)
      const newApt: AppointmentWithDetails = {
        id: `apt-${Date.now()}`,
        salon_id: salon.id,
        staff_id: data.staff_id,
        service_id: data.service_id,
        client_name: data.client_name,
        client_phone: data.client_phone,
        date: data.date,
        time: data.time,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'confirmed',
        notes: data.notes || null,
        service_name: serviceName,
        service_price: servicePrice,
        service_duration: durationMinutes,
        price: servicePrice,
        duration_minutes: durationMinutes,
        created_at: new Date().toISOString(),
      }

      saveLocalAppointments([newApt, ...current])
      await fetchAppointments()
      toast.success('Agendamento criado com sucesso!')
      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao criar agendamento')
      return false
    }
  }

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    try {
      if (supabase && salonId) {
        const { error } = await supabase
          .from('appointments')
          .update(data)
          .eq('id', id)
          .eq('salon_id', salonId)

        if (!error) {
          await fetchAppointments()
          toast.success('Agendamento atualizado!')
          return true
        }
      }

      // Local fallback
      if (salonId) {
        const current = getLocalAppointments(salonId)
        const updated = current.map((a) => (a.id === id ? { ...a, ...data } : a))
        saveLocalAppointments(updated)
      }

      await fetchAppointments()
      toast.success('Agendamento atualizado!')
      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao atualizar agendamento')
      return false
    }
  }, [salonId, fetchAppointments])

  const cancelAppointment = useCallback(async (id: string) => {
    try {
      if (supabase && salonId) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'canceled' })
          .eq('id', id)
          .eq('salon_id', salonId)

        if (!error) {
          await fetchAppointments()
          toast.success('Agendamento cancelado')
          return true
        }
      }

      // Local fallback
      if (salonId) {
        const current = getLocalAppointments(salonId)
        const updated = current.map((a) => (a.id === id ? { ...a, status: 'canceled' as const } : a))
        saveLocalAppointments(updated)
      }

      await fetchAppointments()
      toast.success('Agendamento cancelado')
      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao cancelar agendamento')
      return false
    }
  }, [salonId, fetchAppointments])

  const getStaffBlockings = useCallback(async (staffId: string, blockDate: Date) => {
    if (!salonId) return []

    try {
      const dateStr = format(blockDate, 'yyyy-MM-dd')
      if (supabase) {
        const { data, error } = await supabase
          .from('staff_blockings')
          .select('*')
          .eq('salon_id', salonId)
          .eq('staff_id', staffId)
          .eq('block_date', dateStr)

        if (!error && data) {
          return data
        }
      }
      return []
    } catch (error) {
      console.error(error)
      return []
    }
  }, [salonId])

  return {
    appointments,
    loading,
    refetch: fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getStaffBlockings,
  }
}
