import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays, 
  UserCheck, 
  Scissors, 
  Settings, 
  DollarSign, 
  X, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  CreditCard,
  MessageSquare,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSalon } from '@/hooks/useSalon'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'
import { getBusinessConfig } from '@/lib/businessConfig'

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { salon } = useSalon()
  const { user } = useAuth()
  const { can } = usePlan()

  const [systemLogo, setSystemLogo] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('system_logo') : null
  })

  useEffect(() => {
    const handleIdentityChange = () => {
      setSystemLogo(localStorage.getItem('system_logo'))
    }
    window.addEventListener('app_identity_changed', handleIdentityChange)
    window.addEventListener('storage', handleIdentityChange)
    return () => {
      window.removeEventListener('app_identity_changed', handleIdentityChange)
      window.removeEventListener('storage', handleIdentityChange)
    }
  }, [])

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  const config = getBusinessConfig(salon?.business_type || 'beauty_salon')
  const LogoIcon = config.icon || Sparkles
  const role = user?.role || 'owner'

  // Restrição de rotas por perfil:
  // - Super Admin: Painel Geral (/admin), Lojas (/admin/lojas), Assinaturas (/admin/assinaturas), Configurações (/admin/configuracoes).
  // - Profissional (employee): Vê APENAS Minha Agenda (/agenda) e Agenda Visual (/agenda-visual).
  // - Dono (owner): Vê todas as rotas operacionais do salão.
  const menuItems = role === 'super_admin'
    ? [
        { to: '/admin', label: 'Painel Geral', icon: ShieldCheck },
        { to: '/admin/lojas', label: 'Lojas', icon: Building2 },
        { to: '/admin/assinaturas', label: 'Assinaturas', icon: CreditCard },
        { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
      ]
    : role === 'employee'
    ? [
        { to: '/agenda', label: 'Minha Agenda', icon: Calendar },
        { to: '/agenda-visual', label: 'Agenda Visual', icon: CalendarDays },
      ]
    : [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/agenda', label: 'Agenda', icon: Calendar },
        { to: '/agenda-visual', label: 'Agenda Visual', icon: CalendarDays },
        { to: '/campanhas', label: 'Campanhas', icon: MessageSquare },
        { to: '/servicos', label: 'Serviços', icon: Scissors },
        { to: '/financeiro', label: 'Financeiro', icon: DollarSign },
        { to: '/equipe', label: 'Equipe', icon: UserCheck },
        { to: '/configuracoes/salao', label: 'Configurações', icon: Settings },
      ]

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Header: Logo + Nome do Salão */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 bg-white">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
              {role === 'super_admin' ? (
                systemLogo ? (
                  <img src={systemLogo} alt="Logo do Sistema" className="h-full w-full object-cover" />
                ) : (
                  <LogoIcon className="h-4 w-4 text-amber-400" />
                )
              ) : salon?.logo_url ? (
                <img src={salon.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <LogoIcon className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-luxury font-bold text-slate-900 block truncate text-base tracking-tight leading-none">
              {role === 'super_admin' ? 'ALISA BEAUTY' : salon?.name || 'Studio BelezaFlow'}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold mt-1 block">
                {role === 'super_admin' ? 'Super Admin' : role === 'employee' ? 'Espaço Profissional' : 'Gestão do Salão'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 flex-shrink-0 cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || 
              (item.to === '/configuracoes/salao' && location.pathname.startsWith('/configuracoes'))
            
            // Verificação de bloqueio para o plano do salão
            const isVisualLocked = item.to === '/agenda-visual' && role === 'owner' && !can('agenda_visual')
            const isCampanhasLocked = item.to === '/campanhas' && role === 'owner' && !can('campanhas_em_lote')

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px]',
                  isActive 
                    ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-800' 
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-amber-400' : 'text-slate-400')} />
                  <span className={cn(isActive && 'font-semibold')}>{item.label}</span>
                </div>

                {isVisualLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Lock className="w-2.5 h-2.5" />
                    Pro
                  </span>
                )}

                {isCampanhasLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    <Lock className="w-2.5 h-2.5" />
                    VIP
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Public Booking Link Card */}
        {role !== 'super_admin' && (
          <div className="p-3.5 border-t border-slate-100 bg-amber-50/40">
            <a
              href={`/agendar/${salon?.id || 'demo'}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-amber-200/80 text-xs font-semibold text-slate-900 hover:border-amber-400 hover:shadow-xs transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Link do Cliente</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </a>
          </div>
        )}
      </aside>
    </>
  )
}
