import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface LogoUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  salonId: string
  className?: string
}

export function LogoUpload({ value, onChange, salonId, className }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo deve ser uma imagem')
      return
    }

    setUploading(true)
    try {
      if (supabase) {
        // Gera nome único
        const fileExt = file.name.split('.').pop()
        const fileName = `${salonId || 'salon'}-${Date.now()}.${fileExt}`
        const filePath = `logos/${fileName}`

        // Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('salon-assets')
          .upload(filePath, file, { upsert: true })

        if (!uploadError) {
          // Pega URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('salon-assets')
            .getPublicUrl(filePath)

          onChange(publicUrl)
          toast.success('Logo enviada com sucesso!')
          return
        }
      }

      // Fallback local caso storage não esteja criado ou offline
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
        toast.success('Logo carregada com sucesso!')
      }
      reader.readAsDataURL(file)
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao enviar logo'
      toast.error(message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange(null)
    toast.success('Logo removida')
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-slate-700">
        Logomarca
      </label>
      
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="relative h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? (
            <>
              <img src={value} alt="Logo" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <Upload className="h-6 w-6 text-slate-400" />
          )}
        </div>

        {/* Botão de upload */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="logo-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            leftIcon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          >
            {uploading ? 'Enviando...' : value ? 'Trocar logo' : 'Enviar logo'}
          </Button>
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG ou SVG até 5MB
          </p>
        </div>
      </div>
    </div>
  )
}
