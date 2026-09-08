import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata valor em Real brasileiro
 * @example formatCurrency(1234.5) // "R$ 1.234,50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data em formato brasileiro
 * @example formatDate('2026-09-08T14:00:00Z') // "08 de set, 2026"
 */
export function formatDate(date: string | Date, pattern: string = "dd 'de' MMM, yyyy"): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

/**
 * Formata data completa com dia da semana
 * @example formatDateFull('2026-09-08') // "Terça-feira, 08 de setembro de 2026"
 */
export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Formata hora
 * @example formatTime('2026-09-08T14:30:00Z') // "14:30"
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

/**
 * Formata data e hora juntos
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/**
 * Formata data relativa (há 2 horas, ontem, etc)
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

/**
 * Formata telefone brasileiro
 * @example formatPhone('11999887766') // "(11) 99988-7766"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

/**
 * Formata número com separadores
 * @example formatNumber(1234) // "1.234"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Formata porcentagem
 * @example formatPercentage(50.5) // "50,5%"
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value / 100)
}
