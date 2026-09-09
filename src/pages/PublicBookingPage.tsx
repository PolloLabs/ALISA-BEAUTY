import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Calendar, Clock, User, Scissors, Share2, CheckCircle2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

// DADOS MOCK (FICTÍCIOS) PARA TESTE
const MOCK_SALON = {
  name: 'ALISA BEAUTY',
  logo_url: null,
  primary_color: '#D4AF37',
  theme: 'luxury',
  phone: '(11) 99999-9999',
  address: 'Rua Exemplo, 123 - São Paulo'
}

const MOCK_SERVICES = [
  { id: '1', name: 'Corte Feminino', description: 'Corte + escova', price: 130, duration_minutes: 60 },
  { id: '2', name: 'Manicure Completa', description: 'Unhas + esmaltação', price: 75, duration_minutes: 45 },
  { id: '3', name: 'Barba Completa', description: 'Barba + toalha quente', price: 60, duration_minutes: 30 },
  { id: '4', name: 'Coloração', description: 'Tintura completa', price: 250, duration_minutes: 120 },
]

const MOCK_STAFF = [
  { id: '1', full_name: 'Ana Silva', avatar_url: null },
  { id: '2', full_name: 'Carlos Oliveira', avatar_url: null },
  { id: '3', full_name: 'Mariana Costa', avatar_url: null },
]

const MOCK_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

export function PublicBookingPage() {
  const { salonId } = useParams<{ salonId: string }>()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [bookingComplete, setBookingComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const dates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))

  const handleConfirm = async () => {
    const name = (document.getElementById('clientName') as HTMLInputElement)?.value
    const phone = (document.getElementById('clientPhone') as HTMLInputElement)?.value
    
    if (!name || !phone || !selectedService || !selectedStaff || !selectedTime) {
      toast.error('Preencha todos os campos')
      return
    }

    setSubmitting(true)
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setBookingComplete(true)
    toast.success('Agendamento confirmado! (MODO DEMO)')
    setSubmitting(false)
  }

  const shareWhatsApp = () => {
    if (!selectedService || !selectedStaff) return
    const msg = `Agendamento confirmado!\n${MOCK_SALON.name}\n${selectedService.name}\n${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime}\nProfissional: ${selectedStaff.full_name}\nValor: ${formatCurrency(selectedService.price)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // TELA DE ERRO (se tentar acessar sem ID válido em modo produção)
  if (salonId && salonId !== 'demo') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full mx-auto mb-4 bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Modo Demonstração</h1>
          <p className="text-slate-600 mb-4">
            Para testar o sistema, use: <code className="bg-slate-100 px-2 py-1 rounded">/agendar/demo</code>
          </p>
          <button onClick={() => window.location.href = '/agendar/demo'} className="h-11 px-6 rounded-lg bg-slate-900 text-amber-500 font-medium">
            Ir para Demo
          </button>
        </div>
      </div>
    )
  }

  // TELA DE SUCESSO
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            {MOCK_SALON.logo_url ? (
              <img src={MOCK_SALON.logo_url} alt="" className="h-16 w-16 mx-auto rounded-xl mb-3" />
            ) : (
              <div className="h-16 w-16 mx-auto rounded-xl bg-slate-900 flex items-center justify-center mb-3">
                <Sparkles className="h-8 w-8 text-amber-500" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900">{MOCK_SALON.name}</h1>
            <p className="text-sm text-amber-600 font-medium">MODO DEMONSTRAÇÃO</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center">
            <div className="h-16 w-16 rounded-full mx-auto mb-4 bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Agendamento Confirmado!</h2>
            <p className="text-sm text-slate-600 mb-6">Este é um agendamento de teste</p>

            <div className="bg-slate-900 rounded-xl p-4 text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Scissors className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Serviço</p>
                  <p className="font-semibold text-white">{selectedService.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Profissional</p>
                  <p className="font-semibold text-white">{selectedStaff.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Data</p>
                  <p className="font-semibold text-white">{format(selectedDate, 'dd/MM/yyyy')} às {selectedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Valor</p>
                  <p className="font-semibold text-white">{formatCurrency(selectedService.price)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={shareWhatsApp} className="w-full h-11 rounded-lg border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhar WhatsApp
              </button>
              <button onClick={() => window.location.reload()} className="w-full h-11 rounded-lg bg-slate-900 text-amber-500 font-medium hover:bg-slate-800">
                Novo Agendamento
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">Powered by BelezaFlow</p>
        </div>
      </div>
    )
  }

  // FLUXO DE AGENDAMENTO
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {MOCK_SALON.logo_url ? (
            <img src={MOCK_SALON.logo_url} alt="" className="h-16 w-16 mx-auto rounded-xl mb-3" />
          ) : (
            <div className="h-16 w-16 mx-auto rounded-xl bg-slate-900 flex items-center justify-center mb-3">
              <Sparkles className="h-8 w-8 text-amber-500" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{MOCK_SALON.name}</h1>
          <p className="text-sm text-amber-600 font-medium mb-2">MODO DEMONSTRAÇÃO</p>
          <p className="text-xs text-slate-500">Teste todas as funcionalidades</p>
        </div>

        <div className="mb-8">
          <div className="flex mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={cn('h-2 flex-1 mx-1 rounded-full', s <= step ? 'bg-slate-900' : 'bg-slate-200')} />
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center">Passo {step} de 5</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            
            {/* STEP 1: Serviços */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha o serviço</h2>
                <div className="space-y-3">
                  {MOCK_SERVICES.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        selectedService?.id === service.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-slate-900">{service.name}</h3>
                          {service.description && <p className="text-xs text-slate-600 mt-1">{service.description}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-600">{formatCurrency(service.price)}</p>
                          <p className="text-xs text-slate-500">{service.duration_minutes}min</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Profissional */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha o profissional</h2>
                <div className="space-y-3">
                  {MOCK_STAFF.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all',
                        selectedStaff?.id === member.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-amber-500 font-bold">
                        {member.full_name.charAt(0)}
                      </div>
                      <h3 className="font-semibold text-slate-900">{member.full_name}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Data */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha a data</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map((date) => {
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'flex-shrink-0 w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all',
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                      >
                        <span className="text-xs">{isToday ? 'Hoje' : format(date, 'EEE', { locale: ptBR })}</span>
                        <span className="text-2xl font-bold">{format(date, 'dd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Horário */}
            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha o horário</h2>
                <div className="grid grid-cols-4 gap-2">
                  {MOCK_TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'h-12 rounded-lg font-medium transition-all',
                        selectedTime === time
                          ? 'bg-slate-900 text-amber-500'
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Dados */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Seus dados</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
                  <input
                    id="clientName"
                    type="text"
                    placeholder="Seu nome"
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
                  <input
                    id="clientPhone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-amber-800">
                    <strong>Modo Demonstração:</strong> Este agendamento não será salvo no banco de dados.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 h-11 rounded-lg border border-slate-200 font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !selectedService) ||
                (step === 2 && !selectedStaff) ||
                (step === 3 && !selectedDate) ||
                (step === 4 && !selectedTime)
              }
              className="flex-1 h-11 rounded-lg bg-slate-900 text-amber-500 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 h-11 rounded-lg bg-slate-900 text-amber-500 font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
              <Check className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Powered by <span className="font-semibold">BelezaFlow</span>
        </p>
      </div>
    </div>
  )
}
