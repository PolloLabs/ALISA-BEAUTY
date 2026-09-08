import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, ArrowLeft, Scissors, Star } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { Professional, Service } from '../types';

export const ClientBookingView: React.FC = () => {
  const { services, professionals, addAppointment } = useSalon();

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
      return;
    }

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Salon Brand Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center mx-auto shadow-sm mb-3">
          <Scissors className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">ALISA Studio & Spa</h1>
        <p className="text-xs text-slate-500 mt-1">
          Agendamento Online Instantâneo • Escolha o serviço e garanta seu horário
        </p>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === i
                  ? 'w-8 bg-rose-500'
                  : step > i
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Selecionar Serviço */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-1">
            Passo 1: Selecione o Serviço Desejado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleServiceSelect(srv)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-rose-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100">
                      {srv.category}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      R$ {srv.price.toFixed(2)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">
                    {srv.name}
                  </h3>
                  {srv.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {srv.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {srv.duration_minutes} min
                  </span>
                  <span className="text-rose-500 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Escolher <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Selecionar Especialista */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos serviços
            </button>
            <span className="text-xs text-slate-500">
              Serviço: <strong className="text-slate-800">{selectedService?.name}</strong>
            </span>
          </div>

          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-1">
            Passo 2: Escolha a Especialista
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {professionals.map((pro) => (
              <button
                key={pro.id}
                onClick={() => handleProfessionalSelect(pro)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-left hover:border-rose-300 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <img
                  src={pro.avatar}
                  alt={pro.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-rose-600 transition-colors">
                      {pro.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {pro.rating}
                    </div>
                  </div>
                  <p className="text-xs text-rose-500 font-medium">{pro.role}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {pro.specialties.join(', ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Data e Horário */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar às especialistas
            </button>
            <span className="text-xs text-slate-500">
              Com: <strong className="text-slate-800">{selectedProfessional?.name}</strong>
            </span>
          </div>

          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Passo 3: Escolha a Data e Horário
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-500" /> Data do Atendimento
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-500" /> Horários Livres
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDateTimeConfirm}
            className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer mt-4"
          >
            Avançar para Identificação
          </button>
        </div>
      )}

      {/* STEP 4: Dados da Cliente */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao horário
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Passo 4: Seus Dados para Contato
          </h2>

          {/* Resumo do pedido */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>{selectedService?.name}</span>
              <span>R$ {selectedService?.price.toFixed(2)}</span>
            </div>
            <div className="text-slate-500">
              Especialista: <strong className="text-slate-700">{selectedProfessional?.name}</strong>
            </div>
            <div className="text-slate-500">
              Data: <strong className="text-slate-700">{selectedDate.split('-').reverse().join('/')}</strong> às{' '}
              <strong className="text-slate-700">{selectedTime}</strong> ({selectedService?.duration_minutes} min)
            </div>
          </div>

          <form onSubmit={handleFinalSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Beatriz Lima"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp para Confirmação *
              </label>
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alguma preferência ou observação?
              </label>
              <input
                type="text"
                placeholder="Ex: Primeira vez no espaço, prefiro esmalte hipoalergênico..."
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer mt-3 disabled:opacity-50"
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar e Agendar Horário'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 5: Sucesso & Comprovante */}
      {step === 5 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">Agendamento Realizado!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Seu horário foi reservado com sucesso no salão ALISA.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-semibold text-slate-800">{clientName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Serviço:</span>
              <span className="font-semibold text-slate-800">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Especialista:</span>
              <span className="font-semibold text-slate-800">{selectedProfessional?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Data e Hora:</span>
              <span className="font-semibold text-slate-800">
                {selectedDate.split('-').reverse().join('/')} às {selectedTime}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Valor Estimado:</span>
              <span className="font-bold text-emerald-600 text-sm">
                R$ {selectedService?.price.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <a
              href={`https://api.whatsapp.com/send?phone=5511987654321&text=${encodeURIComponent(
                `Olá, acabei de agendar ${selectedService?.name} para o dia ${selectedDate.split('-').reverse().join('/')} às ${selectedTime} com ${selectedProfessional?.name}!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors text-center inline-flex items-center justify-center gap-1.5"
            >
              Falar com o Salão no WhatsApp
            </a>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Fazer Outro Agendamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
