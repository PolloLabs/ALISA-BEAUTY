import React, { useState } from 'react';
import { Clock, User, Phone, CheckCircle2, XCircle, MoreVertical, MessageCircle, Trash2, AlertCircle } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { useSalon } from '../context/SalonContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

export interface AppointmentCardProps {
  appointment: Appointment;
  className?: string;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, className }) => {
  const { updateAppointmentStatus, deleteAppointment } = useSalon();
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Confirmado
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-200">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
      case 'pendente':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Pendente
          </span>
        );
    }
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = appointment.client_phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(
      `Olá, ${appointment.client_name}! Confirmamos seu agendamento no BelezaFlow:\n\n` +
      ` Serviço: ${appointment.service_name}\n` +
      ` Profissional: ${appointment.professional_name}\n` +
      ` Data: ${appointment.date.split('-').reverse().join('/')}\n` +
      ` Horário: ${appointment.time}\n` +
      ` Valor: R$ ${appointment.price.toFixed(2)}\n\n` +
      `Caso precise remarcar, entre em contato conosco!`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${text}`, '_blank');
  };

  return (
    <Card className={cn('p-4 transition-all hover:border-slate-300 relative', className)}>
      {/* Top row: Time and Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-base">
          <Clock className="w-4 h-4 text-rose-500" />
          <span>{appointment.time}</span>
          <span className="text-xs font-normal text-slate-400">({appointment.duration_minutes} min)</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(appointment.status)}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                <button
                  onClick={() => {
                    updateAppointmentStatus(appointment.id, 'confirmado');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    updateAppointmentStatus(appointment.id, 'concluido');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  Marcar como Concluído
                </button>
                <button
                  onClick={() => {
                    updateAppointmentStatus(appointment.id, 'cancelado');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Cancelar
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    deleteAppointment(appointment.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="pt-3 space-y-2">
        {/* Service & Price */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-800 text-sm leading-snug">
            {appointment.service_name}
          </h4>
          <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
            R$ {appointment.price.toFixed(2)}
          </span>
        </div>

        {/* Client details */}
        <div className="flex flex-col gap-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{appointment.client_name}</span>
          </div>
          {appointment.client_phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{appointment.client_phone}</span>
            </div>
          )}
        </div>

        {/* Professional badge */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 mt-2">
          <div className="text-slate-500">
            Profissional: <span className="font-medium text-slate-700">{appointment.professional_name}</span>
          </div>
        </div>

        {/* Notes if present */}
        {appointment.notes && (
          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
            &ldquo;{appointment.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Actions bottom bar */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendWhatsApp}
          className="flex-1"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
          WhatsApp
        </Button>

        {appointment.status !== 'concluido' && (
          <Button
            variant="success"
            size="sm"
            onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
            className="flex-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluir
          </Button>
        )}
      </div>
    </Card>
  );
};
