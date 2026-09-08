import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Scissors,
  ArrowLeft,
  Star,
  AlertCircle,
  CalendarPlus,
  Share2,
  ShieldCheck,
  MessageSquare,
  Sparkle
} from 'lucide-react'
import { format, addDays, isToday, isTomorrow, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

import { useSalon } from '@/hooks/useSalon'
import {
  generateAvailableSlots,
  calculateEndTime,
  TimeSlot,
  ExistingAppointment,
  StaffBlocking
} from '@/lib/schedulingEngine'
import { formatCurrency, formatDateFull } from '@/lib/formatters'
import {
  supabase,
  isSupabaseConfigured,
  initialServices,
  initialProfessionals,
  initialAppointments
} from '@/lib/supabase'
import { Salon, Service, Professional, Appointment } from '@/types'

// Normalização de profissional para a interface de agendamento público
interface BookingStaff {
  id: string
  name: string
  role: string
  avatar: string
  specialties?: string[]
  rating?: number
}

interface ConfirmedAppointmentData {
  id: string
  service: Service
  staff: BookingStaff
  date: Date
  time: string
  endTime: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  notes?: string
}

export const PublicBookingPage: React.FC = () => {
  const { salonId } = useParams<{ salonId?: string }>()
  const navigate = useNavigate()
  const { salon: contextSalon } = useSalon()

  // Estados principais
  const [salon, setSalon] = useState<Salon | null>(null)
  const [loadingSalon, setLoadingSalon] = useState(true)
  const [salonNotFound, setSalonNotFound] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<BookingStaff[]>([])
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([])
  const [staffBlockings, setStaffBlockings] = useState<StaffBlocking[]>([])

  // Wizard Steps: 1 a 5, e 6 = Sucesso
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)

  // Seleções do usuário
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [searchService, setSearchService] = useState<string>('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<BookingStaff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Formulário do cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({})

  // Dados do agendamento confirmado
  const [confirmedData, setConfirmedData] = useState<ConfirmedAppointmentData | null>(null)

  // Ref para scroll horizontal de datas
  const dateScrollRef = useRef<HTMLDivElement>(null)

  // 1. Carregar Salão (Supabase -> Context -> LocalStorage -> Fallback)
  useEffect(() => {
    let isMounted = true

    const loadSalonData = async () => {
      setLoadingSalon(true)
      try {
        const targetId = salonId || contextSalon?.id

        // 1. Tenta pelo Supabase se configurado
        if (targetId && isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('salons')
              .select('*')
              .or(`id.eq.${targetId},slug.eq.${targetId}`)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle()

            if (!error && data && isMounted) {
              setSalon(data as Salon)
              setLoadingSalon(false)
              return
            }
          } catch (e) {
            console.warn('[PublicBookingPage] Supabase error fetching salon:', e)
          }
        }

        // 2. Se contexto ativo tiver salão com mesmo ID ou se nenhum ID foi passado
        if (contextSalon && (!salonId || contextSalon.id === salonId || contextSalon.slug === salonId)) {
          if (isMounted) {
            setSalon(contextSalon)
            setLoadingSalon(false)
            return
          }
        }

        // 3. Tenta carregar do LocalStorage
        try {
          const saved = localStorage.getItem('belezaflow_active_salon')
          if (saved) {
            const parsed = JSON.parse(saved) as Salon
            if (!salonId || parsed.id === salonId || parsed.slug === salonId) {
              if (isMounted) {
                setSalon(parsed)
                setLoadingSalon(false)
                return
              }
            }
          }
        } catch (e) {
          console.error('[PublicBookingPage] LocalStorage error:', e)
        }

        // 4. Fallback padrão luxo elegante para demonstração caso nenhum salão seja encontrado
        if (isMounted) {
          const defaultSalon: Salon = {
            id: salonId || 'salon-1',
            owner_id: 'owner-1',
            name: 'Atelier & Salão Elegance',
            business_type: 'beauty_salon',
            logo_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80',
            primary_color: '#D97706',
            address: 'Alameda dos Ipês, 450 - Jardins, São Paulo',
            phone: '(11) 98765-4321',
            open_time: '08:00',
            close_time: '19:00',
            is_active: true,
            created_at: new Date().toISOString(),
          }
          setSalon(defaultSalon)
          setLoadingSalon(false)
        }
      } catch (err) {
        console.error('[PublicBookingPage] Falha geral ao carregar salão:', err)
        if (isMounted) {
          setSalonNotFound(true)
          setLoadingSalon(false)
        }
      }
    }

    loadSalonData()

    return () => {
      isMounted = false
    }
  }, [salonId, contextSalon])

  // 2. SEO e Meta Tags dinâmicas
  useEffect(() => {
    if (salon) {
      const prevTitle = document.title
      document.title = `Agendar Horário | ${salon.name} - BelezaFlow`

      const metaDescription = document.querySelector('meta[name="description"]')
      const originalDescription = metaDescription?.getAttribute('content') || ''
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Agende seu horário online no ${salon.name}. Serviços profissionais com confirmação instantânea.`
        )
      }

      return () => {
        document.title = prevTitle
        if (metaDescription) {
          metaDescription.setAttribute('content', originalDescription)
        }
      }
    }
  }, [salon])

  // 3. Carregar Serviços e Equipe do Salão
  useEffect(() => {
    if (!salon) return
    let isMounted = true

    const loadServicesAndStaff = async () => {
      try {
        let loadedServices: Service[] = []
        let loadedStaff: BookingStaff[] = []

        // Busca serviços no Supabase
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: srvData } = await supabase
              .from('services')
              .select('*')
              .eq('salon_id', salon.id)
              .eq('is_active', true)

            if (srvData && srvData.length > 0) {
              loadedServices = srvData as Service[]
            }
          } catch (err) {
            console.warn('[PublicBookingPage] Erro ao buscar serviços do supabase:', err)
          }

          // Busca profissionais no Supabase
          try {
            const { data: stfData } = await supabase
              .from('staff')
              .select('id, salon_id, is_active, profiles(full_name, phone, avatar_url)')
              .eq('salon_id', salon.id)
              .eq('is_active', true)

            if (stfData && stfData.length > 0) {
              const rawStaffList = stfData as unknown as Array<{
                id: string
                profiles?: { full_name?: string; avatar_url?: string } | Array<{ full_name?: string; avatar_url?: string }> | null
              }>

              loadedStaff = rawStaffList.map(s => {
                const profileObj = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
                return {
                  id: s.id,
                  name: profileObj?.full_name || 'Especialista',
                  role: 'Profissional',
                  avatar: profileObj?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  rating: 4.9,
                }
              })
            }
          } catch (err) {
            console.warn('[PublicBookingPage] Erro ao buscar staff do supabase:', err)
          }
        }

        // Fallback local para Serviços
        if (loadedServices.length === 0) {
          try {
            const localSrv = localStorage.getItem('belezaflow_services')
            if (localSrv) {
              const parsed = JSON.parse(localSrv) as Service[]
              const filtered = parsed.filter(s => (!s.salon_id || s.salon_id === salon.id) && s.is_active !== false)
              if (filtered.length > 0) loadedServices = filtered
            }
          } catch (e) {
            console.error(e)
          }
        }
        if (loadedServices.length === 0) {
          loadedServices = initialServices
        }

        // Fallback local para Profissionais
        if (loadedStaff.length === 0) {
          try {
            const localStaff = localStorage.getItem('belezaflow_staff')
            if (localStaff) {
              const parsed = JSON.parse(localStaff) as { id: string; full_name?: string; avatar_url?: string; is_active?: boolean }[]
              const active = parsed.filter(s => s.is_active !== false)
              if (active.length > 0) {
                loadedStaff = active.map(s => ({
                  id: s.id,
                  name: s.full_name || 'Profissional',
                  role: 'Especialista',
                  avatar: s.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                  rating: 4.9,
                }))
              }
            }
          } catch (e) {
            console.error(e)
          }
        }
        if (loadedStaff.length === 0) {
          loadedStaff = initialProfessionals.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            avatar: p.avatar,
            specialties: p.specialties,
            rating: p.rating,
          }))
        }

        if (isMounted) {
          setServices(loadedServices)
          setStaffList(loadedStaff)
        }
      } catch (e) {
        console.error('[PublicBookingPage] Erro ao carregar recursos:', e)
      }
    }

    loadServicesAndStaff()

    return () => {
      isMounted = false
    }
  }, [salon])

  // 4. Carregar agendamentos existentes e bloqueios da data selecionada
  useEffect(() => {
    if (!salon) return
    let isMounted = true

    const fetchDaySchedule = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      try {
        let apts: ExistingAppointment[] = []
        let blockings: StaffBlocking[] = []

        // Supabase query
        if (isSupabaseConfigured && supabase) {
          try {
            const startOfDay = `${dateStr}T00:00:00`
            const endOfDay = `${dateStr}T23:59:59`

            let query = supabase
              .from('appointments')
              .select('start_time, end_time, staff_id')
              .eq('salon_id', salon.id)
              .gte('start_time', startOfDay)
              .lte('start_time', endOfDay)
              .neq('status', 'canceled')

            if (selectedStaff && selectedStaff.id !== 'any') {
              query = query.eq('staff_id', selectedStaff.id)
            }

            const { data: dbApts } = await query
            if (dbApts) {
              apts = dbApts.map(a => ({
                start_time: a.start_time,
                end_time: a.end_time,
              }))
            }

            // Bloqueios
            if (selectedStaff && selectedStaff.id !== 'any') {
              const { data: dbBlocks } = await supabase
                .from('staff_blockings')
                .select('block_date, start_time, end_time')
                .eq('salon_id', salon.id)
                .eq('staff_id', selectedStaff.id)
                .eq('block_date', dateStr)

              if (dbBlocks) {
                blockings = dbBlocks as StaffBlocking[]
              }
            }
          } catch (err) {
            console.warn('[PublicBookingPage] Erro ao buscar agendamentos do dia:', err)
          }
        }

        // Fallback local storage
        if (apts.length === 0) {
          try {
            const raw = localStorage.getItem('belezaflow_appointments')
            const list: Appointment[] = raw ? JSON.parse(raw) : initialAppointments

            apts = list
              .filter(a => {
                if (a.status === 'canceled' || a.status === 'cancelado') return false
                if (selectedStaff && selectedStaff.id !== 'any') {
                  if (a.staff_id && a.staff_id !== selectedStaff.id) return false
                  if (a.professional_id && a.professional_id !== selectedStaff.id) return false
                }
                const matchDate = a.date === dateStr || (a.start_time && a.start_time.startsWith(dateStr))
                return matchDate
              })
              .map(a => ({
                start_time: a.start_time || `${dateStr}T${a.time}:00`,
                end_time: a.end_time || `${dateStr}T${a.time}:00`,
              }))
          } catch (e) {
            console.error(e)
          }
        }

        if (isMounted) {
          setExistingAppointments(apts)
          setStaffBlockings(blockings)
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchDaySchedule()

    return () => {
      isMounted = false
    }
  }, [salon, selectedDate, selectedStaff])

  // Próximos 30 dias para o scroll horizontal do Step 3
  const next30Days = useMemo(() => {
    const days: Date[] = []
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    for (let i = 0; i < 30; i++) {
      days.push(addDays(base, i))
    }
    return days
  }, [])

  // Categorias únicas dos serviços
  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach(s => {
      if (s.category) set.add(s.category)
    })
    return ['todos', ...Array.from(set)]
  }, [services])

  // Serviços filtrados por busca e categoria
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchCategory = selectedCategory === 'todos' || s.category === selectedCategory
      const matchSearch =
        s.name.toLowerCase().includes(searchService.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchService.toLowerCase()))
      return matchCategory && matchSearch
    })
  }, [services, selectedCategory, searchService])

  // Cálculo de slots disponíveis usando schedulingEngine
  const availableSlots: TimeSlot[] = useMemo(() => {
    if (!salon || !selectedService || !selectedStaff) return []

    return generateAvailableSlots({
      date: selectedDate,
      salonHours: {
        open_time: salon.open_time || '08:00',
        close_time: salon.close_time || '19:00',
      },
      serviceDurationMinutes: selectedService.duration_minutes || 30,
      existingAppointments,
      staffBlockings,
    })
  }, [salon, selectedService, selectedStaff, selectedDate, existingAppointments, staffBlockings])

  // Agrupamento de slots por período
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []
    const evening: TimeSlot[] = []

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.time.substring(0, 2), 10)
      if (hour < 12) {
        morning.push(slot)
      } else if (hour < 18) {
        afternoon.push(slot)
      } else {
        evening.push(slot)
      }
    })

    return { morning, afternoon, evening }
  }, [availableSlots])

  // Opção "Qualquer Profissional" virtual para seleção
  const anyStaffOption: BookingStaff = useMemo(() => ({
    id: 'any',
    name: 'Primeiro Disponível',
    role: 'Qualquer profissional livre',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
  }), [])

  // Formata telefone enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.substring(0, 11)
    if (val.length > 10) {
      val = val.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (val.length > 5) {
      val = val.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
    }
    setClientPhone(val)
    if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }))
  }

  // Navegação do Wizard
  const handleNextStep = () => {
    if (step === 1 && !selectedService) {
      toast.error('Por favor, selecione um serviço para continuar')
      return
    }
    if (step === 2 && !selectedStaff) {
      toast.error('Por favor, selecione um profissional')
      return
    }
    if (step === 3 && !selectedDate) {
      toast.error('Por favor, escolha uma data')
      return
    }
    if (step === 4 && !selectedTime) {
      toast.error('Por favor, escolha um horário vago')
      return
    }
    if (step < 5) {
      setStep((step + 1) as 1 | 2 | 3 | 4 | 5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    if (step > 1 && step <= 5) {
      setStep((step - 1) as 1 | 2 | 3 | 4 | 5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Scroll nos dias
  const scrollDays = (direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      dateScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Submissão do Agendamento
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: { name?: string; phone?: string } = {}
    if (!clientName.trim() || clientName.trim().length < 3) {
      errors.name = 'Nome completo é obrigatório (mínimo 3 letras)'
    }
    const cleanPhone = clientPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      errors.phone = 'Informe um WhatsApp/telefone válido com DDD'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    if (!salon || !selectedService || !selectedStaff || !selectedTime) {
      toast.error('Dados incompletos para confirmar agendamento.')
      return
    }

    setIsSubmitting(true)

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const startIsoString = `${dateStr}T${selectedTime}:00`
      const calculatedEnd = calculateEndTime(selectedTime, selectedService.duration_minutes || 30)
      const endIsoString = `${dateStr}T${calculatedEnd}:00`

      // Se foi selecionado "Qualquer profissional", atribui o primeiro ativo
      const assignedStaff = selectedStaff.id === 'any'
        ? (staffList.length > 0 ? staffList[0] : anyStaffOption)
        : selectedStaff

      const appointmentId = `pub-apt-${Date.now()}`

      // 1. Tenta salvar no Supabase se ativo
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('appointments').insert({
            salon_id: salon.id,
            staff_id: assignedStaff.id !== 'any' ? assignedStaff.id : (staffList[0]?.id || null),
            service_id: selectedService.id,
            client_name: clientName.trim(),
            client_phone: clientPhone.trim(),
            client_email: clientEmail.trim() || null,
            start_time: startIsoString,
            end_time: endIsoString,
            status: 'confirmed',
            notes: clientNotes.trim() || null,
          })

          if (error) {
            console.warn('[PublicBookingPage] Supabase insert error, saving to local fallback:', error)
          }
        } catch (dbErr) {
          console.warn('[PublicBookingPage] Supabase exception:', dbErr)
        }
      }

      // 2. Salva no LocalStorage para sincronia imediata com o painel do salão
      try {
        const raw = localStorage.getItem('belezaflow_appointments')
        const current: Appointment[] = raw ? JSON.parse(raw) : initialAppointments
        const newApt: Appointment = {
          id: appointmentId,
          salon_id: salon.id,
          staff_id: assignedStaff.id,
          service_id: selectedService.id,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          client_email: clientEmail.trim() || undefined,
          date: dateStr,
          time: selectedTime,
          start_time: startIsoString,
          end_time: endIsoString,
          duration_minutes: selectedService.duration_minutes || 30,
          price: selectedService.price,
          status: 'confirmed',
          notes: clientNotes.trim() || null,
          service_name: selectedService.name,
          professional_name: assignedStaff.name,
          created_at: new Date().toISOString(),
        }
        localStorage.setItem('belezaflow_appointments', JSON.stringify([newApt, ...current]))
      } catch (locErr) {
        console.error('[PublicBookingPage] LocalStorage save error:', locErr)
      }

      // 3. Sucesso! Prepara dados e vai para Step 6
      const confirmed: ConfirmedAppointmentData = {
        id: appointmentId,
        service: selectedService,
        staff: assignedStaff,
        date: selectedDate,
        time: selectedTime,
        endTime: calculatedEnd,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        notes: clientNotes.trim() || undefined,
      }

      setConfirmedData(confirmed)
      setStep(6)
      toast.success('Agendamento confirmado com sucesso!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      console.error(err)
      toast.error('Não foi possível finalizar o agendamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gerar link para Google Calendar
  const getGoogleCalendarLink = () => {
    if (!confirmedData || !salon) return '#'
    const dateStr = format(confirmedData.date, 'yyyy-MM-dd')
    const startDateTime = new Date(`${dateStr}T${confirmedData.time}:00`)
    const endDateTime = addMinutes(startDateTime, confirmedData.service.duration_minutes || 30)

    const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '')
    const dates = `${formatGCal(startDateTime)}/${formatGCal(endDateTime)}`

    const title = `${confirmedData.service.name} • ${salon.name}`
    const details = `Agendamento confirmado no ${salon.name}\nProfissional: ${confirmedData.staff.name}\nCliente: ${confirmedData.clientName}\nValor: ${formatCurrency(confirmedData.service.price)}\n\nGerenciado por BelezaFlow`
    const location = salon.address || salon.name

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
  }

  // Gerar link para WhatsApp
  const getWhatsAppShareLink = () => {
    if (!confirmedData || !salon) return '#'
    const dateFormatted = format(confirmedData.date, "dd 'de' MMMM", { locale: ptBR })
    const msg = `*Agendamento Confirmado!*\n\nOlá! Agendei meu horário no *${salon.name}*:\n✨ *Serviço:* ${confirmedData.service.name}\n👤 *Profissional:* ${confirmedData.staff.name}\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${confirmedData.time} às ${confirmedData.endTime}\n💰 *Valor:* ${formatCurrency(confirmedData.service.price)}\n\n_Agendado online via BelezaFlow_`

    const salonPhoneDigits = salon.phone ? salon.phone.replace(/\D/g, '') : ''
    if (salonPhoneDigits.length >= 10) {
      return `https://wa.me/55${salonPhoneDigits}?text=${encodeURIComponent(msg)}`
    }
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  // Reset para novo agendamento
  const handleNewBooking = () => {
    setSelectedService(null)
    setSelectedStaff(null)
    setSelectedTime('')
    setClientName('')
    setClientPhone('')
    setClientEmail('')
    setClientNotes('')
    setConfirmedData(null)
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Tela de Carregando Salão
  if (loadingSalon) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-medium text-slate-900 mb-1">Carregando agendamento</h2>
          <p className="text-sm text-slate-500">Preparando horários e serviços exclusivos...</p>
        </div>
      </div>
    )
  }

  // Salão Não Encontrado
  if (salonNotFound || !salon) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Salão não encontrado</h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            O link de agendamento pode estar expirado ou incorreto. Verifique o endereço com o estabelecimento.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium py-3 px-6 rounded-xl transition-all shadow-md"
          >
            Acessar BelezaFlow
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      {/* 1. TOPO / PREVIEW DO SALÃO LUXO */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-3.5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {salon.logo_url ? (
                <img
                  src={salon.logo_url}
                  alt={salon.name}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-lg shadow-sm shrink-0 border border-amber-500/30">
                  {salon.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    Agendamento Online
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
                  {salon.name}
                </h1>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{salon.address || 'Atendimento com hora marcada'}</span>
                </p>
              </div>
            </div>

            {/* Informações rápidas de funcionamento */}
            <div className="hidden sm:flex flex-col items-end text-right text-xs shrink-0">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Funcionamento
              </span>
              <span className="font-medium text-slate-700">
                {salon.open_time.substring(0, 5)} às {salon.close_time.substring(0, 5)}
              </span>
            </div>
          </div>

          {/* BARRA DE PROGRESSO DO WIZARD (Steps 1 a 5) */}
          {step <= 5 && (
            <div className="mt-3.5 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5 px-0.5">
                <div className="flex items-center gap-1 text-slate-700 font-semibold">
                  {step > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="p-1 -ml-1 text-slate-400 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                      title="Voltar passo"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span>Passo {step} de 5</span>
                </div>
                <span className="text-amber-700 font-medium">
                  {step === 1 && '1. Escolher Serviço'}
                  {step === 2 && '2. Escolher Profissional'}
                  {step === 3 && '3. Escolher Data'}
                  {step === 4 && '4. Escolher Horário'}
                  {step === 5 && '5. Seus Dados & Confirmação'}
                </span>
              </div>

              {/* Linha de progresso */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
                {[1, 2, 3, 4, 5].map(stepNum => (
                  <div
                    key={stepNum}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      stepNum <= step ? 'bg-amber-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL DO WIZARD */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: ESCOLHER SERVIÇO */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Selecione o serviço desejado
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Escolha o procedimento ideal para o seu momento de beleza.
                </p>
              </div>

              {/* Categorias (Pills) */}
              {categories.length > 2 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full capitalize whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-amber-400 font-semibold shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'todos' ? 'Todos os serviços' : cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Lista de Cards de Serviços */}
              <div className="space-y-3">
                {filteredServices.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                    <Scissors className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">Nenhum serviço disponível nesta categoria.</p>
                  </div>
                ) : (
                  filteredServices.map(service => {
                    const isSelected = selectedService?.id === service.id
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white relative ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {service.category && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                                  {service.category}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {service.duration_minutes} min
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-base sm:text-lg font-bold text-slate-900 block">
                              {formatCurrency(service.price)}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full mt-2 ml-auto flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-amber-600 text-white'
                                  : 'border border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Botão de Avançar fixo/destaque */}
              <div className="pt-3">
                <button
                  type="button"
                  disabled={!selectedService}
                  onClick={handleNextStep}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    selectedService
                      ? 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar para Profissional</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: ESCOLHER PROFISSIONAL */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Com quem você deseja agendar?
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Selecione seu profissional de preferência ou escolha o primeiro livre.
                </p>
              </div>

              <div className="space-y-3">
                {/* Opção "Primeiro Disponível" */}
                <div
                  onClick={() => setSelectedStaff(anyStaffOption)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative flex items-center gap-4 ${
                    selectedStaff?.id === 'any'
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-300/60 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 uppercase">
                      Máxima agilidade
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">Qualquer Especialista</h3>
                    <p className="text-xs text-slate-500">Agendar com o primeiro profissional livre nesta data.</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-all ${
                      selectedStaff?.id === 'any'
                        ? 'bg-amber-600 text-white'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                {/* Lista de Profissionais da Casa */}
                {staffList.map(staff => {
                  const isSelected = selectedStaff?.id === staff.id
                  return (
                    <div
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative flex items-center gap-4 ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                      }`}
                    >
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 truncate">{staff.name}</h3>
                          {staff.rating && (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {staff.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{staff.role}</p>
                        {staff.specialties && staff.specialties.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-1 truncate">
                            {staff.specialties.join(' • ')}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botões de navegação */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!selectedStaff}
                  onClick={handleNextStep}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    selectedStaff
                      ? 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar para Data</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ESCOLHER DATA (Próximos 30 dias com scroll horizontal) */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Selecione o melhor dia
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Consulte os próximos 30 dias com agendamento aberto.
                </p>
              </div>

              {/* Controles do Carrossel de Datas */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Calendário de Disponibilidade
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollDays('left')}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Voltar dias"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollDays('right')}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Avançar dias"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Carrossel Horizontal */}
                <div
                  ref={dateScrollRef}
                  className="flex gap-2.5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth"
                >
                  {next30Days.map(day => {
                    const isSelected =
                      format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                    const isCurrentDay = isToday(day)
                    const isTomorrowDay = isTomorrow(day)

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day)
                          setSelectedTime('') // reseta horário ao trocar dia
                        }}
                        className={`flex flex-col items-center justify-between min-w-[76px] sm:min-w-[84px] py-3.5 px-2 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold tracking-wider uppercase ${
                            isSelected ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {format(day, 'EEE', { locale: ptBR })}
                        </span>
                        <span
                          className={`text-2xl font-bold my-1 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {format(day, 'dd')}
                        </span>
                        <span
                          className={`text-[11px] font-medium uppercase ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {format(day, 'MMM', { locale: ptBR })}
                        </span>

                        {/* Badges de Hoje / Amanhã */}
                        {isCurrentDay && (
                          <span
                            className={`mt-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-amber-500/30 text-amber-300'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            Hoje
                          </span>
                        )}
                        {isTomorrowDay && (
                          <span
                            className={`mt-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Amanhã
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Data selecionada em texto por extenso */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Data escolhida:</span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 capitalize">
                      {formatDateFull(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de navegação */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 transition-all shadow-md cursor-pointer"
                >
                  <span>Continuar para Horário</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: ESCOLHER HORÁRIO (Slots gerados pelo schedulingEngine) */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Escolha o melhor horário
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Horários calculados para {selectedService?.name} ({selectedService?.duration_minutes} min).
                </p>
              </div>

              {/* Resumo rápido do dia e profissional */}
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold capitalize">{formatDateFull(selectedDate)}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-amber-800">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedStaff?.name}</span>
                </div>
              </div>

              {/* Grid de Slots */}
              {availableSlots.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-slate-900">Sem horários livres nesta data</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Não encontramos horários disponíveis para a duração deste procedimento neste dia. Por favor, selecione outra data.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="mt-4 px-4 py-2 bg-slate-900 text-amber-400 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Trocar Data
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Manhã */}
                  {groupedSlots.morning.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Manhã (antes das 12h)
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {groupedSlots.morning.map(slot => {
                          const isSelected = selectedTime === slot.time
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                !slot.available
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tarde */}
                  {groupedSlots.afternoon.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Tarde (12h às 18h)
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {groupedSlots.afternoon.map(slot => {
                          const isSelected = selectedTime === slot.time
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                !slot.available
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Noite */}
                  {groupedSlots.evening.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Noite (após 18h)
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {groupedSlots.evening.map(slot => {
                          const isSelected = selectedTime === slot.time
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                !slot.available
                                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de navegação */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!selectedTime}
                  onClick={handleNextStep}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    selectedTime
                      ? 'bg-slate-900 hover:bg-slate-800 text-amber-400'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar para Confirmação</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: DADOS DO CLIENTE + CONFIRMAÇÃO */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Finalize seu agendamento
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Informe seus dados para contato e confirmação instantânea via WhatsApp.
                </p>
              </div>

              {/* Card Resumo do Agendamento */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Resumo do Pedido
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Serviço</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {selectedService?.name}
                    </span>
                    <span className="text-slate-500 block mt-0.5">
                      Duração: {selectedService?.duration_minutes} min
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Profissional</span>
                    <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      {selectedStaff?.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Data</span>
                    <span className="font-semibold text-slate-800 text-sm capitalize">
                      {formatDateFull(selectedDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Horário</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {selectedTime} às {calculateEndTime(selectedTime, selectedService?.duration_minutes || 30)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulário de Identificação */}
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Seus dados de contato
                  </h3>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={clientName}
                        onChange={e => {
                          setClientName(e.target.value)
                          if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }))
                        }}
                        placeholder="Ex: Amanda Albuquerque"
                        className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.name
                            ? 'border-rose-300 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500/20'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.name}</p>
                    )}
                  </div>

                  {/* WhatsApp / Telefone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp / Celular <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={handlePhoneChange}
                        placeholder="(11) 99999-9999"
                        className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.phone
                            ? 'border-rose-300 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500/20'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.phone}</p>
                    )}
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Enviaremos o lembrete e detalhes do seu agendamento neste número.
                    </span>
                  </div>

                  {/* E-mail (Opcional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail (opcional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Observações ou preferências (opcional)
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <textarea
                        rows={2}
                        value={clientNotes}
                        onChange={e => setClientNotes(e.target.value)}
                        placeholder="Ex: prefiro corte em camadas, primeira vez no salão..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePrevStep}
                    className="px-5 py-3.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-all shadow-lg active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                        <span>Confirmando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkle className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Confirmar Agendamento</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 6: TELA DE SUCESSO */}
          {step === 6 && confirmedData && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Card Cabeçalho Sucesso */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block mb-2">
                  Agendamento Confirmado
                </span>

                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Tudo pronto, {confirmedData.clientName.split(' ')[0]}!
                </h2>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Seu horário está reservado com sucesso no <span className="font-semibold text-slate-700">{salon.name}</span>.
                </p>

                {/* Recibo elegante com resumo detalhado */}
                <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/60">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400">Estabelecimento</span>
                    <span className="font-semibold text-slate-900">{salon.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400">Serviço</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {confirmedData.service.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400">Profissional</span>
                    <span className="font-semibold text-slate-900">{confirmedData.staff.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400">Data</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {formatDateFull(confirmedData.date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-400">Horário</span>
                    <span className="font-semibold text-slate-900">
                      {confirmedData.time} às {confirmedData.endTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-bold text-slate-700">Valor Total</span>
                    <span className="font-bold text-slate-900 text-base">
                      {formatCurrency(confirmedData.service.price)}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação da Tela de Sucesso */}
                <div className="mt-6 space-y-2.5">
                  {/* Adicionar ao Google Calendar */}
                  <a
                    href={getGoogleCalendarLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <CalendarPlus className="w-4 h-4 text-amber-600" />
                    <span>Adicionar ao Google Calendar</span>
                  </a>

                  {/* Compartilhar / Notificar via WhatsApp */}
                  <a
                    href={getWhatsAppShareLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Enviar Confirmação no WhatsApp</span>
                  </a>

                  {/* Fazer novo agendamento */}
                  <button
                    type="button"
                    onClick={handleNewBooking}
                    className="w-full py-3 px-4 rounded-xl font-medium text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors mt-2 cursor-pointer"
                  >
                    Fazer outro agendamento
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. FOOTER "Powered by BelezaFlow" */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-600 flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="font-bold tracking-tight text-slate-900">BelezaFlow</span>
            <span className="text-amber-600 font-bold">•</span>
            <span>Gestão Inteligente para Salões</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Ambiente de agendamento seguro e verificado.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default PublicBookingPage
