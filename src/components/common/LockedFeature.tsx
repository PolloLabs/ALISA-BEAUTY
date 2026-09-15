import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePlan } from '@/hooks/usePlan'

interface LockedFeatureProps {
  title: string
  description: string
  requiredPlan?: 'Pro' | 'Premium'
  benefits?: string[]
}

export const LockedFeature: React.FC<LockedFeatureProps> = ({
  title,
  description,
  requiredPlan = 'Pro',
  benefits = [],
}) => {
  const navigate = useNavigate()
  const { planName } = usePlan()

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full p-6 sm:p-8 bg-slate-900 border border-amber-500/30 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 text-center">
          {/* Badge & Lock Icon */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Lock className="w-7 h-7" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Recurso Exclusivo Plano {requiredPlan}
            </span>
          </div>

          {/* Título & Descrição */}
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-luxury text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Lista de benefícios do plano exigido */}
          {benefits.length > 0 && (
            <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5 max-w-md mx-auto">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                O que você desbloqueia:
              </span>
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Status Atual e Ação de Upgrade */}
          <div className="pt-2 space-y-3 max-w-md mx-auto">
            <p className="text-xs text-slate-400">
              Seu plano atual: <strong className="text-amber-400">{planName}</strong>
            </p>

            <Button
              onClick={() => navigate('/plan-gate')}
              size="lg"
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Fazer Upgrade para {requiredPlan}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ativação instantânea e sem contrato de fidelidade</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
