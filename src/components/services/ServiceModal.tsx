import { useState, useEffect } from 'react'
import { Service } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { ServiceForm, ServiceFormData } from './ServiceForm'

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service | null
  onSave: (data: ServiceFormData) => Promise<boolean>
}

export function ServiceModal({ isOpen, onClose, service, onSave }: ServiceModalProps) {
  const [loading, setLoading] = useState(false)

  // Reset loading quando modal abre/fecha
  useEffect(() => {
    if (!isOpen) setLoading(false)
  }, [isOpen])

  const handleSubmit = async (data: ServiceFormData) => {
    setLoading(true)
    const success = await onSave(data)
    setLoading(false)
    if (success) onClose()
  }

  const isEditing = !!service

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar serviço' : 'Novo serviço'}
      size="md"
    >
      <ServiceForm
        defaultValues={
          service
            ? {
                name: service.name,
                description: service.description || '',
                price: service.price,
                duration_minutes: service.duration_minutes,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </Modal>
  )
}
