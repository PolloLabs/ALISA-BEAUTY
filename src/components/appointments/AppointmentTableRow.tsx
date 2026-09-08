import { Clock, User, Scissors, Phone, XCircle, CheckCircle } from 'lucide-react'
import { AppointmentWithDetails } from '@/hooks/useAppointments'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface AppointmentTableRowProps {
  appointment: AppointmentWithDetails
  onCancel: (appointment: AppointmentWithDetails) => void
  onComplete: (appointment: AppointmentWithDetails) => void
}

export function AppointmentTableRow({ appointment, onCancel, onComplete }: AppointmentTableRowProps) {
  const statusConfig = {
    confirmed: { label: 'Confirmado', variant: 'success' as const },
    pending: { label: 'Pendente', variant: 'warning' as const },
    completed: { label: 'Concluído', variant: 'info' as const },
    canceled: { label: 'Cancelado', variant: 'danger' as const },
  }

  const statusKey = (appointment.status in statusConfig ? appointment.status : 'pending') as keyof typeof statusConfig
  const config = statusConfig[statusKey]

  const timeValue = appointment.start_time || (appointment.date && appointment.time ? `${appointment.date}T${appointment.time}:00` : new Date())

  return (
    <tr className={cn(
      'hover:bg-slate-50 transition-colors',
      appointment.status === 'canceled' && 'opacity-60'
    )}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-800">
            {formatTime(timeValue)}
          </span>
          <span className="text-xs text-slate-500">
            ({appointment.service_duration || appointment.duration_minutes || 30}min)
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {appointment.client_name}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" />
            {appointment.client_phone}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-slate-800 flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5 text-slate-400" />
            {appointment.service_name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Com: {appointment.staff_name}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
        {formatCurrency(appointment.service_price ?? appointment.price ?? 0)}
      </td>
      <td className="px-4 py-3">
        <Badge variant={config.variant}>{config.label}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => onComplete(appointment)}
                className="h-9 px-3 rounded-lg flex items-center justify-center gap-1 text-sm font-medium text-white transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--primary-color)' }}
                title="Concluir"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => onCancel(appointment)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="Cancelar"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
