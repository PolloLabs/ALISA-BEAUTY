import { useState, useRef, useEffect } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from './Button'

const FAVICON_STORAGE_KEY = 'system_favicon'

interface FaviconUploadProps {
  className?: string
}

export function FaviconUpload({ className }: FaviconUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(() => {
    return localStorage.getItem(FAVICON_STORAGE_KEY)
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedFavicon = localStorage.getItem(FAVICON_STORAGE_KEY)

    if (savedFavicon) {
      setPreview(savedFavicon)
      updateFavicon(savedFavicon)
    }
  }, [])

  const updateFavicon = (faviconUrl: string) => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    link.href = faviconUrl
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O favicon deve ter no máximo 2MB')
      return
    }

    if (
      ![
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/x-icon',
        'image/vnd.microsoft.icon',
      ].includes(file.type)
    ) {
      toast.error('Use PNG, JPG, SVG ou ICO')
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()

    reader.onloadend = () => {
      setPreview(reader.result as string)
    }

    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Selecione um favicon antes de salvar')
      return
    }

    setUploading(true)

    try {
      const reader = new FileReader()

      reader.onloadend = () => {
        const base64 = reader.result as string

        localStorage.setItem(FAVICON_STORAGE_KEY, base64)

        setPreview(base64)
        setSelectedFile(null)

        updateFavicon(base64)

        window.dispatchEvent(new Event('favicon_changed'))
        window.dispatchEvent(new Event('storage'))

        toast.success('Favicon atualizado com sucesso!')
        setUploading(false)
      }

      reader.onerror = () => {
        toast.error('Erro ao ler o arquivo do favicon')
        setUploading(false)
      }

      reader.readAsDataURL(selectedFile)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar o favicon')
      setUploading(false)
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Favicon Personalizado
      </label>

      <div className="flex items-start gap-4">
        <div className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Favicon atual"
              className="h-12 w-12 object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400 text-center px-2">
              Favicon
            </span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.ico,image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Selecionar imagem
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={uploading || !selectedFile}
              leftIcon={
                uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : undefined
              }
            >
              {uploading ? 'Salvando...' : 'Salvar Favicon'}
            </Button>
          </div>

          <p className="text-xs text-slate-500">
            Recomendado: PNG quadrado de 512 × 512 pixels. Máximo de 2MB.
          </p>
        </div>
      </div>
    </div>
  )
}
