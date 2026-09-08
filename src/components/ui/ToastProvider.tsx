import { Toaster } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Sistema de Toasts profissionais
 * Uso: toast.success('Salvo com sucesso!')
 *      toast.error('Erro ao salvar')
 *      toast.loading('Carregando...')
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'white',
          color: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '12px 16px',
          minWidth: '300px',
          maxWidth: '450px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
          duration: 5000,
        },
      }}
    />
  )
}

// Ícones customizados para cada tipo
export const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  loading: <AlertCircle className="h-5 w-5 text-slate-400 animate-pulse" />,
  info: <Info className="h-5 w-5 text-rose-500" />,
}
