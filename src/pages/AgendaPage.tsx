import { useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  XCircle,
  CheckCircle,
  Plus,
  Filter,
  Users,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Globe,
} from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface AgendaAppointment {
  id: string
  salon_id: string
  client_name: string
  client_phone: string
  client_email?: string
  service_id: string
  service_name: string
  service_price: number
  service_duration: number
  staff_id: string
  staff_name: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'pending' | 'completed' | 'canceled'
  payment_status: 'pending' | 'partial' | 'paid'
  payment_amount: number
  payment_method?: 'pix' | 'card' | 'cash' | 'boleto'
  deposit_amount?: number
  notes?: string
  created_at: string
}

const MOCK_APPOINTMENTS: AgendaAppointment[] = [
  {
    id: '1',
    salon_id: 'default-salon',
    client_name: 'Maria Silva',
    client_phone: '(11) 99999-1111',
    client_email: 'maria.silva@email.com',
    service_id: 'srv-1',
    service_name: 'Corte Feminino',
    service_price: 130,
    service_duration: 60,
    staff_id: '3',
    staff_name: 'Ana Silva',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60000).toISOString(),
    status: 'confirmed',
    payment_status: 'paid',
    payment_amount: 130,
    payment_method: 'pix',
    deposit_amount: 39,
    notes: 'Cliente prefere corte em camadas',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    salon_id: 'default-salon',
    client_name: 'João Santos',
    client_phone: '(11) 99999-2222',
    client_email: 'joao.santos@email.com',
    service_id: 'srv-2',
    service_name: 'Barba Completa',
    service_price: 60,
    service_duration: 30,
    staff_id: '2',
    staff_name: 'Carlos Oliveira',
    start_time: new Date(Date.now() + 2 * 60 * 60000).toISOString(),
    end_time: new Date(Date.now() + 2.5 * 60 * 60000).toISOString(),
    status: 'pending',
    payment_status: 'partial',
    payment_amount: 18,
    payment_method: 'card',
    deposit_amount: 18,
    notes: 'Sinal de 30% quitado via cartão',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    salon_id: 'default-salon',
    client_name: 'Pedro Costa',
    client_phone: '(11) 99999-3333',
    client_email: 'pedro.costa@email.com',
    service_id: 'srv-3',
    service_name: 'Manicure',
    service_price: 75,
    service_duration: 45,
    staff_id: '1',
    staff_name: 'Mariana Costa',
    start_time: new Date(Date.now() + 3 * 60 * 60000).toISOString(),
    end_time: new Date(Date.now() + 3.75 * 60 * 60000).toISOString(),
    status: 'confirmed',
    payment_status: 'pending',
    payment_amount: 0,
    payment_method: 'cash',
    deposit_amount: 0,
    notes: 'Pagamento total agendado para o atendimento',
    created_at: new Date().toISOString(),
  },
]

const MOCK_STAFF = [
  { id: '1', full_name: 'Mariana Costa' },
  { id: '2', full_name: 'Carlos Oliveira' },
  { id: '3', full_name: 'Ana Silva' },
]

export function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [appointments, setAppointments] = useState<AgendaAppointment[]>(MOCK_APPOINTMENTS)
  const [loading] = useState(false)
  
  // ESTADO PARA TESTE DAS POLÍTICAS RLS:
  // super_admin: super_admin_all
  // owner: owner_salon_only
  // employee: employee_own_only
  // client: client_public_insert / client_public_select
  const [viewMode, setViewMode] = useState<'super_admin' | 'owner' | 'employee' | 'client'>('owner')
  const currentStaffId = '3' // Simulando que é a Ana Silva

  const isEmployee = viewMode === 'employee'
  const isSuperAdmin = viewMode === 'super_admin'
  const isClient = viewMode === 'client'

  // Filtra agendamentos baseado no tipo de usuário / política RLS
  const filteredAppointments = appointments.filter((apt) => {
    if (viewMode === 'employee') {
      return apt.staff_id === currentStaffId
    }
    if (viewMode === 'owner') {
      // Owner vê apenas do seu salão
      return apt.salon_id === 'default-salon' && (staffFilter === 'all' || apt.staff_id === staffFilter)
    }
    if (viewMode === 'super_admin') {
      // Super admin vê tudo
      return staffFilter === 'all' || apt.staff_id === staffFilter
    }
    // Cliente vê horários para agendamento
    return true
  })

  const dayAppointments = filteredAppointments.filter((apt) => {
    const aptDate = new Date(apt.start_time)
    return format(aptDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  })

  const confirmedCount = dayAppointments.filter((a) => a.status === 'confirmed').length
  const completedCount = dayAppointments.filter((a) => a.status === 'completed').length
  const totalRevenue = dayAppointments
    .filter((a) => a.status !== 'canceled')
    .reduce((sum, a) => sum + (a.service_price || 0), 0)

  const handleCancel = (id: string) => {
    setAppointments(appointments.map((apt) => 
      apt.id === id ? { ...apt, status: 'canceled' } : apt
    ))
  }

  const handleComplete = (id: string) => {
    setAppointments(appointments.map((apt) => 
      apt.id === id ? { ...apt, status: 'completed' } : apt
    ))
  }

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1))
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const goToToday = () => setSelectedDate(new Date())

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description={isEmployee ? "Seus agendamentos" : "Gerencie os agendamentos do seu estabelecimento"}
        action={!isEmployee ? {
          label: 'Novo agendamento',
          onClick: () => alert('Em produção, abriria modal de agendamento'),
          icon: <Plus className="h-4 w-4" />,
        } : undefined}
      />

      {/* SELETOR DE MODO DE TESTE DAS POLÍTICAS RLS */}
      <div className={cn(
        'p-4 rounded-2xl border transition-all space-y-3',
        isSuperAdmin ? 'bg-purple-50/70 border-purple-200' :
        isEmployee ? 'bg-blue-50/70 border-blue-200' :
        isClient ? 'bg-emerald-50/70 border-emerald-200' :
        'bg-amber-50/70 border-amber-200'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shadow-sm',
              isSuperAdmin ? 'bg-purple-600 text-white' :
              isEmployee ? 'bg-blue-600 text-white' :
              isClient ? 'bg-emerald-600 text-white' :
              'bg-amber-600 text-white'
            )}>
              {isSuperAdmin && <ShieldCheck className="h-5 w-5" />}
              {isEmployee && <Users className="h-5 w-5" />}
              {isClient && <Globe className="h-5 w-5" />}
              {!isSuperAdmin && !isEmployee && !isClient && <Briefcase className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Simulador de Política RLS:
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                  {isSuperAdmin && 'super_admin_all (ALL)'}
                  {viewMode === 'owner' && 'owner_salon_only (ALL)'}
                  {isEmployee && 'employee_own_only (SELECT)'}
                  {isClient && 'client_public (INSERT/SELECT)'}
                </span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {isSuperAdmin && 'Visão Super Admin: Acesso irrestrito a todos os agendamentos e unidades.'}
                {viewMode === 'owner' && 'Visão Proprietário: Apenas agendamentos pertencentes ao seu salão.'}
                {isEmployee && 'Visão Profissional: Apenas os agendamentos atribuídos à sua conta (Ana Silva).'}
                {isClient && 'Visão Pública / Cliente: Sem login obrigatório, com acesso direto a agendamento online.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-slate-200/80 self-start sm:self-center">
            <button
              onClick={() => setViewMode('super_admin')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                isSuperAdmin ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              Super Admin
            </button>
            <button
              onClick={() => setViewMode('owner')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                viewMode === 'owner' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              Proprietário
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                isEmployee ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              Funcionário
            </button>
            <button
              onClick={() => setViewMode('client')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                isClient ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              Cliente (Público)
            </button>
          </div>
        </div>
      </div>

      {/* Navegação de Data */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-center min-w-[180px]">
                <p className="text-lg font-bold text-slate-900">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-500">
                  {format(selectedDate, "EEEE", { locale: ptBR })}
                </p>
              </div>

              <button
                onClick={goToNextDay}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {!isToday && (
                <button
                  onClick={goToToday}
                  className="ml-2 h-10 px-3 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors border border-amber-200"
                >
                  Hoje
                </button>
              )}
            </div>

            {!isEmployee && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todos os profissionais</option>
                  {MOCK_STAFF.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{dayAppointments.length}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
              <p className="text-xs text-slate-500">Confirmados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
              <p className="text-xs text-slate-500">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-slate-500">Faturamento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : dayAppointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarIcon}
            title="Nenhum agendamento neste dia"
            description={isEmployee 
              ? "Você não tem agendamentos para esta data"
              : "Comece adicionando um novo agendamento para esta data"}
            actionLabel={!isEmployee ? "Novo agendamento" : undefined}
            onAction={!isEmployee ? () => alert('Em produção, abriria modal') : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {dayAppointments
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((appointment) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all',
                  appointment.status === 'canceled' && 'opacity-60'
                )}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">
                        {formatTime(appointment.start_time)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appointment.service_duration}min
                      </p>
                    </div>
                    <Badge
                      variant={
                        appointment.status === 'confirmed'
                          ? 'success'
                          : appointment.status === 'completed'
                          ? 'info'
                          : appointment.status === 'canceled'
                          ? 'danger'
                          : 'warning'
                      }
                      className="ml-2"
                    >
                      {appointment.status === 'confirmed' && 'Confirmado'}
                      {appointment.status === 'completed' && 'Concluído'}
                      {appointment.status === 'canceled' && 'Cancelado'}
                      {appointment.status === 'pending' && 'Pendente'}
                    </Badge>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="h-3 w-3" /> Cliente
                      </p>
                      <p className="font-medium text-slate-900">
                        {appointment.client_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {appointment.client_phone}
                      </p>
                      {appointment.client_email && (
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {appointment.client_email}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Scissors className="h-3 w-3" /> Serviço
                      </p>
                      <p className="font-medium text-slate-900">
                        {appointment.service_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Com: {appointment.staff_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Pagamento
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                          appointment.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appointment.payment_status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        )}>
                          {appointment.payment_status === 'paid' && 'Pago'}
                          {appointment.payment_status === 'partial' && `Sinal (${formatCurrency(appointment.deposit_amount || 0)})`}
                          {appointment.payment_status === 'pending' && 'Pendente'}
                        </span>
                        {appointment.payment_method && (
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {appointment.payment_method}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Valor Total</p>
                      <p className="font-bold text-emerald-600 text-lg">
                        {formatCurrency(appointment.service_price)}
                      </p>
                      {appointment.payment_amount > 0 && (
                        <p className="text-[11px] text-slate-500">
                          Recebido: {formatCurrency(appointment.payment_amount)}
                        </p>
                      )}
                    </div>
                  </div>

                  {appointment.status === 'confirmed' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleComplete(appointment.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                      <Button
                        onClick={() => handleCancel(appointment.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      )}
    </div>
  )
}
