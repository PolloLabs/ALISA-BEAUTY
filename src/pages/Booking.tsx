import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Scissors,
  Star,
  MessageCircle,
} from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Professional, Service } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

export interface BookingProps {
  className?: string;
}

export const Booking: React.FC<BookingProps> = ({ className }) => {
  const { salon, services, professionals, addAppointment } = useSalon();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00'
  ];

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    setStep(3);
  };

  const handleDateTimeConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedProfessional || !clientName.trim() || !clientPhone.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setErrorMsg('');

    setIsSubmitting(true);
    try {
      await addAppointment({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        service_id: selectedService.id,
        service_name: selectedService.name,
        professional_id: selectedProfessional.id,
        professional_name: selectedProfessional.name,
        date: selectedDate,
        time: selectedTime,
        duration_minutes: selectedService.duration_minutes,
        price: selectedService.price,
        status: 'pendente',
        notes: clientNotes.trim() || undefined,
      });
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedService(null);
    setSelectedProfessional(null);
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setStep(1);
  };

  const handleSendWhatsAppNotification = () => {
    if (!selectedService || !selectedProfessional) return;
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(
      `Olá! Meu agendamento no BelezaFlow foi solicitado com sucesso:\n\n` +
      ` Procedimento: ${selectedService.name}\n` +
      ` Especialista: ${selectedProfessional.name}\n` +
      ` Data: ${selectedDate.split('-').reverse().join('/')}\n` +
      ` Horário: ${selectedTime}\n` +
      ` Valor: R$ ${selectedService.price.toFixed(2)}\n\n` +
      `Nome: ${clientName}`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${text}`, '_blank');
  };

  return (
    <div className={cn('max-w-2xl mx-auto space-y-6 pb-20 md:pb-8', className)}>
      {/* Salon Brand Header */}
      <Card className="p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center mx-auto shadow-sm mb-3">
          <Scissors className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          BelezaFlow &bull; Agendamento Online
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Agendamento Instantâneo &bull; Escolha o procedimento e garanta seu horário
        </p>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                step === i
                  ? 'w-8 bg-rose-500'
                  : step > i
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-200'
              )}
            />
          ))}
        </div>
      </Card>

      {/* STEP 1: Selecionar Serviço */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              1. Selecione o Procedimento
            </h2>
            <span className="text-xs text-slate-400">{services.length} disponíveis</span>
          </div>

          <div className="space-y-3">
            {services.map((service) => (
              <Card
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="p-4 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-500 border border-rose-100">
                      {service.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  {service.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                      {service.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {service.duration_minutes} minutos
                  </p>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="text-xs text-slate-400 block">A partir de</span>
                    <span className="text-base font-bold text-slate-800">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-rose-50 text-slate-400 group-hover:text-rose-500 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Selecionar Especialista */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-600 hover:text-rose-500 flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar aos procedimentos
            </button>
            <span className="text-xs font-semibold text-rose-500">
              {selectedService?.name}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            2. Selecione o Profissional
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {professionals.map((prof) => (
              <Card
                key={prof.id}
                onClick={() => handleProfessionalSelect(prof)}
                className="p-4 cursor-pointer hover:border-rose-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prof.avatar}
                    alt={prof.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">
                        {prof.name}
                      </h3>
                      <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{prof.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{prof.role}</p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1">
                  {prof.specialties.slice(0, 2).map((s, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Data e Horário */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-600 hover:text-rose-500 flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao especialista
            </button>
            <span className="text-xs font-semibold text-rose-500">
              {selectedProfessional?.name}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            3. Escolha a Data e o Horário
          </h2>

          <Card className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Data do Atendimento
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Horários Livres Disponíveis
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={cn(
                      'py-2.5 rounded-lg text-xs font-semibold transition-all border min-h-[40px] cursor-pointer',
                      selectedTime === slot
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-500'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-4"
              onClick={handleDateTimeConfirm}
            >
              Continuar para Identificação
            </Button>
          </Card>
        </div>
      )}

      {/* STEP 4: Informações do Cliente */}
      {step === 4 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs text-slate-600 hover:text-rose-500 flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao horário
            </button>
            <span className="text-xs text-slate-400">Etapa final</span>
          </div>

          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-rose-500" />
            4. Seus Dados para Contato
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-500 text-xs border border-red-200">
              {errorMsg}
            </div>
          )}

          <Card className="p-5 space-y-4">
            <Input
              label="Nome Completo *"
              placeholder="Como prefere ser chamada?"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              icon={<User className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="WhatsApp / Celular com DDD *"
              type="tel"
              placeholder="(11) 98888-7777"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
              icon={<Phone className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Observações / Preferências (Opcional)"
              placeholder="Alguma alergia, tamanho de unha, preferência específica..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
            />

            {/* Order Review */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Serviço:</span>
                <span className="font-semibold text-slate-800">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Especialista:</span>
                <span className="font-semibold text-slate-800">{selectedProfessional?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Data e Hora:</span>
                <span className="font-semibold text-slate-800">
                  {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-800">
                <span>Valor Total:</span>
                <span>R$ {selectedService?.price.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Confirmando Agendamento...' : 'Solicitar Agendamento'}
            </Button>
          </Card>
        </form>
      )}

      {/* STEP 5: Sucesso & Confirmação */}
      {step === 5 && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-slate-800">Agendamento Realizado!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Obrigada, <strong>{clientName}</strong>! Seu horário foi registrado com sucesso na agenda do salão. Em breve enviaremos a confirmação.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600">Procedimento:</span>
              <span className="font-bold text-slate-800">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Profissional:</span>
              <span className="font-bold text-slate-800">{selectedProfessional?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Quando:</span>
              <span className="font-bold text-slate-800">
                {selectedDate.split('-').reverse().join('/')} às {selectedTime}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" onClick={handleSendWhatsAppNotification}>
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              Notificar via WhatsApp
            </Button>
            <Button variant="primary" onClick={handleReset}>
              Agendar Outro Horário
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
