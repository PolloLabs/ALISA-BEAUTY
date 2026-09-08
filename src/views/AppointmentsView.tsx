import React, { useState } from 'react';
import { Calendar as CalendarIcon, Filter, Plus, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentStatus } from '../types';

interface AppointmentsViewProps {
  onOpenNewAppointment: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onOpenNewAppointment }) => {
  const { appointments, selectedDate, setSelectedDate, professionals } = useSalon();
  const [statusFilter, setStatusFilter] = useState<'todos' | AppointmentStatus>('todos');
  const [professionalFilter, setProfessionalFilter] = useState<string>('todos');

  // Filter appointments for the selected date
  const dateAppointments = appointments.filter((apt) => apt.date === selectedDate);

  // Apply status & professional filters
  const filteredAppointments = dateAppointments.filter((apt) => {
    const matchesStatus = statusFilter === 'todos' || apt.status === statusFilter;
    const matchesProf = professionalFilter === 'todos' || apt.professional_id === professionalFilter;
    return matchesStatus && matchesProf;
  });

  // Calculate day stats
  const totalDayAppointments = dateAppointments.length;
  const confirmedCount = dateAppointments.filter((a) => a.status === 'confirmado').length;
  const pendingCount = dateAppointments.filter((a) => a.status === 'pendente').length;
  const completedCount = dateAppointments.filter((a) => a.status === 'concluido').length;
  const dayEstimatedRevenue = dateAppointments
    .filter((a) => a.status !== 'cancelado')
    .reduce((sum, a) => sum + a.price, 0);

  // Quick date change helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formatted = `${day}/${month}/${year}`;
    return { formatted, weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1) };
  };

  const dateDisplay = formatDateDisplay(selectedDate);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Date Header & Quick Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">{dateDisplay.weekday}</h2>
                {isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Hoje
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{dateDisplay.formatted}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleSetToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => handleShiftDate(1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Quick summary stats of the day */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[11px] font-medium text-slate-500">Agendamentos</p>
            <p className="text-lg font-bold text-slate-800">{totalDayAppointments}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[11px] font-medium text-slate-500">Confirmados</p>
            <p className="text-lg font-bold text-emerald-500">{confirmedCount}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[11px] font-medium text-slate-500">Pendentes</p>
            <p className="text-lg font-bold text-amber-500">{pendingCount}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-[11px] font-medium text-slate-500">Faturamento Previsto</p>
            <p className="text-lg font-bold text-slate-800">R$ {dayEstimatedRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filter and sorting bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'todos'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({dateAppointments.length})
          </button>
          <button
            onClick={() => setStatusFilter('confirmado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'confirmado'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Confirmados ({confirmedCount})
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'pendente'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('concluido')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'concluido'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Concluídos ({completedCount})
          </button>
        </div>

        {/* Filter by Professional */}
        <div className="flex items-center gap-2">
          <select
            value={professionalFilter}
            onChange={(e) => setProfessionalFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            <option value="todos">Todos os Profissionais</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments List - Responsive Grid */}
      {filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Não há atendimentos agendados para este dia com os filtros selecionados.
          </p>
          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento para {dateDisplay.formatted}
          </button>
        </div>
      )}
    </div>
  );
};
