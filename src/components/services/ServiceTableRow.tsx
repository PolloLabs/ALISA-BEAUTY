import { Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Service } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface ServiceTableRowProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onToggleStatus: (service: Service) => void
}

export function ServiceTableRow({ service, onEdit, onDelete, onToggleStatus }: ServiceTableRowProps) {
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}min`
    if (m === 0) return `${h}h`
    return `${h}h ${m}min`
  }

  return (
    <tr className={cn(
      'hover:bg-slate-50 transition-colors',
      !service.is_active && 'opacity-60'
    )}>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800">{service.name}</p>
          {service.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {service.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
        {formatCurrency(service.price)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatDuration(service.duration_minutes)}
      </td>
      <td className="px-4 py-3">
        <Badge variant={service.is_active ? 'success' : 'default'}>
          {service.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onToggleStatus(service)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={service.is_active ? 'Desativar' : 'Ativar'}
          >
            {service.is_active ? (
              <ToggleRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-slate-400" />
            )}
          </button>
          <button
            onClick={() => onEdit(service)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(service)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
