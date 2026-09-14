import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Scissors,
  Armchair,
} from 'lucide-react'
import { useSalon } from '../context/SalonContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { NewAppointmentModal } from '../components/NewAppointmentModal'
import { DonutChart, DonutCategory } from '../components/charts/DonutChart'
import { formatCurrency, formatDateFull } from '@/lib/formatters'
import { cn, safeStorageGet } from '../lib/utils'
import { Appointment } from '../types'

export interface DashboardProps {
  className?: string
}

export const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const navigate = useNavigate()
  const { appointments, updateAppointmentStatus } = useSalon()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]
  const currentDateFormatted = formatDateFull(new Date())

  // Atendimentos e Faturamento reais
  const todayAppointments = appointments.filter(
    (a) => a.date === todayStr && a.status !== 'cancelado' && a.status !== 'canceled'
  )
  const todayRevenue = todayAppointments.reduce((acc, a) => acc + (a.price || 0), 0)

  const confirmedCount = todayAppointments.filter(
    (a) => a.status === 'confirmado' || a.status === 'confirmed'
  ).length

  const pendingCount = todayAppointments.filter(
    (a) => a.status === 'pendente' || a.status === 'pending'
  ).length

  const canceledCount = appointments.filter(
    (a) => (a.status === 'cancelado' || a.status === 'canceled') && a.date === todayStr
  ).length

  const servicesDoneToday = todayAppointments.filter(
    (a) => a.status === 'concluido' || a.status === 'completed'
  ).length

  const currentYearMonth = todayStr.substring(0, 7)
  const monthRevenue = appointments
    .filter((a) => {
      const aDate = a.date || (a.start_time ? a.start_time.split('T')[0] : '')
      const notCanceled = a.status !== 'cancelado' && a.status !== 'canceled'
      return aDate.startsWith(currentYearMonth) && notCanceled
    })
    .reduce((sum, a) => sum + (a.price || 0), 0)

  const averageTicket = servicesDoneToday > 0 ? todayRevenue / servicesDoneToday : 0

  // 1. Rosca: Status dos Agendamentos do Dia (Confirmados / Pendentes / Cancelados)
  const appointmentStatusData: DonutCategory[] = [
    { name: 'Confirmados', value: confirmedCount, color: '#D4AF37' },
    { name: 'Pendentes', value: pendingCount, color: '#0f172a' },
    { name: 'Cancelados', value: canceledCount, color: '#ef4444' },
  ]

  // 2. Rosca: Gênero dos Clientes
  const clients = safeStorageGet<any[]>('belezaflow_clients', [])
  const femaleCount = clients.filter(c => c.gender === 'feminino' || c.gender === 'F').length
  const maleCount = clients.filter(c => c.gender === 'masculino' || c.gender === 'M').length
  const otherCount = clients.length - femaleCount - maleCount

  const clientGenderData: DonutCategory[] = [
    { name: 'Feminino', value: femaleCount, color: '#D4AF37' },
    { name: 'Masculino', value: maleCount, color: '#0f172a' },
    { name: 'Outro/Infantil', value: Math.max(0, otherCount), color: '#94a3b8' },
  ]

  // 3. Rosca: Ocupação das Cadeiras (Em atendimento / Disponíveis)
  const busyCount = todayAppointments.filter(a => a.status === 'confirmado' || a.status === 'confirmed').length
  const chairOccupancyData: DonutCategory[] = [
    { name: 'Em atendimento', value: busyCount, color: '#0f172a' },
    { name: 'Disponíveis', value: 0, color: '#D4AF37' },
  ]

  // Próximos atendimentos para a lista inferior
  const upcomingAppointments = appointments
    .filter(
      (a) =>
        (a.date ? a.date >= todayStr : true) &&
        a.status !== 'cancelado' &&
        a.status !== 'canceled'
    )
    .sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.time || '').localeCompare(b.time || '')
    })
    .slice(0, 6)

  const handleSendWhatsApp = (apt: Appointment) => {
    const cleanPhone = (apt.client_phone || '').replace(/\D/g, '')
    if (!cleanPhone) return
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const dateFormatted = apt.date ? apt.date.split('-').reverse().join('/') : 'Hoje'
    const text = encodeURIComponent(
      `Olá, ${apt.client_name}! Confirmamos seu atendimento no BelezaFlow:\n\n` +
      `✦ Serviço: ${apt.service_name || 'Procedimento'}\n` +
      `✦ Profissional: ${apt.professional_name || 'Equipe'}\n` +
      `✦ Data: ${dateFormatted}\n` +
      `✦ Horário: ${apt.time || ''}\n` +
      `✦ Valor: ${formatCurrency(apt.price || 0)}\n\n` +
      `Estamos prontos para lhe receber!`
    )
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${text}`, '_blank')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Confirmado
          </span>
        )
      case 'concluido':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Concluído
          </span>
        )
      case 'pendente':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Pendente
          </span>
        )
    }
  }

  return (
    <div className={cn('space-y-6 sm:space-y-8 pb-16', className)}>
      {/* Banner de Boas-vindas Executivo */}
      <Card className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Visão Geral do Estabelecimento
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 capitalize">
              {currentDateFormatted}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/agenda')}
              className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-800"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Ver Agenda</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 
        TAREFA 1.a) 4 KPIs EM CARTÕES GRANDES ANTES DE QUALQUER GRÁFICO
        Grid: 1 coluna no mobile, 2 no tablet, 4 no desktop
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Faturamento do Dia */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faturamento do Dia
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {formatCurrency(todayRevenue)}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +12.5%
              </span>
              <span className="text-[11px] text-slate-400">vs ontem</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: Faturamento do Mês */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faturamento do Mês
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {formatCurrency(monthRevenue)}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +8.2%
              </span>
              <span className="text-[11px] text-slate-400">vs mês anterior</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Serviços Realizados (hoje) */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Serviços Realizados (hoje)
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Scissors className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {servicesDoneToday}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +16.7%
              </span>
              <span className="text-[11px] text-slate-400">vs ontem</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Ticket Médio */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {formatCurrency(averageTicket)}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +4.3%
              </span>
              <span className="text-[11px] text-slate-400">vs ontem</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 
        TAREFA 1.b, c, d) 3 ROSCAS (DONUTS) 
        Regra de Ouro:
        - Donut apenas para dados que somam 100% com no máximo 3 categorias.
        - Número total sempre no centro.
        - Grid: 1 coluna no mobile, 3 colunas no desktop
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rosca 1: Status dos Agendamentos do Dia (Confirmados / Pendentes / Cancelados) */}
        <DonutChart
          title="Status dos Agendamentos do Dia"
          subtitle="Distribuição em tempo real do dia atual"
          data={appointmentStatusData}
          centerLabel="Agendamentos"
        />

        {/* Rosca 2: Gênero dos Clientes (Feminino / Masculino / Infantil) */}
        <DonutChart
          title="Gênero dos Clientes"
          subtitle="Composição do público do salão"
          data={clientGenderData}
          centerLabel="Clientes"
        />

        {/* Rosca 3: Ocupação das Cadeiras (Em atendimento / Disponíveis) */}
        <DonutChart
          title="Ocupação das Cadeiras"
          subtitle="Capacidade instalada em atendimento"
          data={chairOccupancyData}
          centerLabel="Cadeiras"
        />
      </div>

      {/* Seção Próximos Atendimentos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-luxury text-slate-900">
                Próximos Atendimentos
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe a fila de atendimentos agendados
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/agenda')}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAppointments.map((apt) => (
              <Card
                key={apt.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Topo: Horário & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{apt.time || 'Horário a definir'}</span>
                      {apt.duration_minutes && (
                        <span className="text-xs font-normal text-slate-400">
                          ({apt.duration_minutes} min)
                        </span>
                      )}
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>

                  {/* Detalhes do Atendimento */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                        {apt.service_name || 'Procedimento'}
                      </h4>
                      <span className="font-bold font-luxury text-amber-600 text-sm whitespace-nowrap">
                        {formatCurrency(apt.price || 0)}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800">{apt.client_name}</span>
                      </div>
                      {apt.client_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{apt.client_phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <span>Profissional:</span>
                      <span className="font-medium text-slate-700">
                        {apt.professional_name || 'Equipe'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação Rápida */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendWhatsApp(apt)}
                    className="flex-1 rounded-xl text-xs border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </Button>

                  {apt.status !== 'concluido' && apt.status !== 'completed' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'concluido')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs border border-slate-800 shadow-xs transition-colors cursor-pointer"
                      title="Marcar como concluído"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Concluir</span>
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold font-luxury text-slate-900">
              Sem dados ainda
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
              Sua agenda está livre no momento. Adicione um novo agendamento com um clique.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs sm:text-sm border border-slate-800 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Novo Agendamento</span>
            </button>
          </Card>
        )}
      </div>

      {/* Modal de Novo Agendamento */}
      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
