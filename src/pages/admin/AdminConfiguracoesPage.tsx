import React, { useState, useRef } from 'react'
import {
  ShieldCheck,
  Sparkles,
  User,
  Upload,
  X,
  Save,
} from 'lucide-react'
import { resizeImageToMax256 } from '@/lib/utils'
import toast from 'react-hot-toast'
import { FaviconUpload } from '@/components/ui/FaviconUpload'

export const AdminConfiguracoesPage: React.FC = () => {
  // Staged Preview States (Inicia com o que está no localStorage)
  const [previewLogo, setPreviewLogo] = useState<string | null>(() => {
    return localStorage.getItem('system_logo')
  })
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(() => {
    return localStorage.getItem('admin_photo')
  })

  // Arquivos temporários selecionados (para redimensionar via canvas ao salvar)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  // Flags indicando se houve alteração pendente
  const [isLogoChanged, setIsLogoChanged] = useState(false)
  const [isPhotoChanged, setIsPhotoChanged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // 1. Seleção de Imagem da Logo (Apenas prévia local temporária)
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewLogo(reader.result as string)
      setLogoFile(file)
      setIsLogoChanged(true)
    }
    reader.readAsDataURL(file)

    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  // Remoção da prévia da Logo (Staged)
  const handleRemoveLogoPreview = () => {
    setPreviewLogo(null)
    setLogoFile(null)
    setIsLogoChanged(true)
  }

  // 2. Seleção de Foto do Administrador (Apenas prévia local temporária)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewPhoto(reader.result as string)
      setPhotoFile(file)
      setIsPhotoChanged(true)
    }
    reader.readAsDataURL(file)

    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  // Remoção da prévia da Foto (Staged)
  const handleRemovePhotoPreview = () => {
    setPreviewPhoto(null)
    setPhotoFile(null)
    setIsPhotoChanged(true)
  }

  // 3. Salvar Alterações (Aplica redimensionamento 256px, grava no localStorage e emite eventos)
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Atualiza Logo do Sistema se alterada
      if (isLogoChanged) {
        if (previewLogo === null) {
          localStorage.removeItem('system_logo')
        } else if (logoFile) {
          const base64 = await resizeImageToMax256(logoFile)
          localStorage.setItem('system_logo', base64)
        } else if (previewLogo) {
          localStorage.setItem('system_logo', previewLogo)
        }
      }

      // Atualiza Foto do Administrador se alterada
      if (isPhotoChanged) {
        if (previewPhoto === null) {
          localStorage.removeItem('admin_photo')
        } else if (photoFile) {
          const base64 = await resizeImageToMax256(photoFile)
          localStorage.setItem('admin_photo', base64)
        } else if (previewPhoto) {
          localStorage.setItem('admin_photo', previewPhoto)
        }
      }

      // Limpa flags de alteração pendente
      setIsLogoChanged(false)
      setLogoFile(null)
      setIsPhotoChanged(false)
      setPhotoFile(null)

      // Dispara eventos para atualizar imediatamente a sidebar e o header
      window.dispatchEvent(new Event('app_identity_changed'))
      window.dispatchEvent(new Event('storage'))

      toast.success('Alterações salvas com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar alterações')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Header da Página com Estilo Luxo e Botão Salvar Alterações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Painel Super Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
            Configurações do Sistema
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Personalize a identidade visual institucional da plataforma ALISA BEAUTY e do perfil administrativo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-medium text-xs sm:text-sm border border-slate-800 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-500" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* CARD 1: LOGO DO SISTEMA (Sidebar Esquerda) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-luxury text-slate-900">
                Logomarca & Emblema do Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Imagem que representará a marca no topo da barra lateral esquerda da plataforma
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {previewLogo ? (
                <>
                  <img
                    src={previewLogo}
                    alt="Logo do Sistema"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogoPreview}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    title="Remover logotipo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="text-center p-2">
                  <Sparkles className="w-7 h-7 text-amber-400 mx-auto mb-1 opacity-80" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Sem Logo
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-medium text-xs border border-slate-800 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  <span>{previewLogo ? 'Alterar Imagem' : 'Fazer Upload de Imagem'}</span>
                </button>

                {previewLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogoPreview}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Recomendado: imagem quadrada ou proporção 1:1, formato PNG ou JPG até 5MB.
              </p>
            </div>
          </div>
        </div>
        {/* FAVICON DO SISTEMA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>

            <div>
              <h2 className="text-base font-bold font-luxury text-slate-900">
                Favicon do Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Personalize o ícone exibido na aba do navegador.
              </p>
            </div>
          </div>

          <FaviconUpload />
        </div>

        {/* CARD 2: FOTO DO ADMINISTRADOR (Header Direito) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-luxury text-slate-900">
                Foto do Perfil do Administrador
              </h2>
              <p className="text-xs text-slate-500">
                Foto de identificação pessoal exibida no avatar do cabeçalho superior direito
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {previewPhoto ? (
                <>
                  <img
                    src={previewPhoto}
                    alt="Foto do Administrador"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhotoPreview}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    title="Remover foto do perfil"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="text-center p-2">
                  <User className="w-7 h-7 text-amber-400 mx-auto mb-1 opacity-80" />
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Sem Foto
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-medium text-xs border border-slate-800 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  <span>{previewPhoto ? 'Alterar Imagem' : 'Fazer Upload de Imagem'}</span>
                </button>

                {previewPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhotoPreview}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Recomendado: imagem quadrada ou proporção 1:1, formato PNG ou JPG até 5MB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminConfiguracoesPage
