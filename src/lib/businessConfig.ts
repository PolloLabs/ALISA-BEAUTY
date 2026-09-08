import React from 'react'
import { BusinessType } from '@/types'
import { Sparkles, Scissors, Star, Heart } from 'lucide-react'

/**
 * Configurações de marca baseadas no tipo de negócio
 * Permite personalização visual sem estereótipos de gênero
 */

export interface BusinessConfig {
  label: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  defaultColor: string
  colorPresets: Array<{ name: string; value: string }>
  welcomeTitle: string
  welcomeDescription: string
}

export const businessConfigs: Record<BusinessType, BusinessConfig> = {
  beauty_salon: {
    label: 'Salão de Beleza',
    description: 'Cortes, coloração, tratamentos capilares e estéticos',
    icon: Sparkles,
    defaultColor: '#d946ef', // Fuchsia vibrante
    colorPresets: [
      { name: 'Fuchsia', value: '#d946ef' },
      { name: 'Rosa Queimado', value: '#be185d' },
      { name: 'Dourado', value: '#ca8a04' },
      { name: 'Verde Sálvia', value: '#65a30d' },
      { name: 'Lavanda', value: '#a855f7' },
    ],
    welcomeTitle: 'Bem-vinda ao seu salão digital',
    welcomeDescription: 'Gerencie agendamentos, equipe e clientes com facilidade',
  },
  barbershop: {
    label: 'Barbearia',
    description: 'Cortes masculinos, barba, depilação e cuidados masculinos',
    icon: Scissors,
    defaultColor: '#0891b2', // Azul petróleo
    colorPresets: [
      { name: 'Azul Petróleo', value: '#0891b2' },
      { name: 'Preto Fosco', value: '#1e293b' },
      { name: 'Marrom Café', value: '#78350f' },
      { name: 'Verde Militar', value: '#3f6212' },
      { name: 'Vermelho Sangue', value: '#991b1b' },
    ],
    welcomeTitle: 'Bem-vindo à sua barbearia digital',
    welcomeDescription: 'Organize sua agenda e fidelize seus clientes',
  },
  unisex: {
    label: 'Salão Unissex',
    description: 'Atendimento completo para todos os públicos',
    icon: Star,
    defaultColor: '#7c3aed', // Roxo moderno
    colorPresets: [
      { name: 'Roxo Moderno', value: '#7c3aed' },
      { name: 'Azul Royal', value: '#2563eb' },
      { name: 'Verde Esmeralda', value: '#059669' },
      { name: 'Laranja Vibrante', value: '#ea580c' },
      { name: 'Cinza Chumbo', value: '#334155' },
    ],
    welcomeTitle: 'Bem-vindo ao seu salão unissex',
    welcomeDescription: 'Atenda todos os públicos com profissionalismo',
  },
  nail_studio: {
    label: 'Estúdio de Unhas',
    description: 'Manicure, pedicure, nail art e alongamento',
    icon: Heart,
    defaultColor: '#ec4899', // Rosa pink
    colorPresets: [
      { name: 'Rosa Pink', value: '#ec4899' },
      { name: 'Coral', value: '#f97316' },
      { name: 'Menta', value: '#14b8a6' },
      { name: 'Lilás', value: '#c084fc' },
      { name: 'Dourado Rosé', value: '#f59e0b' },
    ],
    welcomeTitle: 'Bem-vinda ao seu estúdio de unhas',
    welcomeDescription: 'Encante suas clientes com um atendimento organizado',
  },
}

/**
 * Hook helper para obter config do tipo de negócio
 */
export function getBusinessConfig(type?: BusinessType | null): BusinessConfig {
  if (!type) return businessConfigs.beauty_salon
  return businessConfigs[type] || businessConfigs.beauty_salon
}

/**
 * Formata label amigável do tipo de negócio
 */
export function formatBusinessType(type?: BusinessType | null): string {
  if (!type) return 'Salão'
  return businessConfigs[type]?.label || 'Salão'
}
