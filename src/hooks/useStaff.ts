import { useState, useEffect, useCallback } from 'react'
import { supabase, initialProfessionals } from '@/lib/supabase'
import { useSalon } from '@/hooks/useSalon'
import { toast } from 'react-hot-toast'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'

export interface StaffMember {
  id: string
  salon_id: string
  profile_id: string
  job_title: string | null
  commission_rate: number
  is_active: boolean
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  password?: string
}

export interface StoredProfessional {
  staff_id: string
  nome: string
  profissao: string
  email: string
  senha: string
  telefone?: string
  comissao?: number
}

interface UseStaffOptions {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  pageSize?: number
}

interface UseStaffReturn {
  staff: StaffMember[]
  loading: boolean
  total: number
  totalPages: number
  currentPage: number
  refetch: () => Promise<void>
  createStaff: (data: {
    full_name: string
    phone: string
    email?: string
    password?: string
    job_title?: string
    commission_rate: number
  }) => Promise<boolean>
  updateStaff: (id: string, data: {
    full_name?: string
    phone?: string
    email?: string
    password?: string
    job_title?: string
    commission_rate?: number
  }) => Promise<boolean>
  deleteStaff: (id: string) => Promise<boolean>
  toggleStaffStatus: (id: string, isActive: boolean) => Promise<boolean>
  getAllActiveStaff: () => Promise<StaffMember[]>
}

const LOCAL_STORAGE_KEY = 'belezaflow_staff'
const PROFESSIONALS_KEY = 'professionals'

export function getStoredProfessionals(): StoredProfessional[] {
  return safeStorageGet<StoredProfessional[]>(PROFESSIONALS_KEY, [])
}

export function saveStoredProfessionals(pros: StoredProfessional[]) {
  safeStorageSet(PROFESSIONALS_KEY, pros)
}

function getLocalStaff(salonId: string): StaffMember[] {
  const list = safeStorageGet<StaffMember[]>(LOCAL_STORAGE_KEY, [])
  if (list && list.length > 0) {
    return list.filter((s) => !s.salon_id || s.salon_id === salonId)
  }

  // Pre-popula se vazio com profissionais padrão
  const defaultList: StaffMember[] = initialProfessionals.map((pro, index) => ({
    id: pro.id,
    salon_id: salonId,
    profile_id: 'prof-' + pro.id,
    job_title: pro.role || 'Cabeleireiro(a)',
    commission_rate: 40 + index * 5,
    is_active: true,
    full_name: pro.name,
    phone: pro.phone,
    email: pro.name.toLowerCase().replace(/\s+/g, '.') + '@belezaflow.com',
    avatar_url: pro.avatar,
    password: 'pro' + (index + 1) + '123',
  }))

  return defaultList
}

function saveLocalStaff(staffList: StaffMember[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staffList))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('staff_updated'))
    }
  } catch (e) {
    console.error('Error saving local staff:', e)
  }
}

export function useStaff(options: UseStaffOptions = {}): UseStaffReturn {
  const { salon } = useSalon()
  const { search = '', status = 'active', page = 1, pageSize = 10 } = options
  
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchStaff = useCallback(async () => {
    if (!salon) {
      setStaff([])
      setLoading(false)
      setTotal(0)
      return
    }

    setLoading(true)
    try {
      if (supabase) {
        let query = supabase
          .from('staff')
          .select(`
            *,
            profiles:profile_id (full_name, phone, email, avatar_url)
          `, { count: 'exact' })
          .eq('salon_id', salon.id)

        if (status === 'active') {
          query = query.eq('is_active', true)
        } else if (status === 'inactive') {
          query = query.eq('is_active', false)
        }

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) throw error

        interface StaffDbRow {
          id: string
          salon_id: string
          profile_id: string
          job_title?: string | null
          commission_rate: number
          is_active: boolean
          profiles?: {
            full_name?: string | null
            phone?: string | null
            email?: string | null
            avatar_url?: string | null
          } | null
        }

        const transformed: StaffMember[] = ((data as unknown as StaffDbRow[]) || []).map((item) => ({
          id: item.id,
          salon_id: item.salon_id,
          profile_id: item.profile_id,
          job_title: item.job_title || null,
          commission_rate: item.commission_rate,
          is_active: item.is_active,
          full_name: item.profiles?.full_name || null,
          phone: item.profiles?.phone || null,
          email: item.profiles?.email || null,
          avatar_url: item.profiles?.avatar_url || null,
        }))

        setStaff(transformed)
        setTotal(count || 0)
        return
      }

      // Fallback local storage
      let all = getLocalStaff(salon.id)

      if (status === 'active') {
        all = all.filter((s) => s.is_active !== false)
      } else if (status === 'inactive') {
        all = all.filter((s) => s.is_active === false)
      }

      if (search.trim()) {
        const searchLower = search.toLowerCase()
        all = all.filter((s) =>
          s.full_name?.toLowerCase().includes(searchLower) ||
          s.phone?.includes(search) ||
          s.email?.toLowerCase().includes(searchLower) ||
          s.job_title?.toLowerCase().includes(searchLower)
        )
      }

      const count = all.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      setStaff(all.slice(from, to))
      setTotal(count)
    } catch (error: unknown) {
      console.error('Erro ao buscar equipe:', error)
      let all = getLocalStaff(salon.id)
      if (status === 'active') {
        all = all.filter((s) => s.is_active !== false)
      } else if (status === 'inactive') {
        all = all.filter((s) => s.is_active === false)
      }
      if (search.trim()) {
        const searchLower = search.toLowerCase()
        all = all.filter((s) =>
          s.full_name?.toLowerCase().includes(searchLower) ||
          s.phone?.includes(search) ||
          s.email?.toLowerCase().includes(searchLower) ||
          s.job_title?.toLowerCase().includes(searchLower)
        )
      }
      const count = all.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      setStaff(all.slice(from, to))
      setTotal(count)
    } finally {
      setLoading(false)
    }
  }, [salon, search, status, page, pageSize])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const createStaff = async (data: {
    full_name: string
    phone: string
    email?: string
    password?: string
    job_title?: string
    commission_rate: number
  }) => {
    if (!salon) return false

    try {
      const staffId = 'staff-' + Date.now()
      const staffEmail = data.email || `${data.full_name.toLowerCase().replace(/\s+/g, '.')}@belezaflow.com`
      const staffPassword = data.password || 'prof123'

      if (supabase) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            full_name: data.full_name,
            phone: data.phone,
            email: staffEmail,
            role: 'employee',
          })
          .select()
          .single()

        if (profileError) throw profileError

        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            salon_id: salon.id,
            profile_id: profile.id,
            job_title: data.job_title || 'Cabeleireiro(a)',
            commission_rate: data.commission_rate,
            is_active: true,
          })

        if (staffError) throw staffError
      } else {
        const current = getLocalStaff(salon.id)
        const newMember: StaffMember = {
          id: staffId,
          salon_id: salon.id,
          profile_id: 'prof-' + Date.now(),
          job_title: data.job_title || 'Cabeleireiro(a)',
          commission_rate: data.commission_rate,
          is_active: true,
          full_name: data.full_name,
          phone: data.phone,
          email: staffEmail,
          avatar_url: null,
          password: staffPassword,
        }
        saveLocalStaff([newMember, ...current])
      }

      // Salva no localStorage 'professionals' conforme especificação estrita da tarefa:
      // {nome, profissao, email, senha, staff_id}
      const existingPros = getStoredProfessionals()
      const updatedPros = [
        ...existingPros.filter((p) => p.email.toLowerCase() !== staffEmail.toLowerCase()),
        {
          staff_id: staffId,
          nome: data.full_name,
          profissao: data.job_title || 'Cabeleireiro(a)',
          email: staffEmail,
          senha: staffPassword,
          telefone: data.phone,
          comissao: data.commission_rate,
        },
      ]
      saveStoredProfessionals(updatedPros)

      await fetchStaff()
      toast.success('Profissional cadastrado! Credenciais de login salvas com sucesso.')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao adicionar profissional')
      return false
    }
  }

  const updateStaff = async (id: string, data: {
    full_name?: string
    phone?: string
    email?: string
    password?: string
    job_title?: string
    commission_rate?: number
  }) => {
    try {
      if (supabase) {
        const { data: staffData, error: fetchError } = await supabase
          .from('staff')
          .select('profile_id')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        if (data.full_name || data.phone || data.email !== undefined) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              ...(data.full_name && { full_name: data.full_name }),
              ...(data.phone && { phone: data.phone }),
              ...(data.email !== undefined && { email: data.email }),
            })
            .eq('id', staffData.profile_id)

          if (profileError) throw profileError
        }

        if (data.job_title !== undefined || data.commission_rate !== undefined) {
          const { error: staffUpdateError } = await supabase
            .from('staff')
            .update({
              ...(data.job_title !== undefined && { job_title: data.job_title }),
              ...(data.commission_rate !== undefined && { commission_rate: data.commission_rate }),
            })
            .eq('id', id)

          if (staffUpdateError) throw staffUpdateError
        }
      } else {
        if (salon) {
          const current = getLocalStaff(salon.id)
          const updated = current.map((s) => {
            if (s.id === id) {
              return {
                ...s,
                ...(data.full_name && { full_name: data.full_name }),
                ...(data.phone && { phone: data.phone }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.job_title !== undefined && { job_title: data.job_title }),
                ...(data.commission_rate !== undefined && { commission_rate: data.commission_rate }),
                ...(data.password ? { password: data.password } : {}),
              }
            }
            return s
          })
          saveLocalStaff(updated)
        }
      }

      // Atualiza também em 'professionals'
      const existingPros = getStoredProfessionals()
      const updatedPros = existingPros.map((p) => {
        if (p.staff_id === id || (data.email && p.email.toLowerCase() === data.email.toLowerCase())) {
          return {
            ...p,
            ...(data.full_name && { nome: data.full_name }),
            ...(data.job_title && { profissao: data.job_title }),
            ...(data.email && { email: data.email }),
            ...(data.password ? { senha: data.password } : {}),
            ...(data.phone && { telefone: data.phone }),
            ...(data.commission_rate !== undefined && { comissao: data.commission_rate }),
          }
        }
        return p
      })
      saveStoredProfessionals(updatedPros)

      await fetchStaff()
      toast.success('Profissional atualizado com sucesso!')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao atualizar profissional')
      return false
    }
  }

  const deleteStaff = async (id: string) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('staff')
          .update({ is_active: false })
          .eq('id', id)

        if (error) throw error
      } else {
        if (salon) {
          const current = getLocalStaff(salon.id)
          const updated = current.map((s) => (s.id === id ? { ...s, is_active: false } : s))
          saveLocalStaff(updated)
        }
      }

      await fetchStaff()
      toast.success('Profissional desativado da equipe')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao desativar profissional')
      return false
    }
  }

  const toggleStaffStatus = async (id: string, isActive: boolean) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('staff')
          .update({ is_active: isActive })
          .eq('id', id)

        if (error) throw error
      } else {
        if (salon) {
          const current = getLocalStaff(salon.id)
          const updated = current.map((s) => (s.id === id ? { ...s, is_active: isActive } : s))
          saveLocalStaff(updated)
        }
      }

      await fetchStaff()
      toast.success(isActive ? 'Profissional ativado' : 'Profissional desativado')
      return true
    } catch (error: unknown) {
      console.error(error)
      const err = error as { message?: string }
      toast.error(err.message || 'Erro ao alterar status')
      return false
    }
  }

  const getAllActiveStaff = useCallback(async (): Promise<StaffMember[]> => {
    if (!salon) return []
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('staff')
          .select(`
            *,
            profiles:profile_id (full_name, phone, email, avatar_url)
          `)
          .eq('salon_id', salon.id)
          .eq('is_active', true)

        if (error) throw error

        interface ActiveStaffDbRow {
          id: string
          salon_id: string
          profile_id: string
          job_title?: string | null
          commission_rate: number
          is_active: boolean
          profiles?: {
            full_name?: string | null
            phone?: string | null
            email?: string | null
            avatar_url?: string | null
          } | null
        }

        const transformed: StaffMember[] = ((data as unknown as ActiveStaffDbRow[]) || []).map((item) => ({
          id: item.id,
          salon_id: item.salon_id,
          profile_id: item.profile_id,
          job_title: item.job_title || null,
          commission_rate: item.commission_rate,
          is_active: item.is_active,
          full_name: item.profiles?.full_name || null,
          phone: item.profiles?.phone || null,
          email: item.profiles?.email || null,
          avatar_url: item.profiles?.avatar_url || null,
        }))

        return transformed
      }

      const local = getLocalStaff(salon.id)
      return local.filter((s) => s.is_active !== false)
    } catch (error) {
      console.error(error)
      const local = getLocalStaff(salon.id)
      return local.filter((s) => s.is_active !== false)
    }
  }, [salon?.id])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    staff,
    loading,
    total,
    totalPages,
    currentPage: page,
    refetch: fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    toggleStaffStatus,
    getAllActiveStaff,
  }
}
