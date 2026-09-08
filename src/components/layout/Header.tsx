import React, { useState, useRef, useEffect } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSalon } from '@/hooks/useSalon'

export interface HeaderProps {
  onMenuClick: () => void
  rightActions?: React.ReactNode
}

export function Header({ onMenuClick, rightActions }: HeaderProps) {
  const { profile, signOut } = useAuth()
  const { salon } = useSalon()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const getRoleLabel = (role: string | undefined) => {
    const labels: Record<string, string> = {
      super_admin: 'Administrador',
      owner: 'Proprietário',
      employee: 'Profissional',
      client: 'Cliente',
    }
    return labels[role || 'client'] || 'Usuário'
  }

  const primaryColor = salon?.primary_color || '#f43f5e'

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

        {/* Breadcrumb Minimalista */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="text-slate-400">Painel</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900 tracking-wide">
            {salon?.name || 'BelezaFlow'}
          </span>
          <span className="text-amber-600/80 text-[10px] ml-1">✦</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {rightActions}

        {/* Perfil do Usuário */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 h-10 px-2 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <div 
              className="h-8 w-8 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold shadow-xs flex-shrink-0"
            >
              {getInitials(profile?.full_name)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-[11px] text-amber-700/90 leading-tight font-medium">
                {getRoleLabel(profile?.role)}
              </p>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-amber-700 font-medium truncate mt-0.5">
                  {getRoleLabel(profile?.role)}
                </p>
              </div>
              <button
                onClick={() => {
                  signOut()
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
