import { addMinutes, format, isBefore, isAfter, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * MOTOR DE AGENDAMENTO - O coração do sistema
 * Gera horários disponíveis respeitando:
 * - Horário de funcionamento do salão
 * - Duração do serviço
 * - Agendamentos existentes
 * - Bloqueios (almoço, folgas)
 * - Intervalo entre agendamentos
 */

export interface TimeSlot {
  time: string // "HH:mm"
  available: boolean
  reason?: 'occupied' | 'blocking' | 'outside_hours' | 'too_close_to_close'
}

export interface SalonHours {
  open_time: string // "HH:mm:ss" ou "HH:mm"
  close_time: string // "HH:mm:ss" ou "HH:mm"
}

export interface ExistingAppointment {
  start_time: string // ISO string
  end_time: string // ISO string
}

export interface StaffBlocking {
  block_date: string // "YYYY-MM-DD"
  start_time: string // "HH:mm:ss" ou "HH:mm"
  end_time: string // "HH:mm:ss" ou "HH:mm"
}

interface GenerateSlotsParams {
  date: Date
  salonHours: SalonHours
  serviceDurationMinutes: number
  existingAppointments: ExistingAppointment[]
  staffBlockings: StaffBlocking[]
  intervalMinutes?: number // Intervalo entre agendamentos (padrão 15)
}

/**
 * Normaliza horário para formato "HH:mm"
 */
function normalizeTime(time: string): string {
  return time.substring(0, 5)
}

/**
 * Converte "HH:mm" para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Converte minutos desde meia-noite para "HH:mm"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Gera todos os slots de horário disponíveis para uma data/profissional/serviço
 */
export function generateAvailableSlots({
  date,
  salonHours,
  serviceDurationMinutes,
  existingAppointments,
  staffBlockings,
  intervalMinutes = 15,
}: GenerateSlotsParams): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  const openMinutes = timeToMinutes(normalizeTime(salonHours.open_time || '08:00'))
  const closeMinutes = timeToMinutes(normalizeTime(salonHours.close_time || '19:00'))
  
  // Se horário inválido, retorna vazio
  if (openMinutes >= closeMinutes) return []
  
  const dateStr = format(date, 'yyyy-MM-dd')
  
  // Gera slots de 30 em 30 minutos (padrão)
  const slotStep = 30
  
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += slotStep) {
    const slotEnd = minutes + serviceDurationMinutes
    const slotTime = minutesToTime(minutes)
    
    // Verifica se o serviço cabe antes do fechamento
    if (slotEnd > closeMinutes) {
      slots.push({
        time: slotTime,
        available: false,
        reason: 'too_close_to_close',
      })
      continue
    }
    
    // Converte para intervalos de Date para verificação
    const slotStart = setMinutes(setHours(date, Math.floor(minutes / 60)), minutes % 60)
    const slotEnd2 = addMinutes(slotStart, serviceDurationMinutes)
    
    // Verifica conflito com agendamentos existentes
    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.start_time)
      const aptEnd = new Date(apt.end_time)
      
      // Verifica sobreposição
      return (
        (isBefore(slotStart, aptEnd) && isAfter(slotEnd2, aptStart)) ||
        (slotStart.getTime() === aptStart.getTime())
      )
    })
    
    if (hasConflict) {
      slots.push({
        time: slotTime,
        available: false,
        reason: 'occupied',
      })
      continue
    }
    
    // Verifica conflito com bloqueios do profissional
    const hasBlocking = staffBlockings
      .filter(b => b.block_date === dateStr)
      .some((blocking) => {
        const blockStartMin = timeToMinutes(normalizeTime(blocking.start_time))
        const blockEndMin = timeToMinutes(normalizeTime(blocking.end_time))
        
        // Verifica sobreposição
        return minutes < blockEndMin && slotEnd > blockStartMin
      })
    
    if (hasBlocking) {
      slots.push({
        time: slotTime,
        available: false,
        reason: 'blocking',
      })
      continue
    }
    
    // Slot disponível!
    slots.push({
      time: slotTime,
      available: true,
    })
  }
  
  return slots
}

/**
 * Calcula o horário de fim baseado no início e duração
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + durationMinutes
  return minutesToTime(totalMinutes)
}

/**
 * Verifica se um horário específico está disponível
 */
export function isTimeSlotAvailable(
  date: Date,
  time: string,
  serviceDurationMinutes: number,
  existingAppointments: ExistingAppointment[],
  staffBlockings: StaffBlocking[]
): boolean {
  const [h, m] = time.split(':').map(Number)
  const slotStart = setMinutes(setHours(date, h), m)
  const slotEnd = addMinutes(slotStart, serviceDurationMinutes)
  
  // Verifica conflito com agendamentos
  const hasConflict = existingAppointments.some((apt) => {
    const aptStart = new Date(apt.start_time)
    const aptEnd = new Date(apt.end_time)
    return isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart)
  })
  
  if (hasConflict) return false
  
  // Verifica conflito com bloqueios
  const dateStr = format(date, 'yyyy-MM-dd')
  const slotStartMin = h * 60 + m
  const slotEndMin = slotStartMin + serviceDurationMinutes
  
  const hasBlocking = staffBlockings
    .filter(b => b.block_date === dateStr)
    .some((blocking) => {
      const blockStartMin = timeToMinutes(normalizeTime(blocking.start_time))
      const blockEndMin = timeToMinutes(normalizeTime(blocking.end_time))
      return slotStartMin < blockEndMin && slotEndMin > blockStartMin
    })
  
  return !hasBlocking
}

/**
 * Formata data para exibição amigável
 */
export function formatAppointmentDate(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  if (diffDays === -1) return 'Ontem'
  
  return format(date, "dd 'de' MMM", { locale: ptBR })
}
