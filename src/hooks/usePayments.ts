import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Payment } from '@/types'
import { toast } from 'react-hot-toast'

export interface UsePaymentsReturn {
  payments: Payment[]
  loading: boolean
  fetchPaymentsByAppointment: (appointmentId: string) => Promise<Payment[]>
  recordPayment: (data: {
    appointment_id: string
    amount: number
    method: 'pix' | 'card' | 'boleto'
    status?: 'pending' | 'completed' | 'failed'
    transaction_id?: string
    paid_at?: string
  }) => Promise<Payment | null>
  updatePaymentStatus: (
    paymentId: string, 
    status: 'pending' | 'completed' | 'failed', 
    transactionId?: string
  ) => Promise<boolean>
}

const LOCAL_STORAGE_PAYMENTS_KEY = 'belezaflow_payments'

function getLocalPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading local payments:', e)
  }
  return [
    {
      id: 'pay-1',
      appointment_id: '1',
      amount: 130,
      method: 'pix',
      status: 'completed',
      transaction_id: 'tx_pix_987654321',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'pay-2',
      appointment_id: '2',
      amount: 18,
      method: 'card',
      status: 'completed',
      transaction_id: 'ch_card_123456789',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  ]
}

function saveLocalPayments(list: Payment[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Error saving local payments:', e)
  }
}

export function usePayments(): UsePaymentsReturn {
  const [payments, setPayments] = useState<Payment[]>(getLocalPayments())
  const [loading, setLoading] = useState<boolean>(false)

  const fetchPaymentsByAppointment = useCallback(async (appointmentId: string): Promise<Payment[]> => {
    setLoading(true)
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('appointment_id', appointmentId)
          .order('created_at', { ascending: false })

        if (!error && data) {
          setPayments((prev) => {
            const others = prev.filter((p) => p.appointment_id !== appointmentId)
            return [...data, ...others]
          })
          return data as Payment[]
        }
      }

      // Fallback local
      const local = getLocalPayments()
      const filtered = local.filter((p) => p.appointment_id === appointmentId)
      return filtered
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
      const local = getLocalPayments()
      return local.filter((p) => p.appointment_id === appointmentId)
    } finally {
      setLoading(false)
    }
  }, [])

  const recordPayment = async (data: {
    appointment_id: string
    amount: number
    method: 'pix' | 'card' | 'boleto'
    status?: 'pending' | 'completed' | 'failed'
    transaction_id?: string
    paid_at?: string
  }): Promise<Payment | null> => {
    try {
      const paymentStatus = data.status || 'pending'
      const paidAt = paymentStatus === 'completed' ? (data.paid_at || new Date().toISOString()) : null

      const payload = {
        appointment_id: data.appointment_id,
        amount: data.amount,
        method: data.method,
        status: paymentStatus,
        transaction_id: data.transaction_id || null,
        paid_at: paidAt,
      }

      if (supabase) {
        const { data: inserted, error } = await supabase
          .from('payments')
          .insert(payload)
          .select()
          .single()

        if (!error && inserted) {
          setPayments((prev) => [inserted as Payment, ...prev])
          toast.success('Pagamento registrado com sucesso!')
          return inserted as Payment
        }
      }

      // Fallback local
      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        appointment_id: data.appointment_id,
        amount: data.amount,
        method: data.method,
        status: paymentStatus,
        transaction_id: data.transaction_id || `tx_demo_${Date.now()}`,
        paid_at: paidAt,
        created_at: new Date().toISOString(),
      }

      const all = [newPayment, ...getLocalPayments()]
      saveLocalPayments(all)
      setPayments(all)
      toast.success('Pagamento registrado com sucesso!')
      return newPayment
    } catch (err: any) {
      console.error('Erro ao registrar pagamento:', err)
      toast.error('Erro ao registrar pagamento')
      return null
    }
  }

  const updatePaymentStatus = async (
    paymentId: string,
    status: 'pending' | 'completed' | 'failed',
    transactionId?: string
  ): Promise<boolean> => {
    try {
      const paidAt = status === 'completed' ? new Date().toISOString() : null
      const updateData: Partial<Payment> = {
        status,
        ...(paidAt ? { paid_at: paidAt } : {}),
        ...(transactionId ? { transaction_id: transactionId } : {}),
      }

      if (supabase) {
        const { error } = await supabase
          .from('payments')
          .update(updateData)
          .eq('id', paymentId)

        if (!error) {
          setPayments((prev) =>
            prev.map((p) => (p.id === paymentId ? { ...p, ...updateData } : p))
          )
          return true
        }
      }

      // Fallback local
      const current = getLocalPayments()
      const updated = current.map((p) =>
        p.id === paymentId ? { ...p, ...updateData } : p
      )
      saveLocalPayments(updated)
      setPayments(updated)
      return true
    } catch (err) {
      console.error('Erro ao atualizar status do pagamento:', err)
      return false
    }
  }

  return {
    payments,
    loading,
    fetchPaymentsByAppointment,
    recordPayment,
    updatePaymentStatus,
  }
}
