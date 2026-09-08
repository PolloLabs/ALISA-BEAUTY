import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Clock, MapPin, Save, RefreshCw, AlertTriangle } from 'lucide-react'
import { useSalon } from '@/hooks/useSalon'
import { salonSchema, SalonFormData } from '@/lib/schemas'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InputMaskField } from '@/components/ui/InputMaskField'
import { LogoUpload } from '@/components/ui/LogoUpload'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/hooks/useConfirm'
import toast from 'react-hot-toast'

export function Settings() {
  const { salon, updateSalon } = useSalon()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: salon?.name || '',
      phone: salon?.phone || '',
      address: salon?.address || '',
      open_time: salon?.open_time || '08:00',
      close_time: salon?.close_time || '19:00',
      primary_color: salon?.primary_color || '#f43f5e',
      logo_url: salon?.logo_url || null,
    },
  })

  useEffect(() => {
    if (salon) {
      reset({
        name: salon.name || '',
        phone: salon.phone || '',
        address: salon.address || '',
        open_time: salon.open_time || '08:00',
        close_time: salon.close_time || '19:00',
        primary_color: salon.primary_color || '#f43f5e',
        logo_url: salon.logo_url || null,
      })
    }
  }, [salon, reset])

  const currentColor = watch('primary_color')
  const currentLogo = watch('logo_url')
  const salonName = watch('name')

  const onSubmit = async (data: SalonFormData) => {
    setIsSubmitting(true)
    try {
      const ok = await updateSalon({
        name: data.name,
        phone: data.phone,
        address: data.address,
        open_time: data.open_time,
        close_time: data.close_time,
        primary_color: data.primary_color,
        logo_url: data.logo_url,
      })

      if (ok) {
        toast.success('Configurações do salão atualizadas com sucesso!')
      } else {
        toast.error('Erro ao atualizar configurações.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar alterações'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ação destrutiva protegida com ConfirmDialog e useConfirm
  const resetBrandConfirm = useConfirm(async () => {
    setValue('primary_color', '#f43f5e')
    setValue('logo_url', null)
    await updateSalon({
      primary_color: '#f43f5e',
      logo_url: null,
    })
    document.documentElement.style.setProperty('--primary-color', '#f43f5e')
    toast.success('Identidade visual restaurada para o padrão!')
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Configurações do Salão"
        description="Gerencie a identidade visual, dados cadastrais e horários da sua empresa."
      />

      {/* Visual Identity Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 bg-slate-50"
            style={{ borderColor: currentColor || '#f43f5e' }}
          >
            {currentLogo ? (
              <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {salonName.trim() || 'Salão Sem Nome'}
              </h2>
              <span 
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: currentColor || '#f43f5e' }}
                title="Cor primária ativa"
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Horário de funcionamento: {watch('open_time')} às {watch('close_time')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetBrandConfirm.open}
          leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-400" />}
          className="self-start sm:self-auto text-slate-600 hover:text-red-500"
        >
          Restaurar Marca Padrão
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Identidade Visual */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalização de Marca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Upload de Logo */}
                <Controller
                  control={control}
                  name="logo_url"
                  render={({ field }) => (
                    <LogoUpload
                      value={field.value ?? null}
                      onChange={(url) => setValue('logo_url', url, { shouldDirty: true })}
                      salonId={salon?.id || 'main-salon'}
                    />
                  )}
                />

                {/* Seletor de Cor Primária */}
                <Controller
                  control={control}
                  name="primary_color"
                  render={({ field }) => (
                    <ColorPicker
                      value={field.value}
                      onChange={(color) => {
                        field.onChange(color)
                        document.documentElement.style.setProperty('--primary-color', color)
                      }}
                    />
                  )}
                />

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">Aplicação da Cor:</p>
                  <p>A cor selecionada é aplicada dinamicamente aos botões, destaques e páginas do sistema.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Gerais & Horários */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Cadastrais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nome Comercial do Salão *"
                  placeholder="Ex: Studio Alisa Beleza & Estética"
                  {...register('name')}
                  error={errors.name?.message}
                  icon={<Building2 className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <InputMaskField
                        mask="(99) 99999-9999"
                        label="Telefone com WhatsApp"
                        placeholder="(11) 98765-4321"
                        value={field.value || ''}
                        onChange={field.onChange}
                        error={errors.phone?.message}
                      />
                    )}
                  />

                  <Input
                    label="Endereço Completo"
                    placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                    {...register('address')}
                    error={errors.address?.message}
                    icon={<MapPin className="w-4 h-4 text-slate-400" />}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Horário de Abertura *"
                    type="time"
                    {...register('open_time')}
                    error={errors.open_time?.message}
                    icon={<Clock className="w-4 h-4 text-slate-400" />}
                  />

                  <Input
                    label="Horário de Fechamento *"
                    type="time"
                    {...register('close_time')}
                    error={errors.close_time?.message}
                    icon={<Clock className="w-4 h-4 text-slate-400" />}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Os horários configurados limitam os slots disponíveis na agenda pública de clientes.
                </p>
              </CardContent>
            </Card>

            {/* Ações de salvamento */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
                style={{ backgroundColor: currentColor }}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmação de Ação Destrutiva */}
      <ConfirmDialog
        isOpen={resetBrandConfirm.isOpen}
        onClose={resetBrandConfirm.close}
        onConfirm={resetBrandConfirm.onConfirm}
        isLoading={resetBrandConfirm.isLoading}
        title="Restaurar Identidade Padrão?"
        description="Esta ação removerá o logotipo atual e redefinirá a cor principal para a cor padrão do BelezaFlow (#f43f5e)."
        confirmLabel="Sim, restaurar"
        cancelLabel="Cancelar"
        variant="warning"
      />
    </div>
  )
}
