import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  CreditCard,
  Percent,
  Building2,
} from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useSalon } from '@/context/SalonContext'
import { usePlan } from '@/hooks/usePlan'
import { useUnits } from '@/hooks/useUnits'

export function AgendaPage() {
  const { user } = useAuth()
  const { appointments, updateAppointmentStatus, professionals, loading } = useSalon()
  const [searchParams] = useSearchParams()
  const { can } = usePlan()
  const { units } = useUnits()
  const hasMultiUnits = can('multi_unidades')

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [unitFilter, setUnitFilter] = useState<string>(() => searchParams.get('unit') || 'all')

  const isEmployee = user?.role === 'employee'

  // Identificador do profissional autenticado
  const currentStaffId = useMemo(() => {
    if (!isEmployee || !user) return null
    if (user.staff_id) return user.staff_id
    if (user.email?.toLowerCase().includes('ana') || user.fullName?.toLowerCase().includes('ana')) {
      return '3'
    }
    return user.id
  }, [isEmployee, user])

  // Filtra agendamentos baseado no perfil
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptStaffId = apt.staff_id || apt.professional_id
      const aptStaffName = apt.professional_name || ''

      const matchesStaff = isEmployee
        ? (currentStaffId === '3'
            ? aptStaffId === '3' || aptStaffName.toLowerCase().includes('ana')
            : aptStaffId === currentStaffId || aptStaffName.toLowerCase() === user?.fullName?.toLowerCase())
        : (staffFilter === 'all' || aptStaffId === staffFilter)

      const matchesUnit = !hasMultiUnits || unitFilter === 'all' || apt.unit_id === unitFilter

      return matchesStaff && matchesUnit
    })
  }, [appointments, isEmployee, currentStaffId, user, staffFilter, hasMultiUnits, unitFilter])

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

  const dayAppointments = filteredAppointments.filter((apt) => {
    const dStr = apt.date ? apt.date.split('T')[0] : (apt.start_time ? apt.start_time.split('T')[0] : '')
    return dStr === selectedDateStr
  })

  const confirmedCount = dayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'confirmado').length
  const completedCount = dayAppointments.filter((a) => a.status === 'completed' || a.status === 'concluido').length
  const totalRevenue = dayAppointments
    .filter((a) => a.status !== 'canceled' && a.status !== 'cancelado')
    .reduce((sum, a) => sum + (a.price || 0), 0)

  // Taxa de comissão média para profissional (40%)
  const commissionRate = 0.40
  const totalCommission = dayAppointments
    .filter((a) => a.status === 'completed' || a.status === 'concluido' || a.status === 'confirmed' || a.status === 'confirmado')
    .reduce((sum, a) => sum + ((a.price || 0) * commissionRate), 0)

  const handleCancel = (id: string) => {
    updateAppointmentStatus(id, 'canceled')
  }

  const handleComplete = (id: string) => {
    updateAppointmentStatus(id, 'completed')
  }

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1))
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const goToToday = () => setSelectedDate(new Date())

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? "Minha Agenda" : "Agenda"}
        description={
          isEmployee 
            ? `Bem-vindo(a), ${user?.fullName || 'Profissional'}. Veja seus horários e comissões do dia.`
            : "Gerencie os agendamentos e atendimentos do seu estabelecimento"
        }
      />

      {/* Banner Informativo Exclusivo para Profissional */}
      {isEmployee && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              ✂️
            </div>
            <div>
              <p className="text-sm font-bold text-blue-950">
                Acesso de Profissional Ativo
              </p>
              <p className="text-xs text-blue-800 mt-0.5">
                Você visualiza apenas os seus atendimentos e o cálculo individual de suas comissões.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold text-blue-900">
            <Percent className="w-3.5 h-3.5 text-blue-600" />
            <span>Comissão Base: 40%</span>
          </div>
        </div>
      )}

      {/* Navegação de Data & Métricas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                aria-label="Dia anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-center min-w-[180px]">
                <p className="text-lg font-bold text-slate-900">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {format(selectedDate, "EEEE", { locale: ptBR })}
                </p>
              </div>

              <button
                onClick={goToNextDay}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                aria-label="Próximo dia"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {!isToday && (
                <button
                  onClick={goToToday}
                  className="ml-2 h-10 px-3 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors border border-amber-200 cursor-pointer"
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Filtro de Profissionais (apenas para donos e administradores) */}
            {!isEmployee && (
              <div className="flex flex-wrap items-center gap-2">
                {hasMultiUnits && units.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 h-10">
                    <Building2 className="h-4 w-4 text-amber-600" />
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="bg-transparent text-sm text-slate-800 font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="all">Todas as unidades</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
                  <select
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">Todos os profissionais</option>
                    {professionals.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{dayAppointments.length}</p>
              <p className="text-xs text-slate-500">Agendamentos</p>
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
              {isEmployee ? (
                <>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(totalCommission)}
                  </p>
                  <p className="text-xs text-slate-500">Sua Comissão (Est.)</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs text-slate-500">Faturamento Bruto</p>
                </>
              )}
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
            title="Sem dados ainda"
            description={isEmployee 
              ? "Você não possui agendamentos para esta data."
              : "Nenhum agendamento registrado para esta data."}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {dayAppointments
            .sort((a, b) => {
              const tA = a.time || (a.start_time ? a.start_time.substring(11, 16) : '00:00')
              const tB = b.time || (b.start_time ? b.start_time.substring(11, 16) : '00:00')
              return tA.localeCompare(tB)
            })
            .map((appointment) => {
              const isConfirmed = appointment.status === 'confirmed' || appointment.status === 'confirmado'
              const isCompleted = appointment.status === 'completed' || appointment.status === 'concluido'
              const isCanceled = appointment.status === 'canceled' || appointment.status === 'cancelado'
              const isPending = appointment.status === 'pending' || appointment.status === 'pendente'

              return (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all',
                    isCanceled && 'opacity-60'
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-lg">
                          {appointment.time || (appointment.start_time ? formatTime(appointment.start_time) : '00:00')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appointment.duration_minutes || 30}min
                        </p>
                      </div>
                      <Badge
                        variant={
                          isConfirmed
                            ? 'success'
                            : isCompleted
                            ? 'info'
                            : isCanceled
                            ? 'danger'
                            : 'warning'
                        }
                        className="ml-2"
                      >
                        {isConfirmed && 'Confirmado'}
                        {isCompleted && 'Concluído'}
                        {isCanceled && 'Cancelado'}
                        {isPending && 'Pendente'}
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
                          Profissional: {appointment.professional_name || 'Profissional'}
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
                        {isEmployee ? (
                          <>
                            <p className="text-xs text-slate-500">Sua Comissão (40%)</p>
                            <p className="font-bold text-amber-600 text-lg">
                              {formatCurrency((appointment.price || 0) * commissionRate)}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Valor total: {formatCurrency(appointment.price || 0)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-slate-500">Valor Total</p>
                            <p className="font-bold text-emerald-600 text-lg">
                              {formatCurrency(appointment.price || 0)}
                            </p>
                            {typeof appointment.payment_amount === 'number' && appointment.payment_amount > 0 && (
                              <p className="text-[11px] text-slate-500">
                                Recebido: {formatCurrency(appointment.payment_amount)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {isConfirmed && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleComplete(appointment.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                        <Button
                          onClick={() => handleCancel(appointment.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
        </div>
      )}
    </div>
  )
}

