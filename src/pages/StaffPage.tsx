import { useState } from 'react'
import { Plus, Search, Users, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaffMember, useStaff } from '@/hooks/useStaff'
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        job_title: data.job_title,
        commission_rate: data.commission_rate,
      })
    } else {
      return await createStaff({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || undefined,
        job_title: data.job_title,
        commission_rate: data.commission_rate,
      })
    }
  }

  const statusLabels: Record<StatusFilter, string> = {
    all: 'Todos',
    active: 'Ativos',
    inactive: 'Inativos',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description={`Gerencie os profissionais do seu estabelecimento (${total} ${total === 1 ? 'profissional' : 'profissionais'})`}
        action={{
          label: 'Novo profissional',
          onClick: handleCreate,
          icon: <Plus className="h-4 w-4" />,
        }}
      />

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
    </div>
  )
}
