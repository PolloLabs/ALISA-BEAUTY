import { useState, useMemo } from 'react'
import { Search, User, Phone, Calendar, MessageCircle, DollarSign } from 'lucide-react'
import { useSalon } from '@/hooks/useSalon'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function Clients() {
  const { appointments, salon } = useSalon()
  const [search, setSearch] = useState('')
  const primaryColor = salon?.primary_color || '#f43f5e'

  const clients = useMemo(() => {
    const map = new Map<string, {
      name: string
      phone: string
      appointmentsCount: number
      totalSpent: number
      lastVisit: string
    }>()

    appointments.forEach((apt) => {
      const key = apt.client_phone || apt.client_name
      const existing = map.get(key)
      if (existing) {
        existing.appointmentsCount += 1
        existing.totalSpent += apt.price || 0
        if (apt.date > existing.lastVisit) {
          existing.lastVisit = apt.date
        }
      } else {
        map.set(key, {
          name: apt.client_name,
          phone: apt.client_phone,
          appointmentsCount: 1,
          totalSpent: apt.price || 0,
          lastVisit: apt.date,
        })
      }
    })

    return Array.from(map.values())
  }, [appointments])

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [clients, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de Clientes"
        description="Visualize e gerencie o histórico dos clientes que agendaram no seu salão."
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total de Clientes: <span className="font-bold text-slate-800">{clients.length}</span>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Nenhum cliente encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Os clientes serão cadastrados automaticamente conforme novos agendamentos forem realizados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const cleanPhone = client.phone.replace(/\D/g, '')
            return (
              <Card key={client.phone || client.name} className="hover:border-slate-300 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">
                          {client.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{client.phone || 'Sem telefone'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px]">
                      {client.appointmentsCount} {client.appointmentsCount === 1 ? 'visita' : 'visitas'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Último Atendimento</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Investido</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <DollarSign className="w-3 h-3" />
                        R$ {client.totalSpent.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {cleanPhone && (
                    <a
                      href={`https://wa.me/55${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Conversar no WhatsApp</span>
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
