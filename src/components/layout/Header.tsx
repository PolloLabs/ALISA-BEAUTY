import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSalon } from '@/hooks/useSalon'

export interface HeaderProps {
  onMenuClick: () => void
  rightActions?: React.ReactNode
}

export function Header({ onMenuClick, rightActions }: HeaderProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { salon } = useSalon()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Dashboard'
    if (path === '/') return 'Dashboard'
    if (path === '/agenda') return user?.role === 'employee' ? 'Minha Agenda' : 'Agenda'
    if (path === '/agenda-visual') return 'Agenda Visual'
    if (path.startsWith('/servicos')) return 'Serviços'
    if (path.startsWith('/financeiro')) return 'Financeiro'
    if (path.startsWith('/equipe')) return 'Equipe'
    if (path.startsWith('/clientes')) return 'Clientes'
    if (path.startsWith('/configuracoes')) return 'Configurações'
    if (path.startsWith('/home')) return 'Home'
    return 'Dashboard'
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const getRoleLabel = (role: string | undefined) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      owner: 'Dono(a) do Salão',
      employee: 'Profissional',
      client: 'Cliente',
    }
    return labels[role || 'owner'] || 'Usuário'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-700 cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Título da Página Atual */}
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {rightActions}

        {/* Botão de Logout Rápido */}
        <button
          onClick={logout}
          className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-sm font-medium transition-colors cursor-pointer"
          title="Sair da conta"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>

        {/* Perfil do Usuário */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 h-10 px-2 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <div 
              className="h-8 w-8 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold shadow-xs flex-shrink-0"
            >
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.fullName || 'Usuário'}
              </p>
              <p className="text-[11px] text-amber-700/90 leading-tight font-medium">
                {getRoleLabel(user?.role)}
              </p>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.fullName || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                  {getRoleLabel(user?.role)}
                </span>
              </div>

              <div className="p-2 border-b border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sessão Autenticada</span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout()
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
