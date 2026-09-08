import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    children, 
    disabled,
    style,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 shadow-sm',
      secondary: 'bg-slate-800 hover:bg-slate-900 text-white',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
      ghost: 'hover:bg-slate-100 text-slate-800',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
      success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }

    // Se variant é primary e tem style com backgroundColor explicitamente passado
    const buttonStyle = style

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
          variants[variant],
          sizes[size],
          className
        )}
        style={buttonStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
