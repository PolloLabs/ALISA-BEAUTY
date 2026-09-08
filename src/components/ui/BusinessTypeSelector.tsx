import { BusinessType } from '@/types'
import { businessConfigs } from '@/lib/businessConfig'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface BusinessTypeSelectorProps {
  value: BusinessType
  onChange: (type: BusinessType) => void
  className?: string
}

export function BusinessTypeSelector({ value, onChange, className }: BusinessTypeSelectorProps) {
  const types: BusinessType[] = ['beauty_salon', 'barbershop', 'unisex', 'nail_studio']

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm font-medium text-slate-700">
        Tipo de estabelecimento
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((type) => {
          const config = businessConfigs[type]
          const Icon = config.icon
          const isSelected = value === type

          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer',
                'hover:shadow-md',
                isSelected
                  ? 'border-slate-800 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Badge de seleção */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Ícone com cor do preset */}
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${config.defaultColor}20` }}
              >
                <Icon 
                  className="h-6 w-6"
                  style={{ color: config.defaultColor }}
                />
              </div>

              {/* Label */}
              <h3 className="font-semibold text-slate-800 mb-1">
                {config.label}
              </h3>
              
              {/* Descrição */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {config.description}
              </p>

              {/* Preview de cores */}
              <div className="flex gap-1 mt-3">
                {config.colorPresets.slice(0, 5).map((preset) => (
                  <div
                    key={preset.value}
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
