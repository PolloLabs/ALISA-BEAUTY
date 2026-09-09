import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, Calendar, Clock, User, Scissors, Share2, CheckCircle2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Salon, Service } from '@/types'
import { generateAvailableSlots, calculateEndTime } from '@/lib/schedulingEngine'
import { formatCurrency } from '@/lib/formatters'
import { Avatar } from '@/components/staff/Avatar'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface StaffMember {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export function PublicBookingPage() {
  const { salonId } = useParams<{ salonId: string }>()
  const navigate = useNavigate()
  
  const [salon, setSalon] = useState<Salon | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Valida se é UUID válido
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  // Carrega dados do salão
  useEffect(() => {
    const loadSalon = async () => {
      if (!salonId) {
        setError('ID do salão não fornecido')
        setLoading(false)
        return
      }

      if (!isValidUUID(salonId)) {
        setError('Link de agendamento inválido. Por favor, verifique o link.')
        setLoading(false)
        setTimeout(() => navigate('/'), 8000)
        return
      }

      setLoading(true)
      try {
        const { data: salonData, error } = await supabase
          .from('salons')
          .select('*')
          .eq('id', salonId)
          .eq('is_active', true)
          .single()

        if (error || !salonData) {
          setError('Salão não encontrado ou inativo')
          setLoading(false)
          setTimeout(() => navigate('/'), 8000)
          return
        }

        setSalon(salonData as Salon)

        const [servicesRes, staffRes] = await Promise.all([
          supabase.from('services').select('*').eq('salon_id', salonId).eq('is_active', true).order('name'),
          supabase.from('staff').select(`
            id,
            profiles:profile_id (full_name, avatar_url)
          `).eq('salon_id', salonId).eq('is_active', true)
        ])

        setServices((servicesRes.data as Service[]) || [])
        setStaffList(((staffRes.data || []) as any[]).map((s: any) => ({
          id: s.id,
          full_name: s.profiles?.full_name || null,
          avatar_url: s.profiles?.avatar_url || null,
        })))
      } catch (err) {
        console.error(err)
        setError('Erro ao carregar dados do salão')
        setLoading(false)
      }
    }
    loadSalon()
  }, [salonId, navigate])

  // Gera slots disponíveis
  useEffect(() => {
    const generateSlots = async () => {
      if (!selectedStaff || !salon || !selectedService) {
        setAvailableSlots([])
        return
      }

      setLoadingSlots(true)
      try {
        const [appointmentsRes, blockingsRes] = await Promise.all([
          supabase.from('appointments').select('start_time, end_time')
            .eq('staff_id', selectedStaff.id)
            .eq('salon_id', salon.id)
            .neq('status', 'canceled')
            .gte('start_time', format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00')
            .lte('start_time', format(selectedDate, 'yyyy-MM-dd') + 'T23:59:59'),
          supabase.from('staff_blockings').select('*')
            .eq('staff_id', selectedStaff.id)
            .eq('salon_id', salon.id)
            .eq('block_date', format(selectedDate, 'yyyy-MM-dd'))
        ])

        const slots = generateAvailableSlots({
          date: selectedDate,
          salonHours: { open_time: salon.open_time, close_time: salon.close_time },
          serviceDurationMinutes: selectedService.duration_minutes,
          existingAppointments: appointmentsRes.data || [],
          staffBlockings: blockingsRes.data || [],
        })

        setAvailableSlots(slots)
        setSelectedTime('')
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSlots(false)
      }
    }
    generateSlots()
  }, [selectedStaff, selectedDate, selectedService, salon])

  const handleConfirmBooking = async (data: any) => {
    if (!salon || !selectedService || !selectedStaff || !selectedTime) return

    setSubmitting(true)
    try {
      const startTime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`
      const endTime = `${format(selectedDate, 'yyyy-MM-dd')}T${calculateEndTime(selectedTime, selectedService.duration_minutes)}:00`

      const { error } = await supabase.from('appointments').insert({
        salon_id: salon.id,
        staff_id: selectedStaff.id,
        service_id: selectedService.id,
        client_name: data.client_name,
        client_phone: data.client_phone,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        status: 'confirmed',
      })

      if (error) throw error

      setCreatedAppointment({
        service_name: selectedService.name,
        service_price: selectedService.price,
        service_duration: selectedService.duration_minutes,
        staff_name: selectedStaff.full_name,
        start_time: startTime,
      })
      setBookingComplete(true)
      toast.success('Agendamento confirmado!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao confirmar')
    } finally {
      setSubmitting(false)
    }
  }

  const addToGoogleCalendar = () => {
    if (!createdAppointment) return
    const start = new Date(createdAppointment.start_time)
    const end = new Date(start.getTime() + createdAppointment.service_duration * 60000)
    const formatGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${createdAppointment.service_name} - ${salon?.name}`)}&dates=${formatGCal(start)}/${formatGCal(end)}&details=${encodeURIComponent(`Profissional: ${createdAppointment.staff_name}`)}`
    window.open(url, '_blank')
  }

  const shareWhatsApp = () => {
    if (!createdAppointment || !salon) return
    const message = `Agendamento confirmado!\n\n${salon.name}\n${createdAppointment.service_name}\n${format(selectedDate, "dd/MM/yyyy")} às ${selectedTime}\nProfissional: ${createdAppointment.staff_name}\nValor: ${formatCurrency(createdAppointment.service_price)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))

  // PÁGINA DE ERRO
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
          <div className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Inválido</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <p className="text-sm text-slate-500 mb-6">Redirecionando em 8 segundos...</p>
          <button onClick={() => navigate('/')} className="h-11 px-6 rounded-lg bg-slate-900 text-amber-500 font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mx-auto">
            <ArrowLeft className="h-4 w-4" />
            Voltar agora
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full mx-auto mb-4 animate-pulse bg-slate-900" />
          <p className="text-sm text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!salon) return null

  // TELA DE SUCESSO
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            {salon.logo_url ? (
              <img src={salon.logo_url} alt={salon.name} className="h-16 w-16 mx-auto rounded-xl object-cover mb-3" />
            ) : (
              <div className="h-16 w-16 mx-auto rounded-xl bg-slate-900 flex items-center justify-center mb-3">
                <Sparkles className="h-8 w-8 text-amber-500" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900">{salon.name}</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center">
            <div className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Agendamento Confirmado!</h2>
            <p className="text-sm text-slate-600 mb-6">Estamos ansiosos para recebê-lo(a)</p>

            <div className="bg-slate-900 rounded-xl p-4 text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Scissors className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Serviço</p>
                  <p className="font-semibold text-white">{createdAppointment.service_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Profissional</p>
                  <p className="font-semibold text-white">{createdAppointment.staff_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-slate-400">Data</p>
                  <p className="font-semibold text-white">{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={addToGoogleCalendar} className="w-full h-11 rounded-lg bg-slate-900 text-amber-500 font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Adicionar ao Google Calendar
              </button>
              <button onClick={shareWhatsApp} className="w-full h-11 rounded-lg border border-slate-200 text-slate-900 font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhar
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
          {salon.logo_url ? (
            <img src={salon.logo_url} alt={salon.name} className="h-16 w-16 mx-auto rounded-xl object-cover mb-3" />
          ) : (
            <div className="h-16 w-16 mx-auto rounded-xl bg-slate-900 flex items-center justify-center mb-3">
              <Sparkles className="h-8 w-8 text-amber-500" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{salon.name}</h1>
          <p className="text-sm text-slate-600">Agende seu horário</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={cn('h-2 flex-1 mx-1 rounded-full', s <= step ? 'bg-slate-900' : 'bg-slate-200')} />
            ))}
          </div>
          <p className="text-xs text-slate-500 text-center">Passo {step} de 5</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha o serviço</h2>
                <div className="space-y-3">
                  {services.map((service) => (
                    <button key={service.id} onClick={() => setSelectedService(service)} className={cn('w-full p-4 rounded-xl border-2 text-left', selectedService?.id === service.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white')}>
                      <div className="flex justify-between">
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

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha o profissional</h2>
                <div className="space-y-3">
                  {staffList.map((member) => (
                    <button key={member.id} onClick={() => setSelectedStaff(member)} className={cn('w-full p-4 rounded-xl border-2 text-left flex items-center gap-3', selectedStaff?.id === member.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white')}>
                      <Avatar name={member.full_name} imageUrl={member.avatar_url} size="md" />
                      <h3 className="font-semibold text-slate-900">{member.full_name || 'Profissional'}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha a data</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.map((date) => {
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                    return (
                      <button key={date.toISOString()} onClick={() => setSelectedDate(date)} className={cn('flex-shrink-0 w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-center', isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white')}>
                        <span className="text-xs">{isToday ? 'Hoje' : format(date, 'EEE', { locale: ptBR })}</span>
                        <span className="text-2xl font-bold">{format(date, 'dd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Escolha o horário</h2>
                {loadingSlots ? (
                  <p className="text-center text-slate-600">Carregando...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-700">Nenhum horário disponível</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available} className={cn('h-12 rounded-lg font-medium', slot.available ? selectedTime === slot.time ? 'bg-slate-900 text-amber-500' : 'bg-white border border-slate-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Seus dados</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
                  <input type="text" placeholder="Seu nome" className="w-full h-11 px-3 rounded-lg border border-slate-200" id="clientName" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
                  <input type="tel" placeholder="(00) 00000-0000" className="w-full h-11 px-3 rounded-lg border border-slate-200" id="clientPhone" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 h-11 rounded-lg border border-slate-200 font-medium">
              Voltar
            </button>
          )}
          {step < 5 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!selectedService || (step === 2 && !selectedStaff) || (step === 3 && !selectedDate) || (step === 4 && !selectedTime)} className="flex-1 h-11 rounded-lg bg-slate-900 text-amber-500 font-medium disabled:opacity-50">
              Próximo
            </button>
          ) : (
            <button onClick={() => { const name = (document.getElementById('clientName') as HTMLInputElement).value; const phone = (document.getElementById('clientPhone') as HTMLInputElement).value; handleConfirmBooking({ client_name: name, client_phone: phone }) }} disabled={submitting} className="flex-1 h-11 rounded-lg bg-slate-900 text-amber-500 font-medium">
              {submitting ? 'Confirmando...' : 'Confirmar'}
            </button>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-8">Powered by BelezaFlow</p>
      </div>
    </div>
  )
}
