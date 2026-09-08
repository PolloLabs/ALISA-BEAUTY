import { useState, useEffect, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppointments, AppointmentWithDetails } from '@/hooks/useAppointments'
import { useStaff, StaffMember } from '@/hooks/useStaff'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { AppointmentTableRow } from '@/components/appointments/AppointmentTableRow'
import { AppointmentModal } from '@/components/appointments/AppointmentModal'
import { AppointmentFormData } from '@/components/appointments/AppointmentForm'
import { formatAppointmentDate } from '@/lib/schedulingEngine'

export function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cancelingAppointment, setCancelingAppointment] = useState<AppointmentWithDetails | null>(null)

  const appointmentOptions = useMemo(() => ({
    date: selectedDate,
    staffId: staffFilter === 'all' ? undefined : staffFilter,
  }), [selectedDate, staffFilter])

  const { appointments, loading, createAppointment, cancelAppointment, updateAppointment } = useAppointments(appointmentOptions)
  const { getAllActiveStaff } = useStaff()
  const [staffList, setStaffList] = useState<StaffMember[]>([])

  useEffect(() => {
    let mounted = true
    getAllActiveStaff().then((data) => {
      if (mounted) setStaffList(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleCreate = () => setIsModalOpen(true)

  const handleCancel = (appointment: AppointmentWithDetails) => {
    setCancelingAppointment(appointment)
  }

  const handleConfirmCancel = async () => {
    if (!cancelingAppointment) return
    await cancelAppointment(cancelingAppointment.id)
    setCancelingAppointment(null)
  }

  const handleComplete = async (appointment: AppointmentWithDetails) => {
    await updateAppointment(appointment.id, { status: 'completed' })
  }

  const handleSave = async (data: AppointmentFormData) => {
    return await createAppointment(data)
  }

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1))
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const goToToday = () => setSelectedDate(new Date())

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // Estatísticas do dia
  const confirmedCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'confirmado').length
  const totalRevenue = appointments
    .filter(a => a.status !== 'canceled' && a.status !== 'cancelado')
    .reduce((sum, a) => sum + (a.service_price || a.price || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gerencie os agendamentos do seu estabelecimento"
        action={{
          label: 'Novo agendamento',
          onClick: handleCreate,
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      {/* Navegação de Data */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Navegação */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                title="Dia anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-center min-w-[180px]">
                <p className="text-lg font-bold text-slate-800">
                  {formatAppointmentDate(selectedDate)}
                </p>
                <p className="text-xs text-slate-500">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>

              <button
                onClick={goToNextDay}
                className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
                title="Próximo dia"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {!isToday && (
                <button
                  onClick={goToToday}
                  className="ml-2 h-10 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  style={{ color: 'var(--primary-color)' }}
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Filtro por profissional */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">Todos os profissionais</option>
                {staffList.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estatísticas do dia */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
              <p className="text-xs text-slate-500">Confirmados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">
                {appointments.filter(a => a.status === 'completed' || a.status === 'concluido').length}
              </p>
              <p className="text-xs text-slate-500">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>
                R$ {totalRevenue.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-slate-500">Faturamento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {loading ? (
        <SkeletonTable />
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarIcon}
            title="Nenhum agendamento neste dia"
            description="Comece adicionando um novo agendamento para esta data"
            actionLabel="Novo agendamento"
            onAction={handleCreate}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence>
              {appointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AppointmentCard
                    appointment={appointment}
                    onCancel={handleCancel}
                    onComplete={handleComplete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop: Tabela */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appointments.map((appointment) => (
                    <AppointmentTableRow
                      key={appointment.id}
                      appointment={appointment}
                      onCancel={handleCancel}
                      onComplete={handleComplete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Modal de criação */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={null}
        onSave={handleSave}
        initialDate={format(selectedDate, 'yyyy-MM-dd')}
      />

      {/* Dialog de confirmação de cancelamento */}
      <ConfirmDialog
        isOpen={!!cancelingAppointment}
        onClose={() => setCancelingAppointment(null)}
        onConfirm={handleConfirmCancel}
        title="Cancelar agendamento?"
        description={`O agendamento de "${cancelingAppointment?.client_name}" às ${cancelingAppointment?.start_time ? new Date(cancelingAppointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : cancelingAppointment?.time || ''} será cancelado. O horário ficará disponível para novos agendamentos.`}
        confirmLabel="Sim, cancelar"
        variant="danger"
      />
    </div>
  )
}

export default AgendaPage
