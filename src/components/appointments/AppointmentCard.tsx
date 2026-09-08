import { Clock, User, Scissors, Phone, XCircle, CheckCircle } from 'lucide-react'
import { AppointmentWithDetails } from '@/hooks/useAppointments'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface AppointmentCardProps {
  appointment: AppointmentWithDetails
  onCancel: (appointment: AppointmentWithDetails) => void
  onComplete: (appointment: AppointmentWithDetails) => void
}

export function AppointmentCard({ appointment, onCancel, onComplete }: AppointmentCardProps) {
  const statusConfig = {
    confirmed: { label: 'Confirmado', variant: 'success' as const, icon: CheckCircle },
    pending: { label: 'Pendente', variant: 'warning' as const, icon: Clock },
    completed: { label: 'Concluído', variant: 'info' as const, icon: CheckCircle },
    canceled: { label: 'Cancelado', variant: 'danger' as const, icon: XCircle },
  }

  const statusKey = (appointment.status in statusConfig ? appointment.status : 'pending') as keyof typeof statusConfig
  const config = statusConfig[statusKey]
  const StatusIcon = config.icon

  const timeValue = appointment.start_time || (appointment.date && appointment.time ? `${appointment.date}T${appointment.time}:00` : new Date())

  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md',
      appointment.status === 'canceled' && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--primary-color)', opacity: 0.1 }}
          >
            <Clock 
              className="h-5 w-5"
              style={{ color: 'var(--primary-color)' }}
            />
          </div>
          <div>
            <p className="font-bold text-slate-800">
              {formatTime(timeValue)}
            </p>
            <p className="text-xs text-slate-500">
              {appointment.service_duration || appointment.duration_minutes || 30}min
            </p>
          </div>
        </div>
        <Badge variant={config.variant}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Cliente */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-800">{appointment.client_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="h-4 w-4 text-slate-400" />
          <span>{appointment.client_phone}</span>
        </div>
      </div>

      {/* Serviço e Profissional */}
      <div className="space-y-1.5 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Scissors className="h-4 w-4 text-slate-400" />
            <span>{appointment.service_name}</span>
          </div>
          <span className="font-semibold text-emerald-600">
            {formatCurrency(appointment.service_price ?? appointment.price ?? 0)}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Com: <span className="font-medium text-slate-700">{appointment.staff_name}</span>
        </p>
      </div>

      {/* Actions */}
      {appointment.status === 'confirmed' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onComplete(appointment)}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            <CheckCircle className="h-4 w-4" />
            Concluir
          </button>
          <button
            onClick={() => onCancel(appointment)}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Cancelar"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
