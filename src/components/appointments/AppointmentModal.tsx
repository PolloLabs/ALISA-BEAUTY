import { useState, useEffect, useMemo } from 'react'
import { AppointmentWithDetails } from '@/hooks/useAppointments'
import { Modal } from '@/components/ui/Modal'
import { AppointmentForm, AppointmentFormData } from './AppointmentForm'
import { AlertCircle } from 'lucide-react'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: AppointmentWithDetails | null
  onSave: (data: AppointmentFormData) => Promise<boolean | void>
  initialDate?: string
}

export function AppointmentModal({ isOpen, onClose, appointment, onSave, initialDate }: AppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setLoading(false)
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const success = await onSave(data)
      if (success !== false) {
        onClose()
      }
    } catch (err: unknown) {
      console.error('[AppointmentModal] Erro ao processar agendamento:', err)
      const msg = err instanceof Error ? err.message : 'Falha ao salvar agendamento'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const formDefaultValues = useMemo(() => {
    if (appointment) {
      return {
        client_name: appointment.client_name,
        client_phone: appointment.client_phone || '',
        service_id: appointment.service_id,
        staff_id: appointment.staff_id || appointment.professional_id || '',
        date: appointment.date || (appointment.start_time ? appointment.start_time.substring(0, 10) : ''),
        time: appointment.time || (appointment.start_time ? appointment.start_time.substring(11, 16) : ''),
        notes: appointment.notes || '',
      }
    }
    if (initialDate) {
      return { date: initialDate }
    }
    return undefined
  }, [
    appointment?.id,
    appointment?.client_name,
    appointment?.client_phone,
    appointment?.service_id,
    appointment?.staff_id,
    appointment?.date,
    appointment?.time,
    appointment?.notes,
    initialDate,
  ])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
      subtitle="Defina o cliente, procedimento, profissional e horário"
      size="lg"
      className="border border-slate-200/80 shadow-2xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro ao salvar agendamento</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {isOpen && (
          <AppointmentForm
            defaultValues={formDefaultValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={loading}
          />
        )}
      </div>
    </Modal>
  )
}

export default AppointmentModal

