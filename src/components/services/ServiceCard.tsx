import { Edit2, Trash2, ToggleLeft, ToggleRight, Clock, DollarSign } from 'lucide-react'
import { Service } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onToggleStatus: (service: Service) => void
}

export function ServiceCard({ service, onEdit, onDelete, onToggleStatus }: ServiceCardProps) {
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md',
      !service.is_active && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">
            {service.name}
          </h3>
          {service.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {service.description}
            </p>
          )}
        </div>
        <Badge variant={service.is_active ? 'success' : 'default'}>
          {service.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-700">
          <DollarSign className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold">{formatCurrency(service.price)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>{formatDuration(service.duration_minutes)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onEdit(service)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Edit2 className="h-4 w-4" />
          Editar
        </button>
        <button
          onClick={() => onToggleStatus(service)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={service.is_active ? 'Desativar' : 'Ativar'}
        >
          {service.is_active ? (
            <>
              <ToggleRight className="h-4 w-4 text-emerald-500" />
              Desativar
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4 text-slate-400" />
              Ativar
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(service)}
          className="flex items-center justify-center h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
