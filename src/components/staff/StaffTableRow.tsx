import { Edit2, Trash2, ToggleLeft, ToggleRight, Percent, Briefcase } from 'lucide-react'
import { StaffMember } from '@/hooks/useStaff'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'

interface StaffTableRowProps {
  staff: StaffMember
  onEdit: (staff: StaffMember) => void
  onDelete: (staff: StaffMember) => void
  onToggleStatus: (staff: StaffMember) => void
}

export function StaffTableRow({ staff, onEdit, onDelete, onToggleStatus }: StaffTableRowProps) {
  return (
    <tr className={cn(
      'hover:bg-slate-50 transition-colors',
      !staff.is_active && 'opacity-60'
    )}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar 
            name={staff.full_name} 
            imageUrl={staff.avatar_url}
            size="sm"
          />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">
              {staff.full_name || 'Sem nome'}
            </p>
            {staff.job_title && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                <Briefcase className="h-3 w-3" />
                {staff.job_title}
              </p>
            )}
            <p className="text-xs text-slate-500 truncate">
              {staff.phone || staff.email || 'Sem contato'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Percent className="h-3.5 w-3.5 text-amber-600" />
          <span className="font-semibold text-slate-900">{staff.commission_rate}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={staff.is_active ? 'success' : 'default'}>
          {staff.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="bg-slate-50 rounded-lg px-3 py-1.5">
          <p className="text-xs text-slate-500">Em breve</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onToggleStatus(staff)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={staff.is_active ? 'Desativar' : 'Ativar'}
          >
            {staff.is_active ? (
              <ToggleRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-slate-400" />
            )}
          </button>
          <button
            onClick={() => onEdit(staff)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(staff)}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            title="Remover"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
