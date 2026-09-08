import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Avatar com iniciais quando não tem foto
 * Cores baseadas no nome para consistência
 */
export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Cor determinística baseada no nome
  const getColorFromName = (name: string | null) => {
    if (!name) return 'bg-slate-400'
    const colors = [
      'bg-rose-500',
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-cyan-500',
      'bg-pink-500',
      'bg-indigo-500',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  }

  if (imageUrl) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizes[size], className)}>
        <img 
          src={imageUrl} 
          alt={name || 'Avatar'} 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'relative rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0',
        sizes[size],
        getColorFromName(name),
        className
      )}
    >
      {name ? getInitials(name) : <User className="h-1/2 w-1/2" />}
    </div>
  )
}
