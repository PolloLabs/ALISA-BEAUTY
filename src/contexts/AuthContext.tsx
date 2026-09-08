import React, { createContext, useContext, useState, useEffect } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email?: string
  fullName?: string
  salonName?: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  email?: string
  role?: string
}

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName: string; salonName?: string }) => Promise<void>
  logout: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_STORAGE_USER_KEY = 'belezaflow_auth_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    // Default demo admin user for frictionless development/preview
    return {
      id: 'demo-user-1',
      email: 'admin@belezaflow.com.br',
      fullName: 'Administrador(a)',
      salonName: 'Studio BelezaFlow',
    }
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Administrador',
            salonName: session.user.user_metadata?.salon_name || 'Meu Salão',
          }
          setUser(authUser)
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser))
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Administrador',
            salonName: session.user.user_metadata?.salon_name || 'Meu Salão',
          }
          setUser(authUser)
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser))
        } else {
          setUser(null)
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name || 'Administrador',
            salonName: data.user.user_metadata?.salon_name || 'Meu Salão',
          }
          setUser(authUser)
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser))
        }
      } else {
        // Modo local/demo
        const demoUser: AuthUser = {
          id: 'demo-' + Date.now(),
          email,
          fullName: 'Profissional BelezaFlow',
          salonName: 'Studio BelezaFlow',
        }
        setUser(demoUser)
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: { email: string; password: string; fullName: string; salonName?: string }) => {
    setIsLoading(true)
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              salon_name: data.salonName || 'Meu Salão',
            },
          },
        })
        if (error) throw error
        if (authData.user) {
          const authUser: AuthUser = {
            id: authData.user.id,
            email: authData.user.email,
            fullName: data.fullName,
            salonName: data.salonName || 'Meu Salão',
          }
          setUser(authUser)
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(authUser))
        }
      } else {
        // Modo local/demo
        const newUser: AuthUser = {
          id: 'user-' + Date.now(),
          email: data.email,
          fullName: data.fullName,
          salonName: data.salonName || 'Meu Salão',
        }
        setUser(newUser)
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
  }

  const profile: UserProfile | null = user ? {
    id: user.id,
    full_name: user.fullName || user.email?.split('@')[0] || 'Usuário',
    email: user.email,
    role: 'owner',
  } : null

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        signOut: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
