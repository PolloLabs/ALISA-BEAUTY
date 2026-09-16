import { useState, useEffect, useCallback } from 'react'
import { Unit } from '@/types'
import { useSalon } from '@/hooks/useSalon'
import { safeStorageGet, safeStorageSet } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const UNITS_STORAGE_KEY = 'units'

const DEFAULT_UNITS: Unit[] = [
  {
    id: 'unit-1',
    name: 'Unidade Matriz - Jardins',
    address: 'Rua Oscar Freire, 1024 - Jardins, São Paulo - SP',
    salon_id: 'default-salon',
    phone: '(11) 3088-1200',
    created_at: new Date().toISOString(),
  },
  {
    id: 'unit-2',
    name: 'Unidade Filial - Moema',
    address: 'Av. Moema, 450 - Moema, São Paulo - SP',
    salon_id: 'default-salon',
    phone: '(11) 5051-3400',
    created_at: new Date().toISOString(),
  },
]

export function getStoredUnits(salonId?: string): Unit[] {
  const stored = safeStorageGet<Unit[]>(UNITS_STORAGE_KEY, [])
  if (stored && stored.length > 0) {
    if (!salonId) return stored
    return stored.filter((u) => !u.salon_id || u.salon_id === salonId)
  }
  // Se vazio, inicializa com as unidades padrão
  safeStorageSet(UNITS_STORAGE_KEY, DEFAULT_UNITS)
  if (!salonId) return DEFAULT_UNITS
  return DEFAULT_UNITS.filter((u) => !u.salon_id || u.salon_id === salonId)
}

export function saveStoredUnits(units: Unit[]) {
  safeStorageSet(UNITS_STORAGE_KEY, units)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('units_changed'))
  }
}

export function useUnits() {
  const { salon } = useSalon()
  const salonId = salon?.id || 'default-salon'

  const [units, setUnits] = useState<Unit[]>(() => getStoredUnits(salonId))
  const [loading, setLoading] = useState(false)

  const refreshUnits = useCallback(() => {
    const list = getStoredUnits(salonId)
    setUnits(list)
  }, [salonId])

  useEffect(() => {
    refreshUnits()
    const handleUpdate = () => refreshUnits()
    window.addEventListener('units_changed', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('units_changed', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [refreshUnits])

  const createUnit = async (data: { name: string; address: string; phone?: string }): Promise<Unit | null> => {
    try {
      const allUnits = safeStorageGet<Unit[]>(UNITS_STORAGE_KEY, DEFAULT_UNITS)
      const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        name: data.name.trim(),
        address: data.address.trim(),
        phone: data.phone?.trim() || undefined,
        salon_id: salonId,
        created_at: new Date().toISOString(),
      }
      const updated = [...allUnits, newUnit]
      saveStoredUnits(updated)
      setUnits(updated.filter((u) => !u.salon_id || u.salon_id === salonId))
      toast.success('Unidade cadastrada com sucesso!')
      return newUnit
    } catch (err) {
      console.error('Erro ao cadastrar unidade:', err)
      toast.error('Erro ao cadastrar unidade')
      return null
    }
  }

  const updateUnit = async (id: string, data: Partial<Omit<Unit, 'id' | 'salon_id'>>): Promise<boolean> => {
    try {
      const allUnits = safeStorageGet<Unit[]>(UNITS_STORAGE_KEY, DEFAULT_UNITS)
      const index = allUnits.findIndex((u) => u.id === id)
      if (index === -1) {
        toast.error('Unidade não encontrada')
        return false
      }
      const updated = [...allUnits]
      updated[index] = { ...updated[index], ...data }
      saveStoredUnits(updated)
      setUnits(updated.filter((u) => !u.salon_id || u.salon_id === salonId))
      toast.success('Unidade atualizada!')
      return true
    } catch (err) {
      console.error('Erro ao atualizar unidade:', err)
      toast.error('Erro ao atualizar unidade')
      return false
    }
  }

  const deleteUnit = async (id: string): Promise<boolean> => {
    try {
      const allUnits = safeStorageGet<Unit[]>(UNITS_STORAGE_KEY, DEFAULT_UNITS)
      const updated = allUnits.filter((u) => u.id !== id)
      saveStoredUnits(updated)
      setUnits(updated.filter((u) => !u.salon_id || u.salon_id === salonId))
      toast.success('Unidade removida')
      return true
    } catch (err) {
      console.error('Erro ao remover unidade:', err)
      toast.error('Erro ao remover unidade')
      return false
    }
  }

  return {
    units,
    loading,
    createUnit,
    updateUnit,
    deleteUnit,
    refreshUnits,
  }
}
