import React, { useState, useRef } from 'react'
import {
  Settings,
  Upload,
  X,
  Sparkles,
  User,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { resizeImageToMax256 } from '@/lib/utils'
import toast from 'react-hot-toast'

export const AdminConfiguracoesPage: React.FC = () => {
  const [systemLogo, setSystemLogo] = useState<string | null>(() => {
    return localStorage.getItem('system_logo')
  })
  const [adminPhoto, setAdminPhoto] = useState<string | null>(() => {
    return localStorage.getItem('admin_photo')
  })
  const [isProcessingLogo, setIsProcessingLogo] = useState(false)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const notifyIdentityChange = () => {
    window.dispatchEvent(new Event('app_identity_changed'))
    window.dispatchEvent(new Event('storage'))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsProcessingLogo(true)
      const base64 = await resizeImageToMax256(file)
      localStorage.setItem('system_logo', base64)
      setSystemLogo(base64)
      notifyIdentityChange()
      toast.success('Logo do sistema atualizada com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar logotipo')
    } finally {
      setIsProcessingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = () => {
    localStorage.removeItem('system_logo')
    setSystemLogo(null)
    notifyIdentityChange()
    toast.success('Logo do sistema restaurada para o padrão.')
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsProcessingPhoto(true)
      const base64 = await resizeImageToMax256(file)
      localStorage.setItem('admin_photo', base64)
      setAdminPhoto(base64)
      notifyIdentityChange()
      toast.success('Foto do administrador atualizada com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar foto')
    } finally {
      setIsProcessingPhoto(false)
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = () => {
    localStorage.removeItem('admin_photo')
    setAdminPhoto(null)
    notifyIdentityChange()
    toast.success('Foto removida. Utilizando iniciais padrão "SA".')
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner de Configurações */}
      <Card className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Painel Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Configurações do Sistema
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Personalize a identidade visual institucional da plataforma ALISA BEAUTY e do perfil administrativo.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: LOGO DO SISTEMA (Sidebar Esquerda) */}
        <Card className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-luxury text-slate-900">
                  Logo do Sistema
                </h2>
                <p className="text-xs text-slate-500">
                  Exibida no topo da barra lateral esquerda da plataforma
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Preview Box */}
              <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                {systemLogo ? (
                  <>
                    <img
                      src={systemLogo}
                      alt="Logo do Sistema"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      title="Remover logotipo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Sparkles className="w-7 h-7 text-amber-400 mx-auto mb-1 opacity-80" />
                    <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider block">
                      Padrão
                    </span>
                  </div>
                )}
              </div>

              {/* Controles de Upload */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isProcessingLogo}
                    className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs border border-slate-800 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isProcessingLogo ? 'Processando...' : systemLogo ? 'Alterar Logo' : 'Enviar Logo'}</span>
                  </button>

                  {systemLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>Restaurar Padrão</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  A imagem é automaticamente redimensionada para até <strong>256px</strong> via canvas para máxima performance e armazenamento seguro no navegador.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Atualização instantânea na sidebar de navegação</span>
          </div>
        </Card>

        {/* CARD 2: FOTO DO ADMINISTRADOR (Header Direito) */}
        <Card className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-luxury text-slate-900">
                  Foto do Administrador
                </h2>
                <p className="text-xs text-slate-500">
                  Exibida no avatar do perfil no cabeçalho superior direito
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Preview Avatar */}
              <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                {adminPhoto ? (
                  <>
                    <img
                      src={adminPhoto}
                      alt="Foto do Administrador"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <span className="text-2xl font-bold font-luxury text-amber-400 block leading-none">
                      SA
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider block">
                      Iniciais
                    </span>
                  </div>
                )}
              </div>

              {/* Controles de Upload */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs border border-slate-800 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isProcessingPhoto ? 'Processando...' : adminPhoto ? 'Alterar Foto' : 'Enviar Foto'}</span>
                  </button>

                  {adminPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      <span>Restaurar Iniciais</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Redimensionamento automático para até <strong>256px</strong>. Caso nenhuma foto seja selecionada, o sistema exibe automaticamente as iniciais padrão <strong>"SA"</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Atualização instantânea no avatar do cabeçalho</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminConfiguracoesPage
