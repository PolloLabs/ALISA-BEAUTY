import React, { useState, useMemo } from 'react'
import {
  Building2,
  DollarSign,
  Calendar,
  Sparkles,
  TrendingUp,
  Search,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { DonutChart, DonutCategory } from '@/components/charts/DonutChart'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import { safeStorageGet } from '@/lib/utils'
import { Appointment } from '@/types'

interface SalonRow {
  id: string
  name: string
  owner_name: string
  owner_email: string
  plan: 'Básico' | 'Pro' | 'Premium'
  status: 'Ativo' | 'Inadimplente'
  mrr: number
  created_at: string
}

export const SuperAdminPage: React.FC = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativo' | 'Inadimplente'>('all')

  // Salões reais persistidos em localStorage (inicia ZERADO)
  const salons = useMemo(() => {
    return safeStorageGet<SalonRow[]>('belezaflow_admin_salons', [])
  }, [])

  // Agendamentos reais de hoje persistidos em localStorage (inicia ZERADO)
  const appointmentsToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const allAppointments = safeStorageGet<Appointment[]>('belezaflow_appointments', [])
    const mockIds = ['apt-1', 'apt-2', 'apt-3', 'apt-4', 'apt-5', 'apt-6', '1', '2', '3', '4']
    return allAppointments.filter((a) => {
      if (!a || mockIds.includes(a.id)) return false
      const d = a.date ? a.date.split('T')[0] : (a.start_time ? a.start_time.split('T')[0] : '')
      return d === todayStr
    }).length
  }, [])

  // Total MRR consolidado de todos os salões assinantes na plataforma
  const activeSalons = salons.filter((s) => s.status === 'Ativo')
  const activeSalonsCount = activeSalons.length
  const totalMRR = activeSalons.reduce((acc, curr) => acc + (curr.mrr || 0), 0)
  const newSalons30d = salons.length

  // Rosca 1: Planos (Básico / Pro / Premium)
  const plansData: DonutCategory[] = [
    { name: 'Básico', value: salons.filter((s) => s.plan === 'Básico').length, color: '#94a3b8' },
    { name: 'Pro', value: salons.filter((s) => s.plan === 'Pro').length, color: '#D4AF37' },
    { name: 'Premium', value: salons.filter((s) => s.plan === 'Premium').length, color: '#0f172a' },
  ]

  // Rosca 2: Status dos Salões (Ativos / Inadimplentes)
  const salonStatusData: DonutCategory[] = [
    { name: 'Ativos', value: activeSalonsCount, color: '#D4AF37' },
    { name: 'Inadimplentes', value: salons.filter((s) => s.status === 'Inadimplente').length, color: '#ef4444' },
  ]

  const filteredSalons = salons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.owner_email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || salon.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner Super Admin */}
      <Card className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Painel de Governança Global</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Dashboard do Super Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Visão consolidada de todas as instâncias, planos, MRR e status operacional dos salões parceiros.
            </p>
          </div>
        </div>
      </Card>

      {/* 
        TAREFA 2.a) 4 KPIs EM CARTÕES GRANDES ANTES DE QUALQUER GRÁFICO
        Grid: 1 coluna no mobile, 2 no tablet, 4 no desktop
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Salões Ativos */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Salões Ativos
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {activeSalonsCount}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +20%
              </span>
              <span className="text-[11px] text-slate-400">vs mês anterior</span>
            </div>
          </div>
        </Card>

        {/* KPI 2: MRR */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              MRR
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {formatCurrency(totalMRR)}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +15.8%
              </span>
              <span className="text-[11px] text-slate-400">vs mês anterior</span>
            </div>
          </div>
        </Card>

        {/* KPI 3: Novos Salões (30d) */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Novos Salões (30d)
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {newSalons30d}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +33.3%
              </span>
              <span className="text-[11px] text-slate-400">vs mês anterior</span>
            </div>
          </div>
        </Card>

        {/* KPI 4: Agendamentos (hoje) */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Agendamentos (hoje)
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {appointmentsToday}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <TrendingUp className="w-3 h-3" />
                +12.4%
              </span>
              <span className="text-[11px] text-slate-400">vs ontem</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 
        TAREFA 2.b, c) 2 ROSCAS (DONUTS) DO SUPER ADMIN
        Regra de Ouro:
        - Donut apenas para dados que somam 100% com no máximo 3 categorias.
        - Número total sempre no centro.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rosca 1: Planos (Básico / Pro / Premium) */}
        <DonutChart
          title="Distribuição de Planos"
          subtitle="Proporção de assinaturas ativas na plataforma"
          data={plansData}
          centerLabel="Salões"
          height={200}
        />

        {/* Rosca 2: Status dos Salões (Ativos / Inadimplentes) */}
        <DonutChart
          title="Status dos Salões"
          subtitle="Monitoramento de adimplência e regularidade"
          data={salonStatusData}
          centerLabel="Salões"
          height={200}
        />
      </div>

      {/* 
        TAREFA 2.d) TABELA: Salão | Dono | Plano | Status | MRR
      */}
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-luxury text-slate-900">
              Salões Cadastrados na Plataforma
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Listagem consolidada de salões, planos e faturamento recorrente
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Input de Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar salão ou dono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({salons.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Ativo')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'Ativo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ativos ({activeSalonsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Inadimplente')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'Inadimplente'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inadimplentes ({salons.filter((s) => s.status === 'Inadimplente').length})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Salão</th>
                <th className="px-5 py-3.5">Dono</th>
                <th className="px-5 py-3.5">Plano</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalons.map((salon) => (
                <tr key={salon.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Salão */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900 text-sm">{salon.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Desde {salon.created_at}</div>
                  </td>

                  {/* Dono */}
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800 text-sm">{salon.owner_name}</div>
                    <div className="text-xs text-slate-500">{salon.owner_email}</div>
                  </td>

                  {/* Plano */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        salon.plan === 'Premium'
                          ? 'bg-slate-900 text-amber-400 border border-slate-800'
                          : salon.plan === 'Pro'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {salon.plan}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    {salon.status === 'Ativo' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        Inadimplente
                      </span>
                    )}
                  </td>

                  {/* MRR */}
                  <td className="px-5 py-3.5 text-right font-bold font-luxury text-slate-900 text-sm">
                    {formatCurrency(salon.mrr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSalons.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 font-luxury">Sem dados ainda</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {salons.length === 0
                ? 'Nenhum salão cadastrado na plataforma até o momento.'
                : 'Nenhum salão corresponde aos filtros aplicados.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SuperAdminPage
