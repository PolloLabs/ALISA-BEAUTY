import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export interface AccountManager {
  name: string
  whatsapp: string
  email: string
  avatar?: string
}

export interface PlanItem {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  featureKeys?: string[]
  maxProfessionals?: number
  isPopular: boolean
  active: boolean
  badge?: string
}

export interface UserSubscription {
  id?: string
  planId: string
  planName: string
  status: 'active' | 'pending' | 'canceled'
  price?: number
  activatedAt?: string
  manager?: AccountManager
}

export const FEATURE_DEFINITIONS: Record<string, { label: string; description: string; minPlan: 'basico' | 'pro' | 'premium' }> = {
  agenda_publica_pix: {
    label: 'Agenda pública com PIX',
    description: 'Agendamento online pelo link do salão com recebimento instantâneo via PIX',
    minPlan: 'basico',
  },
  clientes: {
    label: 'Controle de clientes e histórico',
    description: 'Gestão completa da base de clientes e histórico de visitas',
    minPlan: 'basico',
  },
  financeiro_basico: {
    label: 'Relatório financeiro básico',
    description: 'Faturamento bruto, quantidade de atendimentos e ticket médio',
    minPlan: 'basico',
  },
  lembretes_whatsapp: {
    label: 'Lembretes automáticos por WhatsApp',
    description: 'Envio de confirmações e avisos automáticos de horários agendados',
    minPlan: 'basico',
  },
  agenda_visual: {
    label: 'Agenda visual multi-profissional',
    description: 'Visualização da grade diária por colunas com linha do tempo de todos os profissionais',
    minPlan: 'pro',
  },
  checkout_completo: {
    label: 'Checkout com Cartão de Crédito e Sinal de 30%',
    description: 'Cobrança antecipada com opção de sinal para garantia contra no-show e cartão de crédito',
    minPlan: 'pro',
  },
  comissoes: {
    label: 'Cálculo automático de comissões',
    description: 'Módulo financeiro com apuração de comissões individuais e faturamento líquido',
    minPlan: 'pro',
  },
  relatorios_tempo_real: {
    label: 'Relatórios e métricas em tempo real',
    description: 'Painéis analíticos avançados com filtros por período e profissional',
    minPlan: 'pro',
  },
  suporte_prioritario: {
    label: 'Suporte prioritário via WhatsApp',
    description: 'Canal direto com time de atendimento técnico',
    minPlan: 'pro',
  },
  personalizacao_completa: {
    label: 'Personalização de identidade visual completa',
    description: 'Cores personalizadas, paleta de luxo, modo noturno e customização de telas',
    minPlan: 'premium',
  },
  campanhas_em_lote: {
    label: 'Campanhas em lote e retorno de clientes',
    description: 'Filtro inteligente de clientes inativos e disparos de reengajamento via WhatsApp',
    minPlan: 'premium',
  },
  gerente_dedicado: {
    label: 'Gerente de conta dedicado',
    description: 'Consultor executivo VIP com suporte direto e reuniões periódicas de crescimento',
    minPlan: 'premium',
  },
}

export const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'basico',
    name: 'Básico',
    price: 49,
    description: 'Ideal para profissionais autônomos e pequenos studios.',
    features: [
      'Até 2 profissionais',
      'Agenda online pública com PIX',
      'Controle de clientes e histórico',
      'Relatório financeiro básico',
      'Lembretes automáticos por WhatsApp',
    ],
    featureKeys: [
      'agenda_publica_pix',
      'clientes',
      'financeiro_basico',
      'lembretes_whatsapp',
    ],
    maxProfessionals: 2,
    isPopular: false,
    active: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'Perfeito para salões em expansão que buscam máxima produtividade.',
    features: [
      'Até 5 profissionais',
      'Agenda visual completa e multi-profissional',
      'Checkout com PIX, Cartão e Sinal de 30%',
      'Cálculo automático de comissões',
      'Relatórios e métricas de faturamento em tempo real',
      'Suporte prioritário via WhatsApp',
    ],
    featureKeys: [
      'agenda_publica_pix',
      'clientes',
      'financeiro_basico',
      'lembretes_whatsapp',
      'agenda_visual',
      'checkout_completo',
      'comissoes',
      'relatorios_tempo_real',
      'suporte_prioritario',
    ],
    maxProfessionals: 5,
    isPopular: true,
    active: true,
    badge: 'Mais Popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    description: 'Gestão executiva de luxo para salões de alto padrão.',
    features: [
      'Profissionais ilimitados',
      'Tudo do Plano Pro incluído',
      'Personalização de identidade visual completa',
      'Disparo em lote e campanhas de retorno de clientes',
      'Gerente de conta dedicado',
    ],
    featureKeys: [
      'agenda_publica_pix',
      'clientes',
      'financeiro_basico',
      'lembretes_whatsapp',
      'agenda_visual',
      'checkout_completo',
      'comissoes',
      'relatorios_tempo_real',
      'suporte_prioritario',
      'personalizacao_completa',
      'campanhas_em_lote',
      'gerente_dedicado',
    ],
    maxProfessionals: 999,
    isPopular: false,
    active: true,
    badge: 'Exclusivo VIP',
  },
]

export const DEFAULT_ACCOUNT_MANAGER: AccountManager = {
  name: 'Sophia Albuquerque',
  whatsapp: '(11) 98765-9999',
  email: 'sophia.albuquerque@alisabeauty.com',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
}

interface PlanContextType {
  plan: PlanItem | null
  planId: string
  planName: string
  isBasic: boolean
  isPro: boolean
  isPremium: boolean
  can: (featureKey: string) => boolean
  limits: {
    maxProfessionals: number
  }
  allPlans: PlanItem[]
  subscription: UserSubscription | null
  accountManager: AccountManager
  refreshPlan: () => void
  activateSubscription: (planIdentifier: string) => void
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  // 1. Carrega catálogo de planos de localStorage 'plans'
  const [allPlans, setAllPlans] = useState<PlanItem[]>(() => {
    const stored = safeStorageGet<PlanItem[]>('plans', [])
    if (stored && stored.length > 0) {
      // Normaliza se planos antigos não possuírem featureKeys ou maxProfessionals
      return stored.map((p) => {
        const lower = p.name.toLowerCase()
        const defaultMatch = DEFAULT_PLANS.find(
          (dp) => dp.id === p.id || dp.name.toLowerCase() === lower
        )
        return {
          ...p,
          featureKeys: p.featureKeys || defaultMatch?.featureKeys || [],
          maxProfessionals:
            typeof p.maxProfessionals === 'number'
              ? p.maxProfessionals
              : defaultMatch?.maxProfessionals || 5,
        }
      })
    }
    safeStorageSet('plans', DEFAULT_PLANS)
    return DEFAULT_PLANS
  })

  // 2. Carrega assinatura ativa do salão de localStorage 'subscription'
  const [subscription, setSubscription] = useState<UserSubscription | null>(() => {
    const stored = safeStorageGet<UserSubscription | null>('subscription', null)
    if (stored) return stored
    // Fallback: se houver plano no user logado
    if (user?.plan_id) {
      const pId = user.plan_id.toLowerCase()
      const matched = DEFAULT_PLANS.find(
        (p) => p.id === pId || p.name.toLowerCase() === pId
      )
      const sub: UserSubscription = {
        planId: matched ? matched.id : pId,
        planName: matched ? matched.name : 'Pro',
        status: user.plan_status === 'active' ? 'active' : 'pending',
        price: matched ? matched.price : 99,
        activatedAt: new Date().toISOString(),
      }
      safeStorageSet('subscription', sub)
      return sub
    }
    // Default demo subscription para owner: Pro
    const defaultSub: UserSubscription = {
      planId: 'pro',
      planName: 'Pro',
      status: 'active',
      price: 99,
      activatedAt: new Date().toISOString(),
    }
    safeStorageSet('subscription', defaultSub)
    return defaultSub
  })

  // 3. Gerente de conta dedicado (para Premium)
  const [accountManager, setAccountManager] = useState<AccountManager>(() => {
    const stored = safeStorageGet<AccountManager>('account_manager', DEFAULT_ACCOUNT_MANAGER)
    return stored || DEFAULT_ACCOUNT_MANAGER
  })

  // Função de sincronização
  const refreshPlan = useCallback(() => {
    const storedPlans = safeStorageGet<PlanItem[]>('plans', DEFAULT_PLANS)
    setAllPlans(storedPlans)

    const storedSub = safeStorageGet<UserSubscription | null>('subscription', null)
    if (storedSub) {
      setSubscription(storedSub)
    }

    const storedMgr = safeStorageGet<AccountManager>('account_manager', DEFAULT_ACCOUNT_MANAGER)
    if (storedMgr) {
      setAccountManager(storedMgr)
    }
  }, [])

  useEffect(() => {
    const handleStorageChange = () => {
      refreshPlan()
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('plan_changed', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('plan_changed', handleStorageChange)
    }
  }, [refreshPlan])

  // Identifica o plano ativo
  const activePlanId = (subscription?.planId || user?.plan_id || 'pro').toLowerCase()

  const currentPlan = allPlans.find(
    (p) => p.id.toLowerCase() === activePlanId || p.name.toLowerCase() === activePlanId
  ) || allPlans.find((p) => p.name.toLowerCase() === 'pro') || allPlans[0]

  const normalizedPlanId = currentPlan
    ? currentPlan.name.toLowerCase().includes('premium')
      ? 'premium'
      : currentPlan.name.toLowerCase().includes('básico') || currentPlan.name.toLowerCase().includes('basico')
      ? 'basico'
      : 'pro'
    : 'pro'

  const isBasic = normalizedPlanId === 'basico'
  const isPro = normalizedPlanId === 'pro'
  const isPremium = normalizedPlanId === 'premium'

  // Motor de verificação de features
  const can = useCallback(
    (featureKey: string): boolean => {
      // Super admin tem permissão irrestrita técnica caso necessário
      if (user?.role === 'super_admin') return true

      if (!currentPlan) return false

      // 1. Se o plano configurado em 'plans' tiver featureKeys explicitamente salvas pelo super admin
      if (Array.isArray(currentPlan.featureKeys) && currentPlan.featureKeys.length > 0) {
        return currentPlan.featureKeys.includes(featureKey)
      }

      // 2. Fallback baseado no mapa padrão da especificação
      const def = FEATURE_DEFINITIONS[featureKey]
      if (!def) return false

      if (def.minPlan === 'basico') return true
      if (def.minPlan === 'pro') return isPro || isPremium
      if (def.minPlan === 'premium') return isPremium

      return false
    },
    [user?.role, currentPlan, isPro, isPremium]
  )

  const limits = {
    maxProfessionals: typeof currentPlan?.maxProfessionals === 'number'
      ? currentPlan.maxProfessionals
      : isBasic
      ? 2
      : isPro
      ? 5
      : 999,
  }

  const activateSubscription = (planIdentifier: string) => {
    const matched = allPlans.find(
      (p) => p.id === planIdentifier || p.name.toLowerCase() === planIdentifier.toLowerCase()
    ) || allPlans.find((p) => p.id === 'pro')

    const newSub: UserSubscription = {
      planId: matched ? matched.id : planIdentifier,
      planName: matched ? matched.name : planIdentifier,
      status: 'active',
      price: matched ? matched.price : 99,
      activatedAt: new Date().toISOString(),
      manager: accountManager,
    }

    safeStorageSet('subscription', newSub)
    setSubscription(newSub)

    // Notifica outros componentes
    window.dispatchEvent(new Event('plan_changed'))
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <PlanContext.Provider
      value={{
        plan: currentPlan || null,
        planId: normalizedPlanId,
        planName: currentPlan?.name || 'Pro',
        isBasic,
        isPro,
        isPremium,
        can,
        limits,
        allPlans,
        subscription,
        accountManager,
        refreshPlan,
        activateSubscription,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlan deve ser utilizado dentro de um PlanProvider')
  }
  return context
}
