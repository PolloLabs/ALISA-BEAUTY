import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { InputMaskField } from '@/components/ui/InputMaskField'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/hooks/useConfirm'
import { Calendar, User, Phone, Scissors, Trash2, Bell, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [price, setPrice] = useState(120.5)

  // useConfirm hook demo
  const deleteConfirm = useConfirm(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    toast.success('Ação confirmada e executada com sucesso!')
  })

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* PageHeader Component */}
        <PageHeader
          title="ALISA BEAUTY"
          description="Design System & Componentes das Etapas 1 e 2"
          action={{
            label: 'Novo Atendimento',
            icon: <Scissors className="h-4 w-4" />,
            onClick: () => setIsModalOpen(true),
          }}
        />

        {/* Grid de Componentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Botões */}
          <Card>
            <CardHeader>
              <CardTitle>Botões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button>Primário</Button>
                <Button variant="secondary">Secundário</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Perigo</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Pequeno</Button>
                <Button size="md">Médio</Button>
                <Button size="lg">Grande</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button leftIcon={<Calendar className="h-4 w-4" />}>Com Ícone</Button>
                <Button isLoading>Carregando...</Button>
                <Button disabled>Desabilitado</Button>
              </div>
            </CardContent>
          </Card>

          {/* Novos Inputs: Máscara & Moeda */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs Formatados (Etapa 2)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputMaskField
                mask="(99) 99999-9999"
                label="Telefone com Máscara"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <CurrencyInput
                label="Preço do Serviço (BRL)"
                value={price}
                onChange={(val) => setPrice(val)}
              />
              <div className="pt-2 text-xs text-slate-500">
                Valor numérico atual: <span className="font-semibold text-rose-500">R$ {price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notificações Toasts & Confirmação */}
          <Card>
            <CardHeader>
              <CardTitle>Toasts & Diálogos de Confirmação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success('Agendamento salvo com sucesso!')}
                >
                  Toast Sucesso
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.error('Erro ao conectar ao servidor')}
                >
                  Toast Erro
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast('Lembrete enviado ao cliente!', { icon: '🔔' })}
                >
                  Toast Info
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  variant="danger"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={deleteConfirm.open}
                >
                  Testar ConfirmDialog
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges e Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Badges & Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Padrão</Badge>
                <Badge variant="success">Confirmado</Badge>
                <Badge variant="warning">Pendente</Badge>
                <Badge variant="danger">Cancelado</Badge>
                <Badge variant="info">Novo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Skeleton Loaders */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Vazio (EmptyState)</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Scissors}
                title="Nenhum serviço cadastrado"
                description="Cadastre os serviços oferecidos para liberar os agendamentos online."
                actionLabel="Cadastrar Serviço"
                onAction={() => toast.success('Modal de serviço aberto!')}
              />
            </CardContent>
          </Card>

        </div>

        {/* Modal de Teste */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Detalhes do Atendimento"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              Modal do sistema BelezaFlow funcionando com transição suave e responsividade.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setIsModalOpen(false)
                toast.success('Atendimento confirmado!')
              }}>
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Confirmação com Hook useConfirm */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={deleteConfirm.close}
          onConfirm={deleteConfirm.onConfirm}
          isLoading={deleteConfirm.isLoading}
          title="Excluir item permanentemente?"
          description="Esta ação é irreversível e removerá todos os registros associados."
          confirmLabel="Sim, excluir"
          cancelLabel="Cancelar"
          variant="danger"
        />

      </div>
    </div>
  )
}
