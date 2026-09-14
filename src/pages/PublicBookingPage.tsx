import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  Share2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  CreditCard,
  QrCode,
  FileText,
  Copy,
  CheckCheck,
  Send,
  ShieldCheck,
  Building2,
  ArrowRight,
  Phone,
  Mail,
  Lock,
} from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { toast } from 'react-hot-toast'
import { cn, safeStorageGet } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useSalon } from '@/hooks/useSalon'
import { useAppointments } from '@/hooks/useAppointments'
import { usePayments } from '@/hooks/usePayments'
import { PaymentMethod } from '@/types'

interface BookingService {
  id: string
  name: string
  description?: string
  price: number
  duration_minutes: number
  category?: string
}

interface BookingStaff {
  id: string
  full_name: string
  job_title?: string
  avatar_url?: string | null
}

const DEFAULT_SERVICES: BookingService[] = [
  { id: 'srv-1', name: 'Corte Feminino', description: 'Corte moderno + lavagem especial + escova modeladora', price: 130, duration_minutes: 60, category: 'Cabelo' },
  { id: 'srv-2', name: 'Manicure Completa', description: 'Cutilagem russa, hidratação profunda e esmaltação', price: 75, duration_minutes: 45, category: 'Unhas' },
  { id: 'srv-3', name: 'Barba Completa & Terapia', description: 'Alinhamento com navalha, toalha quente e óleos essenciais', price: 60, duration_minutes: 30, category: 'Barba' },
  { id: 'srv-4', name: 'Coloração & Mechas', description: 'Coloração completa com produtos orgânicos sem amônia', price: 250, duration_minutes: 120, category: 'Cabelo' },
  { id: 'srv-5', name: 'Design de Sobrancelhas', description: 'Mapeamento facial e alinhamento com henna', price: 55, duration_minutes: 30, category: 'Estética' },
]

const DEFAULT_STAFF: BookingStaff[] = [
  { id: 'stf-1', full_name: 'Mariana Costa', job_title: 'Especialista em Mechas e Cortes' },
  { id: 'stf-2', full_name: 'Carlos Oliveira', job_title: 'Barbeiro Master e Visagista' },
  { id: 'stf-3', full_name: 'Ana Silva', job_title: 'Esteticista & Nail Designer' },
]

const BASE_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
]

type PaymentOption = 'full' | 'deposit' | 'local'
type GatewayMethod = 'pix' | 'card' | 'boleto'

export function PublicBookingPage() {
  const { salonId } = useParams<{ salonId?: string }>()
  const navigate = useNavigate()
  const { salon: activeSalon } = useSalon()
  const { recordPayment } = usePayments()

  // 1. DADOS DO SALÃO
  const currentSalonId = salonId || activeSalon?.id || 'default-salon'
  const salonName = activeSalon?.name || 'Studio BelezaFlow'
  const depositPercentage = activeSalon?.deposit_percentage ?? 30
  const fullDiscountPercentage = activeSalon?.full_payment_discount ?? 5
  const requireDeposit = activeSalon?.require_deposit ?? false

  // 2. ESTADOS DO FLUXO DO CLIENTE
  // Etapas:
  // 1: Serviço
  // 2: Profissional
  // 3: Data
  // 4: Horário (agenda bloqueada em tempo real)
  // 5: Dados do Cliente (Nome, Telefone, E-mail)
  // 6: Resumo & Seleção da Forma de Pagamento
  // 7: Gateway de Pagamento (PIX / Cartão / Boleto)
  // 8: Confirmação & Agenda Bloqueada
  const [step, setStep] = useState<number>(1)

  const [services, setServices] = useState<BookingService[]>(DEFAULT_SERVICES)
  const [staffList, setStaffList] = useState<BookingStaff[]>(DEFAULT_STAFF)
  const [existingAppointments, setExistingAppointments] = useState<any[]>([])

  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<BookingStaff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Formulário do cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  // Opção de pagamento
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('full')
  const [gatewayMethod, setGatewayMethod] = useState<GatewayMethod>('pix')

  // Estados de simulação do Gateway
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null)
  const [emailSentAlert, setEmailSentAlert] = useState(false)

  // Carrega dados de agendamentos locais para bloqueio de agenda
  useEffect(() => {
    const savedAppts = safeStorageGet<any[]>('belezaflow_appointments', [])
    if (savedAppts && savedAppts.length > 0) {
      setExistingAppointments(savedAppts)
    }

    // Carrega serviços salvos se houver
    const parsedServices = safeStorageGet<any[]>('belezaflow_services', [])
    if (Array.isArray(parsedServices) && parsedServices.length > 0) {
      setServices(parsedServices.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        price: Number(s.price) || 0,
        duration_minutes: Number(s.duration_minutes) || 30,
        category: s.category || 'Geral'
      })))
    }

    // Carrega equipe salva se houver
    const parsedStaff = safeStorageGet<any[]>('belezaflow_staff', [])
    if (Array.isArray(parsedStaff) && parsedStaff.length > 0) {
      setStaffList(parsedStaff.map(st => ({
        id: st.id,
        full_name: st.full_name || st.name,
        job_title: st.job_title || st.role || 'Profissional',
        avatar_url: st.avatar_url || null
      })))
    }
  }, [])

  // Próximos 30 dias para seleção de data
  const availableDates = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
  }, [])

  // CÁLCULO DE HORÁRIOS DISPONÍVEIS (BLOQUEIO REAL DA AGENDA)
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const occupiedSlots = useMemo(() => {
    if (!selectedStaff) return new Set<string>()

    const occupied = new Set<string>()
    existingAppointments.forEach((apt) => {
      if (apt.staff_id === selectedStaff.id || apt.professional_id === selectedStaff.id) {
        // Checa data
        const aptDate = apt.date || (apt.start_time ? apt.start_time.substring(0, 10) : '')
        if (aptDate === selectedDateStr && apt.status !== 'canceled') {
          const aptTime = apt.time || (apt.start_time ? apt.start_time.substring(11, 16) : '')
          if (aptTime) {
            occupied.add(aptTime)
          }
        }
      }
    })
    return occupied
  }, [selectedStaff, selectedDateStr, existingAppointments])

  // CÁLCULOS DE VALORES DO RESUMO (ETAPA 4 e 6)
  const originalPrice = selectedService?.price || 0
  const discountedPrice = originalPrice * (1 - fullDiscountPercentage / 100)
  const depositAmount = originalPrice * (depositPercentage / 100)
  const remainingDepositAmount = originalPrice - depositAmount

  const amountToPayNow = useMemo(() => {
    if (paymentOption === 'full') return discountedPrice
    if (paymentOption === 'deposit') return depositAmount
    return 0
  }, [paymentOption, discountedPrice, depositAmount])

  // CHAVE PIX COPIA E COLA FICTÍCIA
  const fakePixCode = useMemo(() => {
    return `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 15)}520400005303986540${amountToPayNow.toFixed(2)}5802BR5916BELEZAFLOW6009SAOPAULO62070503***6304`
  }, [amountToPayNow])

  // FORMATADOR DE MÁSCARA TELEFONE
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '')
    let masked = raw
    if (raw.length <= 10) {
      masked = raw.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else {
      masked = raw.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    }
    setClientPhone(masked)
  }

  // AÇÃO DE CONFIRMAÇÃO DO RESUMO -> SE PAGAR VAI AO GATEWAY, SE LOCAL CONFIRMA
  const handleProceedFromSummary = () => {
    if (paymentOption === 'local') {
      executeBookingConfirmation({
        payment_status: 'pending',
        payment_amount: 0,
        payment_method: 'cash',
        deposit_amount: 0,
      })
    } else {
      // Direciona para o Gateway de pagamento
      setStep(7)
    }
  }

  // AÇÃO FINAL: SALVAR AGENDAMENTO E BLOQUEAR AGENDA
  const executeBookingConfirmation = async (paymentDetails: {
    payment_status: 'pending' | 'partial' | 'paid'
    payment_amount: number
    payment_method: PaymentMethod
    deposit_amount: number
    transaction_id?: string
  }) => {
    setIsProcessingPayment(true)

    try {
      const startTime = `${selectedDateStr}T${selectedTime}:00`
      const duration = selectedService?.duration_minutes || 30
      const startDateObj = new Date(startTime)
      const endDateObj = new Date(startDateObj.getTime() + duration * 60000)
      const endTime = endDateObj.toISOString()

      const newAppointmentId = `apt-${Date.now()}`

      const appointmentPayload = {
        id: newAppointmentId,
        salon_id: currentSalonId,
        staff_id: selectedStaff?.id || 'default-staff',
        service_id: selectedService?.id || 'default-service',
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail || null,
        start_time: startDateObj.toISOString(),
        end_time: endTime,
        status: 'confirmed',
        payment_status: paymentDetails.payment_status,
        payment_amount: paymentDetails.payment_amount,
        payment_method: paymentDetails.payment_method,
        deposit_amount: paymentDetails.deposit_amount,
        notes: `Agendamento online pelo link público. Opção de pagamento: ${paymentOption}`,
        date: selectedDateStr,
        time: selectedTime,
        service_name: selectedService?.name,
        service_price: selectedService?.price,
        service_duration: selectedService?.duration_minutes,
        staff_name: selectedStaff?.full_name,
        created_at: new Date().toISOString(),
      }

      // Se pagou via gateway, registra na tabela payments
      if (paymentDetails.payment_amount > 0) {
        await recordPayment({
          appointment_id: newAppointmentId,
          amount: paymentDetails.payment_amount,
          method: paymentDetails.payment_method === 'cash' ? 'pix' : (paymentDetails.payment_method as any),
          status: 'completed',
          transaction_id: paymentDetails.transaction_id || `tx_gw_${Date.now()}`,
          paid_at: new Date().toISOString(),
        })
      }

      // Salva no Supabase se configurado
      if (supabase) {
        try {
          await supabase.from('appointments').insert({
            salon_id: currentSalonId,
            staff_id: selectedStaff?.id,
            service_id: selectedService?.id,
            client_name: clientName,
            client_phone: clientPhone,
            client_email: clientEmail || null,
            start_time: startDateObj.toISOString(),
            end_time: endTime,
            status: 'confirmed',
            payment_status: paymentDetails.payment_status,
            payment_amount: paymentDetails.payment_amount,
            payment_method: paymentDetails.payment_method,
            deposit_amount: paymentDetails.deposit_amount,
            notes: appointmentPayload.notes,
          })
        } catch (dbErr) {
          console.warn('Erro ao gravar no Supabase, mantendo persistência local:', dbErr)
        }
      }

      // Sincroniza localmente para bloqueio imediato da agenda
      const updatedList = [appointmentPayload, ...existingAppointments]
      localStorage.setItem('belezaflow_appointments', JSON.stringify(updatedList))
      setExistingAppointments(updatedList)

      setConfirmedAppointment(appointmentPayload)
      setEmailSentAlert(true)
      setStep(8)
      toast.success('Agendamento confirmado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao confirmar agendamento:', error)
      toast.error('Ocorreu um erro ao confirmar o agendamento.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // DISPARAR WHATSAPP COM LINK OFICIAL FORMATADO
  const handleShareWhatsApp = () => {
    if (!confirmedAppointment) return

    const cleanNumber = confirmedAppointment.client_phone.replace(/\D/g, '')
    const targetPhone = cleanNumber.length >= 10 ? `55${cleanNumber}` : ''

    const paymentText =
      confirmedAppointment.payment_status === 'paid'
        ? `✅ Pagamento 100% Confirmado (${formatCurrency(confirmedAppointment.payment_amount)})`
        : confirmedAppointment.payment_status === 'partial'
        ? `💳 Sinal de 30% Pago (${formatCurrency(confirmedAppointment.deposit_amount)}) - Restante no local`
        : `📍 Pagamento no local (${formatCurrency(confirmedAppointment.service_price)})`

    const message = [
      `*AGENDAMENTO CONFIRMADO - ${salonName.toUpperCase()}* ✂️✨`,
      ``,
      `Olá *${confirmedAppointment.client_name}*! Seu horário foi reservado com sucesso:`,
      `📅 *Data:* ${format(new Date(confirmedAppointment.start_time), "dd 'de' MMMM (EEEE)", { locale: ptBR })}`,
      `⏰ *Horário:* ${confirmedAppointment.time}`,
      `💇‍♀️ *Serviço:* ${confirmedAppointment.service_name}`,
      `👤 *Profissional:* ${confirmedAppointment.staff_name}`,
      `💰 *Status:* ${paymentText}`,
      ``,
      `Local: ${activeSalon?.address || 'Rua das Flores, 123 - Jardins'}`,
      `Código de confirmação: #${confirmedAppointment.id.substring(4, 12).toUpperCase()}`,
      ``,
      `Agradecemos pela preferência! Nos vemos em breve.`
    ].join('\n')

    const whatsappUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 selection:bg-amber-100">
      {/* HEADER DA MARCA */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                {salonName}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Online
                </span>
              </h1>
              <p className="text-xs text-slate-400">Agendamento & Pagamento Online</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seguro</span>
          </div>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL */}
      <main className="max-w-xl mx-auto px-4 pt-6">
        {/* BARRA DE PROGRESSO (ETAPAS 1 a 6) */}
        {step <= 6 && (
          <div className="mb-6 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2 px-1">
              <span className="text-slate-900">
                {step === 1 && '1. Selecione o Serviço'}
                {step === 2 && '2. Escolha o Profissional'}
                {step === 3 && '3. Escolha a Data'}
                {step === 4 && '4. Escolha o Horário'}
                {step === 5 && '5. Seus Dados de Contato'}
                {step === 6 && '6. Resumo e Pagamento'}
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                Passo {step} de 6
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-all duration-300',
                    idx < step
                      ? 'bg-amber-600'
                      : idx === step
                      ? 'bg-slate-900 ring-2 ring-slate-900/20'
                      : 'bg-slate-200'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* CORPO DINÂMICO DAS ETAPAS */}
        <AnimatePresence mode="wait">
          {/* PASSO 1: ESCOLHE SERVIÇO */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-600" />
                  Qual procedimento deseja realizar?
                </h2>
              </div>

              <div className="space-y-2.5">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={cn(
                        'w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 group cursor-pointer',
                        isSelected
                          ? 'border-amber-600 bg-amber-50/40 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      )}
                    >
                      <div className="space-y-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                            {service.category || 'Procedimento'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-bold text-slate-900 block">
                          {formatCurrency(service.price)}
                        </span>
                        {fullDiscountPercentage > 0 && (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                            {fullDiscountPercentage}% OFF antecipado
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* PASSO 2: ESCOLHE PROFISSIONAL */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Com quem prefere ser atendido(a)?
              </h2>

              <div className="space-y-2.5">
                {staffList.map((member) => {
                  const isSelected = selectedStaff?.id === member.id
                  return (
                    <button
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className={cn(
                        'w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 cursor-pointer',
                        isSelected
                          ? 'border-amber-600 bg-amber-50/40 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-lg shadow-xs flex-shrink-0">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{member.full_name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {member.job_title || 'Profissional Especialista'}
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        'w-6 h-6 rounded-full border flex items-center justify-center transition-all',
                        isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* PASSO 3: ESCOLHE DATA */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                Selecione o dia do agendamento
              </h2>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Próximos 30 dias disponíveis
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
                  {availableDates.map((date) => {
                    const isSelected = format(date, 'yyyy-MM-dd') === selectedDateStr
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    const isSunday = date.getDay() === 0

                    return (
                      <button
                        key={date.toISOString()}
                        disabled={isSunday}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                          isSunday && 'opacity-40 cursor-not-allowed bg-slate-50',
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <span className={cn('text-[11px] font-medium', isSelected ? 'text-amber-400' : 'text-slate-500')}>
                          {isToday ? 'Hoje' : format(date, 'EEE', { locale: ptBR })}
                        </span>
                        <span className="text-lg font-bold">
                          {format(date, 'dd')}
                        </span>
                        <span className={cn('text-[10px]', isSelected ? 'text-slate-300' : 'text-slate-400')}>
                          {format(date, 'MMM', { locale: ptBR })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 4: ESCOLHE HORÁRIO (AGENDA BLOQUEADA EM TEMPO REAL) */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Horários com {selectedStaff?.full_name}
                </h2>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500">
                  <span>Dia: <strong className="text-slate-900">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</strong></span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Livre</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> Ocupado</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                  {BASE_TIME_SLOTS.map((time) => {
                    const isOccupied = occupiedSlots.has(time)
                    const isSelected = selectedTime === time

                    return (
                      <button
                        key={time}
                        disabled={isOccupied}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'py-2.5 px-2 rounded-xl text-sm font-semibold border transition-all text-center relative cursor-pointer',
                          isOccupied && 'bg-slate-100/80 text-slate-400 border-slate-200/60 cursor-not-allowed line-through',
                          isSelected
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                            : !isOccupied && 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {time}
                        {isOccupied && (
                          <span className="block text-[9px] font-normal text-slate-400 no-underline">
                            Bloqueado
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 5: DADOS DO CLIENTE (NOME, TELEFONE, E-MAIL) */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Identificação para confirmação
              </h2>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: Maria Clara Santos"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    WhatsApp / Telefone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={clientPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Você receberá o lembrete e confirmação via WhatsApp.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    E-mail <span className="text-slate-400 font-normal">(para voucher e comprovante)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 6: RESUMO EXATO CONFORME ESPECIFICAÇÃO E ESCOLHA DE PAGAMENTO */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                Resumo do Agendamento
              </h2>

              {/* CARD DE RESUMO ESPECIFICADO NO PROMPT */}
              <div className="bg-white rounded-2xl border-2 border-slate-900/15 p-5 shadow-sm space-y-4 font-sans">
                <div className="space-y-1.5 pb-3 border-b border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Serviço
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {selectedService?.duration_minutes} minutos
                    </span>
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {selectedService?.name}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    Valor: <span className="text-slate-900 font-bold">{formatCurrency(originalPrice)}</span>
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pb-3 border-b border-slate-200">
                  <p><strong>Profissional:</strong> {selectedStaff?.full_name}</p>
                  <p><strong>Data:</strong> {format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })} às {selectedTime}</p>
                  <p><strong>Cliente:</strong> {clientName} • {clientPhone}</p>
                </div>

                {/* OPÇÕES DE FORMA DE PAGAMENTO */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Forma de pagamento:
                  </p>

                  {/* OPÇÃO 1: Pagar 100% agora */}
                  <label
                    className={cn(
                      'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                      paymentOption === 'full'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={paymentOption === 'full'}
                      onChange={() => setPaymentOption('full')}
                      className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          Pagar 100% agora
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          {fullDiscountPercentage}% desconto
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        ({formatCurrency(discountedPrice)} com {fullDiscountPercentage}% desc)
                      </p>
                      <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                        ✓ Garantia total de horário e check-in expresso
                      </span>
                    </div>
                  </label>

                  {/* OPÇÃO 2: Pagar 30% de sinal */}
                  <label
                    className={cn(
                      'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                      paymentOption === 'deposit'
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      value="deposit"
                      checked={paymentOption === 'deposit'}
                      onChange={() => setPaymentOption('deposit')}
                      className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-sm text-slate-900 block">
                        Pagar {depositPercentage}% de sinal
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        ({formatCurrency(depositAmount)} agora)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Restante de {formatCurrency(remainingDepositAmount)} quitado no atendimento.
                      </p>
                    </div>
                  </label>

                  {/* OPÇÃO 3: Pagar no local */}
                  {!requireDeposit && (
                    <label
                      className={cn(
                        'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                        paymentOption === 'local'
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentOption"
                        value="local"
                        checked={paymentOption === 'local'}
                        onChange={() => setPaymentOption('local')}
                        className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-sm text-slate-900 block">
                          Pagar no local
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          (sem garantia de reserva prioritária)
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Sujeito a tolerância de até 10 minutos de comparecimento.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 7: GATEWAY DE PAGAMENTO (REDIRECIONAMENTO INTEGRADO) */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  Gateway Seguro de Pagamento
                </h2>
              </div>

              {/* CARD VALOR A PAGAR AGORA */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">
                    {paymentOption === 'full' ? 'Total à vista (com 5% de desconto):' : 'Valor do sinal de garantia (30%):'}
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    {formatCurrency(amountToPayNow)}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span className="block text-white font-medium">{selectedService?.name}</span>
                  <span>{selectedTime} • {selectedStaff?.full_name}</span>
                </div>
              </div>

              {/* SELETOR DE MÉTODO DO GATEWAY */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGatewayMethod('pix')}
                  className={cn(
                    'py-3 px-2 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer',
                    gatewayMethod === 'pix'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  PIX Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => setGatewayMethod('card')}
                  className={cn(
                    'py-3 px-2 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer',
                    gatewayMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Cartão de Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setGatewayMethod('boleto')}
                  className={cn(
                    'py-3 px-2 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer',
                    gatewayMethod === 'boleto'
                      ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <FileText className="w-5 h-5 text-slate-700" />
                  Boleto Bancário
                </button>
              </div>

              {/* CONTEÚDO ESPECÍFICO DO GATEWAY */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {gatewayMethod === 'pix' && (
                  <div className="space-y-4 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Liberação imediata da sua reserva após confirmação do PIX.
                    </div>

                    {/* QR Code Simulado */}
                    <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-900 flex flex-col items-center justify-center shadow-inner relative">
                      <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-slate-900 rounded-lg">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'rounded-xs',
                              (i % 2 === 0 || i % 5 === 0) ? 'bg-white' : 'bg-slate-900'
                            )}
                          />
                        ))}
                      </div>
                      <div className="absolute bg-white px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-900 border">
                        PIX BACEN
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-medium">
                        Copie a chave abaixo e pague no app do seu banco:
                      </p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={fakePixCode}
                          className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(fakePixCode)
                            setPixCopied(true)
                            toast.success('Chave PIX copiada!')
                            setTimeout(() => setPixCopied(false), 3000)
                          }}
                          className="h-10 px-4 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:bg-slate-800"
                        >
                          {pixCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {pixCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() =>
                        executeBookingConfirmation({
                          payment_status: paymentOption === 'full' ? 'paid' : 'partial',
                          payment_amount: amountToPayNow,
                          payment_method: 'pix',
                          deposit_amount: paymentOption === 'deposit' ? depositAmount : 0,
                          transaction_id: `tx_pix_${Date.now()}`,
                        })
                      }
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessingPayment ? 'Validando PIX...' : ' Confirmar Pagamento do PIX'}
                    </button>
                  </div>
                )}

                {gatewayMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        defaultValue="4111 2222 3333 4444"
                        className="w-full h-10 px-3 text-sm font-mono border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Validade
                        </label>
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full h-10 px-3 text-sm font-mono border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          defaultValue="890"
                          className="w-full h-10 px-3 text-sm font-mono border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        type="text"
                        defaultValue={clientName || 'MARIA C SANTOS'}
                        className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() =>
                        executeBookingConfirmation({
                          payment_status: paymentOption === 'full' ? 'paid' : 'partial',
                          payment_amount: amountToPayNow,
                          payment_method: 'card',
                          deposit_amount: paymentOption === 'deposit' ? depositAmount : 0,
                          transaction_id: `tx_card_${Date.now()}`,
                        })
                      }
                      className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessingPayment ? 'Aprovando no Gateway...' : ` Pagar ${formatCurrency(amountToPayNow)} com Cartão`}
                    </button>
                  </div>
                )}

                {gatewayMethod === 'boleto' && (
                  <div className="space-y-3 text-center">
                    <p className="text-xs text-slate-600">
                      O boleto possui vencimento em 2 dias úteis. A agenda permanecerá pré-reservada.
                    </p>
                    <div className="p-3 bg-slate-50 border rounded-xl font-mono text-xs text-slate-700 break-all">
                      34191.79001 01043.510047 91020.150008 5 981200000{Math.floor(amountToPayNow * 100)}
                    </div>
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() =>
                        executeBookingConfirmation({
                          payment_status: 'pending',
                          payment_amount: amountToPayNow,
                          payment_method: 'boleto',
                          deposit_amount: paymentOption === 'deposit' ? depositAmount : 0,
                          transaction_id: `tx_bol_${Date.now()}`,
                        })
                      }
                      className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessingPayment ? 'Gerando Boleto...' : ' Gerar Boleto e Concluir'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PASSO 8: CONFIRMAÇÃO & AGENDA BLOQUEADA & DISPARO WHATSAPP/E-MAIL */}
          {step === 8 && confirmedAppointment && (
            <motion.div
              key="step-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-lg space-y-5">
                <div className="w-16 h-16 rounded-full mx-auto bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Agenda Bloqueada com Sucesso
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    Agendamento Confirmado!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Código da Reserva: <strong className="text-slate-900 font-mono">#{confirmedAppointment.id.substring(4, 12).toUpperCase()}</strong>
                  </p>
                </div>

                {/* VOUCHER / COMPROVANTE */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 text-left space-y-3.5 shadow-inner">
                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase">Procedimento</p>
                      <p className="font-bold text-white text-sm">{confirmedAppointment.service_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase">Profissional Responsável</p>
                      <p className="font-bold text-white text-sm">{confirmedAppointment.staff_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase">Data & Horário</p>
                      <p className="font-bold text-white text-sm">
                        {format(new Date(confirmedAppointment.start_time), "dd 'de' MMMM (EEEE)", { locale: ptBR })} às {confirmedAppointment.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                    <CreditCard className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase">Status do Pagamento</p>
                      <p className="font-bold text-amber-400 text-sm">
                        {confirmedAppointment.payment_status === 'paid' && `Quitado com desconto (${formatCurrency(confirmedAppointment.payment_amount)})`}
                        {confirmedAppointment.payment_status === 'partial' && `Sinal de 30% Pago (${formatCurrency(confirmedAppointment.deposit_amount)})`}
                        {confirmedAppointment.payment_status === 'pending' && `Pagamento agendado para o local`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NOTIFICAÇÃO DE ENVIO DE E-MAIL */}
                {emailSentAlert && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs text-blue-900 flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <strong>Comprovante enviado!</strong> Enviamos todos os detalhes e voucher para{' '}
                      <span className="font-semibold underline">{clientEmail || 'seu e-mail'}</span>.
                    </div>
                  </div>
                )}

                {/* BOTÕES DE AÇÃO: DISPARO WHATSAPP */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Comprovante para meu WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setSelectedService(null)
                      setSelectedStaff(null)
                      setSelectedTime('')
                      setConfirmedAppointment(null)
                    }}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Agendar Outro Horário
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROLES DE NAVEGAÇÃO (VOLTAR / AVANÇAR) */}
        {step < 8 && (
          <div className="mt-6 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}

            {step < 6 && (
              <button
                type="button"
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedStaff) ||
                  (step === 3 && !selectedDate) ||
                  (step === 4 && !selectedTime) ||
                  (step === 5 && (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10))
                }
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                Avançar
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 6 && (
              <button
                type="button"
                onClick={handleProceedFromSummary}
                className="flex-1 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {paymentOption === 'local' ? 'Confirmar Agendamento no Local' : 'Prosseguir para Pagamento Seguro'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-slate-400">
          <p>
            Plataforma de Gestão e Agendamentos <strong className="text-slate-600">BelezaFlow</strong>
          </p>
        </footer>
      </main>
    </div>
  )
}
