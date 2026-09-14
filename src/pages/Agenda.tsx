import { useState, useMemo, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Scissors,
  MessageCircle,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { format, addDays, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useSalon } from '@/hooks/useSalon'
import { useAppointments, AppointmentWithDetails } from '@/hooks/useAppointments'
import { useStaff, StaffMember } from '@/hooks/useStaff'
import { calculateEndTime } from '@/lib/schedulingEngine'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/staff/Avatar'
import { AppointmentModal } from '@/components/appointments/AppointmentModal'
import { AppointmentFormData } from '@/components/appointments/AppointmentForm'
import { cn } from '@/lib/utils'

export function Agenda() {
  const { salon } = useSalon()
  const { getAllActiveStaff } = useStaff()

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeStaffList, setActiveStaffList] = useState<StaffMember[]>([])

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [cancelingAppointment, setCancelingAppointment] = useState<AppointmentWithDetails | null>(null)

  // Carrega lista de profissionais para filtro
  useEffect(() => {
    let mounted = true
    const loadStaff = async () => {
      const staffList = await getAllActiveStaff()
      if (mounted) {
        setActiveStaffList(staffList)
      }
    }
    loadStaff()
    return () => {
      mounted = false
    }
  }, [salon?.id])

  const appointmentOptions = useMemo(() => ({
    date: currentDate,
    staffId: selectedStaffId !== 'all' ? selectedStaffId : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }), [currentDate, selectedStaffId, statusFilter])

  const {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
  } = useAppointments(appointmentOptions)

  // Estatísticas do dia
  const stats = useMemo(() => {
    const total = appointments.length
    const confirmed = appointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'confirmado'
    ).length
    const pending = appointments.filter(
      (a) => a.status === 'pending' || a.status === 'pendente'
    ).length
    const completed = appointments.filter(
      (a) => a.status === 'completed' || a.status === 'concluido'
    ).length
    const estimatedRevenue = appointments
      .filter((a) => a.status !== 'canceled' && a.status !== 'cancelado')
      .reduce((sum, a) => sum + (a.service_price || a.price || 0), 0)

    return { total, confirmed, pending, completed, estimatedRevenue }
  }, [appointments])

  const handleShiftDate = (days: number) => {
    setCurrentDate((prev) => addDays(prev, days))
  }

  const handleSetToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    const [year, month, day] = e.target.value.split('-').map(Number)
    setCurrentDate(new Date(year, month - 1, day))
  }

  const handleCreate = async (data: AppointmentFormData) => {
    return await createAppointment({
      staff_id: data.staff_id,
      service_id: data.service_id,
      client_name: data.client_name,
      client_phone: data.client_phone,
      date: data.date,
      time: data.time,
      notes: data.notes || undefined,
    })
  }

  const handleConfirmCancel = async () => {
    if (!cancelingAppointment) return
    await cancelAppointment(cancelingAppointment.id)
    setCancelingAppointment(null)
  }

  const handleSendWhatsApp = (apt: AppointmentWithDetails) => {
    const cleanPhone = (apt.client_phone || '').replace(/\D/g, '')
    if (!cleanPhone) return
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const aptDateStr = format(currentDate, 'dd/MM/yyyy')
    const aptTimeStr = apt.time || (apt.start_time ? apt.start_time.substring(11, 16) : '00:00')
    const priceStr = (apt.service_price || apt.price || 0).toFixed(2).replace('.', ',')

    const message = encodeURIComponent(
      `Olá, ${apt.client_name}! Confirmamos seu agendamento no ${salon?.name || 'BelezaFlow'}:\n\n` +
      ` Serviço: ${apt.service_name || 'Serviço'}\n` +
      ` Profissional: ${apt.staff_name || 'Profissional'}\n` +
      ` Data: ${aptDateStr}\n` +
      ` Horário: ${aptTimeStr}\n` +
      ` Valor: R$ ${priceStr}\n\n` +
      `Caso precise remarcar, entre em contato conosco!`
    )
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${message}`, '_blank')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confirmado':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Confirmado
          </Badge>
        )
      case 'completed':
      case 'concluido':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-slate-500" />
            Concluído
          </Badge>
        )
      case 'canceled':
      case 'cancelado':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        )
      case 'pending':
      case 'pendente':
      default:
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pendente
          </Badge>
        )
    }
  }

  const formattedDateTitle = format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const capitalizedDateTitle = formattedDateTitle.charAt(0).toUpperCase() + formattedDateTitle.slice(1)
  const isDateToday = isToday(currentDate)

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header com Ações e Navegação */}
      <PageHeader
        title="Agenda de Atendimentos"
        description="Gerencie os agendamentos e horários em tempo real com controle anti-conflito"
        action={{
          label: 'Novo agendamento',
          onClick: () => setIsNewModalOpen(true),
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      {/* Barra Superior de Navegação de Data */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Visualização da Data Selecionada */}
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">{capitalizedDateTitle}</h2>
                  {isDateToday && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Hoje
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Horário de funcionamento: {salon?.open_time || '08:00'} às {salon?.close_time || '19:00'}
                </p>
              </div>
            </div>

            {/* Controles de Navegação */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShiftDate(-1)}
                title="Dia anterior"
                className="h-10 px-3 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>

              <Button
                variant={isDateToday ? 'primary' : 'outline'}
                size="sm"
                onClick={handleSetToday}
                className="h-10 px-4 cursor-pointer"
              >
                Hoje
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShiftDate(1)}
                title="Próximo dia"
                className="h-10 px-3 cursor-pointer"
              >
                <span className="hidden sm:inline mr-1">Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <input
                type="date"
                value={format(currentDate, 'yyyy-MM-dd')}
                onChange={handleDateInputChange}
                className="h-10 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Cards de Métricas do Dia */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Total Agendados</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Confirmados</p>
              <p className="text-xl font-bold text-emerald-600">{stats.confirmed}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Pendentes</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500">Faturamento Previsto</p>
              <p className="text-xl font-bold text-slate-800">
                R$ {stats.estimatedRevenue.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filtro por Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'confirmed', label: 'Confirmados' },
                { key: 'pending', label: 'Pendentes' },
                { key: 'completed', label: 'Concluídos' },
                { key: 'canceled', label: 'Cancelados' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key)}
                  className={cn(
                    'px-3 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[38px] cursor-pointer whitespace-nowrap',
                    statusFilter === item.key
                      ? 'text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                  style={
                    statusFilter === item.key
                      ? { backgroundColor: 'var(--primary-color)' }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Filtro por Profissional */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block flex-shrink-0" />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[38px] cursor-pointer"
              >
                <option value="all">Todos os profissionais</option>
                {activeStaffList.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name || 'Profissional'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Agendamentos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-1/2" />
            </Card>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarIcon}
            title="Sem dados ainda"
            description={`Não há atendimentos para ${format(currentDate, "dd 'de' MMMM", { locale: ptBR })} com os filtros selecionados.`}
            actionLabel="Adicionar agendamento"
            onAction={() => setIsNewModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {appointments.map((apt) => {
              const startTimeStr = apt.time || (apt.start_time ? apt.start_time.substring(11, 16) : '00:00')
              const duration = apt.service_duration || apt.duration_minutes || 30
              const endTimeStr = apt.end_time ? apt.end_time.substring(11, 16) : calculateEndTime(startTimeStr, duration)
              const price = apt.service_price || apt.price || 0
              const isCanceled = apt.status === 'canceled' || apt.status === 'cancelado'
              const isCompleted = apt.status === 'completed' || apt.status === 'concluido'

              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={cn(
                    'p-4 transition-all hover:border-slate-300 relative flex flex-col justify-between h-full',
                    isCanceled && 'opacity-60 bg-slate-50'
                  )}>
                    <div>
                      {/* Linha Superior: Horário e Status */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{startTimeStr} - {endTimeStr}</span>
                          <span className="text-xs font-normal text-slate-500">({duration}min)</span>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>

                      {/* Corpo do Agendamento */}
                      <div className="pt-3 space-y-2.5">
                        {/* Serviço e Valor */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Scissors className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <h3 className="font-semibold text-slate-800 text-sm leading-snug">
                              {apt.service_name || 'Serviço'}
                            </h3>
                          </div>
                          <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
                            R$ {price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        {/* Dados do Cliente */}
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium">{apt.client_name}</span>
                          </div>
                          {apt.client_phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{apt.client_phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Profissional Designado */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
                          <Avatar name={apt.staff_name || 'Profissional'} size="sm" />
                          <div className="truncate">
                            <span className="text-slate-400">Profissional: </span>
                            <span className="font-medium text-slate-700">{apt.staff_name || 'Profissional'}</span>
                          </div>
                        </div>

                        {/* Observações */}
                        {apt.notes && (
                          <p className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg italic border border-amber-100">
                            &ldquo;{apt.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Barra de Ações Rápidas */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendWhatsApp(apt)}
                        className="flex-1 text-xs cursor-pointer min-h-[36px]"
                        title="Enviar confirmação por WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                        WhatsApp
                      </Button>

                      {!isCompleted && !isCanceled && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateAppointment(apt.id, { status: 'completed' })}
                            className="flex-1 text-xs cursor-pointer min-h-[36px]"
                            title="Marcar como concluído"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Concluir
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelingAppointment(apt)}
                            className="px-2.5 text-xs text-red-500 hover:bg-red-50 hover:border-red-200 cursor-pointer min-h-[36px]"
                            title="Cancelar agendamento"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {apt.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateAppointment(apt.id, { status: 'confirmed' })}
                          className="flex-1 text-xs cursor-pointer min-h-[36px]"
                        >
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de Novo Agendamento com validação dinâmica */}
      <AppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreate}
        initialDate={format(currentDate, 'yyyy-MM-dd')}
      />

      {/* Diálogo de Confirmação para Cancelamento */}
      <ConfirmDialog
        isOpen={!!cancelingAppointment}
        onClose={() => setCancelingAppointment(null)}
        onConfirm={handleConfirmCancel}
        title="Cancelar agendamento?"
        description={`Tem certeza que deseja cancelar o agendamento de "${cancelingAppointment?.client_name || 'cliente'}" às ${cancelingAppointment?.time || 'horário selecionado'}? O horário ficará disponível novamente para novos agendamentos.`}
        confirmLabel="Sim, cancelar agendamento"
        variant="danger"
      />
    </div>
  )
}

export default Agenda
