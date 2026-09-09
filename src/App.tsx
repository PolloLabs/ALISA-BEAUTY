import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { SalonProvider } from '@/contexts/SalonContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { LoginDemoPage } from '@/pages/LoginDemoPage'
import { Onboarding } from '@/pages/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
import { SalonSettings } from '@/pages/settings/SalonSettings'
import { ServicesPage } from '@/pages/ServicesPage'
import { StaffPage } from '@/pages/StaffPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { Home } from '@/pages/Home'
import { Agenda } from '@/pages/Agenda'
import { Team } from '@/pages/Team'
import { Booking } from '@/pages/Booking'
import { Clients } from '@/pages/Clients'
import { Financial } from '@/pages/Financial'
import { FinanceiroPage } from '@/pages/FinanceiroPage'
import { PublicBookingPage } from '@/pages/PublicBookingPage'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SalonProvider>
            <Routes>
              {/* Rota Pública de Agendamento (Sem Login) */}
              <Route path="/agendar/:salonId" element={<PublicBookingPage />} />
              <Route path="/agendar" element={<PublicBookingPage />} />

              {/* Rotas de Autenticação */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginDemoPage />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Onboarding */}
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute requireSalon={false}>
                    <Onboarding />
                  </ProtectedRoute>
                } 
              />

              {/* Rotas Protegidas */}
              <Route element={<ProtectedRoute requireSalon={true}><MainLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/agenda-visual" element={<Agenda />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/servicos" element={<ServicesPage />} />
                <Route path="/financeiro" element={<FinanceiroPage />} />
                <Route path="/equipe" element={<StaffPage />} />
                <Route path="/configuracoes" element={<SalonSettings />} />
                <Route path="/configuracoes/salao" element={<SalonSettings />} />
                <Route path="/agendamento" element={<Booking />} />
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
