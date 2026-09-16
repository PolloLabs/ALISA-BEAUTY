import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Percent, Briefcase, Lock, Eye, EyeOff, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { InputMaskField } from '@/components/ui/InputMask'
import { useUnits } from '@/hooks/useUnits'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'

const jobTitleOptions = [
  'Cabeleireiro(a)',
  'Barbeiro(a)',
  'Manicure',
  'Pedicure',
  'Esteticista',
  'Maquiador(a)',
  'Designer de Sobrancelhas',
  'Colorista',
  'Auxiliar',
  'Outro',
]

export const staffFormSchema = z.object({
  full_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome contém caracteres inválidos'),
  phone: z.string()
    .min(14, 'Telefone deve ter pelo menos 10 dígitos')
    .refine((val) => val.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  email: z.string()
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .optional()
    .or(z.literal('')),
  job_title: z.string()
    .min(1, 'Selecione uma função')
    .max(50, 'Função muito longa'),
  commission_rate: z.number()
    .min(0, 'Mínimo 0%')
    .max(100, 'Máximo 100%')
    .refine((val) => !isNaN(val), 'Valor inválido'),
  unit_ids: z.array(z.string()).optional(),
})

export type StaffFormData = z.infer<typeof staffFormSchema>

interface StaffFormProps {
  defaultValues?: Partial<StaffFormData>
  onSubmit: (data: StaffFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function StaffForm({ defaultValues, onSubmit, onCancel, isLoading }: StaffFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isEditing = !!defaultValues?.full_name
  const { can } = usePlan()
  const { units } = useUnits()
  const hasMultiUnits = can('multi_unidades') && units && units.length > 0

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      job_title: 'Cabeleireiro(a)',
      commission_rate: 50,
      unit_ids: [],
      ...defaultValues,
    },
  })

  const phoneValue = watch('phone')
  const commissionValue = watch('commission_rate')
  const selectedUnitIds = watch('unit_ids') || []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nome completo *"
        placeholder="Ex: Ana Clara Cavalcante"
        leftIcon={<User className="h-4 w-4" />}
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <InputMaskField
        mask="(99) 99999-9999"
        label="Telefone / WhatsApp *"
        placeholder="(11) 98765-4321"
        value={phoneValue || ''}
        onChange={(e) => setValue('phone', e.target.value, { shouldValidate: true })}
      />
      {errors.phone && (
        <p className="text-xs text-red-500 -mt-2">{errors.phone.message}</p>
      )}

      <Input
        label="E-mail de Acesso (Login) *"
        type="email"
        placeholder="ana@belezaflow.com"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Campo de Senha do Profissional */}
      <div className="relative">
        <Input
          label={isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso do Profissional *'}
          type={showPassword ? 'text' : 'password'}
          placeholder="Mínimo 6 caracteres (ex: prof123)"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title={showPassword ? 'Ocultar senha' : 'Ver senha'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Campo de Função */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-1.5">
          Função do Profissional *
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600 pointer-events-none" />
          <select
            className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
            value={watch('job_title')}
            onChange={(e) => setValue('job_title', e.target.value, { shouldValidate: true })}
          >
            {jobTitleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {errors.job_title && (
          <p className="mt-1.5 text-xs text-red-500">{errors.job_title.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-slate-900">
            Taxa de Comissão do Especialista
          </label>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
            {commissionValue}%
          </span>
        </div>
        <div className="relative">
          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600 pointer-events-none" />
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-12 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={commissionValue}
            onChange={(e) => setValue('commission_rate', parseFloat(e.target.value) || 0, { shouldValidate: true })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
            %
          </span>
        </div>
        {errors.commission_rate && (
          <p className="mt-1.5 text-xs text-red-500">{errors.commission_rate.message}</p>
        )}
        <p className="mt-1 text-xs text-slate-600">
          O profissional receberá <span className="font-semibold text-amber-600">{commissionValue}%</span> do valor de cada atendimento registrado
        </p>
      </div>

      {hasMultiUnits && (
        <div className="pt-2 border-t border-slate-200">
          <label className="block text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-600" />
            Unidades de Atendimento
          </label>
          <p className="text-xs text-slate-500 mb-2.5">
            Selecione em quais unidades este profissional atende:
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {units.map((u) => {
              const isChecked = selectedUnitIds.includes(u.id)
              return (
                <label
                  key={u.id}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors',
                    isChecked
                      ? 'border-amber-500 bg-amber-50/60 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('unit_ids', [...selectedUnitIds, u.id])
                      } else {
                        setValue('unit_ids', selectedUnitIds.filter((id) => id !== u.id))
                      }
                    }}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1 truncate">
                    <span className="font-semibold block truncate text-slate-900">{u.name}</span>
                    <span className="text-[11px] text-slate-500 truncate block">{u.address}</span>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 h-11 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-medium text-amber-500 bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 min-h-[44px] cursor-pointer"
        >
          {isLoading ? 'Salvando...' : 'Salvar profissional'}
        </button>
      </div>
    </form>
  )
}
