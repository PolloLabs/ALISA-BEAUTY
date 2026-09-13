import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Palette, 
  Sliders, 
  Save, 
  Upload, 
  X, 
  Clock, 
  MapPin, 
  Phone, 
  Sparkles, 
  Sun, 
  Moon, 
  Check, 
  AlertCircle,
  Scissors,
  Store,
  Crown,
  Bell,
  MessageSquare,
  QrCode,
  Share2,
  CreditCard,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Power
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSalon } from '@/hooks/useSalon';
import { ShareBookingLink } from '@/components/ShareBookingLink';
import { BusinessType } from '@/types';
import { cn } from '@/lib/utils';

type SettingsTab = 'dados' | 'personalizacao' | 'geral' | 'pagamentos' | 'link';

interface LuxuryColorPreset {
  name: string;
  value: string;
  desc: string;
}

const LUXURY_PALETTE: LuxuryColorPreset[] = [
  { name: 'Ouro Real', value: '#d97706', desc: 'Âmbar Dourado' },
  { name: 'Ouro Champagne', value: '#ca8a04', desc: 'Champagne Suave' },
  { name: 'Bronze Nobre', value: '#9a3412', desc: 'Cobre Acobreado' },
  { name: 'Rosa Quartzo', value: '#e11d48', desc: 'Glamour Clássico' },
  { name: 'Esmeralda', value: '#059669', desc: 'Verde Precioso' },
  { name: 'Safira Noturna', value: '#2563eb', desc: 'Azul Real' },
  { name: 'Ametista Imperial', value: '#9333ea', desc: 'Púrpura Luxo' },
  { name: 'Preto Ônix', value: '#0f172a', desc: 'Ébano Sofisticado' },
];

export function SalonSettings() {
  const { salon, loading, updateSalon, showToast } = useSalon();

  const [activeTab, setActiveTab] = useState<SettingsTab>('dados');
  const [isSaving, setIsSaving] = useState(false);

  // Form State: Dados do Salão
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('19:00');

  // Form State: Personalização
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#d97706');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('belezaflow_theme') === 'dark';
  });

  // Form State: Configurações Gerais
  const [businessType, setBusinessType] = useState<BusinessType>('beauty_salon');
  const [appointmentInterval, setAppointmentInterval] = useState<number>(30);
  const [autoConfirm, setAutoConfirm] = useState<boolean>(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState<boolean>(true);
  const [reminderMessage, setReminderMessage] = useState(
    'Olá, [cliente]! Lembramos do seu horário marcado no [salao] para [servico] às [horario]. Nos vemos em breve!'
  );

  // Form State: Pagamentos, Sinal e Status
  const [paymentEnabled, setPaymentEnabled] = useState<boolean>(false);
  const [requireDeposit, setRequireDeposit] = useState<boolean>(false);
  const [depositPercentage, setDepositPercentage] = useState<number>(30);
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState<number>(5);
  const [isActive, setIsActive] = useState<boolean>(true);

  // File input ref for logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when salon data loads
  useEffect(() => {
    if (salon) {
      setName(salon.name || '');
      setPhone(formatPhone(salon.phone || ''));
      setAddress(salon.address || '');
      setOpenTime(salon.open_time?.substring(0, 5) || '08:00');
      setCloseTime(salon.close_time?.substring(0, 5) || '19:00');
      setLogoUrl(salon.logo_url || null);
      setPrimaryColor(salon.primary_color || '#d97706');
      if (salon.business_type) {
        setBusinessType(salon.business_type);
      }
      setPaymentEnabled(salon.payment_enabled ?? false);
      setRequireDeposit(salon.require_deposit ?? false);
      setDepositPercentage(salon.deposit_percentage ?? 30);
      setFullPaymentDiscount(salon.full_payment_discount ?? 5);
      setIsActive(salon.is_active ?? true);
    }
  }, [salon]);

  // Handle phone format
  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (!numbers) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo de imagem deve ter no máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      toast.success('Imagem carregada com sucesso!');
    };
    reader.onerror = () => {
      toast.error('Erro ao ler imagem');
    };
    reader.readAsDataURL(file);
  };

  // Handle dark mode toggle
  const handleThemeToggle = (enableDark: boolean) => {
    setIsDarkMode(enableDark);
    localStorage.setItem('belezaflow_theme', enableDark ? 'dark' : 'light');
    if (enableDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Save Settings Form Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Informe o nome do estabelecimento');
      setActiveTab('dados');
      return;
    }

    if (openTime >= closeTime) {
      toast.error('O horário de abertura deve ser anterior ao de fechamento');
      setActiveTab('dados');
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateSalon({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        open_time: openTime,
        close_time: closeTime,
        logo_url: logoUrl,
        primary_color: primaryColor,
        business_type: businessType,
        payment_enabled: paymentEnabled,
        require_deposit: requireDeposit,
        deposit_percentage: Number(depositPercentage),
        full_payment_discount: Number(fullPaymentDiscount),
        is_active: isActive,
      });

      if (success) {
        toast.success('Configurações salvas com sucesso!');
        showToast('Configurações do salão atualizadas!');
      } else {
        toast.error('Não foi possível salvar as alterações.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Erro ao atualizar dados';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="h-12 w-full max-w-md bg-slate-200 rounded-xl" />
        <div className="h-96 w-full bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header da Página com Estilo Luxo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Gerenciamento & Marca</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Configurações do Estabelecimento
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Personalize a identidade visual, horários operacionais e preferências do sistema.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-medium text-xs sm:text-sm border border-slate-800 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-500" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Abas de Navegação (Design Luxo) */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 sm:gap-4 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'dados'
                ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>Dados do Salão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personalizacao')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'personalizacao'
                ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Personalização</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'geral'
                ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            <Sliders className="w-4 h-4" />
            <span>Configurações Gerais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagamentos')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'pagamentos'
                ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pagamento & Sinal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer',
              activeTab === 'link'
                ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            <QrCode className="w-4 h-4" />
            <span>Link & QR Code</span>
          </button>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* ABA 1: DADOS DO SALÃO */}
          {activeTab === 'dados' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Informações Comerciais
                    </h2>
                    <p className="text-xs text-slate-500">
                      Estes dados aparecem nos comprovantes e na página de agendamentos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Nome do Salão */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Nome do Salão / Estúdio <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Studio Beleza Flow"
                        required
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Telefone / WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Telefone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="(11) 98765-4321"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Endereço Completo
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Av. Paulista, 1000, Sala 42 - SP"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Horário de Abertura */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Horário de Abertura
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Horário de Fechamento */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Horário de Fechamento
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Link Público de Agendamento & QR Code */}
              <div className="pt-2">
                <ShareBookingLink />
              </div>
            </div>
          )}

          {/* ABA 2: PERSONALIZAÇÃO */}
          {activeTab === 'personalizacao' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Upload de Logo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Logomarca & Emblema
                    </h2>
                    <p className="text-xs text-slate-500">
                      Imagem que representará sua marca no painel e na tela de agendamento
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    {logoUrl ? (
                      <>
                        <img
                          src={logoUrl}
                          alt="Logo do Salão"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm"
                          title="Remover logotipo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Scissors className="w-7 h-7 text-amber-400 mx-auto mb-1 opacity-80" />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                          Sem Logo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-medium text-xs border border-slate-800 shadow-sm transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-500" />
                        <span>{logoUrl ? 'Alterar Imagem' : 'Fazer Upload de Imagem'}</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
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

              {/* Seletor de Cor Primária */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Cor Primária de Destaque
                    </h2>
                    <p className="text-xs text-slate-500">
                      Paleta de alta sofisticação para botões, indicadores e selos
                    </p>
                  </div>
                </div>

                {/* Preset Luxo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LUXURY_PALETTE.map((preset) => {
                    const isSelected = primaryColor.toLowerCase() === preset.value.toLowerCase();
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setPrimaryColor(preset.value)}
                        className={cn(
                          'p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer',
                          isSelected
                            ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-600 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <div
                          className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center flex-shrink-0 shadow-2xs"
                          style={{ backgroundColor: preset.value }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{preset.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Cor Personalizada HEX */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-slate-100">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Cor Customizada:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#d97706"
                      className="w-32 h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span>Prévia ativa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle de Tema: Claro / Escuro */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Modo de Visualização (Tema)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Alterne entre o tema Claro e o modo Noturno de alto luxo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleThemeToggle(false)}
                    className={cn(
                      'p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                      !isDarkMode
                        ? 'border-amber-600 bg-amber-50/30 ring-1 ring-amber-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Tema Claro (Recomendado)</span>
                        {!isDarkMode && <Check className="w-4 h-4 text-amber-600" />}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Design limpo com tons neutros em slate e toques em dourado imperial.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeToggle(true)}
                    className={cn(
                      'p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                      isDarkMode
                        ? 'border-amber-600 bg-amber-50/30 ring-1 ring-amber-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Tema Noturno</span>
                        {isDarkMode && <Check className="w-4 h-4 text-amber-600" />}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Ambiente imersivo e elegante em ébano para uso noturno.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: CONFIGURAÇÕES GERAIS */}
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Tipo de Estabelecimento */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Segmento de Atuação
                    </h2>
                    <p className="text-xs text-slate-500">
                      Define a terminologia de procedimentos e o perfil dos seus clientes
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'beauty_salon',
                      label: 'Salão de Beleza',
                      desc: 'Cabelos, escova, mechas & maquiagem',
                    },
                    {
                      id: 'barbershop',
                      label: 'Barbearia Clássica',
                      desc: 'Corte masculino, barba & terapia capilar',
                    },
                    {
                      id: 'unisex',
                      label: 'Studio Unissex',
                      desc: 'Atendimento integrado e multi-serviços',
                    },
                    {
                      id: 'nail_studio',
                      label: 'Nail Designer',
                      desc: 'Alongamento, esmaltação & estética',
                    },
                  ].map((item) => {
                    const isSelected = businessType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBusinessType(item.id as BusinessType)}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                          isSelected
                            ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-600 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-900">{item.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parâmetros de Agendamento */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Regras de Agenda
                    </h2>
                    <p className="text-xs text-slate-500">
                      Controle a grade de horários e espaçamento entre procedimentos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Intervalo Mínimo de Horários
                    </label>
                    <select
                      value={appointmentInterval}
                      onChange={(e) => setAppointmentInterval(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value={15}>A cada 15 minutos</option>
                      <option value={30}>A cada 30 minutos (Padrão)</option>
                      <option value={45}>A cada 45 minutos</option>
                      <option value={60}>A cada 60 minutos (1 hora)</option>
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Intervalo sugerido entre horários de atendimento na agenda.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Automações de Status
                    </label>

                    {/* Auto confirm switch */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">
                          Confirmar agendamentos automaticamente
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Marca agendamentos direto como Confirmados
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAutoConfirm(!autoConfirm)}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                          autoConfirm ? 'bg-amber-600' : 'bg-slate-300'
                        )}
                      >
                        <span
                          className={cn(
                            'block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs',
                            autoConfirm ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notificações WhatsApp */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-luxury text-slate-900">
                      Mensagem de Lembrete WhatsApp
                    </h2>
                    <p className="text-xs text-slate-500">
                      Texto modelo disparado para os clientes ao clicar no botão de WhatsApp
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-slate-900">
                        Ativar lembretes rápidos via WhatsApp
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWhatsappNotifications(!whatsappNotifications)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                        whatsappNotifications ? 'bg-amber-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs',
                          whatsappNotifications ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Modelo do Texto de Confirmação
                    </label>
                    <textarea
                      rows={3}
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <p className="text-[11px] text-slate-500">
                      Tags disponíveis: <code className="text-amber-700 font-semibold">[cliente]</code>, <code className="text-amber-700 font-semibold">[salao]</code>, <code className="text-amber-700 font-semibold">[servico]</code>, <code className="text-amber-700 font-semibold">[horario]</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: PAGAMENTO & SINAL */}
          {activeTab === 'pagamentos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Status do Estabelecimento */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <Power className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold font-luxury text-slate-900">
                        Disponibilidade do Estabelecimento (is_active)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Controle se o seu estabelecimento está aberto e aceitando agendamentos públicos
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
                      isActive ? 'bg-emerald-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs',
                        isActive ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5',
                    isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  )}>
                    <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-emerald-500' : 'bg-rose-500')} />
                    {isActive ? 'Salão Ativo & Aberto para Agendamentos' : 'Salão Pausado / Não Recebendo Agendamentos'}
                  </span>
                </div>
              </div>

              {/* Habilitar Pagamentos & Sinal */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold font-luxury text-slate-900">
                        Pagamentos Online & Cobrança de Sinal (payment_enabled)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Permita pagamentos antecipados e cobrança de caução/sinal para combater faltas (no-shows)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentEnabled(!paymentEnabled)}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
                      paymentEnabled ? 'bg-amber-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs',
                        paymentEnabled ? 'translate-x-7' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Opções condicionais se o pagamento estiver habilitado */}
                <div className={cn('space-y-6 transition-opacity', !paymentEnabled && 'opacity-60 pointer-events-none')}>
                  {/* Exigência obrigatória de depósito */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Exigir Sinal Obrigatório para Confirmar (require_deposit)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        Quando ativo, o agendamento só entra na agenda do profissional após a confirmação do pagamento do sinal.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRequireDeposit(!requireDeposit)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0',
                        requireDeposit ? 'bg-amber-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs',
                          requireDeposit ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Configuração de Porcentagens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Porcentagem do Sinal */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Porcentagem do Sinal / Entrada (deposit_percentage)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={5}
                          max={100}
                          step={1}
                          value={depositPercentage}
                          onChange={(e) => setDepositPercentage(Number(e.target.value))}
                          className="w-full h-11 pl-4 pr-12 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[20, 30, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDepositPercentage(pct)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer',
                              depositPercentage === pct
                                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            )}
                          >
                            {pct}% {pct === 30 && '(Padrão)'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Valor cobrado antecipadamente para segurar o horário na agenda (ex: 30%).
                      </p>
                    </div>

                    {/* Desconto para Pagamento Integral */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Desconto Pagamento 100% à Vista (full_payment_discount)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={fullPaymentDiscount}
                          onChange={(e) => setFullPaymentDiscount(Number(e.target.value))}
                          className="w-full h-11 pl-4 pr-12 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 5, 10].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setFullPaymentDiscount(pct)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer',
                              fullPaymentDiscount === pct
                                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            )}
                          >
                            {pct}% {pct === 5 && '(Padrão)'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Incentivo concedido se o cliente optar por quitar o valor total no agendamento.
                      </p>
                    </div>
                  </div>

                  {/* Simulador / Preview Visual */}
                  <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-700" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Exemplo de Cobrança ao Cliente (Serviço de R$ 100,00)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                        <span className="text-slate-500 block">Sinal a Pagar ({depositPercentage}%):</span>
                        <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                          R$ {(100 * (depositPercentage / 100)).toFixed(2).replace('.', ',')}
                        </strong>
                        <span className="text-[10px] text-slate-500">Garante a vaga imediatamente</span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                        <span className="text-slate-500 block">Restante no Salão:</span>
                        <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                          R$ {(100 - 100 * (depositPercentage / 100)).toFixed(2).replace('.', ',')}
                        </strong>
                        <span className="text-[10px] text-slate-500">Pago no dia do atendimento</span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-amber-200/60 shadow-xs">
                        <span className="text-slate-500 block">Opção à Vista (-{fullPaymentDiscount}%):</span>
                        <strong className="text-sm font-bold text-emerald-700 block mt-0.5">
                          R$ {(100 * (1 - fullPaymentDiscount / 100)).toFixed(2).replace('.', ',')}
                        </strong>
                        <span className="text-[10px] text-emerald-700 font-medium">Economia de R$ {(100 * (fullPaymentDiscount / 100)).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: LINK PÚBLICO E QR CODE */}
          {activeTab === 'link' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ShareBookingLink />

              {/* Estratégias e Dicas Práticas de Divulgação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Instagram & Bio</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Adicione o link direto na biografia do seu perfil e crie um destaque nos Stories chamado <strong>&quot;Agendar&quot;</strong> para que os seguidores reservem horários 24h por dia.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp & Status</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Envie o link rápido quando clientes solicitarem vagas ou configure uma mensagem automática no WhatsApp Business com o link exclusivo.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">QR Code no Balcão</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clique em <strong>&quot;Imprimir QR&quot;</strong> para gerar o flyer de balcão. Coloque-o em um display acrílico na recepção para agendamentos de retorno na hora da saída.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Rodapé para Salvar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-500 font-medium text-sm border border-slate-800 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-500" />
              <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SalonSettings;
