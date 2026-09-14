import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Shield, Zap, Crown, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface PlanGateProps {
  onPlanActivated: () => void
}

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    price: '49',
    period: '/mês',
    description: 'Ideal para profissionais autônomos e pequenos studios.',
    badge: null,
    highlighted: false,
    icon: Zap,
    features: [
      'Até 2 profissionais',
      'Agenda online pública com PIX',
      'Controle de clientes e histórico',
      'Relatório financeiro básico',
      'Lembretes automáticos por WhatsApp',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99',
    period: '/mês',
    description: 'Perfeito para salões em expansão que buscam máxima produtividade.',
    badge: 'Mais Popular',
    highlighted: true,
    icon: Crown,
    features: [
      'Até 5 profissionais',
      'Agenda visual completa e multi-profissional',
      'Checkout com PIX, Cartão e Sinal de 30%',
      'Cálculo automático de comissões',
      'Relatórios e métricas de faturamento em tempo real',
      'Suporte prioritário via WhatsApp',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '199',
    period: '/mês',
    description: 'Gestão executiva de luxo para salões de alto padrão.',
    badge: 'Exclusivo VIP',
    highlighted: false,
    icon: Sparkles,
    features: [
      'Profissionais ilimitados',
      'Tudo do Plano Pro incluído',
      'Personalização de identidade visual completa',
      'Gestão multi-unidades e permissões avançadas',
      'Disparo em lote e campanhas de retorno de clientes',
      'Gerente de conta dedicado',
    ],
  },
]

export const PlanGate: React.FC<PlanGateProps> = ({ onPlanActivated }) => {
  const { user, activatePlan } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const handleSimulatePayment = async () => {
    setIsProcessing(true)
    try {
      // Simulação rápida de pagamento do plano
      await new Promise((resolve) => setTimeout(resolve, 800))
      activatePlan(selectedPlan)
      toast.success('Assinatura ativada com sucesso! Bem-vindo(a) ao BelezaFlow Pro.')
      onPlanActivated()
    } catch {
      toast.error('Erro ao processar assinatura')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto space-y-8 py-6">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Ativação de Assinatura
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-luxury">
            Escolha o Plano do seu Salão
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Olá, <span className="text-amber-400 font-semibold">{user?.fullName || 'Proprietário(a)'}</span>! 
            Para desbloquear o acesso total ao painel do seu salão, selecione um plano abaixo e realize a ativação.
          </p>
        </div>

        {/* Cards de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id
            const Icon = plan.icon

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-slate-900/95 border-amber-500 shadow-2xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Top */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        <span className="text-xs text-slate-400">Mensal</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-400">R$</span>
                      <span className="text-4xl font-extrabold text-white tracking-tight">{plan.price}</span>
                      <span className="text-xs text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Lista de Features */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60">
                  <div className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}>
                    {isSelected ? 'Plano Selecionado' : 'Selecionar este Plano'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Ação de Pagamento Simulado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Ambiente de Simulação Segura
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Ao clicar em simular pagamento, o status do seu salão será alterado para <span className="text-emerald-400 font-semibold">Ativo</span> e todo o painel será liberado imediatamente.
            </p>
          </div>

          <Button
            onClick={handleSimulatePayment}
            isLoading={isProcessing}
            size="lg"
            className="w-full sm:w-auto px-8 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Simular Pagamento</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          BelezaFlow Mini SaaS &bull; Assinatura mensal sem fidelidade
        </p>
      </div>
    </div>
  )
}

export default PlanGate
