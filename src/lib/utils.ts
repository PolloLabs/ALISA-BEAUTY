import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Faz parse seguro de string JSON com try/catch e fallback garantido.
 * Evita quebras causadas por dados corrompidos ou nulos no localStorage.
 */
export function safeParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback
  try {
    const parsed = JSON.parse(jsonString)
    return (parsed !== null && parsed !== undefined) ? parsed : fallback
  } catch (error) {
    console.error('safeParse error:', error)
    return fallback
  }
}

/**
 * Lê do localStorage com try/catch e fallback garantido usando safeParse.
 */
export function safeStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const item = localStorage.getItem(key)
    return safeParse<T>(item, fallback)
  } catch (error) {
    console.error(`safeStorageGet error for key "${key}":`, error)
    return fallback
  }
}

/**
 * Grava no localStorage com try/catch garantido contra exceções de quota ou restrições.
 */
export function safeStorageSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error(`safeStorageSet error for key "${key}":`, error)
    return false
  }
}
