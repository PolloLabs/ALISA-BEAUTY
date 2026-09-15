import React, { useState } from 'react'
import {
  CreditCard,
  Plus,
  Search,
  Check,
  Sparkles,
  CheckCircle2,
  Clock,
  Settings,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/formatters'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'
import toast from 'react-hot-toast'

export interface PlanItem {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  isPopular: boolean
  active: boolean
  badge?: string
}

export interface Subscription {
  id: string
  salon_name: string
  owner_name: string
  plan: string
  price: number
  start_date: string
  status: 'Ativa' | 'Pendente' | 'Cancelada'
}

export const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'plan-basico',
    name: 'Básico',
    price: 49,
    description: 'Ideal para profissionais autônomos ou pequenos estúdios individuais.',
    features: [
      '1 Profissional incluso',
      'Agendamento Online 24h',
      'Controle de Clientes básico',
    ],
    isPopular: false,
    active: true,
    badge: 'Plano Inicial',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: 99,
    description: 'Para salões estabelecidos que demandam gestão avançada de equipe e caixa.',
    features: [
      'Até 5 Profissionais cadastrados',
      'Módulo Financeiro & Comissões',
      'Lembretes por WhatsApp',
    ],
    isPopular: true,
    active: true,
    badge: 'Mais Popular',
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    price: 199,
    description: 'Operação ilimitada para redes, spas e salões de alto volume de atendimento.',
    features: [
      'Profissionais ilimitados',
      'Multi-unidades e relatórios VIP',
      'Suporte prioritário 24/7',
    ],
    isPopular: false,
    active: true,
    badge: 'Completo',
  },
]

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    salon_name: 'Studio Elegance & Spa',
    owner_name: 'Camila Alcantara',
    plan: 'Premium',
    price: 199,
    start_date: '2026-01-12',
    status: 'Ativa',
  },
  {
    id: 'sub-2',
    salon_name: 'Barbearia Don Corleone',
    owner_name: 'Rodrigo Medeiros',
    plan: 'Pro',
    price: 99,
    start_date: '2026-02-25',
    status: 'Ativa',
  },
  {
    id: 'sub-3',
    salon_name: 'Espaço VIP Hair Studio',
    owner_name: 'Juliana Siqueira',
    plan: 'Básico',
    price: 49,
    start_date: '2026-03-03',
    status: 'Ativa',
  },
  {
    id: 'sub-4',
    salon_name: 'Maison D’Or Beauté',
    owner_name: 'Beatriz Vasconcelos',
    plan: 'Premium',
    price: 199,
    start_date: '2026-03-15',
    status: 'Ativa',
  },
  {
    id: 'sub-5',
    salon_name: 'Instituto Renovare',
    owner_name: 'Marcos Vinicius',
    plan: 'Pro',
    price: 99,
    start_date: '2026-04-02',
    status: 'Ativa',
  },
]

export const AdminAssinaturasPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Planos salvos no localStorage 'plans'
  const [plans, setPlans] = useState<PlanItem[]>(() => {
    const stored = safeStorageGet<PlanItem[]>('plans', [])
    if (stored && stored.length > 0) {
      return stored
    }
    safeStorageSet('plans', DEFAULT_PLANS)
    return DEFAULT_PLANS
  })

  // Modal de Configuração de Plano
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null)
  const [modalPlanName, setModalPlanName] = useState('')
  const [modalPlanPrice, setModalPlanPrice] = useState<number | string>(99)
  const [modalPlanDescription, setModalPlanDescription] = useState('')
  const [modalPlanFeatures, setModalPlanFeatures] = useState<string[]>([])
  const [newFeatureText, setNewFeatureText] = useState('')
  const [modalIsPopular, setModalIsPopular] = useState(false)
  const [modalIsActive, setModalIsActive] = useState(true)

  // Form State Nova Assinatura
  const [salonName, setSalonName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    const active = plans.find((p) => p.active)
    return active ? active.name : 'Pro'
  })
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<'Ativa' | 'Pendente'>('Ativa')

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const stored = safeStorageGet<Subscription[]>('belezaflow_admin_subscriptions', [])
    if (stored && stored.length > 0) {
      return stored
    }
    safeStorageSet('belezaflow_admin_subscriptions', DEFAULT_SUBSCRIPTIONS)
    return DEFAULT_SUBSCRIPTIONS
  })

  // Handlers do Editor de Planos
  const handleOpenEditPlan = (plan: PlanItem) => {
    setEditingPlan(plan)
    setModalPlanName(plan.name)
    setModalPlanPrice(plan.price)
    setModalPlanDescription(plan.description)
    setModalPlanFeatures([...plan.features])
    setNewFeatureText('')
    setModalIsPopular(plan.isPopular)
    setModalIsActive(plan.active)
    setIsPlanModalOpen(true)
  }

  const handleOpenCreatePlan = () => {
    setEditingPlan(null)
    setModalPlanName('')
    setModalPlanPrice(79)
    setModalPlanDescription('')
    setModalPlanFeatures([
      'Suporte padrão incluso',
      'Agendamento Online 24h',
    ])
    setNewFeatureText('')
    setModalIsPopular(false)
    setModalIsActive(true)
    setIsPlanModalOpen(true)
  }

  const handleAddFeature = () => {
    const text = newFeatureText.trim()
    if (!text) return
    setModalPlanFeatures([...modalPlanFeatures, text])
    setNewFeatureText('')
  }

  const handleRemoveFeature = (index: number) => {
    setModalPlanFeatures(modalPlanFeatures.filter((_, i) => i !== index))
  }

  const handleEditFeature = (index: number, value: string) => {
    const updated = [...modalPlanFeatures]
    updated[index] = value
    setModalPlanFeatures(updated)
  }

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault()

    if (!modalPlanName.trim()) {
      toast.error('Informe o nome do plano')
      return
    }

    const priceNum = Number(modalPlanPrice) || 0
    const validFeatures = modalPlanFeatures.map((f) => f.trim()).filter(Boolean)

    if (validFeatures.length === 0) {
      toast.error('Adicione ao menos um serviço ou recurso ao plano')
      return
    }

    let updatedPlans: PlanItem[] = []

    if (editingPlan) {
      // Edição de plano existente
      updatedPlans = plans.map((p) => {
        if (p.id === editingPlan.id) {
          return {
            ...p,
            name: modalPlanName.trim(),
            price: priceNum,
            description: modalPlanDescription.trim(),
            features: validFeatures,
            isPopular: modalIsPopular,
            active: modalIsActive,
          }
        }
        // Se este plano for marcado como Mais Popular, os outros perdem o selo
        return modalIsPopular ? { ...p, isPopular: false } : p
      })
    } else {
      // Criação de novo plano
      const newPlan: PlanItem = {
        id: `plan-${Date.now()}`,
        name: modalPlanName.trim(),
        price: priceNum,
        description: modalPlanDescription.trim(),
        features: validFeatures,
        isPopular: modalIsPopular,
        active: modalIsActive,
        badge: 'Customizado',
      }

      if (modalIsPopular) {
        updatedPlans = plans.map((p) => ({ ...p, isPopular: false }))
      } else {
        updatedPlans = [...plans]
      }
      updatedPlans.push(newPlan)
    }

    setPlans(updatedPlans)
    safeStorageSet('plans', updatedPlans)
    setIsPlanModalOpen(false)
    toast.success('Plano salvo com sucesso!')
  }

  // Handler para criar assinatura
  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault()

    if (!salonName.trim()) {
      toast.error('Informe o nome do salão')
      return
    }

    const matchedPlan = plans.find((p) => p.name === selectedPlan)
    const planPrice = matchedPlan ? matchedPlan.price : 99

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      salon_name: salonName.trim(),
      owner_name: ownerName.trim() || 'Responsável',
      plan: selectedPlan,
      price: planPrice,
      start_date: startDate,
      status: status,
    }

    const updated = [newSub, ...subscriptions]
    setSubscriptions(updated)
    safeStorageSet('belezaflow_admin_subscriptions', updated)

    // Sincroniza também com a lista de lojas para manter consistência no painel
    const currentSalons = safeStorageGet<any[]>('belezaflow_admin_salons', [])
    const existingIndex = currentSalons.findIndex(
      (s) => s.name?.toLowerCase() === newSub.salon_name.toLowerCase()
    )

    if (existingIndex >= 0) {
      currentSalons[existingIndex].plan = newSub.plan
      currentSalons[existingIndex].mrr = newSub.price
      safeStorageSet('belezaflow_admin_salons', currentSalons)
    } else {
      const newSalonEntry = {
        id: `store-${Date.now()}`,
        name: newSub.salon_name,
        owner_name: newSub.owner_name,
        owner_email: `${newSub.salon_name.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
        plan: newSub.plan,
        status: 'Ativo',
        mrr: newSub.price,
        created_at: newSub.start_date.split('-').reverse().join('/'),
      }
      safeStorageSet('belezaflow_admin_salons', [newSalonEntry, ...currentSalons])
    }

    toast.success('Assinatura cadastrada com sucesso!')
    setSalonName('')
    setOwnerName('')
    setIsModalOpen(false)
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    return (
      sub.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner & Botão Nova Assinatura */}
      <Card className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-1.5">
              <CreditCard className="w-4 h-4 text-purple-700" />
              <span>Gestão de Planos & Assinaturas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Assinaturas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Controle de planos, contratos ativos e cadastro de novas assinaturas da plataforma.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-sm border border-slate-800 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Nova Assinatura</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Cards dos Planos com Editor e Botão + Novo Plano */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold font-luxury text-slate-900">
              Planos Disponíveis
            </h2>
            <p className="text-xs text-slate-500">
              Grade oficial de valores e recursos para adesão de novos estabelecimentos
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreatePlan}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium text-xs border border-slate-800 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Novo Plano</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isPopular = plan.isPopular

            if (isPopular) {
              return (
                <Card
                  key={plan.id}
                  className={`p-5 sm:p-6 bg-slate-900 rounded-2xl border border-amber-500/50 shadow-md flex flex-col justify-between relative overflow-hidden text-white ${
                    !plan.active ? 'opacity-70' : ''
                  }`}
                >
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {plan.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-400 font-semibold tracking-wide">
                          {plan.active ? 'Mais Popular' : 'Inativo'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer shadow-xs"
                          title="Configurar Plano"
                        >
                          <Settings className="w-3.5 h-3.5 text-amber-400" />
                          <span>Configurações</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-luxury text-amber-400">
                          {formatCurrency(plan.price).replace(',00', '')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/mês</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-5 space-y-2.5 text-xs text-slate-200 border-t border-slate-800 pt-4">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            }

            return (
              <Card
                key={plan.id}
                className={`p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden ${
                  !plan.active ? 'opacity-70 bg-slate-50/80' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {plan.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">
                        {plan.active ? plan.badge || 'Plano Inicial' : 'Inativo'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlan(plan)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-xs"
                        title="Configurar Plano"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Configurações</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold font-luxury text-slate-900">
                        {formatCurrency(plan.price).replace(',00', '')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/mês</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Tabela de Assinaturas */}
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-luxury text-slate-900">
              Contratos & Assinaturas Ativas ({subscriptions.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Histórico de adesões e planos contratados em tempo real
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar salão ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Salão</th>
                <th className="px-5 py-3.5">Plano</th>
                <th className="px-5 py-3.5">Valor Mensal</th>
                <th className="px-5 py-3.5">Data de Início</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Salão */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900 text-sm">{sub.salon_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{sub.owner_name}</div>
                  </td>

                  {/* Plano */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sub.plan === 'Premium'
                          ? 'bg-slate-900 text-amber-400 border border-slate-800'
                          : sub.plan === 'Pro'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sub.plan}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="px-5 py-3.5 font-bold font-luxury text-slate-900 text-sm">
                    {formatCurrency(sub.price)}
                    <span className="text-xs font-normal text-slate-400">/mês</span>
                  </td>

                  {/* Data de Início */}
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {sub.start_date.split('-').reverse().join('/')}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 text-right">
                    {sub.status === 'Ativa' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 font-luxury">Nenhuma assinatura encontrada</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Nenhuma assinatura cadastrada corresponde aos filtros de pesquisa.
            </p>
          </div>
        )}
      </Card>

      {/* Modal Configurar Plano (Edição e Criação) */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? `Configurar Plano: ${editingPlan.name}` : 'Criar Novo Plano'}
        subtitle="Gerencie valores, serviços incluídos e visibilidade do plano"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Plano *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Prime VIP"
                value={modalPlanName}
                onChange={(e) => setModalPlanName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Preço Mensal (R$) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={1}
                placeholder="Ex: 99"
                value={modalPlanPrice}
                onChange={(e) => setModalPlanPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrição Curta
            </label>
            <textarea
              rows={2}
              placeholder="Breve resumo da proposta de valor deste plano..."
              value={modalPlanDescription}
              onChange={(e) => setModalPlanDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Lista de Serviços Oferecidos (Features) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Serviços & Recursos Oferecidos ({modalPlanFeatures.length})
              </label>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {modalPlanFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleEditFeature(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Descrição do serviço..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remover serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar novo serviço */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
                placeholder="Adicionar serviço (ex: Notificações WhatsApp)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {/* Toggle Mais Popular */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Destaque "Mais Popular"
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Apenas 1 plano ativo com o selo e estilo de destaque escuro por vez
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={modalIsPopular}
                onChange={(e) => setModalIsPopular(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
            </label>

            {/* Toggle Plano Ativo */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Plano Ativo
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Disponível para novas contratações na plataforma
                </span>
              </div>
              <input
                type="checkbox"
                checked={modalIsActive}
                onChange={(e) => setModalIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
            </label>
          </div>

          {/* Footer do Modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-amber-400 transition-colors cursor-pointer"
            >
              Salvar Plano
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nova Assinatura */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Nova Assinatura"
        subtitle="Vincule um estabelecimento a um plano contratado"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Salão / Estabelecimento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Studio Belle Paris"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Responsável / Dono
            </label>
            <input
              type="text"
              placeholder="Ex: Mariana Lima"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Plano Contratado
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
              >
                {plans
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} — {formatCurrency(p.price)}/mês
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data de Início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Ativa' | 'Pendente')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
            >
              <option value="Ativa">Ativa (Acesso Liberado)</option>
              <option value="Pendente">Pendente (Aguardando Confirmação)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 text-amber-400 transition-colors cursor-pointer"
            >
              Salvar Assinatura
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminAssinaturasPage
