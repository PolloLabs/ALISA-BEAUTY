import React, { useState } from 'react'
import {
  Building2,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'
import toast from 'react-hot-toast'

export interface SalonStore {
  id: string
  name: string
  owner_name: string
  owner_email: string
  plan: 'Básico' | 'Pro' | 'Premium'
  status: 'Ativo' | 'Bloqueado' | 'Inadimplente'
  mrr: number
  created_at: string
}

const DEFAULT_SALONS: SalonStore[] = [
  {
    id: 'store-1',
    name: 'Studio Elegance & Spa',
    owner_name: 'Camila Alcantara',
    owner_email: 'camila@elegance.com.br',
    plan: 'Premium',
    status: 'Ativo',
    mrr: 199,
    created_at: '12/01/2026',
  },
  {
    id: 'store-2',
    name: 'Barbearia Don Corleone',
    owner_name: 'Rodrigo Medeiros',
    owner_email: 'rodrigo@doncorleone.com',
    plan: 'Pro',
    status: 'Ativo',
    mrr: 99,
    created_at: '25/02/2026',
  },
  {
    id: 'store-3',
    name: 'Espaço VIP Hair Studio',
    owner_name: 'Juliana Siqueira',
    owner_email: 'juliana@espacovip.com',
    plan: 'Básico',
    status: 'Bloqueado',
    mrr: 49,
    created_at: '03/03/2026',
  },
  {
    id: 'store-4',
    name: 'Maison D’Or Beauté',
    owner_name: 'Beatriz Vasconcelos',
    owner_email: 'beatriz@maisondor.com',
    plan: 'Premium',
    status: 'Ativo',
    mrr: 199,
    created_at: '15/03/2026',
  },
  {
    id: 'store-5',
    name: 'Instituto Renovare',
    owner_name: 'Marcos Vinicius',
    owner_email: 'marcos@renovare.com',
    plan: 'Pro',
    status: 'Ativo',
    mrr: 99,
    created_at: '02/04/2026',
  },
]

export const AdminLojasPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativo' | 'Bloqueado'>('all')

  const [salons, setSalons] = useState<SalonStore[]>(() => {
    const stored = safeStorageGet<SalonStore[]>('belezaflow_admin_salons', [])
    if (stored && stored.length > 0) {
      return stored
    }
    // Inicializa com salões padrão caso esteja vazio
    safeStorageSet('belezaflow_admin_salons', DEFAULT_SALONS)
    return DEFAULT_SALONS
  })

  const toggleBlockStatus = (id: string) => {
    const target = salons.find((s) => s.id === id)
    if (!target) return

    const newStatus: 'Ativo' | 'Bloqueado' = target.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado'
    const updated = salons.map((s) => (s.id === id ? { ...s, status: newStatus } : s))

    setSalons(updated)
    safeStorageSet('belezaflow_admin_salons', updated)

    if (newStatus === 'Bloqueado') {
      toast.error(`Acesso do salão "${target.name}" bloqueado.`)
    } else {
      toast.success(`Acesso do salão "${target.name}" desbloqueado com sucesso!`)
    }
  }

  const filteredSalons = salons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salon.owner_email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || salon.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = salons.filter((s) => s.status === 'Ativo').length
  const blockedCount = salons.filter((s) => s.status === 'Bloqueado').length

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner Lojas */}
      <Card className="p-6 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-1.5">
              <Building2 className="w-4 h-4 text-purple-700" />
              <span>Administração das Lojas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-luxury text-slate-900 tracking-tight">
              Gestão de Lojas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Painel de governança de todas as instâncias de salões, planos contratados e controle de acesso.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabela de Lojas */}
      <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-luxury text-slate-900">
              Lojas Cadastradas ({salons.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização detalhada com controle de bloqueio e liberação de acesso
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Input de Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar salão ou dono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({salons.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Ativo')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'Ativo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ativas ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Bloqueado')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'Bloqueado'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bloqueadas ({blockedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Salão</th>
                <th className="px-5 py-3.5">Dono</th>
                <th className="px-5 py-3.5">Plano</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalons.map((salon) => (
                <tr key={salon.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Salão */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900 text-sm">{salon.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Cadastrado em {salon.created_at}</div>
                  </td>

                  {/* Dono */}
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800 text-sm">{salon.owner_name}</div>
                    <div className="text-xs text-slate-500">{salon.owner_email}</div>
                  </td>

                  {/* Plano */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        salon.plan === 'Premium'
                          ? 'bg-slate-900 text-amber-400 border border-slate-800'
                          : salon.plan === 'Pro'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {salon.plan} ({formatCurrency(salon.mrr)})
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    {salon.status === 'Ativo' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        Bloqueado
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5 text-right">
                    {salon.status === 'Ativo' ? (
                      <button
                        onClick={() => toggleBlockStatus(salon.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Bloquear acesso deste salão"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloquear</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleBlockStatus(salon.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Desbloquear acesso deste salão"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Desbloquear</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSalons.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 font-luxury">Sem dados encontrados</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Nenhuma loja corresponde aos termos de pesquisa ou filtros selecionados.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdminLojasPage
