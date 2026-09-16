import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Filter, Crown, AlertTriangle, ArrowRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaffMember, useStaff } from '@/hooks/useStaff'
import { usePlan } from '@/hooks/usePlan'
import { useSalon } from '@/hooks/useSalon'
import { safeStorageGet } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StaffCard } from '@/components/staff/StaffCard'
import { StaffTableRow } from '@/components/staff/StaffTableRow'
import { StaffModal } from '@/components/staff/StaffModal'
import { StaffFormData } from '@/components/staff/StaffForm'

type StatusFilter = 'all' | 'active' | 'inactive'

export function StaffPage() {
  const navigate = useNavigate()
  const { salon } = useSalon()
  const { limits, planName } = usePlan()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)

  const {
    staff,
    loading,
    total,
    totalPages,
    createStaff,
    updateStaff,
    deleteStaff,
    toggleStaffStatus,
  } = useStaff({ search, status: statusFilter, page, pageSize: 10 })

  const handleCreate = () => {
    // Enforcement: verificar se profissionais cadastrados >= max do plano
    const allStored = safeStorageGet<StaffMember[]>('belezaflow_staff', [])
    const registeredCount = (allStored && allStored.length > 0)
      ? allStored.filter((s) => !salon?.id || !s.salon_id || s.salon_id === salon.id).length
      : (total || staff.length)

    if (registeredCount >= limits.maxProfessionals) {
      setIsUpgradeModalOpen(true)
      return
    }
    setEditingStaff(null)
    setIsModalOpen(true)
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setIsModalOpen(true)
  }

  const handleDelete = (member: StaffMember) => {
    setDeletingStaff(member)
  }

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return
    await deleteStaff(deletingStaff.id)
    setDeletingStaff(null)
  }

  const handleToggleStatus = async (member: StaffMember) => {
    await toggleStaffStatus(member.id, !member.is_active)
  }

  const handleSave = async (data: StaffFormData) => {
    if (editingStaff) {
      return await updateStaff(editingStaff.id, {
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || undefined,
        password: data.password || undefined,
        job_title: data.job_title,
        commission_rate: data.commission_rate,
        unit_ids: data.unit_ids,
      })
    } else {
      return await createStaff({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || undefined,
        password: data.password || undefined,
        job_title: data.job_title,
        commission_rate: data.commission_rate,
        unit_ids: data.unit_ids,
      })
    }
  }

  const statusLabels: Record<StatusFilter, string> = {
    all: 'Todos',
    active: 'Ativos',
    inactive: 'Inativos',
  }

  const nextPlanName = limits.maxProfessionals <= 2 ? 'Pro' : 'Premium'
  const activeStaffCount = staff.filter((s) => s.is_active !== false).length
  const isLimitReached = activeStaffCount >= limits.maxProfessionals

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-luxury text-slate-900">Equipe</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie os profissionais ({activeStaffCount} de{' '}
            {limits.maxProfessionals >= 999 ? 'ilimitados' : limits.maxProfessionals} no plano {planName})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo profissional
          </Button>
        </div>
      </div>

      {isLimitReached && limits.maxProfessionals < 999 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Limite de {limits.maxProfessionals} profissionais atingido no plano {planName}
              </p>
              <p className="text-xs text-slate-600">
                Para cadastrar novos colaboradores na equipe, faça upgrade para o plano {nextPlanName}.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/plan-gate')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Fazer Upgrade</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, telefone ou e-mail..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Filtro de status */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
              <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
                {(['active', 'inactive', 'all'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                      statusFilter === status
                        ? 'text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    style={
                      statusFilter === status
                        ? { backgroundColor: 'var(--primary-color)' }
                        : undefined
                    }
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {loading ? (
        <SkeletonTable />
      ) : staff.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={
              search
                ? 'Nenhum profissional encontrado'
                : statusFilter === 'inactive'
                ? 'Nenhum profissional inativo'
                : 'Nenhum profissional cadastrado'
            }
            description={
              search
                ? 'Tente buscar com outros termos'
                : 'Comece cadastrando os membros da sua equipe'
            }
            actionLabel={!search && statusFilter === 'active' ? 'Adicionar profissional' : undefined}
            onAction={!search && statusFilter === 'active' ? handleCreate : undefined}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence>
              {staff.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <StaffCard
                    staff={member}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop: Tabela */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Profissional
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Comissão
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ganhos (mês)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {staff.map((member) => (
                    <StaffTableRow
                      key={member.id}
                      staff={member}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal de criação/edição */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStaff(null)
        }}
        staff={editingStaff}
        onSave={handleSave}
      />

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleConfirmDelete}
        title="Desativar profissional?"
        description={`O profissional "${deletingStaff?.full_name || 'selecionado'}" será desativado e não poderá receber novos agendamentos. Esta ação pode ser desfeita.`}
        confirmLabel="Sim, desativar"
        variant="danger"
      />

      {/* Modal de Bloqueio & Upgrade de Profissionais */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                  <Users className="w-7 h-7 text-amber-600" />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold mb-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    Limite do Plano {planName}
                  </div>
                  <h3 className="text-xl font-bold font-luxury text-slate-900">
                    Limite do plano atingido
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Seu plano atual <strong className="text-slate-900">{planName}</strong> permite até <strong className="text-slate-900">{limits.maxProfessionals} profissionais cadastrados</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 text-xs space-y-2">
                  <p className="font-semibold text-slate-800">
                    Faça upgrade para cadastrar novos profissionais:
                  </p>
                  <ul className="space-y-1.5 text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {nextPlanName === 'Pro' ? 'Plano Pro: Até 5 profissionais na sua equipe' : 'Plano Premium: Profissionais ilimitados'}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {nextPlanName === 'Pro' ? 'Agenda Visual multi-profissional completa' : 'Gestão Multi-Unidades e Campanhas WhatsApp'}
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsUpgradeModalOpen(false)
                      navigate('/plan-gate')
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Fazer Upgrade</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
