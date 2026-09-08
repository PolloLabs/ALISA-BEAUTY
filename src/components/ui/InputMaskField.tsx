import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputMaskProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask?: string
  label?: string
  error?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Aplica máscara em strings de dígitos
 */
function applyMask(value: string, mask: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  // Caso especial: telefone brasileiro flexível (10 ou 11 dígitos)
  if (mask.includes('(99) 99999-9999') || mask.includes('(99) 9999-9999')) {
    const numbers = digits.slice(0, 11)
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  // Máscara genérica com '9' para dígitos
  let result = ''
  let digitIndex = 0

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    const maskChar = mask[i]
    if (maskChar === '9') {
      result += digits[digitIndex]
      digitIndex++
    } else {
      result += maskChar
      if (digits[digitIndex] === maskChar) {
        digitIndex++
      }
    }
  }

  return result
}

/**
 * Input com máscara compatível com React 19 (sem dependência de findDOMNode)
 */
export const InputMaskField = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, label, error, value = '', onChange, placeholder, disabled, className, id: customId, ...rest }, ref) => {
    const id = customId || label?.toLowerCase().replace(/\s+/g, '-')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return
      if (!mask) {
        onChange(e)
        return
      }

      const rawVal = e.target.value
      const maskedVal = applyMask(rawVal, mask)

      // Clona o evento com o valor formatado
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: maskedVal,
        },
      } as React.ChangeEvent<HTMLInputElement>

      onChange(syntheticEvent)
    }

    const displayValue = mask && value ? applyMask(value, mask) : value

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label 
            htmlFor={id}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            {label}
          </label>
        )}
        <input
          {...rest}
          ref={ref}
          id={id}
          type="text"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 transition-all font-mono',
            'placeholder:text-slate-400 placeholder:font-sans',
            'focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            error ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200',
            className
          )}
        />
        {error && (
          <p className="text-xs text-rose-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

InputMaskField.displayName = 'InputMaskField'

