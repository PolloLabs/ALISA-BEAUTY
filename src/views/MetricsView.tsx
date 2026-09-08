import React from 'react';
import { DollarSign, CheckCircle2, TrendingUp, Users, Calendar, Sparkles, PieChart } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

export const MetricsView: React.FC = () => {
  const { appointments, services } = useSalon();

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const todayAppointments = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelado');
  const todayRevenue = todayAppointments.reduce((acc, a) => acc + a.price, 0);

  const totalValidAppointments = appointments.filter((a) => a.status !== 'cancelado');
  const totalRevenue = totalValidAppointments.reduce((acc, a) => acc + a.price, 0);

  const completedCount = appointments.filter((a) => a.status === 'concluido').length;
  const averageTicket = totalValidAppointments.length > 0 ? totalRevenue / totalValidAppointments.length : 0;

  // Service popular count
  const serviceCountMap: Record<string, { count: number; revenue: number }> = {};
  appointments.forEach((apt) => {
    if (apt.status !== 'cancelado') {
      if (!serviceCountMap[apt.service_name]) {
        serviceCountMap[apt.service_name] = { count: 0, revenue: 0 };
      }
      serviceCountMap[apt.service_name].count += 1;
      serviceCountMap[apt.service_name].revenue += apt.price;
    }
  });

  const topServices = Object.entries(serviceCountMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-lg font-bold text-slate-800">Desempenho & Métricas</h2>
        <p className="text-xs text-slate-500">
          Visão geral financeira e operacional do salão ALISA no BelezaFlow.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Faturamento Hoje</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            R$ {todayRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {todayAppointments.length} atendimentos previstos
          </p>
        </div>

        {/* Card 2: Faturamento Total */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Faturamento Acumulado</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            R$ {totalRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Total em agendamentos válidos
          </p>
        </div>

        {/* Card 3: Atendimentos Concluídos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Concluídos</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{completedCount}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            De {appointments.length} agendamentos totais
          </p>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            R$ {averageTicket.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Média por atendimento
          </p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Services */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            Procedimentos Mais Populares
          </h3>
          <div className="space-y-3">
            {topServices.length > 0 ? (
              topServices.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.count} agendamento(s)</p>
                  </div>
                  <span className="font-bold text-slate-800 text-xs">
                    R$ {item.revenue.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Nenhum dado registrado ainda.</p>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-500" />
            Distribuição por Status
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Confirmados', key: 'confirmado', color: 'bg-emerald-500' },
              { label: 'Concluídos', key: 'concluido', color: 'bg-slate-700' },
              { label: 'Pendentes', key: 'pendente', color: 'bg-amber-500' },
              { label: 'Cancelados', key: 'cancelado', color: 'bg-rose-500' },
            ].map(({ label, key, color }) => {
              const count = appointments.filter((a) => a.status === key).length;
              const percentage = appointments.length > 0 ? (count / appointments.length) * 100 : 0;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{label}</span>
                    <span className="text-slate-500 font-semibold">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
