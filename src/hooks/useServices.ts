import { useState, useEffect, useCallback } from 'react'
import { supabase, initialServices } from '@/lib/supabase'
import { useSalon } from '@/hooks/useSalon'
import { Service } from '@/types'
import { toast } from 'react-hot-toast'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'

interface UseServicesOptions {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  pageSize?: number
}

interface UseServicesReturn {
  services: Service[]
  loading: boolean
  total: number
  totalPages: number
  currentPage: number
  refetch: () => Promise<void>
  createService: (data: Omit<Service, 'id' | 'salon_id' | 'is_active'>) => Promise<boolean>
  updateService: (id: string, data: Partial<Service>) => Promise<boolean>
  deleteService: (id: string) => Promise<boolean>
  toggleServiceStatus: (id: string, isActive: boolean) => Promise<boolean>
  getAllActiveServices: () => Promise<Service[]>
}

const LOCAL_STORAGE_KEY = 'belezaflow_services'

function getLocalServices(salonId: string): Service[] {
  const list = safeStorageGet<Service[]>(LOCAL_STORAGE_KEY, [])
  if (list && list.length > 0) {
    return list.filter((s) => !s.salon_id || s.salon_id === salonId)
  }
  return initialServices.map((s) => ({ ...s, salon_id: salonId, is_active: s.is_active ?? true }))
}

function saveLocalServices(services: Service[]) {
  safeStorageSet(LOCAL_STORAGE_KEY, services)
}

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const { salon } = useSalon()
  const { search = '', status = 'active', page = 1, pageSize = 10 } = options
  
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchServices = useCallback(async () => {
    if (!salon) {
      setServices([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (supabase) {
        let query = supabase
          .from('services')
          .select('*', { count: 'exact' })
          .eq('salon_id', salon.id)
          .order('name', { ascending: true })

        // Filtro por status
        if (status === 'active') {
          query = query.eq('is_active', true)
        } else if (status === 'inactive') {
          query = query.eq('is_active', false)
        }

        // Filtro por busca
        if (search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`)
        }

        // Paginação
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        setServices((data as Service[]) || [])
        setTotal(count || 0)
        return
      }

      // Fallback local se Supabase não estiver configurado
      let all = getLocalServices(salon.id)
      if (status === 'active') {
        all = all.filter((s) => s.is_active !== false)
      } else if (status === 'inactive') {
        all = all.filter((s) => s.is_active === false)
      }

      if (search.trim()) {
        const lower = search.toLowerCase()
        all = all.filter((s) => s.name.toLowerCase().includes(lower))
      }

      const count = all.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      setServices(all.slice(from, to))
      setTotal(count)
    } catch (error: unknown) {
      console.error('Erro ao buscar serviços:', error)
      let all = getLocalServices(salon.id)
      if (status === 'active') {
        all = all.filter((s) => s.is_active !== false)
      } else if (status === 'inactive') {
        all = all.filter((s) => s.is_active === false)
      }
      if (search.trim()) {
        const lower = search.toLowerCase()
        all = all.filter((s) => s.name.toLowerCase().includes(lower))
      }
      const count = all.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      setServices(all.slice(from, to))
      setTotal(count)
    } finally {
      setLoading(false)
    }
  }, [salon, search, status, page, pageSize])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const createService = async (data: Omit<Service, 'id' | 'salon_id' | 'is_active'>) => {
    if (!salon) return false

    try {
      if (supabase) {
        const { error } = await supabase.from('services').insert({
          ...data,
          salon_id: salon.id,
          is_active: true,
        })

        if (error) throw error
      } else {
        const current = getLocalServices(salon.id)
        const newService: Service = {
          id: 'srv-' + Date.now(),
          salon_id: salon.id,
          name: data.name,
          description: data.description,
          price: data.price,
          duration_minutes: data.duration_minutes,
          is_active: true,
        }
        saveLocalServices([newService, ...current])
      }

      await fetchServices()
      toast.success('Serviço criado com sucesso!')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao criar serviço')
      return false
    }
  }

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('services')
          .update(data)
          .eq('id', id)

        if (error) throw error
      } else {
        if (salon) {
          const current = getLocalServices(salon.id)
          const updated = current.map((s) => (s.id === id ? { ...s, ...data } : s))
          saveLocalServices(updated)
        }
      }

      await fetchServices()
      toast.success('Serviço atualizado!')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao atualizar serviço')
      return false
    }
  }

  const deleteService = async (id: string) => {
    try {
      // Soft delete: marca como inativo
      if (supabase) {
        const { error } = await supabase
          .from('services')
          .update({ is_active: false })
          .eq('id', id)

        if (error) throw error
      } else {
        if (salon) {
          const current = getLocalServices(salon.id)
          const updated = current.map((s) => (s.id === id ? { ...s, is_active: false } : s))
          saveLocalServices(updated)
        }
      }

      await fetchServices()
      toast.success('Serviço desativado')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao desativar serviço')
      return false
    }
  }

  const toggleServiceStatus = async (id: string, isActive: boolean) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('services')
          .update({ is_active: isActive })
          .eq('id', id)

        if (error) throw error
      } else {
        if (salon) {
          const current = getLocalServices(salon.id)
          const updated = current.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
          saveLocalServices(updated)
        }
      }

      await fetchServices()
      toast.success(isActive ? 'Serviço ativado' : 'Serviço desativado')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao alterar status')
      return false
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getAllActiveServices = useCallback(async (): Promise<Service[]> => {
    if (!salon) return []
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', salon.id)
          .eq('is_active', true)
          .order('name')
        if (error) throw error
        return (data as Service[]) || []
      }
      const local = getLocalServices(salon.id)
      return local.filter((s) => s.is_active !== false)
    } catch (error) {
      console.error(error)
      const local = getLocalServices(salon.id)
      return local.filter((s) => s.is_active !== false)
    }
  }, [salon?.id])

  return {
    services,
    loading,
    total,
    totalPages,
    currentPage: page,
    refetch: fetchServices,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    getAllActiveServices,
  }
}
