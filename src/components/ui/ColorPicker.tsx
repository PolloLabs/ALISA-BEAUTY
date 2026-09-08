import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

const presetColors = [
  { name: 'Rosa', value: '#f43f5e' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Preto', value: '#1e293b' },
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-slate-700">
        Cor principal
      </label>
      
      <div className="flex flex-wrap gap-2">
        {presetColors.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={cn(
              'h-10 w-10 rounded-lg border-2 transition-all hover:scale-110',
              value === color.value 
                ? 'border-slate-800 ring-2 ring-slate-800 ring-offset-2' 
                : 'border-slate-200'
            )}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={`Selecionar cor ${color.name}`}
          />
        ))}
      </div>

      {/* Input customizado */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded-lg border border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono"
          placeholder="#f43f5e"
        />
      </div>
    </div>
  )
}
