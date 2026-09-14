import React, { createContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { safeStorageGet, safeStorageSet, safeParse } from '@/lib/utils'

export type UserRole = 'super_admin' | 'owner' | 'employee' | 'client'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  salonName?: string
  salonId?: string
  staff_id?: string
  role: UserRole
  plan_status?: 'active' | 'inactive' | 'trial'
  plan_id?: string
}

export interface UserProfile {
  id: string
  full_name: string
  phone?: string
  role: UserRole
  salon_id?: string
  avatar_url?: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: { email: string; password: string; fullName: string; salonName?: string }) => Promise<void>
  logout: () => Promise<void>
  activatePlan: (planId?: string) => void
  currentView?: UserRole
  viewMode?: UserRole
  setViewMode?: (mode: UserRole | string) => void
  setRole?: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_STORAGE_USER_KEY = 'user'
const LEGACY_STORAGE_USER_KEY = 'belezaflow_auth_user'
const PROFESSIONALS_KEY = 'professionals'

export interface StoredProfessionalItem {
  nome: string
  profissao: string
  email: string
  senha: string
  staff_id: string
  telefone?: string
  comissao?: number
}

// Garante que o profissional de demonstração 'Ana Clara' exista no localStorage 'professionals'
export function seedDemoProfessionalsIfEmpty(): StoredProfessionalItem[] {
  try {
    let list: StoredProfessionalItem[] = safeStorageGet<StoredProfessionalItem[]>(PROFESSIONALS_KEY, [])

    // Se estiver vazio, semeia com os dados especificados na tarefa
    if (list.length === 0) {
      list = [
        {
          nome: 'Ana Clara',
          profissao: 'Cabeleireira',
          email: 'ana.clara@belezaflow.com',
          senha: 'pro1123',
          staff_id: '3',
          telefone: '(11) 98888-3333',
          comissao: 40,
        },
      ]
      safeStorageSet(PROFESSIONALS_KEY, list)
    } else {
      // Garante que Ana Clara com a senha pro1123 esteja presente mesmo se outros profissionais foram adicionados
      const anaIndex = list.findIndex(
        (p) => p.email?.trim().toLowerCase() === 'ana.clara@belezaflow.com'
      )
      if (anaIndex === -1) {
        list.push({
          nome: 'Ana Clara',
          profissao: 'Cabeleireira',
          email: 'ana.clara@belezaflow.com',
          senha: 'pro1123',
          staff_id: '3',
          telefone: '(11) 98888-3333',
          comissao: 40,
        })
        safeStorageSet(PROFESSIONALS_KEY, list)
      }
    }
    return list
  } catch (e) {
    console.error('Erro ao semear demo professionals:', e)
    return []
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    return safeStorageGet<AuthUser | null>(LOCAL_STORAGE_USER_KEY, null) ||
      safeStorageGet<AuthUser | null>(LEGACY_STORAGE_USER_KEY, null)
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Ao carregar a aplicação, semeia demo professionals caso esteja vazio
  useEffect(() => {
    seedDemoProfessionalsIfEmpty()
  }, [])

  // Sincroniza em localStorage 'user' e chave legada para compatibilidade
  const persistUser = (userData: AuthUser | null) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData))
      localStorage.setItem(LEGACY_STORAGE_USER_KEY, JSON.stringify(userData))
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
      localStorage.removeItem(LEGACY_STORAGE_USER_KEY)
    }
  }

  const activatePlan = (planId: string = 'pro') => {
    if (!user) return
    const updatedUser: AuthUser = {
      ...user,
      plan_status: 'active',
      plan_id: planId,
    }
    persistUser(updatedUser)
  }

  const login = async (emailInput: string, passwordInput: string): Promise<AuthUser> => {
    setIsLoading(true)
    try {
      const email = emailInput.trim().toLowerCase()
      const password = passwordInput.trim()

      // Garante que a lista demo esteja semeada
      seedDemoProfessionalsIfEmpty()

      // 1. SUPER ADMIN: admin@belezaflow.com / admin123
      if (
        (email === 'admin@belezaflow.com' || email === 'admin@belezaflow.com.br') &&
        (password === 'admin123' || password === 'admin')
      ) {
        const superAdminUser: AuthUser = {
          id: 'admin-1',
          email: 'admin@belezaflow.com',
          fullName: 'Super Administrador',
          salonName: 'BelezaFlow Platform',
          role: 'super_admin',
          plan_status: 'active',
        }
        persistUser(superAdminUser)
        return superAdminUser
      }

      // 2. DONO: owner@demo.com / owner123
      if (email === 'owner@demo.com' && (password === 'owner123' || password === '123456')) {
        let planStatus: 'active' | 'inactive' = 'inactive'
        const prevUser = safeStorageGet<AuthUser | null>(LOCAL_STORAGE_USER_KEY, null)
        if (prevUser && prevUser.email === 'owner@demo.com' && prevUser.plan_status === 'active') {
          planStatus = 'active'
        }

        const ownerUser: AuthUser = {
          id: 'owner-1',
          email: 'owner@demo.com',
          fullName: 'Amanda Rocha (Proprietária)',
          salonName: 'Studio BelezaFlow & Spa',
          role: 'owner',
          plan_status: planStatus,
        }
        persistUser(ownerUser)
        return ownerUser
      }

      // 3. PROFESSIONALS (localStorage 'professionals')
      try {
        const prosList = safeStorageGet<StoredProfessionalItem[]>(PROFESSIONALS_KEY, [])
        if (Array.isArray(prosList)) {
          const foundPro = prosList.find(
            (p) => p.email?.trim().toLowerCase() === email && String(p.senha).trim() === password
          )
          if (foundPro) {
            const proUser: AuthUser = {
              id: foundPro.staff_id || '3',
              staff_id: foundPro.staff_id || '3',
              email: foundPro.email,
              fullName: foundPro.nome || 'Profissional da Equipe',
              salonName: 'Studio BelezaFlow & Spa',
              role: 'employee',
              plan_status: 'active',
            }
            persistUser(proUser)
            return proUser
          }
        }

        // Checa fallback na lista de equipe salva em 'belezaflow_staff'
        const staffList = safeStorageGet<any[]>('belezaflow_staff', [])
        if (Array.isArray(staffList)) {
          const foundMember = staffList.find(
            (s: any) =>
              s.email?.trim().toLowerCase() === email &&
              (String(s.password).trim() === password || password === 'pro1123' || password === '123456')
          )
          if (foundMember) {
            const proUser: AuthUser = {
              id: foundMember.id || 'staff-' + Date.now(),
              staff_id: foundMember.id || '3',
              email: foundMember.email,
              fullName: foundMember.full_name || 'Profissional',
              salonName: 'Studio BelezaFlow & Spa',
              role: 'employee',
              plan_status: 'active',
            }
            persistUser(proUser)
            return proUser
          }
        }
      } catch (e) {
        console.error('Erro na validação de profissional:', e)
      }

      // 4. Verificação no Supabase (se configurado)
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error && data?.user) {
            const authUser: AuthUser = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: data.user.user_metadata?.full_name || 'Usuário',
              salonName: data.user.user_metadata?.salon_name || 'Meu Salão',
              role: (data.user.user_metadata?.role as UserRole) || 'owner',
              plan_status: 'active',
            }
            persistUser(authUser)
            return authUser
          }
        } catch (supaErr) {
          console.warn('Falha no Supabase signIn:', supaErr)
        }
      }

      // Se nenhuma correspondência foi encontrada
      throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async ({
    email,
    password,
    fullName,
    salonName,
  }: {
    email: string
    password: string
    fullName: string
    salonName?: string
  }) => {
    setIsLoading(true)
    try {
      const newUser: AuthUser = {
        id: 'usr-' + Date.now(),
        email: email.trim().toLowerCase(),
        fullName,
        salonName: salonName || 'Meu Novo Salão',
        role: 'owner',
        plan_status: 'inactive',
      }
      persistUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut().catch(() => {})
      }
      persistUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        activatePlan,
        currentView: user?.role || 'owner',
        viewMode: user?.role || 'owner',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
