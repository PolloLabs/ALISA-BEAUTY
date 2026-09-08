import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scissors, Clock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

export const serviceFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  description: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .min(0, 'Preço deve ser positivo')
    .max(99999, 'Preço muito alto'),
  duration_minutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Mínimo 15 minutos')
    .max(480, 'Máximo 8 horas'),
})

export type ServiceFormData = z.infer<typeof serviceFormSchema>

interface ServiceFormProps {
  defaultValues?: Partial<ServiceFormData>
  onSubmit: (data: ServiceFormData) => Promise<void>
  isLoading?: boolean
}

export function ServiceForm({ defaultValues, onSubmit, isLoading }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      duration_minutes: 60,
      ...defaultValues,
    },
  })

  const priceValue = watch('price')
  const durationValue = watch('duration_minutes')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nome do serviço"
        placeholder="Ex: Corte Feminino, Barba Completa"
        leftIcon={<Scissors className="h-4 w-4" />}
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Descrição (opcional)
        </label>
        <textarea
          placeholder="Detalhes sobre o serviço..."
          rows={3}
          className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CurrencyInput
          label="Preço"
          value={priceValue}
          onChange={(val) => setValue('price', val, { shouldValidate: true })}
          error={errors.price?.message}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Duração (minutos)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={durationValue}
              onChange={(e) => setValue('duration_minutes', parseInt(e.target.value, 10) || 0, { shouldValidate: true })}
            />
          </div>
          {errors.duration_minutes && (
            <p className="mt-1.5 text-xs text-red-500">{errors.duration_minutes.message}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Equivale a {Math.floor(durationValue / 60)}h {durationValue % 60}min
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-medium text-white transition-colors disabled:opacity-50 min-h-[44px] cursor-pointer"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          {isLoading ? 'Salvando...' : 'Salvar serviço'}
        </button>
      </div>
    </form>
  )
}
