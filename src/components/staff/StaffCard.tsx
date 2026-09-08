import { Edit2, Trash2, ToggleLeft, ToggleRight, Percent, Phone, Mail, Briefcase } from 'lucide-react'
import { StaffMember } from '@/hooks/useStaff'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'

interface StaffCardProps {
  staff: StaffMember
  onEdit: (staff: StaffMember) => void
  onDelete: (staff: StaffMember) => void
  onToggleStatus: (staff: StaffMember) => void
}

export function StaffCard({ staff, onEdit, onDelete, onToggleStatus }: StaffCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md',
      !staff.is_active && 'opacity-60'
    )}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar 
          name={staff.full_name} 
          imageUrl={staff.avatar_url}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {staff.full_name || 'Sem nome'}
          </h3>
          {staff.job_title && (
            <Badge variant="info" className="mt-1">
              <Briefcase className="h-3 w-3 mr-1" />
              {staff.job_title}
            </Badge>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={staff.is_active ? 'success' : 'default'}>
              {staff.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <Percent className="h-3 w-3" />
              <span>{staff.commission_rate}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4 text-sm">
        {staff.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{staff.phone}</span>
          </div>
        )}
        {staff.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{staff.email}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-500 mb-1">Ganhos estimados (mês)</p>
        <p className="text-sm font-semibold text-slate-700">Em breve</p>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onEdit(staff)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Edit2 className="h-4 w-4" />
          Editar
        </button>
        <button
          onClick={() => onToggleStatus(staff)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={staff.is_active ? 'Desativar' : 'Ativar'}
        >
          {staff.is_active ? (
            <>
              <ToggleRight className="h-4 w-4 text-emerald-500" />
              Desativar
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4 text-slate-400" />
              Ativar
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(staff)}
          className="flex items-center justify-center h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
