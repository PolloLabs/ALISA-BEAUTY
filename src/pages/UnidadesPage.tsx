import React, { useState } from 'react'
import { Building2, Plus, MapPin, Phone, Users, DollarSign, Edit, Trash2, Crown, Store } from 'lucide-react'
import { useUnits } from '@/hooks/useUnits'
import { useStaff } from '@/hooks/useStaff'
import { usePlan } from '@/hooks/usePlan'
import { useAppointments } from '@/hooks/useAppointments'
import { LockedFeature } from '@/components/common/LockedFeature'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/formatters'
import { Unit } from '@/types'
import { useNavigate } from 'react-router-dom'

export function UnidadesPage() {
  const { can } = usePlan()
  const { units, createUnit, updateUnit, deleteUnit } = useUnits()
  const { staff } = useStaff()
  const { appointments } = useAppointments()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null)

  // Guard: Somente Premium
  if (!can('multi_unidades')) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <LockedFeature
            title="Gestão Multi-Unidades (Exclusivo Premium)"
            description="O gerenciamento de múltiplas filiais, distribuição de equipe por unidade e faturamento segregado é exclusivo do Plano Premium."
            requiredPlan="Premium"
            buttonText="Fazer Upgrade"
          />
        </div>
      </div>
    )
  }

  const handleOpenCreate = () => {
    setEditingUnit(null)
    setFormData({ name: '', address: '', phone: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (u: Unit) => {
    setEditingUnit(u)
    setFormData({ name: u.name, address: u.address, phone: u.phone || '' })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.address.trim()) return

    setIsSubmitting(true)
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
        })
      } else {
        await createUnit({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
        })
      }
      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta filial?')) {
      await deleteUnit(id)
    }
  }

  // Faturamento e profissionais por unidade
  const getUnitMetrics = (unitId: string) => {
    const unitStaff = staff.filter((s) => s.unit_ids?.includes(unitId))
    const unitAppointments = appointments.filter(
      (a) => a.unit_id === unitId && (a.status === 'concluido' || a.status === 'completed' || a.payment_status === 'paid')
    )
    const revenue = unitAppointments.reduce((acc, a) => acc + (a.price || a.payment_amount || 0), 0)

    return {
      staffCount: unitStaff.length,
      appointmentsCount: unitAppointments.length,
      revenue,
    }
  }

  const totalConsolidatedRevenue = appointments
    .filter((a) => a.status === 'concluido' || a.status === 'completed' || a.payment_status === 'paid')
    .reduce((acc, a) => acc + (a.price || a.payment_amount || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Exclusivo Plano Premium</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-luxury tracking-tight text-slate-900">
            Gestão de Unidades & Filiais
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cadastre múltiplos espaços físicos, distribua sua equipe por unidade e monitore o faturamento segregado.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Unidade</span>
        </Button>
      </div>

      {/* Resumo Consolidado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Unidades</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{units.length}</p>
          <p className="text-xs text-slate-500 mt-1">Filiais ativas registradas</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Profissionais Vinculados</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
          <p className="text-xs text-slate-500 mt-1">Especialistas distribuídos nas filiais</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Consolidado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-mono">
            {formatCurrency(totalConsolidatedRevenue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Todas as unidades combinadas</p>
        </div>
      </div>

      {/* Lista de Unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {units.map((u) => {
          const metrics = getUnitMetrics(u.id)
          return (
            <div
              key={u.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between hover:border-amber-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{u.name}</h3>
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                        Ativa
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar unidade"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir unidade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-600 mb-5">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{u.address}</span>
                  </p>
                  {u.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{u.phone}</span>
                    </p>
                  )}
                </div>

                {/* Métricas segregadas da Unidade */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Equipe alocada</span>
                    <span className="text-sm font-bold text-slate-800">
                      {metrics.staffCount} profissionais
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Faturamento</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono">
                      {formatCurrency(metrics.revenue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => navigate(`/agenda?unit=${u.id}`)}
                  className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Ver agenda desta filial →
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/financeiro?unit=${u.id}`)}
                  className="font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Relatório financeiro
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Criar / Editar Unidade */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'Editar Unidade' : 'Nova Filial / Unidade'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Nome da Unidade *
            </label>
            <Input
              required
              placeholder="Ex: Unidade Jardins, Filial Shopping, etc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Endereço Completo *
            </label>
            <Input
              required
              placeholder="Rua, número, bairro, cidade - UF"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Telefone / WhatsApp da Unidade
            </label>
            <Input
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold"
            >
              {isSubmitting ? 'Salvando...' : editingUnit ? 'Atualizar Unidade' : 'Salvar Unidade'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
