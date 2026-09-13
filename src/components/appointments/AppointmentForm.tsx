import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Clock, Scissors, Users, Calendar, AlertCircle, FileText, Sparkles, Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { InputMaskField } from '@/components/ui/InputMaskField'
import { useSalon } from '@/hooks/useSalon'
import { useServices } from '@/hooks/useServices'
import { useStaff, StaffMember } from '@/hooks/useStaff'
import { useAppointments } from '@/hooks/useAppointments'
import { generateAvailableSlots, calculateEndTime, TimeSlot } from '@/lib/schedulingEngine'
import { Service } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export const appointmentFormSchema = z.object({
  client_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  client_phone: z.string()
    .min(14, 'Telefone deve ter pelo menos 10 dígitos')
    .refine((val) => val.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  client_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  service_id: z.string().min(1, 'Selecione um serviço'),
  staff_id: z.string().min(1, 'Selecione um profissional'),
  date: z.string().min(1, 'Selecione uma data'),
  time: z.string().min(1, 'Selecione um horário'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>

interface AppointmentFormProps {
  defaultValues?: Partial<AppointmentFormData>
  onSubmit: (data: AppointmentFormData) => Promise<boolean | void>
  onCancel?: () => void
  isLoading?: boolean
}

export function AppointmentForm({ defaultValues, onSubmit, onCancel, isLoading }: AppointmentFormProps) {
  const { salon } = useSalon()
  const servicesHook = useServices()
  const staffHook = useStaff()
  const appointmentsHook = useAppointments()

  const getAllActiveServices = servicesHook?.getAllActiveServices
  const getAllActiveStaff = staffHook?.getAllActiveStaff
  const appointments = appointmentsHook?.appointments || []
  const getStaffBlockings = appointmentsHook?.getStaffBlockings

  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      client_name: '',
      client_phone: '',
      service_id: '',
      staff_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      notes: '',
      ...defaultValues,
    },
  })

  const selectedServiceId = watch('service_id')
  const selectedStaffId = watch('staff_id')
  const selectedDate = watch('date')
  const selectedTime = watch('time')
  const phoneValue = watch('client_phone')

  // Carrega serviços e profissionais com logs diagnósticos e fallbacks seguros
  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      setLoadingData(true)
      try {
        const servicesPromise = getAllActiveServices 
          ? getAllActiveServices().catch(err => {
              console.error('[AppointmentForm] Falha ao buscar serviços:', err)
              return []
            }) 
          : Promise.resolve([])

        const staffPromise = getAllActiveStaff 
          ? getAllActiveStaff().catch(err => {
              console.error('[AppointmentForm] Falha ao buscar profissionais:', err)
              return []
            }) 
          : Promise.resolve([])

        const [servicesData, staffData] = await Promise.all([servicesPromise, staffPromise])

        if (isMounted) {
          setServices(Array.isArray(servicesData) ? (servicesData as Service[]) : [])
          setStaffList(Array.isArray(staffData) ? (staffData as StaffMember[]) : [])
        }
      } catch (err) {
        console.error('[AppointmentForm] Erro crítico no carregamento inicial:', err)
        if (isMounted) {
          setServices([])
          setStaffList([])
        }
      } finally {
        if (isMounted) setLoadingData(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [salon?.id])

  // Gera slots disponíveis quando muda serviço, profissional ou data
  useEffect(() => {
    let isMounted = true

    if (!selectedServiceId || !selectedStaffId || !selectedDate) {
      setAvailableSlots([])
      return
    }

    const generateSlots = async () => {
      setLoadingSlots(true)
      try {
        const service = services.find((s) => s.id === selectedServiceId)
        if (!service) {
          if (isMounted) setAvailableSlots([])
          return
        }

        const date = new Date(selectedDate + 'T00:00:00')
        
        // Agendamentos existentes do profissional
        const staffAppointments = (appointments || [])
          .filter((apt) => 
            (apt.staff_id === selectedStaffId || apt.professional_id === selectedStaffId) && 
            apt.status !== 'canceled' && 
            apt.status !== 'cancelado'
          )
          .map((apt) => ({
            start_time: apt.start_time || `${apt.date || selectedDate}T${apt.time || '00:00'}:00`,
            end_time: apt.end_time || `${apt.date || selectedDate}T${calculateEndTime(apt.time || '00:00', apt.duration_minutes || 30)}:00`,
          }))

        // Bloqueios do profissional
        let blockings: any[] = []
        if (getStaffBlockings) {
          try {
            blockings = await getStaffBlockings(selectedStaffId, date)
          } catch (err) {
            console.warn('[AppointmentForm] Não foi possível carregar bloqueios:', err)
          }
        }

        const openTime = salon?.open_time || '08:00'
        const closeTime = salon?.close_time || '19:00'

        const slots = generateAvailableSlots({
          date,
          salonHours: {
            open_time: openTime,
            close_time: closeTime,
          },
          serviceDurationMinutes: service.duration_minutes || 30,
          existingAppointments: staffAppointments,
          staffBlockings: Array.isArray(blockings) ? blockings : [],
        })

        if (isMounted) {
          setAvailableSlots(slots)
        }
      } catch (error) {
        console.error('[AppointmentForm] Erro ao calcular slots disponíveis:', error)
        if (isMounted) setAvailableSlots([])
      } finally {
        if (isMounted) setLoadingSlots(false)
      }
    }

    generateSlots()
    return () => {
      isMounted = false
    }
  }, [
    selectedServiceId, 
    selectedStaffId, 
    selectedDate, 
    services, 
    salon?.id,
    salon?.open_time, 
    salon?.close_time
  ])

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const endTime = selectedTime && selectedService 
    ? calculateEndTime(selectedTime, selectedService.duration_minutes || 30)
    : null

  // Datas disponíveis (próximos 30 dias)
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i)
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, "dd/MM (EEE)", { locale: ptBR }),
      isToday: i === 0,
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* SEÇÃO 1: Dados do Cliente */}
      <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
          <div className="w-6 h-6 rounded-md bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <User className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Dados do Cliente
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome Completo"
            placeholder="Ex: Maria Clara Silva"
            leftIcon={<User className="h-4 w-4 text-slate-400" />}
            error={errors.client_name?.message}
            {...register('client_name')}
          />

          <InputMaskField
            mask="(99) 99999-9999"
            label="WhatsApp / Telefone"
            placeholder="(11) 98765-4321"
            value={phoneValue || ''}
            onChange={(e) => setValue('client_phone', e.target.value, { shouldValidate: true })}
            error={errors.client_phone?.message}
          />
        </div>

        <div>
          <Input
            type="email"
            label="E-mail (opcional)"
            placeholder="cliente@email.com"
            leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
            error={errors.client_email?.message}
            {...register('client_email')}
          />
        </div>
      </div>

      {/* SEÇÃO 2: Serviço e Profissional */}
      <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
          <div className="w-6 h-6 rounded-md bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Serviço & Atendente
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Seletor de Serviço */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Procedimento / Serviço <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Scissors className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all"
                value={selectedServiceId}
                onChange={(e) => {
                  setValue('service_id', e.target.value, { shouldValidate: true })
                  setValue('time', '')
                }}
                disabled={loadingData}
              >
                <option value="">
                  {loadingData ? 'Carregando procedimentos...' : 'Selecione um serviço'}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — R$ {Number(service.price).toFixed(2).replace('.', ',')} ({service.duration_minutes}min)
                  </option>
                ))}
              </select>
            </div>
            {errors.service_id && (
              <p className="text-xs text-rose-500">{errors.service_id.message}</p>
            )}
          </div>

          {/* Seletor de Profissional */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Profissional Especialista <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 appearance-none cursor-pointer transition-all"
                value={selectedStaffId}
                onChange={(e) => {
                  setValue('staff_id', e.target.value, { shouldValidate: true })
                  setValue('time', '')
                }}
                disabled={loadingData}
              >
                <option value="">
                  {loadingData ? 'Carregando equipe...' : 'Selecione um profissional'}
                </option>
                {staffList.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name || 'Profissional'}
                  </option>
                ))}
              </select>
            </div>
            {errors.staff_id && (
              <p className="text-xs text-rose-500">{errors.staff_id.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Data e Horário */}
      <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
          <div className="w-6 h-6 rounded-md bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Data & Horário de Atendimento
          </h3>
        </div>

        {/* Grade de Datas */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Selecione a Data
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {availableDates.map((dateOption) => {
              const isSelected = selectedDate === dateOption.value
              return (
                <button
                  key={dateOption.value}
                  type="button"
                  onClick={() => {
                    setValue('date', dateOption.value, { shouldValidate: true })
                    setValue('time', '')
                  }}
                  className={cn(
                    'flex-shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all min-w-[90px] text-center border cursor-pointer',
                    isSelected
                      ? 'bg-slate-900 text-amber-400 border-slate-800 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50/30'
                  )}
                >
                  <span className="block font-semibold">
                    {dateOption.isToday ? 'Hoje' : dateOption.label.split(' ')[0]}
                  </span>
                  <span className="text-[10px] opacity-75 block">
                    {dateOption.isToday ? dateOption.label : dateOption.label.split(' ')[1]}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.date && (
            <p className="text-xs text-rose-500">{errors.date.message}</p>
          )}
        </div>

        {/* Grade de Horários Disponíveis */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Horários Disponíveis
          </label>

          {!selectedServiceId || !selectedStaffId ? (
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Selecione um serviço e um profissional acima para visualizar a grade de horários.</span>
            </div>
          ) : loadingSlots ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-center text-xs text-amber-800">
              Nenhum horário disponível para o profissional selecionado nesta data.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot.time
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setValue('time', slot.time, { shouldValidate: true })}
                    className={cn(
                      'h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center border',
                      slot.available
                        ? isSelected
                          ? 'bg-slate-900 text-amber-400 border-slate-800 shadow-md scale-105 ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/40'
                        : 'bg-slate-100/70 border-slate-100 text-slate-400 cursor-not-allowed line-through'
                    )}
                    title={!slot.available ? 'Horário ocupado ou indisponível' : ''}
                  >
                    {slot.time}
                  </button>
                )
              })}
            </div>
          )}
          {errors.time && (
            <p className="text-xs text-rose-500">{errors.time.message}</p>
          )}

          {/* Destaque do Horário Selecionado */}
          {selectedTime && endTime && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Horário reservado: <strong>{selectedTime} às {endTime}</strong>
                  {selectedService && ` (${selectedService.duration_minutes} min)`}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Confirmado
              </span>
            </div>
          )}
        </div>

        {/* Observações Opcionais */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Observações / Requisitos Especiais (Opcional)
          </label>
          <div className="relative">
            <textarea
              placeholder="Ex: Cliente tem alergia a certos produtos; prefere corte com tesoura..."
              rows={2}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none transition-all"
              {...register('notes')}
            />
          </div>
        </div>
      </div>

      {/* Ações do Rodapé com Tema Luxo */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-semibold text-xs sm:text-sm border border-slate-800 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 min-w-[160px]"
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>{isLoading ? 'Confirmando...' : 'Confirmar Agendamento'}</span>
        </button>
      </div>
    </form>
  )
}

export default AppointmentForm
