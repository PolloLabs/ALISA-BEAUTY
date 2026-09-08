import { useState, useCallback } from 'react'

interface UseConfirmReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  onConfirm: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

/**
 * Hook para gerenciar modais de confirmação
 * @example
 * const { isOpen, open, close, onConfirm, isLoading } = useConfirm(async () => {
 *   await deleteService(id)
 *   toast.success('Serviço excluído!')
 * })
 * 
 * return (
 *   <>
 *     <Button onClick={open}>Excluir</Button>
 *     <ConfirmDialog
 *       isOpen={isOpen}
 *       onClose={close}
 *       onConfirm={onConfirm}
 *       isLoading={isLoading}
 *       title="Excluir serviço?"
 *       description="Esta ação não pode ser desfeita."
 *     />
 *   </>
 * )
 */
export function useConfirm(action: () => Promise<void>): UseConfirmReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    if (!isLoading) setIsOpen(false)
  }, [isLoading])

  const onConfirm = useCallback(async () => {
    setIsLoading(true)
    try {
      await action()
      setIsOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [action])

  return {
    isOpen,
    open,
    close,
    onConfirm,
    isLoading,
    setIsLoading,
  }
}
