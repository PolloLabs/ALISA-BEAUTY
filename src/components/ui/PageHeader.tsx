import { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  children?: ReactNode
  className?: string
}

/**
 * Header padrão para todas as páginas do sistema
 * Garante consistência visual em todo o app
 * @example
 * <PageHeader
 *   title="Serviços"
 *   description="Gerencie os serviços do seu salão"
 *   action={{ label: 'Novo serviço', onClick: () => openModal() }}
 * />
 */
export function PageHeader({ 
  title, 
  description, 
  action, 
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {title}
        </h1>
        {description && (
          <p className="text-slate-600 mt-1 text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {children}
        {action && (
          <Button onClick={action.onClick} leftIcon={action.icon}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
