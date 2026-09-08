import React from 'react';
import { Star, Phone, Calendar, Scissors, Award } from 'lucide-react';
import { useSalon } from '../context/SalonContext';

export const TeamView: React.FC = () => {
  const { professionals, appointments, selectedDate } = useSalon();

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Equipe & Especialistas</h2>
          <p className="text-xs text-slate-500">
            Profissionais certificados do salão ALISA e disponibilidades da agenda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            {professionals.length} Especialistas Ativas
          </span>
        </div>
      </div>

      {/* Grid of Professionals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((pro) => {
          const proAppointments = appointments.filter(
            (a) => a.professional_id === pro.id && a.date === selectedDate && a.status !== 'cancelado'
          );

          return (
            <div
              key={pro.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                {/* Header with Avatar & Name */}
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={pro.avatar}
                    alt={pro.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-800 text-base">{pro.name}</h3>
                      <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{pro.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-rose-500 font-medium">{pro.role}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {pro.phone}
                    </p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Especialidades
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pro.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day stats & action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-800 font-semibold">{proAppointments.length}</strong> atendimentos hoje
                  </span>
                </div>
                <a
                  href={`https://api.whatsapp.com/send?phone=55${pro.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Contato
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
