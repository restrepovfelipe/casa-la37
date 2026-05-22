'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { MESES } from '@/types'
import Link from 'next/link'

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'gold' | 'warning' | 'danger'
}) {
  const valueColor =
    accent === 'gold'
      ? '#9A7B35'
      : accent === 'warning'
      ? 'oklch(0.620 0.120 60)'
      : accent === 'danger'
      ? 'oklch(0.540 0.180 30)'
      : 'oklch(0.185 0.020 55)'

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}
    >
      <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>
        {label}
      </p>
      <p className="text-3xl font-semibold leading-none mb-1" style={{ color: valueColor }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: 'oklch(0.600 0.012 72)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

const quickLinks = [
  {
    href: '/admin/periodos',
    label: 'Nuevo periodo',
    desc: 'Abre el mes de facturación',
    icon: (
      <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/lecturas',
    label: 'Ingresar lecturas',
    desc: 'Agua y electricidad por local',
    icon: (
      <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 0C7.77614 0 8 0.223858 8 0.5V2.5C8 2.77614 7.77614 3 7.5 3C7.22386 3 7 2.77614 7 2.5V0.5C7 0.223858 7.22386 0 7.5 0ZM2.1967 2.1967C2.39196 2.00144 2.70854 2.00144 2.9038 2.1967L4.31802 3.61091C4.51328 3.80617 4.51328 4.12276 4.31802 4.31802C4.12276 4.51328 3.80617 4.51328 3.61091 4.31802L2.1967 2.9038C2.00144 2.70854 2.00144 2.39196 2.1967 2.1967ZM12.8033 2.1967C12.9986 2.39196 12.9986 2.70854 12.8033 2.9038L11.3891 4.31802C11.1938 4.51328 10.8772 4.51328 10.682 4.31802C10.4867 4.12276 10.4867 3.80617 10.682 3.61091L12.0962 2.1967C12.2915 2.00144 12.608 2.00144 12.8033 2.1967ZM0 7.5C0 7.22386 0.223858 7 0.5 7H2.5C2.77614 7 3 7.22386 3 7.5C3 7.77614 2.77614 8 2.5 8H0.5C0.223858 8 0 7.77614 0 7.5ZM12 7.5C12 7.22386 12.2239 7 12.5 7H14.5C14.7761 7 15 7.22386 15 7.5C15 7.77614 14.7761 8 14.5 8H12.5C12.2239 8 12 7.77614 12 7.5ZM7.5 4C5.567 4 4 5.567 4 7.5C4 8.88908 4.78555 10.0942 5.94993 10.7074L5.94993 12.5C5.94993 12.7761 6.17379 13 6.44993 13H8.54993C8.82607 13 9.04993 12.7761 9.04993 12.5V10.7074C10.2143 10.0942 10.9999 8.88908 10.9999 7.5C10.9999 5.567 9.43294 4 7.5 4ZM5 7.5C5 6.11929 6.11929 5 7.5 5C8.88071 5 10 6.11929 10 7.5C10 8.55436 9.36918 9.45944 8.45905 9.87687C8.22012 9.98543 8.04993 10.2265 8.04993 10.49V12H6.94993V10.49C6.94993 10.2265 6.77974 9.98543 6.54081 9.87687C5.63068 9.45944 5 8.55436 5 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/facturas',
    label: 'Ver facturas',
    desc: 'Generar y registrar pagos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2.5C3 2.22386 3.22386 2 3.5 2H11.5C11.7761 2 12 2.22386 12 2.5V13.5C12 13.6818 11.9014 13.8492 11.7424 13.9373C11.5834 14.0254 11.3891 14.0203 11.235 13.924L7.5 11.5896L3.765 13.924C3.61087 14.0203 3.41659 14.0254 3.25762 13.9373C3.09864 13.8492 3 13.6818 3 13.5V2.5ZM4 3V12.5227L7.235 10.576C7.38913 10.4797 7.58341 10.4797 7.73754 10.576L11 12.5227V3H4ZM5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6H9.5C9.77614 6 10 5.77614 10 5.5C10 5.22386 9.77614 5 9.5 5H5.5ZM5 7.5C5 7.22386 5.22386 7 5.5 7H9.5C9.77614 7 10 7.22386 10 7.5C10 7.77614 9.77614 8 9.5 8H5.5C5.22386 8 5 7.77614 5 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/locales',
    label: 'Gestionar locales',
    desc: 'Arriendos, contratos e IPC',
    icon: (
      <svg width="18" height="18" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 1H13C13.5523 1 14 1.44772 14 2V13C14 13.5523 13.5523 14 13 14H2C1.44772 14 1 13.5523 1 13V2C1 1.44772 1.44772 1 2 1ZM2 2V13H7V2H2ZM8 2V13H13V2H8Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    locales: 0,
    propietarios: 0,
    periodosAbiertos: 0,
    facturasPendientesServicios: 0,
    facturasPendientesArriendo: 0,
    totalPendiente: 0,
  })
  const [ultimoPeriodo, setUltimoPeriodo] = useState<{ mes: number; anio: number; estado: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const [
        { count: locales },
        { count: propietarios },
        { data: periodos },
        { data: facturas },
      ] = await Promise.all([
        supabase.from('locales').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('propietarios').select('*', { count: 'exact', head: true }),
        supabase.from('periodos').select('*').neq('estado', 'cerrado').order('anio', { ascending: false }).order('mes', { ascending: false }),
        supabase.from('facturas').select('estado_servicios, estado_arriendo, total_servicios, arriendo'),
      ])

      const pendServicios = facturas?.filter(f => f.estado_servicios === 'pendiente').length ?? 0
      const pendArriendo = facturas?.filter(f => f.estado_arriendo === 'pendiente').length ?? 0
      const totalPend = facturas
        ?.filter(f => f.estado_servicios === 'pendiente' || f.estado_arriendo === 'pendiente')
        .reduce((s, f) =>
          s +
          (f.estado_servicios === 'pendiente' ? f.total_servicios : 0) +
          (f.estado_arriendo === 'pendiente' ? f.arriendo : 0), 0) ?? 0

      setStats({
        locales: locales ?? 0,
        propietarios: propietarios ?? 0,
        periodosAbiertos: periodos?.length ?? 0,
        facturasPendientesServicios: pendServicios,
        facturasPendientesArriendo: pendArriendo,
        totalPendiente: totalPend,
      })

      if (periodos && periodos.length > 0) setUltimoPeriodo(periodos[0])
    }
    cargar()
  }, [])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>
          Dashboard
        </h1>
        {ultimoPeriodo ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            <span>Periodo activo:</span>
            <span className="font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
              {MESES[ultimoPeriodo.mes - 1]} {ultimoPeriodo.anio}
            </span>
            <Badge variant="secondary" className="text-xs">{ultimoPeriodo.estado}</Badge>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            No hay periodos activos aún
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Locales activos" value={stats.locales} />
        <StatCard label="Propietarios" value={stats.propietarios} />
        <StatCard label="Periodos abiertos" value={stats.periodosAbiertos} accent="gold" />
        <StatCard
          label="Servicios pendientes"
          value={stats.facturasPendientesServicios}
          sub="facturas sin pagar"
          accent={stats.facturasPendientesServicios > 0 ? 'warning' : undefined}
        />
        <StatCard
          label="Arriendos pendientes"
          value={stats.facturasPendientesArriendo}
          sub="facturas sin pagar"
          accent={stats.facturasPendientesArriendo > 0 ? 'warning' : undefined}
        />
        <StatCard
          label="Total por recaudar"
          value={formatCOP(stats.totalPendiente)}
          accent={stats.totalPendiente > 0 ? 'danger' : undefined}
        />
      </div>

      {/* Quick actions */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>
          Accesos rápidos
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(item => (
          <Link key={item.href} href={item.href}>
            <div
              className="rounded-xl border p-4 h-full transition-all hover:shadow-sm cursor-pointer group"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors"
                style={{ backgroundColor: 'oklch(0.920 0.030 72)', color: '#9A7B35' }}
              >
                {item.icon}
              </div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'oklch(0.185 0.020 55)' }}>
                {item.label}
              </p>
              <p className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
