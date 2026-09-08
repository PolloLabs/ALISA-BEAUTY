import { forwardRef } from 'react'
import { NumericFormat, NumericFormatProps } from 'react-number-format'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<NumericFormatProps, 'onChange'> {
  label?: string
  error?: string
  onChange?: (value: number) => void
  className?: string
}

/**
 * Input de moeda formatado em Real brasileiro
 * @example
 * <CurrencyInput
 *   label="Preço"
 *   value={price}
 *   onValueChange={(val) => setPrice(val)}
 * />
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, onChange, className, value, ...props }, ref) => {
    const id = label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <NumericFormat
          {...props}
          id={id}
          value={value}
          onValueChange={(values) => {
            onChange?.(values.floatValue || 0)
          }}
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          decimalSeparator=","
          thousandSeparator="."
          allowNegative={false}
          customInput={InputWrapper}
          getInputRef={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500' : 'border-slate-200',
            className
          )}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

// Wrapper para compatibilidade com NumericFormat
const InputWrapper = forwardRef<HTMLInputElement, any>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={className} {...props} />
  )
)
InputWrapper.displayName = 'InputWrapper'
