import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  Receipt,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CreditCard,
  Building2,
  Crown
} from 'lucide-react';
import { useFinanceiro, FinancialPeriod } from '@/hooks/useFinanceiro';
import { useSalon } from '@/hooks/useSalon';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function FinanceiroPage() {
  const { salon } = useSalon();
  const {
    period,
    setPeriod,
    startDate,
    endDate,
    customStartDateStr,
    customEndDateStr,
    setCustomRange,
    loading,
    refetch,
    grossRevenue,
    totalCommissions,
    netRevenue,
    averageTicket,
    completedAppointmentsCount,
    staffCommissions,
    completedAppointments,
    exportToCSV,
  } = useFinanceiro();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(customStartDateStr);
  const [tempEndDate, setTempEndDate] = useState(customEndDateStr);

  // Filtragem dos agendamentos concluídos por busca e profissional
  const filteredAppointments = useMemo(() => {
    return completedAppointments.filter((apt) => {
      const matchSearch =
        !searchTerm.trim() ||
        apt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.professional_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.client_phone.includes(searchTerm);

      const matchStaff =
        selectedStaffFilter === 'all' ||
        apt.professional_id === selectedStaffFilter ||
        apt.professional_name.toLowerCase() === selectedStaffFilter.toLowerCase();

      return matchSearch && matchStaff;
    });
  }, [completedAppointments, searchTerm, selectedStaffFilter]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempStartDate && tempEndDate) {
      setCustomRange(tempStartDate, tempEndDate);
      setIsCustomOpen(false);
    }
  };

  const periodLabels: Record<FinancialPeriod, string> = {
    current_month: 'Mês Atual',
    previous_month: 'Mês Anterior',
    last_30_days: 'Últimos 30 dias',
    custom: 'Personalizado',
  };

  // Percentual retido pelo salão
  const salonMarginPercent =
    grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 space-y-6">
      {/* Top Header com Identidade Luxo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Gestão Financeira & Comissões</span>
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">• {salon?.name || 'BelezaFlow'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-luxury tracking-tight text-slate-900">
            Painel Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Controle de faturamento bruto, repasses de comissão por profissional e margem líquida retida.
          </p>
        </div>

        {/* Ações Rápidas: Exportar CSV e Atualizar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Atualizar dados financeiros"
          >
            <RefreshCw className={cn('w-4 h-4 text-slate-600', loading && 'animate-spin')} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-amber-500/10 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Exportar Relatório (CSV)</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Período */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Abas de Período */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {(['current_month', 'previous_month', 'last_30_days', 'custom'] as FinancialPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                if (p === 'custom') {
                  setIsCustomOpen(true);
                } else {
                  setIsCustomOpen(false);
                }
              }}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer',
                period === p
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Resumo do intervalo ativo de datas */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {format(startDate, "dd 'de' MMM", { locale: ptBR })} até{' '}
            {format(endDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
          </span>
          {period === 'custom' && (
            <button
              type="button"
              onClick={() => setIsCustomOpen(!isCustomOpen)}
              className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer ml-1"
            >
              (Alterar)
            </button>
          )}
        </div>
      </div>

      {/* Modal/Accordion de Seleção Customizada de Datas */}
      <AnimatePresence>
        {isCustomOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-sm"
          >
            <form onSubmit={handleApplyCustomRange} className="flex flex-col sm:flex-row items-end gap-3.5">
              <div className="flex-1 w-full space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Data Inicial</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex-1 w-full space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Data Final</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-sm font-semibold cursor-pointer"
                >
                  Aplicar Filtro
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Cards Principais de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Faturamento Bruto */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faturamento Bruto
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {formatCurrency(grossRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span>{completedAppointmentsCount} atendimentos concluídos</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Comissões dos Profissionais */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Comissões da Equipe
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-rose-600 tracking-tight">
              {formatCurrency(totalCommissions)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-600/80 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Repasse aos especialistas</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Faturamento Líquido do Salão */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Líquido do Salão
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-emerald-600 tracking-tight">
              {formatCurrency(netRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Margem líquida de {salonMarginPercent}%</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Ticket Médio */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              {formatCurrency(averageTicket)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Valor médio por cliente</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SEÇÃO 1: Comissões e Produtividade por Profissional */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white via-slate-50/50 to-white">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-luxury">
                Comissões por Profissional
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Cálculo individual de repasses baseado na taxa percentual de comissão de cada membro.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {staffCommissions.length} profissional(is) com atendimentos
          </div>
        </div>

        {staffCommissions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Nenhum repasse registrado no período</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Quando os profissionais concluírem agendamentos marcados como concluídos, as comissões aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Profissional</th>
                    <th className="py-3 px-4 text-center">Taxa Comissão</th>
                    <th className="py-3 px-4 text-center">Atendimentos</th>
                    <th className="py-3 px-5 text-right">Faturamento Bruto</th>
                    <th className="py-3 px-5 text-right">Comissão a Pagar</th>
                    <th className="py-3 px-5 text-right">Salão Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffCommissions.map((staff) => (
                    <tr key={staff.staff_id || staff.staff_name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {staff.avatar_url ? (
                            <img
                              src={staff.avatar_url}
                              alt={staff.staff_name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shadow-xs">
                              {staff.staff_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block leading-snug">
                              {staff.staff_name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {staff.job_title || 'Especialista'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {staff.commission_rate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {staff.completed_count} {staff.completed_count === 1 ? 'serviço' : 'serviços'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-slate-900">
                        {formatCurrency(staff.gross_total)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-rose-600">
                        {formatCurrency(staff.commission_total)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600">
                        {formatCurrency(staff.salon_net_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Mobile First) */}
            <div className="md:hidden divide-y divide-slate-100">
              {staffCommissions.map((staff) => (
                <div key={staff.staff_id || staff.staff_name} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {staff.avatar_url ? (
                        <img
                          src={staff.avatar_url}
                          alt={staff.staff_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                          {staff.staff_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{staff.staff_name}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {staff.job_title || 'Especialista'}
                          </span>
                          <span className="text-xs text-slate-500">
                            • {staff.completed_count} atendimento(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {staff.commission_rate}% comissão
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-500 font-medium">Bruto</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(staff.gross_total)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-rose-600 font-medium">A Pagar</span>
                      <span className="text-xs font-bold text-rose-600">
                        {formatCurrency(staff.commission_total)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-emerald-600 font-medium">Salão</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(staff.salon_net_total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* SEÇÃO 2: Histórico Detalhado de Atendimentos Concluídos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-luxury">
                Extrato de Atendimentos do Período
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Discriminação de cada serviço finalizado com divisão de valores e comprovante.
            </p>
          </div>

          {/* Filtros de Busca e Profissional */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Campo de Busca */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente, serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Dropdown de Profissional */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todos profissionais</option>
              {staffCommissions.map((s) => (
                <option key={s.staff_id || s.staff_name} value={s.staff_name}>
                  {s.staff_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {completedAppointments.length === 0
                ? 'Nenhum agendamento concluído encontrado neste período'
                : 'Nenhum resultado para os filtros pesquisados'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {completedAppointments.length === 0
                ? 'Quando atendimentos forem marcados como concluídos na Agenda, eles aparecerão aqui com a contabilização completa.'
                : 'Tente alterar o termo de busca ou selecionar outro profissional.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Data / Hora</th>
                    <th className="py-3 px-5">Cliente</th>
                    <th className="py-3 px-5">Serviço</th>
                    <th className="py-3 px-4">Profissional</th>
                    <th className="py-3 px-5 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Comissão</th>
                    <th className="py-3 px-5 text-right">Repasse</th>
                    <th className="py-3 px-5 text-right">Salão Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {apt.date ? formatDate(apt.date, 'dd/MM/yyyy') : 'Hoje'}
                        </span>
                        <span className="text-[11px] text-slate-500">{apt.time || 'Horário agendado'}</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-900 block text-xs sm:text-sm">
                          {apt.client_name}
                        </span>
                        {apt.client_phone && (
                          <span className="text-[11px] text-slate-500">{apt.client_phone}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="font-medium text-slate-900 text-xs sm:text-sm block">
                          {apt.service_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {apt.professional_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                        {formatCurrency(apt.price)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {apt.commission_rate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right font-semibold text-rose-600">
                        {formatCurrency(apt.commission_amount)}
                      </td>

                      <td className="py-3.5 px-5 text-right font-bold text-emerald-600">
                        {formatCurrency(apt.net_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{apt.client_name}</h4>
                      <p className="text-xs text-amber-700 font-medium">{apt.service_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatCurrency(apt.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {apt.date ? formatDate(apt.date, 'dd/MM') : 'Hoje'} • {apt.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {apt.professional_name}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-rose-600 font-medium">
                        Comissão: {formatCurrency(apt.commission_amount)}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        Líquido: {formatCurrency(apt.net_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
