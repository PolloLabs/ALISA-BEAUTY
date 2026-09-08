import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Empty state profissional para listas vazias
 * @example
 * <EmptyState
 *   icon={Scissors}
 *   title="Nenhum serviço cadastrado"
 *   description="Comece adicionando os serviços do seu salão"
 *   actionLabel="Adicionar serviço"
 *   onAction={() => setOpenModal(true)}
 * />
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-600 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
