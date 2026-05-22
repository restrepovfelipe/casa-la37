'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Factura, Local, Periodo, Propietario, MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function FacturasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [locales, setLocales] = useState<Local[]>([])
  const [generando, setGenerando] = useState(false)
  const supabase = createClient()

  async function cargar() {
    const [{ data: per }, { data: loc }] = await Promise.all([
      supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('locales').select('*, propietarios(*)').eq('activo', true).order('numero'),
    ])
    if (per) setPeriodos(per)
    if (loc) setLocales(loc)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!periodoId) return
    const p = periodos.find(p => p.id === periodoId)
    setPeriodo(p ?? null)
    cargarFacturas()
  }, [periodoId])

  async function cargarFacturas() {
    const { data } = await supabase
      .from('facturas')
      .select('*, locales(*, propietarios(*))')
      .eq('periodo_id', periodoId)
      .order('locales(numero)')
    if (data) setFacturas(data)
  }

  async function generarFacturas() {
    setGenerando(true)
    const { data: lects } = await supabase
      .from('lecturas')
      .select('*')
      .eq('periodo_id', periodoId)

    const numLocales = locales.length
    const alarmaXLocal = (periodo?.telesentinel ?? 0) / numLocales
    const empleadaXLocal = (periodo?.empleada ?? 0) / numLocales

    for (const local of locales) {
      const lectura = lects?.find(l => l.local_id === local.id)
      const agua = lectura?.agua_total ?? 0
      const luz = lectura?.luz_total ?? 0
      const totalServicios = agua + luz + alarmaXLocal + empleadaXLocal
      const total = local.arriendo_actual + totalServicios

      await supabase.from('facturas').upsert({
        local_id: local.id,
        periodo_id: periodoId,
        arriendo: local.arriendo_actual,
        agua_total: agua,
        luz_total: luz,
        alarma_total: alarmaXLocal,
        empleada_total: empleadaXLocal,
        total_servicios: totalServicios,
        total: total,
        estado_servicios: 'pendiente',
        estado_arriendo: 'pendiente',
      }, { onConflict: 'local_id,periodo_id' })
    }

    await cargarFacturas()
    setGenerando(false)
  }

  async function marcarPagado(facturaId: string, tipo: 'servicios' | 'arriendo') {
    const campo = tipo === 'servicios' ? 'estado_servicios' : 'estado_arriendo'
    await supabase.from('facturas').update({ [campo]: 'pagado' }).eq('id', facturaId)
    await cargarFacturas()
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const totalServicios = facturas.reduce((sum, f) => sum + f.total_servicios, 0)
  const totalArriendos = facturas.reduce((sum, f) => sum + f.arriendo, 0)
  const serviciosPendientes = facturas.filter(f => f.estado_servicios === 'pendiente').length
  const arriendosPendientes = facturas.filter(f => f.estado_arriendo === 'pendiente').length

  // Agrupar arriendos por propietario
  const porPropietario: Record<string, { nombre: string; total: number; cuenta: string }> = {}
  facturas.forEach(f => {
    const local = f.locales as Local
    const prop = local?.propietarios as Propietario
    if (!prop) return
    if (!porPropietario[prop.id]) {
      porPropietario[prop.id] = {
        nombre: prop.nombre,
        total: 0,
        cuenta: `${prop.banco ?? ''} ${prop.tipo_cuenta ?? ''} ${prop.numero_cuenta ?? ''}`.trim(),
      }
    }
    porPropietario[prop.id].total += f.arriendo
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Facturas</h1>
      </div>

      <div className="mb-6 max-w-xs">
        <Label>Seleccionar periodo</Label>
        <Select value={periodoId} onValueChange={(v) => setPeriodoId(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Seleccionar periodo..." /></SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.id} value={p.id}>{MESES[p.mes - 1]} {p.anio}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {periodoId && (
        <>
          {facturas.length === 0 ? (
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3">No hay facturas generadas para este periodo.</p>
              <Button onClick={generarFacturas} disabled={generando}>
                {generando ? 'Generando...' : 'Generar facturas'}
              </Button>
            </div>
          ) : (
            <div className="mb-4 flex gap-3">
              <Button variant="outline" size="sm" onClick={generarFacturas} disabled={generando}>
                {generando ? 'Actualizando...' : 'Recalcular facturas'}
              </Button>
            </div>
          )}

          {/* Resumen */}
          {facturas.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card><CardContent className="pt-4">
                <p className="text-xs text-gray-500">Total servicios</p>
                <p className="text-lg font-bold">{formatCOP(totalServicios)}</p>
                <p className="text-xs text-orange-500">{serviciosPendientes} pendientes</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-xs text-gray-500">Total arriendos</p>
                <p className="text-lg font-bold">{formatCOP(totalArriendos)}</p>
                <p className="text-xs text-orange-500">{arriendosPendientes} pendientes</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-xs text-gray-500">Pagar EPM/agua</p>
                <p className="text-lg font-bold">{formatCOP(facturas.reduce((s, f) => s + f.agua_total + f.luz_total, 0))}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4">
                <p className="text-xs text-gray-500">Alarmar + Empleada</p>
                <p className="text-lg font-bold">{formatCOP((periodo?.telesentinel ?? 0) + (periodo?.empleada ?? 0))}</p>
              </CardContent></Card>
            </div>
          )}

          {/* Facturas por local */}
          <div className="grid gap-4 mb-8">
            {facturas.map(f => {
              const local = f.locales as Local
              const prop = local?.propietarios as Propietario
              return (
                <Card key={f.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{local?.numero}{local?.nombre ? ` — ${local.nombre}` : ''}</p>
                        <p className="text-xs text-gray-400 mb-3">Propietario: {prop?.nombre ?? 'Sin asignar'}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm">
                          <span className="text-gray-500">Arriendo</span><span className="font-medium">{formatCOP(f.arriendo)}</span>
                          <span></span>
                          <span className="text-gray-500">Agua</span><span>{formatCOP(f.agua_total)}</span>
                          <span></span>
                          <span className="text-gray-500">Energía</span><span>{formatCOP(f.luz_total)}</span>
                          <span></span>
                          <span className="text-gray-500">Alarma</span><span>{formatCOP(f.alarma_total)}</span>
                          <span></span>
                          <span className="text-gray-500">Empleada</span><span>{formatCOP(f.empleada_total)}</span>
                          <span></span>
                          <span className="text-gray-500 font-medium">Total servicios</span>
                          <span className="font-medium">{formatCOP(f.total_servicios)}</span>
                          <span></span>
                          <span className="text-gray-500 font-bold">TOTAL</span>
                          <span className="font-bold text-base">{formatCOP(f.total)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Servicios</span>
                          {f.estado_servicios === 'pagado'
                            ? <Badge>Pagado</Badge>
                            : <Button size="sm" variant="outline" onClick={() => marcarPagado(f.id, 'servicios')}>Marcar pagado</Button>
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Arriendo</span>
                          {f.estado_arriendo === 'pagado'
                            ? <Badge>Pagado</Badge>
                            : <Button size="sm" variant="outline" onClick={() => marcarPagado(f.id, 'arriendo')}>Marcar pagado</Button>
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desembolsos a propietarios */}
          {Object.keys(porPropietario).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Transferir arriendos a propietarios</h2>
              <div className="grid gap-3">
                {Object.values(porPropietario).map((p, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-sm text-gray-500">{p.cuenta || 'Sin datos bancarios'}</p>
                      </div>
                      <p className="text-lg font-bold">{formatCOP(p.total)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
