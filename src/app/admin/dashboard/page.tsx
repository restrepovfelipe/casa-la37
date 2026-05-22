'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MESES } from '@/types'
import Link from 'next/link'

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
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      {ultimoPeriodo && (
        <p className="text-gray-500 text-sm mb-6">
          Periodo activo: <span className="font-medium">{MESES[ultimoPeriodo.mes - 1]} {ultimoPeriodo.anio}</span>{' '}
          <Badge variant="secondary">{ultimoPeriodo.estado}</Badge>
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Locales activos</p>
          <p className="text-3xl font-bold">{stats.locales}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Propietarios</p>
          <p className="text-3xl font-bold">{stats.propietarios}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Periodos abiertos</p>
          <p className="text-3xl font-bold">{stats.periodosAbiertos}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Servicios pendientes</p>
          <p className="text-3xl font-bold text-orange-500">{stats.facturasPendientesServicios}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Arriendos pendientes</p>
          <p className="text-3xl font-bold text-orange-500">{stats.facturasPendientesArriendo}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Total por recaudar</p>
          <p className="text-xl font-bold text-red-500">{formatCOP(stats.totalPendiente)}</p>
        </CardContent></Card>
      </div>

      <h2 className="text-lg font-semibold mb-3">Accesos rápidos</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/periodos', label: '+ Nuevo periodo' },
          { href: '/admin/lecturas', label: 'Ingresar lecturas' },
          { href: '/admin/facturas', label: 'Ver facturas' },
          { href: '/admin/locales', label: 'Gestionar locales' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-4">
                <p className="font-medium text-sm">{item.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
