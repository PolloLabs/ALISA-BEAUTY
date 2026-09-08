import { useState, useEffect } from 'react'
import { StaffMember } from '@/hooks/useStaff'
import { Modal } from '@/components/ui/Modal'
import { StaffForm, StaffFormData } from './StaffForm'

interface StaffModalProps {
  isOpen: boolean
  onClose: () => void
  staff: StaffMember | null
  onSave: (data: StaffFormData) => Promise<boolean>
}

export function StaffModal({ isOpen, onClose, staff, onSave }: StaffModalProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) setLoading(false)
  }, [isOpen])

  const handleSubmit = async (data: StaffFormData) => {
    setLoading(true)
    const success = await onSave(data)
    setLoading(false)
    if (success) onClose()
  }

  const isEditing = !!staff

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Profissional' : 'Novo Profissional'}
      size="md"
    >
      <p className="text-sm text-slate-600 mb-4">
        {isEditing 
          ? 'Atualize os dados do profissional da equipe'
          : 'Cadastre membros da equipe para organizar a agenda e calcular comissões'
        }
      </p>
      <StaffForm
        defaultValues={
          staff
            ? {
                full_name: staff.full_name || '',
                phone: staff.phone || '',
                email: staff.email || '',
                job_title: staff.job_title || 'Cabeleireiro(a)',
                commission_rate: staff.commission_rate,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isLoading={loading}
        onCancel={onClose}
      />
    </Modal>
  )
}
