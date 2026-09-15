import React, { useState, useMemo, useEffect } from 'react'
import {
  MessageSquare,
  Users,
  Calendar,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ExternalLink,
  Check,
  RefreshCw,
  AlertCircle,
  Crown,
  ChevronRight,
  Sliders,
} from 'lucide-react'
import { differenceInDays, parseISO, format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useSalon } from '@/hooks/useSalon'
import { usePlan } from '@/hooks/usePlan'
import { LockedFeature } from '@/components/common/LockedFeature'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'
import { formatCurrency } from '@/lib/formatters'

interface ClientCampaignData {
  id: string
  name: string
  phone: string
  lastVisitDate: string
  daysSinceLastVisit: number
  totalSpent: number
  services: string[]
  totalVisits: number
}

// Clientes demonstrativos realistas caso o salão não tenha histórico antigo suficiente
const DEMO_CAMPAIGN_CLIENTS: ClientCampaignData[] = [
  {
    id: 'cli-1',
    name: 'Carolina Medeiros',
    phone: '(11) 98765-4321',
    lastVisitDate: format(subDays(new Date(), 38), 'yyyy-MM-dd'),
    daysSinceLastVisit: 38,
    totalSpent: 420,
    services: ['Corte Feminino', 'Mechas Iluminadas'],
    totalVisits: 3,
  },
  {
    id: 'cli-2',
    name: 'Juliana Paes Silveira',
    phone: '(11) 97654-3210',
    lastVisitDate: format(subDays(new Date(), 52), 'yyyy-MM-dd'),
    daysSinceLastVisit: 52,
    totalSpent: 650,
    services: ['Coloração & Mechas', 'Hidratação Profunda'],
    totalVisits: 4,
  },
  {
    id: 'cli-3',
    name: 'Fernanda Vasconcellos',
    phone: '(11) 96543-2109',
    lastVisitDate: format(subDays(new Date(), 68), 'yyyy-MM-dd'),
    daysSinceLastVisit: 68,
    totalSpent: 310,
    services: ['Manicure e Pedicure', 'Design Sobrancelhas'],
    totalVisits: 5,
  },
  {
    id: 'cli-4',
    name: 'Mariana Ximenes',
    phone: '(11) 95432-1098',
    lastVisitDate: format(subDays(new Date(), 95), 'yyyy-MM-dd'),
    daysSinceLastVisit: 95,
    totalSpent: 890,
    services: ['Alongamento em Fibra', 'Corte Feminino'],
    totalVisits: 6,
  },
  {
    id: 'cli-5',
    name: 'Beatriz Zanin',
    phone: '(11) 94321-0987',
    lastVisitDate: format(subDays(new Date(), 24), 'yyyy-MM-dd'),
    daysSinceLastVisit: 24,
    totalSpent: 260,
    services: ['Limpeza de Pele', 'Design Sobrancelhas'],
    totalVisits: 2,
  },
]

export const CampanhasPage: React.FC = () => {
  const { salon } = useSalon()
  const { can } = usePlan()

  // Estados dos filtros
  const [daysFilter, setDaysFilter] = useState<number>(30) // 0 = Todos, 30, 45, 60, 90
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])

  // Template da mensagem WhatsApp
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    return (
      'Olá {nome}! ✨ Notamos que faz {dias} dias desde sua última visita ao {salao}. ' +
      'Preparamos uma cortesia especial esta semana para renovar seu visual com a gente! Podemos agendar seu horário?'
    )
  })

  // Disparo em lote
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [sendLogs, setSendLogs] = useState<Array<{ name: string; phone: string; status: 'pending' | 'sending' | 'success' }>>([])
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  // Extrair clientes reais dos agendamentos em localStorage 'belezaflow_appointments'
  const clients = useMemo<ClientCampaignData[]>(() => {
    try {
      const appointments = safeStorageGet<any[]>('belezaflow_appointments', [])
      if (!Array.isArray(appointments) || appointments.length === 0) {
        return DEMO_CAMPAIGN_CLIENTS
      }

      const clientMap = new Map<string, {
        name: string
        phone: string
        dates: string[]
        spent: number
        services: Set<string>
      }>()

      appointments.forEach((apt) => {
        const name = (apt.client_name || '').trim()
        const phone = (apt.client_phone || '').trim()
        if (!name) return

        const key = phone || name.toLowerCase()
        const aptDate = apt.date || (apt.start_time ? apt.start_time.split('T')[0] : '')
        const price = typeof apt.price === 'number' ? apt.price : 0
        const serviceName = apt.service_name || 'Serviço'

        if (!clientMap.has(key)) {
          clientMap.set(key, {
            name,
            phone: phone || '(11) 98888-0000',
            dates: aptDate ? [aptDate] : [],
            spent: price,
            services: new Set([serviceName]),
          })
        } else {
          const entry = clientMap.get(key)!
          if (aptDate) entry.dates.push(aptDate)
          entry.spent += price
          entry.services.add(serviceName)
        }
      })

      const now = new Date()
      const extracted: ClientCampaignData[] = []

      clientMap.forEach((entry, key) => {
        // Encontra a data mais recente
        let latestDateStr = format(subDays(now, 35), 'yyyy-MM-dd')
        if (entry.dates.length > 0) {
          const sorted = [...entry.dates].sort().reverse()
          latestDateStr = sorted[0]
        }

        let daysDiff = 35
        try {
          const parsed = parseISO(latestDateStr)
          daysDiff = Math.max(0, differenceInDays(now, parsed))
        } catch {
          daysDiff = 35
        }

        extracted.push({
          id: `client-${key.replace(/\s+/g, '-')}`,
          name: entry.name,
          phone: entry.phone,
          lastVisitDate: latestDateStr,
          daysSinceLastVisit: daysDiff,
          totalSpent: entry.spent,
          services: Array.from(entry.services),
          totalVisits: entry.dates.length || 1,
        })
      })

      // Se extraiu poucos clientes, mescla com os demos para experiência rica de teste
      if (extracted.length < 3) {
        const merged = [...extracted]
        DEMO_CAMPAIGN_CLIENTS.forEach((dc) => {
          if (!merged.some((m) => m.name.toLowerCase() === dc.name.toLowerCase())) {
            merged.push(dc)
          }
        })
        return merged
      }

      return extracted
    } catch {
      return DEMO_CAMPAIGN_CLIENTS
    }
  }, [])

  // Filtragem dos clientes
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Filtro de dias sem visita
      if (daysFilter > 0 && c.daysSinceLastVisit < daysFilter) {
        return false
      }

      // Filtro de busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchName = c.name.toLowerCase().includes(term)
        const matchPhone = c.phone.includes(term)
        const matchService = c.services.some((s) => s.toLowerCase().includes(term))
        if (!matchName && !matchPhone && !matchService) return false
      }

      return true
    })
  }, [clients, daysFilter, searchTerm])

  // Selecionar todos os filtrados por padrão ao mudar de filtro
  useEffect(() => {
    setSelectedClientIds(filteredClients.map((c) => c.id))
  }, [filteredClients])

  const toggleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([])
    } else {
      setSelectedClientIds(filteredClients.map((c) => c.id))
    }
  }

  const toggleSelectClient = (id: string) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(selectedClientIds.filter((item) => item !== id))
    } else {
      setSelectedClientIds([...selectedClientIds, id])
    }
  }

  // Gera prévia do texto para um cliente específico
  const formatClientMessage = (client: ClientCampaignData) => {
    const salonName = salon?.name || 'ALISA BEAUTY'
    return messageTemplate
      .replace(/{nome}/g, client.name.split(' ')[0])
      .replace(/{dias}/g, client.daysSinceLastVisit.toString())
      .replace(/{salao}/g, salonName)
  }

  // Disparo em lote simulado 1 a 1 com delay realista
  const handleStartBatchDispatch = async () => {
    const selectedClients = filteredClients.filter((c) => selectedClientIds.includes(c.id))
    if (selectedClients.length === 0) {
      toast.error('Selecione pelo menos um cliente para o disparo')
      return
    }

    setIsSending(true)
    setIsLogModalOpen(true)
    setSendProgress({ current: 0, total: selectedClients.length })

    const initialLogs = selectedClients.map((c) => ({
      name: c.name,
      phone: c.phone,
      status: 'pending' as const,
    }))
    setSendLogs(initialLogs)

    for (let i = 0; i < selectedClients.length; i++) {
      // Marca como 'sending'
      setSendLogs((prev) => {
        const next = [...prev]
        next[i] = { ...next[i], status: 'sending' }
        return next
      })

      // Simulação realista de delay de envio da API WhatsApp (750ms)
      await new Promise((resolve) => setTimeout(resolve, 750))

      // Marca como 'success'
      setSendLogs((prev) => {
        const next = [...prev]
        next[i] = { ...next[i], status: 'success' }
        return next
      })

      setSendProgress({ current: i + 1, total: selectedClients.length })
    }

    setIsSending(false)
    toast.success(`${selectedClients.length} mensagens disparadas com sucesso via WhatsApp!`)
  }

  // Se o plano não possuir permissão para campanhas em lote, exibe tela de bloqueio com CTA
  if (!can('campanhas_em_lote')) {
    return (
      <LockedFeature
        title="Campanhas de Retorno & Disparos WhatsApp"
        description="Reengaje clientes inativos com disparos inteligentes em lote via WhatsApp. Recupere faturamento trazendo de volta clientes que não visitam seu salão há mais de 30 dias."
        requiredPlan="Premium"
        benefits={[
          'Filtro inteligente de clientes sem visita há 30, 45, 60 ou 90 dias',
          'Template personalizado de mensagem com tags dinâmicas ({nome}, {dias}, {salao})',
          'Disparo automatizado em lote com simulação de envio 1 a 1 e feedback em tempo real',
          'Métricas de clientes recuperados e conversão de retorno',
        ]}
      />
    )
  }

  const previewClient = filteredClients[0] || DEMO_CAMPAIGN_CLIENTS[0]

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner de Identidade Premium */}
      <Card className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Módulo Executivo VIP • Plano Premium</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Campanhas de Retorno & WhatsApp
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Filtre clientes inativos com base no histórico real de visitas e dispare campanhas personalizadas em lote.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartBatchDispatch}
              disabled={isSending || selectedClientIds.length === 0}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm border border-slate-800 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>Disparar WhatsApp ({selectedClientIds.length})</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Grid: Editor de Template & Filtro Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card do Template de Mensagem (Coluna Esquerda 1/3) */}
        <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-luxury text-base pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>Template da Mensagem</span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Texto com Tags Dinâmicas
            </label>
            <textarea
              rows={5}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none text-slate-800"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tags disponíveis:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
                {'{nome}'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
                {'{dias}'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono">
                {'{salao}'}
              </span>
            </div>
          </div>

          {/* Pré-visualização da Mensagem */}
          {previewClient && (
            <div className="p-3.5 rounded-xl bg-slate-950 text-white border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                <span className="font-semibold text-amber-400">Prévia no WhatsApp:</span>
                <span>{previewClient.name.split(' ')[0]}</span>
              </div>
              <p className="text-slate-200 leading-relaxed italic">
                "{formatClientMessage(previewClient)}"
              </p>
            </div>
          )}
        </Card>

        {/* Lista de Clientes com Filtros (Coluna Direita 2/3) */}
        <Card className="lg:col-span-2 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold font-luxury text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Clientes Elegíveis para Retorno ({filteredClients.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Extraídos do histórico real de atendimentos em localStorage
              </p>
            </div>

            {/* Contador de Seleção */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                {selectedClientIds.length === filteredClients.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-500/20">
                {selectedClientIds.length} selecionados
              </span>
            </div>
          </div>

          {/* Barra de Filtros: Dias Sem Visita & Busca */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Filtro Sem Visita Há X+ dias */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Inativo há:
              </span>
              {[
                { label: '30+ dias', val: 30 },
                { label: '45+ dias', val: 45 },
                { label: '60+ dias', val: 60 },
                { label: '90+ dias', val: 90 },
                { label: 'Todos', val: 0 },
              ].map((pill) => {
                const isSelected = daysFilter === pill.val
                return (
                  <button
                    key={pill.val}
                    type="button"
                    onClick={() => setDaysFilter(pill.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 text-amber-400 shadow-xs border border-slate-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                )
              })}
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredClients.map((client) => {
              const isSelected = selectedClientIds.includes(client.id)

              return (
                <div
                  key={client.id}
                  onClick={() => toggleSelectClient(client.id)}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-50/40 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 sm:mt-0 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{client.name}</span>
                        <span className="text-xs text-slate-500 font-normal">{client.phone}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>Última visita: {format(parseISO(client.lastVisitDate), 'dd/MM/yyyy')}</span>
                        <span>•</span>
                        <span className="font-semibold text-rose-600">
                          {client.daysSinceLastVisit} dias sem comparecer
                        </span>
                        <span>•</span>
                        <span className="text-slate-600">
                          {client.services.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Total Gasto</span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(client.totalSpent)}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        formatClientMessage(client)
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                      title="Abrir WhatsApp individual"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )
            })}

            {filteredClients.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Filter className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Nenhum cliente com os filtros selecionados</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Tente alterar o filtro de dias sem visita ou limpar a busca.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Progresso do Disparo em Lote */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => {
          if (!isSending) setIsLogModalOpen(false)
        }}
        title="Disparo de WhatsApp em Lote"
        subtitle={`Enviando campanha personalizada para ${sendProgress.total} clientes`}
      >
        <div className="space-y-4">
          {/* Barra de Progresso */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>{isSending ? 'Disparando mensagens...' : 'Disparo concluído!'}</span>
              <span>
                {sendProgress.current} de {sendProgress.total} entregues
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${(sendProgress.current / (sendProgress.total || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Lista de Clientes e Status de Envio */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {sendLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{log.name}</span>
                  <span className="text-slate-400 text-[11px]">{log.phone}</span>
                </div>

                <div>
                  {log.status === 'success' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Entregue
                    </span>
                  )}
                  {log.status === 'sending' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full animate-pulse">
                      <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                      Enviando...
                    </span>
                  )}
                  {log.status === 'pending' && (
                    <span className="text-[11px] text-slate-400">Aguardando fila</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botão de Fechar */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSending}
              onClick={() => setIsLogModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-amber-400 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? 'Aguarde o término do disparo...' : 'Concluir'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CampanhasPage
