import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SalonProvider } from '@/contexts/SalonContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Onboarding } from '@/pages/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
import { SalonSettings } from '@/pages/settings/SalonSettings'
import { ServicesPage } from '@/pages/ServicesPage'
import { StaffPage } from '@/pages/StaffPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { Home } from '@/pages/Home'
import { Agenda } from '@/pages/Agenda'
import { Clients } from '@/pages/Clients'
import { FinanceiroPage } from '@/pages/FinanceiroPage'
import { PublicBookingPage } from '@/pages/PublicBookingPage'
import { SuperAdminPage } from '@/pages/SuperAdminPage'
import { AdminLojasPage } from '@/pages/admin/AdminLojasPage'
import { AdminAssinaturasPage } from '@/pages/admin/AdminAssinaturasPage'
import { AdminConfiguracoesPage } from '@/pages/admin/AdminConfiguracoesPage'
import { PlanGate } from '@/pages/PlanGate'

// Componente wrapper para o Gate de Plano com redirecionamento pós ativação
function PlanGateRoute() {
  const navigate = useNavigate()
  return (
    <ProtectedRoute checkPlan={false}>
      <PlanGate onPlanActivated={() => navigate('/')} />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SalonProvider>
            <Routes>
              {/* Rota Pública de Agendamento (Sem alteração, sem login) */}
              <Route path="/agendar/:salonId" element={<PublicBookingPage />} />
              <Route path="/agendar" element={<PublicBookingPage />} />

              {/* Rotas de Autenticação */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Gate de Plano (Somente Dono sem plano ativo) */}
              <Route path="/plan-gate" element={<PlanGateRoute />} />

              {/* Onboarding */}
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute requireSalon={false}>
                    <Onboarding />
                  </ProtectedRoute>
                } 
              />

              {/* Rotas Protegidas no Layout Principal */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                {/* Rotas do Super Admin */}
                <Route path="/admin" element={<SuperAdminPage />} />
                <Route path="/admin/lojas" element={<AdminLojasPage />} />
                <Route path="/admin/assinaturas" element={<AdminAssinaturasPage />} />
                <Route path="/admin/configuracoes" element={<AdminConfiguracoesPage />} />

                {/* Rotas Principais */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/agenda-visual" element={<Agenda />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/servicos" element={<ServicesPage />} />
                <Route path="/financeiro" element={<FinanceiroPage />} />
                <Route path="/equipe" element={<StaffPage />} />
                <Route path="/configuracoes" element={<SalonSettings />} />
                <Route path="/configuracoes/salao" element={<SalonSettings />} />
                <Route path="/home" element={<Home />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastProvider />
          </SalonProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
