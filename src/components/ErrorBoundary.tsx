import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary para capturar erros de renderização
 * Evita que o app inteiro quebre por um erro em um componente
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Ocorreu uma instabilidade temporária. Clique abaixo para tentar novamente.
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Tentar novamente
              </Button>
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/')
                    window.dispatchEvent(new PopStateEvent('popstate'))
                  }
                }}
              >
                Ir para o início
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
