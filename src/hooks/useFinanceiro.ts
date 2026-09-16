import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
  format,
  isValid,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSalon } from '@/hooks/useSalon';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Appointment } from '@/types';
import { safeStorageGet } from '@/lib/utils';

export type FinancialPeriod = 'current_month' | 'previous_month' | 'last_30_days' | 'custom';

export interface FinancialAppointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  professional_id: string;
  professional_name: string;
  date: string;
  time: string;
  price: number;
  payment_amount?: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  unit_id?: string;
}

export interface StaffCommission {
  staff_id: string;
  staff_name: string;
  avatar_url: string | null;
  job_title?: string | null;
  commission_rate: number; // Porcentagem (ex: 50%)
  completed_count: number;
  gross_total: number;
  commission_total: number;
  salon_net_total: number;
}

export interface DailyFinance {
  date: string; // YYYY-MM-DD
  formatted_date: string; // Ex: "08/09 (Ter)"
  completed_count: number;
  gross_total: number;
  commission_total: number;
  net_total: number;
}

export interface UseFinanceiroReturn {
  period: FinancialPeriod;
  setPeriod: (period: FinancialPeriod) => void;
  startDate: Date;
  endDate: Date;
  customStartDateStr: string;
  customEndDateStr: string;
  setCustomRange: (start: string, end: string) => void;
  loading: boolean;
  refetch: () => Promise<void>;
  
  // Métricas Principais
  grossRevenue: number;
  totalCommissions: number;
  netRevenue: number;
  averageTicket: number;
  completedAppointmentsCount: number;

  // Agrupamentos
  staffCommissions: StaffCommission[];
  dailyBreakdown: DailyFinance[];
  completedAppointments: FinancialAppointment[];

  // Ações
  exportToCSV: () => void;
}

interface LocalStaffItem {
  id: string;
  full_name?: string | null;
  name?: string;
  job_title?: string | null;
  commission_rate?: number;
  avatar_url?: string | null;
  avatar?: string;
}

export function useFinanceiro(): UseFinanceiroReturn {
  const { salon, appointments: contextAppointments } = useSalon();

  const [period, setPeriod] = useState<FinancialPeriod>('current_month');
  const [loading, setLoading] = useState(false);
  const [dbAppointments, setDbAppointments] = useState<Appointment[] | null>(null);
  const [staffMap, setStaffMap] = useState<Map<string, { name: string; rate: number; avatar: string | null; job_title: string | null }>>(new Map());

  // Datas customizadas (formato YYYY-MM-DD)
  const [customStartDateStr, setCustomStartDateStr] = useState<string>(() => {
    const d = startOfMonth(new Date());
    return format(d, 'yyyy-MM-dd');
  });

  const [customEndDateStr, setCustomEndDateStr] = useState<string>(() => {
    const d = endOfMonth(new Date());
    return format(d, 'yyyy-MM-dd');
  });

  // Determinar intervalo de datas ativo de acordo com o período selecionado
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();

    switch (period) {
      case 'current_month':
        return {
          startDate: startOfDay(startOfMonth(now)),
          endDate: endOfDay(endOfMonth(now)),
        };
      case 'previous_month': {
        const prev = subMonths(now, 1);
        return {
          startDate: startOfDay(startOfMonth(prev)),
          endDate: endOfDay(endOfMonth(prev)),
        };
      }
      case 'last_30_days':
        return {
          startDate: startOfDay(subDays(now, 29)),
          endDate: endOfDay(now),
        };
      case 'custom': {
        const s = parseISO(customStartDateStr);
        const e = parseISO(customEndDateStr);
        return {
          startDate: isValid(s) ? startOfDay(s) : startOfDay(startOfMonth(now)),
          endDate: isValid(e) ? endOfDay(e) : endOfDay(endOfMonth(now)),
        };
      }
      default:
        return {
          startDate: startOfDay(startOfMonth(now)),
          endDate: endOfDay(endOfMonth(now)),
        };
    }
  }, [period, customStartDateStr, customEndDateStr]);

  const setCustomRange = useCallback((start: string, end: string) => {
    setCustomStartDateStr(start);
    setCustomEndDateStr(end);
    setPeriod('custom');
  }, []);

  // 1. Carregar mapeamento de profissionais e suas taxas de comissão
  const loadStaffMembers = useCallback(async () => {
    const newMap = new Map<string, { name: string; rate: number; avatar: string | null; job_title: string | null }>();

    // 1.1 Buscar do LocalStorage (cadastrados via Equipe / useStaff)
    try {
      const parsed = safeStorageGet<LocalStaffItem[]>('belezaflow_staff', []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((s) => {
          const name = s.full_name || s.name || 'Profissional';
          const rate = typeof s.commission_rate === 'number' ? s.commission_rate : 50;
          const avatar = s.avatar_url || s.avatar || null;
          const job_title = s.job_title || null;
          newMap.set(s.id, { name, rate, avatar, job_title });
          newMap.set(name.toLowerCase(), { name, rate, avatar, job_title });
        });
      }
    } catch {
      // continua para Supabase
    }

    // 1.2 Se Supabase estiver ativo, tentar buscar dados reais da tabela staff
    if (isSupabaseConfigured && supabase && salon?.id) {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select(`
            id,
            job_title,
            commission_rate,
            profile_id,
            profiles:profile_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('salon_id', salon.id);

        if (!error && data) {
          data.forEach((stf) => {
            const rawProfile = stf.profiles as unknown;
            const prof = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
            const profObj = prof as { id?: string; full_name?: string; avatar_url?: string } | null;
            const name = profObj?.full_name || 'Profissional';
            const rate = typeof stf.commission_rate === 'number' ? stf.commission_rate : 50;
            const avatar = profObj?.avatar_url || null;
            const job_title = (stf as { job_title?: string | null }).job_title || null;

            newMap.set(stf.id, { name, rate, avatar, job_title });
            if (profObj?.id) {
              newMap.set(profObj.id, { name, rate, avatar, job_title });
            }
            newMap.set(name.toLowerCase(), { name, rate, avatar, job_title });
          });
        }
      } catch (err) {
        console.warn('[useFinanceiro] Aviso ao buscar equipe do Supabase:', err);
      }
    }

    setStaffMap(newMap);
  }, [salon?.id]);

  // 2. Buscar agendamentos concluídos
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    await loadStaffMembers();

    let fetchedFromDb = false;

    if (isSupabaseConfigured && supabase && salon?.id) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('salon_id', salon.id);

        if (!error && data) {
          setDbAppointments(data as Appointment[]);
          fetchedFromDb = true;
        }
      } catch (err) {
        console.warn('[useFinanceiro] Erro ao buscar agendamentos do Supabase:', err);
      }
    }

    if (!fetchedFromDb) {
      setDbAppointments(null);
    }

    setLoading(false);
  }, [salon?.id, loadStaffMembers]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 3. Processar e filtrar agendamentos concluídos no período
  const processedData = useMemo(() => {
    const sourceList = dbAppointments || contextAppointments || [];

    // Filtrar somente agendamentos com status concluído/completed
    const completedList = sourceList.filter((apt) => {
      const st = (apt.status || '').toLowerCase();
      const isCompleted = st === 'completed' || st === 'concluido';
      if (!isCompleted) return false;

      // Obter data do agendamento
      let aptDate: Date | null = null;
      if (apt.date) {
        // Se apt.date for YYYY-MM-DD
        const parsed = parseISO(apt.date.split('T')[0]);
        if (isValid(parsed)) aptDate = parsed;
      }
      if (!aptDate && apt.start_time) {
        const parsed = parseISO(apt.start_time);
        if (isValid(parsed)) aptDate = parsed;
      }
      if (!aptDate && apt.created_at) {
        const parsed = parseISO(apt.created_at);
        if (isValid(parsed)) aptDate = parsed;
      }

      if (!aptDate) return false;

      // Verificar se a data está no intervalo selecionado
      return isWithinInterval(aptDate, { start: startDate, end: endDate });
    });

    // Mapear cada agendamento com cálculos de comissão e líquido
    const mappedAppointments: FinancialAppointment[] = completedList.map((apt) => {
      const price = typeof apt.price === 'number' ? apt.price : 0;
      const profId = apt.staff_id || apt.professional_id || '';
      const profName = apt.professional_name || 'Profissional';

      // Encontrar taxa de comissão cadastrada
      let commissionRate = 50; // Padrão 50%
      const foundStaff =
        staffMap.get(profId) ||
        staffMap.get(profName.toLowerCase());

      if (foundStaff && typeof foundStaff.rate === 'number') {
        commissionRate = foundStaff.rate;
      }

      // Normalizar taxa (se por acaso for decimal <= 1, multiplicar por 100)
      if (commissionRate <= 1 && commissionRate > 0) {
        commissionRate = commissionRate * 100;
      }

      const commissionAmount = (price * commissionRate) / 100;
      const netAmount = price - commissionAmount;

      const dateStr = apt.date ? apt.date.split('T')[0] : (apt.created_at ? apt.created_at.split('T')[0] : '');

      return {
        id: apt.id,
        client_name: apt.client_name || 'Cliente',
        client_phone: apt.client_phone || '',
        service_name: apt.service_name || 'Serviço',
        professional_id: profId || 'staff-default',
        professional_name: profName,
        date: dateStr,
        time: apt.time || (apt.start_time ? apt.start_time.substring(11, 16) : '00:00'),
        price,
        payment_amount: typeof apt.payment_amount === 'number' ? apt.payment_amount : price,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        net_amount: netAmount,
        unit_id: apt.unit_id,
      };
    });

    // Ordenar agendamentos do mais recente para o mais antigo
    mappedAppointments.sort((a, b) => {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateB.localeCompare(dateA);
    });

    // Totais gerais
    let grossTotal = 0;
    let commissionTotal = 0;

    mappedAppointments.forEach((item) => {
      grossTotal += item.price;
      commissionTotal += item.commission_amount;
    });

    const netTotal = grossTotal - commissionTotal;
    const avgTicket = mappedAppointments.length > 0 ? grossTotal / mappedAppointments.length : 0;

    // Agrupamento por Profissional
    const staffGroupMap = new Map<string, StaffCommission>();

    mappedAppointments.forEach((apt) => {
      const staffKey = apt.professional_name.toLowerCase();
      const existing = staffGroupMap.get(staffKey);

      const staffInfo = staffMap.get(apt.professional_id) || staffMap.get(staffKey);
      const avatarUrl = staffInfo?.avatar || null;

      if (!existing) {
        staffGroupMap.set(staffKey, {
          staff_id: apt.professional_id,
          staff_name: apt.professional_name,
          avatar_url: avatarUrl,
          job_title: staffInfo?.job_title || null,
          commission_rate: apt.commission_rate,
          completed_count: 1,
          gross_total: apt.price,
          commission_total: apt.commission_amount,
          salon_net_total: apt.net_amount,
        });
      } else {
        existing.completed_count += 1;
        existing.gross_total += apt.price;
        existing.commission_total += apt.commission_amount;
        existing.salon_net_total += apt.net_amount;
      }
    });

    const staffCommissions = Array.from(staffGroupMap.values()).sort(
      (a, b) => b.gross_total - a.gross_total
    );

    // Agrupamento por Dia
    const dailyGroupMap = new Map<string, DailyFinance>();

    mappedAppointments.forEach((apt) => {
      const dStr = apt.date || 'Sem data';
      const existing = dailyGroupMap.get(dStr);

      let formattedDate = dStr;
      try {
        const dObj = parseISO(dStr);
        if (isValid(dObj)) {
          formattedDate = format(dObj, "dd/MM '( 'EEE' )'", { locale: ptBR });
        }
      } catch {
        // mantém dStr
      }

      if (!existing) {
        dailyGroupMap.set(dStr, {
          date: dStr,
          formatted_date: formattedDate,
          completed_count: 1,
          gross_total: apt.price,
          commission_total: apt.commission_amount,
          net_total: apt.net_amount,
        });
      } else {
        existing.completed_count += 1;
        existing.gross_total += apt.price;
        existing.commission_total += apt.commission_amount;
        existing.net_total += apt.net_amount;
      }
    });

    const dailyBreakdown = Array.from(dailyGroupMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    return {
      grossRevenue: grossTotal,
      totalCommissions: commissionTotal,
      netRevenue: netTotal,
      averageTicket: avgTicket,
      completedAppointmentsCount: mappedAppointments.length,
      staffCommissions,
      dailyBreakdown,
      completedAppointments: mappedAppointments,
    };
  }, [dbAppointments, contextAppointments, staffMap, startDate, endDate]);

  // 4. Exportar relatório em CSV com UTF-8 BOM
  const exportToCSV = useCallback(() => {
    const list = processedData.completedAppointments;
    if (list.length === 0) {
      alert('Nenhum agendamento concluído encontrado no período selecionado para exportação.');
      return;
    }

    const headers = [
      'Data',
      'Hora',
      'Cliente',
      'Telefone',
      'Serviço',
      'Profissional',
      'Valor Bruto (R$)',
      '% Comissão',
      'Comissão Profissional (R$)',
      'Salão Líquido (R$)',
    ];

    const rows = list.map((item) => [
      `"${item.date}"`,
      `"${item.time}"`,
      `"${item.client_name.replace(/"/g, '""')}"`,
      `"${item.client_phone.replace(/"/g, '""')}"`,
      `"${item.service_name.replace(/"/g, '""')}"`,
      `"${item.professional_name.replace(/"/g, '""')}"`,
      `"${item.price.toFixed(2).replace('.', ',')}"`,
      `"${item.commission_rate.toFixed(0)}%"`,
      `"${item.commission_amount.toFixed(2).replace('.', ',')}"`,
      `"${item.net_amount.toFixed(2).replace('.', ',')}"`,
    ]);

    // Linha de totais
    rows.push([
      '"---"',
      '"---"',
      '"TOTAIS DO PERÍODO"',
      '""',
      '""',
      '""',
      `"${processedData.grossRevenue.toFixed(2).replace('.', ',')}"`,
      '""',
      `"${processedData.totalCommissions.toFixed(2).replace('.', ',')}"`,
      `"${processedData.netRevenue.toFixed(2).replace('.', ',')}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    // Adiciona BOM para que o Excel abra com acentos corretos em UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const fileName = `relatorio-financeiro-belezaflow-${format(startDate, 'yyyy-MM-dd')}-a-${format(
      endDate,
      'yyyy-MM-dd'
    )}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedData, startDate, endDate]);

  return {
    period,
    setPeriod,
    startDate,
    endDate,
    customStartDateStr,
    customEndDateStr,
    setCustomRange,
    loading,
    refetch: fetchAppointments,
    grossRevenue: processedData.grossRevenue,
    totalCommissions: processedData.totalCommissions,
    netRevenue: processedData.netRevenue,
    averageTicket: processedData.averageTicket,
    completedAppointmentsCount: processedData.completedAppointmentsCount,
    staffCommissions: processedData.staffCommissions,
    dailyBreakdown: processedData.dailyBreakdown,
    completedAppointments: processedData.completedAppointments,
    exportToCSV,
  };
}
