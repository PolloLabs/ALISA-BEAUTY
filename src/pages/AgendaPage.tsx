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
} from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    client_name: 'Maria Silva',
    client_phone: '(11) 99999-1111',
    service_name: 'Corte Feminino',
    service_price: 130,
    service_duration: 60,
    staff_id: '3',
    staff_name: 'Ana Silva',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60000).toISOString(),
    status: 'confirmed',
  },
  {
    id: '2',
    client_name: 'João Santos',
    client_phone: '(11) 99999-2222',
    service_name: 'Barba Completa',
    service_price: 60,
    service_duration: 30,
    staff_id: '2',
    staff_name: 'Carlos Oliveira',
    start_time: new Date(Date.now() + 2 * 60 * 60000).toISOString(),
    end_time: new Date(Date.now() + 2.5 * 60 * 60000).toISOString(),
    status: 'pending',
  },
  {
    id: '3',
    client_name: 'Pedro Costa',
    client_phone: '(11) 99999-3333',
    service_name: 'Manicure',
    service_price: 75,
    service_duration: 45,
    staff_id: '1',
    staff_name: 'Mariana Costa',
    start_time: new Date(Date.now() + 3 * 60 * 60000).toISOString(),
    end_time: new Date(Date.now() + 3.75 * 60 * 60000).toISOString(),
    status: 'confirmed',
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
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS)
  const [loading] = useState(false)
  
  // ESTADO PARA TESTE: alterna entre proprietário e funcionário
  const [viewMode, setViewMode] = useState<'owner' | 'employee'>('owner')
  const currentStaffId = '3' // Simulando que é a Ana Silva

  const isEmployee = viewMode === 'employee'

  // Filtra agendamentos baseado no tipo de usuário
  const filteredAppointments = appointments.filter((apt) => {
    if (isEmployee) {
      return apt.staff_id === currentStaffId
    }
    if (staffFilter !== 'all') {
      return apt.staff_id === staffFilter
    }
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

      {/* ALERTA DE MODO DE TESTE */}
      <div className={cn(
        'p-4 rounded-xl border-2 flex items-center justify-between',
        isEmployee ? 'bg-blue-50 border-blue-300' : 'bg-amber-50 border-amber-300'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center',
            isEmployee ? 'bg-blue-500' : 'bg-amber-500'
          )}>
            {isEmployee ? <Users className="h-5 w-5 text-white" /> : <Briefcase className="h-5 w-5 text-white" />}
          </div>
          <div>
            <p className="font-bold text-slate-900">
              {isEmployee ? ' Modo FUNCIONÁRIO' : ' Modo PROPRIETÁRIO'}
            </p>
            <p className="text-sm text-slate-600">
              {isEmployee 
                ? 'Você está vendo apenas SEUS agendamentos (Ana Silva)' 
                : 'Você está vendo TODOS os agendamentos da equipe'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setViewMode(isEmployee ? 'owner' : 'employee')}
          className={cn(
            'h-10 px-4 rounded-lg font-medium transition-colors',
            isEmployee 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-amber-600 text-white hover:bg-amber-700'
          )}
        >
          Trocar para {isEmployee ? 'Proprietário' : 'Funcionário'}
        </button>
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

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Valor</p>
                      <p className="font-bold text-emerald-600 text-lg">
                        {formatCurrency(appointment.service_price)}
                      </p>
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
