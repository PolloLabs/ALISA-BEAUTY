import { useMemo } from 'react'
import { DollarSign, TrendingUp, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSalon } from '@/hooks/useSalon'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function Financial() {
  const { appointments, salon } = useSalon()
  const primaryColor = salon?.primary_color || '#f43f5e'

  const metrics = useMemo(() => {
    let totalRevenue = 0
    let confirmedCount = 0
    let pendingCount = 0

    appointments.forEach((apt) => {
      const price = apt.price || 0
      totalRevenue += price
      if (apt.status === 'confirmed' || apt.status === 'completed') {
        confirmedCount++
      } else {
        pendingCount++
      }
    })

    const averageTicket = appointments.length > 0 ? totalRevenue / appointments.length : 0

    return {
      totalRevenue,
      appointmentsCount: appointments.length,
      confirmedCount,
      pendingCount,
      averageTicket,
    }
  }, [appointments])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel Financeiro"
        description="Acompanhe o faturamento, ticket médio e fluxo financeiro dos seus serviços."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Faturamento Total</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-800">
                R$ {metrics.totalRevenue.toFixed(2)}
              </span>
              <span className="text-xs text-emerald-600 block mt-1">Soma de todos os serviços</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket Médio</span>
              <div 
                className="p-2.5 rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-800">
                R$ {metrics.averageTicket.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Por atendimento</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Atendimentos Concluídos</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-800">
                {metrics.confirmedCount}
              </span>
              <span className="text-xs text-blue-600 block mt-1">Confirmados ou realizados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendentes</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-800">
                {metrics.pendingCount}
              </span>
              <span className="text-xs text-amber-600 block mt-1">Aguardando confirmação</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Lançamentos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Receitas por Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Serviço</th>
                  <th className="pb-3">Data / Hora</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-medium text-slate-800">{apt.client_name}</td>
                    <td className="py-3.5 text-slate-600">{apt.service_name}</td>
                    <td className="py-3.5 text-slate-500">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.date} • {apt.time}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                        {apt.status === 'confirmed' ? 'Confirmado' : apt.status || 'Agendado'}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right font-bold text-emerald-600">
                      R$ {(apt.price || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
