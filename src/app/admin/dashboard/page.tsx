'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Factura, Local, MESES, Periodo } from '@/types'
import Link from 'next/link'

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: 'gold' | 'warning' | 'danger'
}) {
  const valueColor = accent === 'gold' ? '#9A7B35' : accent === 'warning' ? 'oklch(0.620 0.120 60)' : accent === 'danger' ? 'oklch(0.540 0.180 30)' : 'oklch(0.185 0.020 55)'
  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>{label}</p>
      <p className="text-3xl font-semibold leading-none mb-1" style={{ color: valueColor }}>{value}</p>
      {sub && <p className="text-xs mt-1.5" style={{ color: 'oklch(0.600 0.012 72)' }}>{sub}</p>}
    </div>
  )
}

const quickLinks = [
  { href: '/admin/periodos', label: 'Nuevo periodo', desc: 'Abre el mes de facturación', icon: <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg> },
  { href: '/admin/lecturas', label: 'Ingresar lecturas', desc: 'Agua y electricidad por local', icon: <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M7.5 0C7.77614 0 8 0.223858 8 0.5V2.5C8 2.77614 7.77614 3 7.5 3C7.22386 3 7 2.77614 7 2.5V0.5C7 0.223858 7.22386 0 7.5 0ZM7.5 4C5.567 4 4 5.567 4 7.5C4 8.889 4.786 10.094 5.95 10.707V12.5C5.95 12.776 6.174 13 6.45 13H8.55C8.826 13 9.05 12.776 9.05 12.5V10.707C10.214 10.094 11 8.889 11 7.5C11 5.567 9.433 4 7.5 4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg> },
  { href: '/admin/facturas', label: 'Ver facturas', desc: 'Generar y registrar pagos', icon: <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M3 2.5C3 2.22386 3.22386 2 3.5 2H11.5C11.7761 2 12 2.22386 12 2.5V13.5C12 13.682 11.901 13.849 11.742 13.937C11.583 14.025 11.389 14.02 11.235 13.924L7.5 11.59L3.765 13.924C3.611 14.02 3.417 14.025 3.258 13.937C3.099 13.849 3 13.682 3 13.5V2.5ZM4 3V12.523L7.235 10.576C7.389 10.48 7.583 10.48 7.738 10.576L11 12.523V3H4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg> },
  { href: '/admin/locales', label: 'Gestionar locales', desc: 'Arriendos, contratos e IPC', icon: <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M2 1H13C13.5523 1 14 1.44772 14 2V13C14 13.5523 13.5523 14 13 14H2C1.44772 14 1 13.5523 1 13V2C1 1.44772 1.44772 1 2 1ZM2 2V13H7V2H2ZM8 2V13H13V2H8Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg> },
]

type FacturaMorosa = Factura & { locales: Local; periodos: Periodo }

export default function DashboardPage() {
  const [stats, setStats] = useState({ locales: 0, propietarios: 0, periodosAbiertos: 0, facturasPendientesServicios: 0, facturasPendientesArriendo: 0, totalPendiente: 0 })
  const [ultimoPeriodo, setUltimoPeriodo] = useState<Periodo | null>(null)
  const [morosas, setMorosas] = useState<FacturaMorosa[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const [
        { count: locales },
        { count: propietarios },
        { data: periodos },
        { data: facturas },
        { data: todasFacturas },
      ] = await Promise.all([
        supabase.from('locales').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('propietarios').select('*', { count: 'exact', head: true }),
        supabase.from('periodos').select('*').neq('estado', 'cerrado').order('anio', { ascending: false }).order('mes', { ascending: false }),
        supabase.from('facturas').select('estado_servicios, estado_arriendo, total_servicios, arriendo'),
        supabase.from('facturas').select('*, locales(*), periodos(*)').or('estado_servicios.eq.pendiente,estado_arriendo.eq.pendiente').order('created_at', { ascending: false }).limit(20),
      ])

      const pendServicios = facturas?.filter(f => f.estado_servicios === 'pendiente').length ?? 0
      const pendArriendo = facturas?.filter(f => f.estado_arriendo === 'pendiente').length ?? 0
      const totalPend = facturas?.filter(f => f.estado_servicios === 'pendiente' || f.estado_arriendo === 'pendiente')
        .reduce((s, f) => s + (f.estado_servicios === 'pendiente' ? f.total_servicios : 0) + (f.estado_arriendo === 'pendiente' ? f.arriendo : 0), 0) ?? 0

      setStats({ locales: locales ?? 0, propietarios: propietarios ?? 0, periodosAbiertos: periodos?.length ?? 0, facturasPendientesServicios: pendServicios, facturasPendientesArriendo: pendArriendo, totalPendiente: totalPend })
      if (periodos && periodos.length > 0) setUltimoPeriodo(periodos[0])
      if (todasFacturas) setMorosas(todasFacturas as FacturaMorosa[])
    }
    cargar()
  }, [])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const hoy = new Date()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Dashboard</h1>
        {ultimoPeriodo ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            <span>Periodo activo:</span>
            <span className="font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
              {MESES[ultimoPeriodo.mes - 1]} {ultimoPeriodo.anio}
            </span>
            <Badge variant="secondary" className="text-xs">{ultimoPeriodo.estado}</Badge>
            {ultimoPeriodo.fecha_limite_pago && (
              <span className={new Date(ultimoPeriodo.fecha_limite_pago) < hoy ? 'text-red-500' : ''}>
                · Límite: {new Date(ultimoPeriodo.fecha_limite_pago + 'T12:00:00').toLocaleDateString('es-CO')}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>No hay periodos activos aún</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Locales activos" value={stats.locales} />
        <StatCard label="Propietarios" value={stats.propietarios} />
        <StatCard label="Periodos abiertos" value={stats.periodosAbiertos} accent="gold" />
        <StatCard label="Servicios pendientes" value={stats.facturasPendientesServicios} sub="facturas sin pagar" accent={stats.facturasPendientesServicios > 0 ? 'warning' : undefined} />
        <StatCard label="Arriendos pendientes" value={stats.facturasPendientesArriendo} sub="facturas sin pagar" accent={stats.facturasPendientesArriendo > 0 ? 'warning' : undefined} />
        <StatCard label="Total por recaudar" value={formatCOP(stats.totalPendiente)} accent={stats.totalPendiente > 0 ? 'danger' : undefined} />
      </div>

      {/* Morosos */}
      {morosas.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>
            Cuentas pendientes
          </h2>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
            {morosas.map((f, idx) => {
              const local = f.locales as Local
              const periodo = f.periodos as Periodo
              const vencida = periodo?.fecha_limite_pago && new Date(periodo.fecha_limite_pago) < hoy
              const debe = (f.estado_servicios === 'pendiente' ? f.total_servicios : 0) + (f.estado_arriendo === 'pendiente' ? f.arriendo : 0)

              return (
                <div
                  key={f.id}
                  className={`px-5 py-3 flex items-center justify-between text-sm ${idx > 0 ? 'border-t' : ''}`}
                  style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>
                      {local?.numero}{local?.nombre ? ` — ${local.nombre}` : ''}
                    </span>
                    <span style={{ color: 'oklch(0.520 0.015 60)' }}>
                      {periodo ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : ''}
                    </span>
                    {f.estado_servicios === 'pendiente' && <Badge variant="outline" className="text-xs">Servicios</Badge>}
                    {f.estado_arriendo === 'pendiente' && <Badge variant="outline" className="text-xs">Arriendo</Badge>}
                    {vencida && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
                  </div>
                  <span className="font-semibold" style={{ color: vencida ? 'oklch(0.540 0.180 30)' : '#9A7B35' }}>
                    {formatCOP(debe)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>Accesos rápidos</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(item => (
          <Link key={item.href} href={item.href}>
            <div className="rounded-xl border p-4 h-full transition-all hover:shadow-sm cursor-pointer" style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'oklch(0.920 0.030 72)', color: '#9A7B35' }}>
                {item.icon}
              </div>
              <p className="text-sm font-medium mb-0.5" style={{ color: 'oklch(0.185 0.020 55)' }}>{item.label}</p>
              <p className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
