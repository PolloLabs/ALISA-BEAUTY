import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

/**
 * Modal de confirmação para ações destrutivas
 * @example
 * <ConfirmDialog
 *   isOpen={confirmDelete}
 *   onClose={() => setConfirmDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir serviço?"
 *   description="Esta ação não pode ser desfeita."
 *   variant="danger"
 *   confirmLabel="Sim, excluir"
 * />
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: 'bg-red-50 text-red-500',
      button: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'bg-amber-50 text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      icon: 'bg-rose-50 text-rose-500',
      button: 'bg-rose-500 hover:bg-rose-600 text-white',
    },
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${variantStyles[variant].icon}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-600 pt-2">
            {description}
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm}
            isLoading={isLoading}
            className={variantStyles[variant].button}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
