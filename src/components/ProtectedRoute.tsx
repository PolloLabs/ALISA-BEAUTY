import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, UserRole } from '@/hooks/useAuth'
import { useSalon } from '@/hooks/useSalon'
import { Skeleton } from '@/components/ui/Skeleton'

interface ProtectedRouteProps {
  children: ReactNode
  requireSalon?: boolean
  allowedRoles?: UserRole[]
  checkPlan?: boolean
}

export function ProtectedRoute({ 
  children, 
  requireSalon = false, 
  allowedRoles,
  checkPlan = true
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { salon, loading: salonLoading } = useSalon()
  const location = useLocation()

  if (isLoading || (requireSalon && salonLoading)) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 rounded-full bg-amber-500 animate-ping" />
        </div>
        <Skeleton className="h-4 w-48 bg-slate-800" />
      </div>
    )
  }

  // Se não autenticado, redireciona para login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se for rota /admin, SOMENTE super_admin pode acessar
  if (location.pathname.startsWith('/admin') && user.role !== 'super_admin') {
    return <Navigate to={user.role === 'employee' ? '/agenda' : '/'} replace />
  }

  // Se for super_admin, ele só pode acessar rotas /admin. Redireciona para /admin se tentar acessar rotas operacionais
  if (user.role === 'super_admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />
  }

  // Se for dono (owner) e o plano não estiver ativo (e não estiver já na rota /plan-gate)
  if (checkPlan && user.role === 'owner' && user.plan_status !== 'active' && location.pathname !== '/plan-gate') {
    return <Navigate to="/plan-gate" replace />
  }

  // Se for profissional (employee), não pode acessar rotas restritas (financeiro, equipe, configurações, dashboard)
  if (user.role === 'employee') {
    const restrictedForEmployee = ['/financeiro', '/equipe', '/configuracoes', '/configuracoes/salao', '/admin', '/campanhas']
    const isRestricted = restrictedForEmployee.some(path => location.pathname.startsWith(path))
    if (isRestricted || location.pathname === '/') {
      return <Navigate to="/agenda" replace />
    }
  }

  // Se a rota define papéis permitidos específicos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'super_admin') {
      return <Navigate to="/admin" replace />
    } else if (user.role === 'employee') {
      return <Navigate to="/agenda" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  // Se rota exige salão criado e o usuário ainda não possui
  if (requireSalon && !salon && user.role === 'owner') {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <>{children}</>
}
