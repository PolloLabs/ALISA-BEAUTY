import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSalon } from '@/hooks/useSalon'
import { Skeleton } from '@/components/ui/Skeleton'

interface ProtectedRouteProps {
  children: ReactNode
  requireSalon?: boolean
}

export function ProtectedRoute({ children, requireSalon = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { salon, loading: salonLoading } = useSalon()
  const location = useLocation()

  if (isLoading || salonLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full bg-rose-500 animate-ping" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se rota exige salão criado e o usuário ainda não possui
  if (requireSalon && !salon) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <>{children}</>
}
