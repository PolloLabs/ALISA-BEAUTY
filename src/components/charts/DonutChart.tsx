import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutCategory {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  title: string
  subtitle?: string
  data: DonutCategory[]
  centerLabel: string
  height?: number
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  data,
  centerLabel,
  height = 190,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('theme-change', checkTheme)
    return () => {
      observer.disconnect()
      window.removeEventListener('theme-change', checkTheme)
    }
  }, [])

  const total = data.reduce((acc, curr) => acc + curr.value, 0)
  const cellStroke = isDark ? '#16161d' : '#ffffff'
  const displayData = total === 0 
    ? [{ name: 'Sem dados ainda', value: 1, color: isDark ? '#2a2d3d' : '#e2e8f0' }] 
    : data

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400/40 transition-all duration-200">
      <div className="mb-2">
        <h3 className="text-sm font-bold font-luxury text-slate-900 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Gráfico Donut com Total no Centro */}
      <div className="relative w-full flex items-center justify-center" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={total === 0 ? 0 : 3}
              dataKey="value"
            >
              {displayData.map((entry, index) => {
                const effectiveColor = isDark && (entry.color === '#0f172a' || entry.color.toLowerCase() === '#0f172a')
                  ? '#475569'
                  : entry.color
                return (
                  <Cell key={`cell-${index}`} fill={effectiveColor} stroke={cellStroke} strokeWidth={2} />
                )
              })}
            </Pie>
            {total > 0 && (
              <Tooltip
                formatter={(value: any) => [
                  `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                  '',
                ]}
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a24' : '#0f172a',
                  borderColor: isDark ? '#2e2e3f' : '#334155',
                  borderRadius: '0.75rem',
                  color: '#ffffff',
                  fontSize: '12px',
                  padding: '6px 10px',
                }}
                itemStyle={{ color: '#D4AF37' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Número Total Sempre no Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-luxury text-slate-900 leading-none">
            {total}
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-1">
            {total === 0 ? 'Sem dados ainda' : centerLabel}
          </span>
        </div>
      </div>

      {/* Legenda abaixo com porcentagem */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs mt-2">
        {total === 0 ? (
          <span className="text-[11px] text-slate-400 italic">Sem dados ainda</span>
        ) : (
          data.map((item) => {
            const pct = Math.round((item.value / total) * 100)
            const legendColor = isDark && (item.color === '#0f172a' || item.color.toLowerCase() === '#0f172a')
              ? '#475569'
              : item.color
            return (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: legendColor }}
                />
                <span className="text-slate-600 text-[11px] sm:text-xs">{item.name}:</span>
                <span className="font-bold text-slate-900 text-[11px] sm:text-xs">
                  {item.value} <span className="text-[10px] font-normal text-slate-400">({pct}%)</span>
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
