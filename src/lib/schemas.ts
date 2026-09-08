import { z } from 'zod'

/**
 * Schemas de validação reutilizáveis em todo o sistema
 * Usado com React Hook Form + Zod resolver
 */

export const phoneSchema = z
  .string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone muito longo')
  .refine((val) => val.replace(/\D/g, '').length >= 10, 'Telefone inválido')

export const emailSchema = z
  .string()
  .email('E-mail inválido')
  .max(255, 'E-mail muito longo')

export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha muito longa')

export const nameSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome contém caracteres inválidos')

// Schema de Login
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginFormData = z.infer<typeof loginSchema>

// Schema de Cadastro
export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Schema de Serviço
export const serviceSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  duration_minutes: z.number().int().min(15, 'Mínimo 15 minutos').max(480, 'Máximo 8 horas'),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

// Schema de Funcionário
export const staffSchema = z.object({
  full_name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  commission_rate: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
})

export type StaffFormData = z.infer<typeof staffSchema>

// Schema de Agendamento
export const appointmentSchema = z.object({
  client_name: nameSchema,
  client_phone: phoneSchema,
  service_id: z.string().min(1, 'Selecione um serviço'),
  staff_id: z.string().min(1, 'Selecione um profissional'),
  date: z.string().min(1, 'Selecione uma data'),
  time: z.string().min(1, 'Selecione um horário'),
  notes: z.string().max(500).optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

// Schema de Salão
export const salonSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  phone: phoneSchema,
  address: z.string().max(255).optional(),
  open_time: z.string().min(1, 'Horário de abertura obrigatório'),
  close_time: z.string().min(1, 'Horário de fechamento obrigatório'),
  primary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  logo_url: z.string().nullable().optional(),
})

export type SalonFormData = z.infer<typeof salonSchema>
