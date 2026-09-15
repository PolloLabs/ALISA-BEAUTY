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

/**
 * Redimensiona um arquivo de imagem para no máximo 256px de largura/altura
 * utilizando HTMLCanvasElement e retorna a imagem em base64.
 * Evita estouro de cota do localStorage.
 */
export function resizeImageToMax256(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Formato de arquivo inválido. Por favor selecione uma imagem.'))
      return
    }

    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onload = () => {
        const maxDimension = 256
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Contexto 2D do Canvas indisponível'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/png', 0.9)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Erro ao processar dimensões da imagem'))
      img.src = readerEvent.target?.result as string
    }
    reader.onerror = () => reject(new Error('Erro ao carregar arquivo de imagem'))
    reader.readAsDataURL(file)
  })
}
