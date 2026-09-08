import { useState } from 'react'
import { Plus, Search, Scissors, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Service } from '@/types'
import { useServices } from '@/hooks/useServices'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceTableRow } from '@/components/services/ServiceTableRow'
import { ServiceModal } from '@/components/services/ServiceModal'
import { ServiceFormData } from '@/components/services/ServiceForm'

type StatusFilter = 'all' | 'active' | 'inactive'

export function ServicesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  const {
    services,
    loading,
    total,
    totalPages,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
  } = useServices({ search, status: statusFilter, page, pageSize: 10 })

  const handleCreate = () => {
    setEditingService(null)
    setIsModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setIsModalOpen(true)
  }

  const handleDelete = (service: Service) => {
    setDeletingService(service)
  }

  const handleConfirmDelete = async () => {
    if (!deletingService) return
    await deleteService(deletingService.id)
    setDeletingService(null)
  }

  const handleToggleStatus = async (service: Service) => {
    await toggleServiceStatus(service.id, !service.is_active)
  }

  const handleSave = async (data: ServiceFormData) => {
    if (editingService) {
      return await updateService(editingService.id, data)
    } else {
      return await createService(data)
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
        title="Serviços"
        description={`Gerencie os serviços do seu estabelecimento (${total} ${total === 1 ? 'serviço' : 'serviços'})`}
        action={{
          label: 'Novo serviço',
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
                placeholder="Buscar serviço..."
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
      ) : services.length === 0 ? (
        <Card>
          <EmptyState
            icon={Scissors}
            title={
              search
                ? 'Nenhum serviço encontrado'
                : statusFilter === 'inactive'
                ? 'Nenhum serviço inativo'
                : 'Nenhum serviço cadastrado'
            }
            description={
              search
                ? 'Tente buscar com outros termos'
                : 'Comece adicionando os serviços do seu estabelecimento'
            }
            actionLabel={!search && statusFilter === 'active' ? 'Adicionar serviço' : undefined}
            onAction={!search && statusFilter === 'active' ? handleCreate : undefined}
          />
        </Card>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence>
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ServiceCard
                    service={service}
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
                      Serviço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Duração
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {services.map((service) => (
                    <ServiceTableRow
                      key={service.id}
                      service={service}
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
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingService(null)
        }}
        service={editingService}
        onSave={handleSave}
      />

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={handleConfirmDelete}
        title="Desativar serviço?"
        description={`O serviço "${deletingService?.name}" será desativado e não aparecerá mais nas opções de agendamento. Esta ação pode ser desfeita.`}
        confirmLabel="Sim, desativar"
        variant="danger"
      />
    </div>
  )
}
