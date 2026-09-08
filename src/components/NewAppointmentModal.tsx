import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Phone, Sparkles, Scissors, FileText } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  className,
}) => {
  const { services, professionals, selectedDate, addAppointment } = useSalon();

  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '');
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedService = services.find((s) => s.id === serviceId) || services[0];
  const selectedProf = professionals.find((p) => p.id === professionalId) || professionals[0];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg('Por favor, informe o nome e telefone do cliente.');
      return;
    }
    setErrorMsg('');

    setIsSubmitting(true);
    try {
      await addAppointment({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim() || undefined,
        service_id: selectedService?.id || '',
        service_name: selectedService?.name || 'Serviço',
        professional_id: selectedProf?.id || '',
        professional_name: selectedProf?.name || 'Profissional',
        date: date,
        time: time,
        duration_minutes: selectedService?.duration_minutes || 45,
        price: selectedService?.price || 0,
        status: 'confirmado',
        notes: notes.trim() || undefined,
      });

      // Reset form & close
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Agendamento"
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 text-red-500 text-xs border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Serviço */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            Serviço Desejado
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[44px]"
          >
            {services.map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.name} — R$ {srv.price.toFixed(2)} ({srv.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>

        {/* Profissional */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-rose-500" />
            Profissional / Especialista
          </label>
          <select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[44px]"
          >
            {professionals.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name} ({prof.role})
              </option>
            ))}
          </select>
        </div>

        {/* Data e Horário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-rose-500" />
              Data
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              Horário
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[44px]"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dados da Cliente */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <h4 className="text-xs font-semibold text-slate-800">Dados da Cliente</h4>
          <Input
            label="Nome Completo *"
            placeholder="Ex: Amanda Souza"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            icon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="WhatsApp / Telefone *"
            type="tel"
            placeholder="(11) 98888-7777"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            icon={<Phone className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Observações (Opcional)"
            placeholder="Ex: Alérgica a esmalte com tolueno, corte em camadas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            icon={<FileText className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Resumo de Preço & Duração */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-600">Duração estimada: </span>
            <span className="font-semibold text-slate-800">{selectedService?.duration_minutes} min</span>
          </div>
          <div>
            <span className="text-slate-600">Valor: </span>
            <span className="font-bold text-slate-800 text-sm">
              R$ {selectedService?.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar Agendamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
