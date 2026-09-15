import React from 'react'
import { Crown, MessageCircle, Mail, Sparkles, CheckCircle2, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { usePlan } from '@/hooks/usePlan'

interface AccountManagerCardProps {
  className?: string
}

export const AccountManagerCard: React.FC<AccountManagerCardProps> = ({ className = '' }) => {
  const { accountManager, isPremium, can } = usePlan()

  // Exibe apenas para estabelecimentos com recurso de gerente dedicado ou plano Premium
  if (!isPremium && !can('gerente_dedicado')) {
    return null
  }

  const cleanPhone = (accountManager.whatsapp || '').replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${accountManager.name}, sou cliente do plano Premium da ALISA BEAUTY e gostaria de um suporte prioritário.`
  )}`

  return (
    <Card className={`p-5 sm:p-6 bg-slate-900 border border-amber-500/40 rounded-2xl text-white shadow-xl relative overflow-hidden ${className}`}>
      {/* Glow dourado */}
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Lado Esquerdo: Identificação do Gerente */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-500/50 overflow-hidden shadow-md">
              {accountManager.avatar ? (
                <img
                  src={accountManager.avatar}
                  alt={accountManager.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold font-luxury text-xl">
                  {accountManager.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Status Online */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-xs"
              title="Online agora"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                Seu Gerente de Conta Dedicado
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Atendimento VIP
              </span>
            </div>

            <h3 className="text-lg font-bold font-luxury text-white tracking-tight">
              {accountManager.name}
            </h3>

            <p className="text-xs text-slate-300">
              Consultor executivo exclusivo para assessoria de crescimento e suporte direto.
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações Diretas */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs border border-emerald-500 shadow-md transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Direto</span>
          </a>

          <a
            href={`mailto:${accountManager.email}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>{accountManager.email}</span>
          </a>
        </div>
      </div>
    </Card>
  )
}
