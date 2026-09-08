import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Store, Clock, MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSalon } from '@/hooks/useSalon'
import { supabase } from '@/lib/supabase'
import { BusinessType } from '@/types'
import { getBusinessConfig } from '@/lib/businessConfig'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InputMaskField } from '@/components/ui/InputMask'
import { LogoUpload } from '@/components/ui/LogoUpload'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { BusinessTypeSelector } from '@/components/ui/BusinessTypeSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface OnboardingFormData {
  name: string
  phone: string
  address: string
  open_time: string
  close_time: string
}

export function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshSalon, createSalon } = useSalon()
  const [loading, setLoading] = useState(false)
  const [businessType, setBusinessType] = useState<BusinessType>('beauty_salon')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#d946ef')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      open_time: '09:00',
      close_time: '19:00',
    },
  })

  const phoneValue = watch('phone')
  const config = getBusinessConfig(businessType)
  const Icon = config.icon

  // Atualiza cor padrão quando muda o tipo de negócio
  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type)
    const newConfig = getBusinessConfig(type)
    setPrimaryColor(newConfig.defaultColor)
  }

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return

    setLoading(true)
    try {
      if (supabase) {
        const { error } = await supabase.from('salons').insert({
          owner_id: user.id,
          name: data.name,
          business_type: businessType,
          phone: data.phone,
          address: data.address || null,
          open_time: data.open_time,
          close_time: data.close_time,
          logo_url: logoUrl,
          primary_color: primaryColor,
          is_active: true,
        })

        if (error) throw error
      }

      await createSalon({
        name: data.name,
        business_type: businessType,
        phone: data.phone,
        address: data.address || null,
        open_time: data.open_time,
        close_time: data.close_time,
        logo_url: logoUrl,
        primary_color: primaryColor,
        is_active: true,
      })

      await refreshSalon()
      toast.success(`${config.label} criado com sucesso! 🎉`)
      navigate('/')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Erro ao criar salão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header dinâmico baseado no tipo */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-4 transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {config.welcomeTitle}
          </h1>
          <p className="text-slate-600 mt-2">
            {config.welcomeDescription}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configure seu estabelecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Seleção de Tipo de Negócio */}
              <BusinessTypeSelector
                value={businessType}
                onChange={handleBusinessTypeChange}
              />

              {/* Personalização de Marca */}
              <div className="space-y-4 pb-6 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">
                  Personalize sua marca
                </h3>
                
                <LogoUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  salonId="temp"
                />

                <ColorPicker
                  value={primaryColor}
                  onChange={setPrimaryColor}
                />
              </div>

              {/* Dados do Estabelecimento */}
              <div className="space-y-4">
                <Input
                  label={`Nome do ${config.label.toLowerCase()}`}
                  placeholder={businessType === 'barbershop' ? 'Ex: Barbearia Old School' : 'Ex: Studio Beleza Pura'}
                  leftIcon={<Store className="h-4 w-4" />}
                  error={errors.name?.message}
                  {...register('name', { required: 'Nome obrigatório' })}
                />

                <InputMaskField
                  mask="(99) 99999-9999"
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  value={phoneValue || ''}
                  onChange={(e) => setValue('phone', e.target.value)}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 -mt-2">{errors.phone.message}</p>
                )}

                <Input
                  label="Endereço (opcional)"
                  placeholder="Rua, número, bairro, cidade"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  error={errors.address?.message}
                  {...register('address')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Horário de abertura
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        {...register('open_time')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Horário de fechamento
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="time"
                        className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        {...register('close_time')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  isLoading={loading}
                  style={{ backgroundColor: primaryColor }}
                >
                  Criar meu {config.label.toLowerCase()}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
