'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Local, Propietario, Factura, Periodo, MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type FormLocal = {
  numero: string; nombre: string; propietario_id: string; arriendo_actual: string
  fecha_inicio_contrato: string; puntos_incremento_ipc: string; retencion_pct: string; activo: boolean
}

const vacio: FormLocal = {
  numero: '', nombre: '', propietario_id: '', arriendo_actual: '',
  fecha_inicio_contrato: '', puntos_incremento_ipc: '0', retencion_pct: '0', activo: true,
}

type HistorialItem = Factura & { periodos: Periodo }

export default function LocalesPage() {
  const [locales, setLocales] = useState<Local[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [form, setForm] = useState<FormLocal>(vacio)
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // IPC
  const [ipcModal, setIpcModal] = useState<Local[] | null>(null)
  const [ipcPorcentaje, setIpcPorcentaje] = useState('')

  // Historial
  const [historialModal, setHistorialModal] = useState<Local | null>(null)
  const [historial, setHistorial] = useState<HistorialItem[]>([])

  const supabase = createClient()

  async function cargar() {
    const [{ data: loc }, { data: prop }] = await Promise.all([
      supabase.from('locales').select('*, propietarios(*)').order('numero'),
      supabase.from('propietarios').select('*').order('nombre'),
    ])
    if (loc) setLocales(loc)
    if (prop) setPropietarios(prop)
  }

  useEffect(() => { cargar() }, [])

  function abrirNuevo() { setForm(vacio); setEditId(null); setOpen(true) }

  function abrirEditar(l: Local) {
    setForm({
      numero: l.numero, nombre: l.nombre ?? '', propietario_id: l.propietario_id ?? '',
      arriendo_actual: l.arriendo_actual.toString(), fecha_inicio_contrato: l.fecha_inicio_contrato ?? '',
      puntos_incremento_ipc: l.puntos_incremento_ipc.toString(),
      retencion_pct: (l.retencion_pct ?? 0).toString(), activo: l.activo,
    })
    setEditId(l.id); setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    const payload = {
      numero: form.numero, nombre: form.nombre || null,
      propietario_id: form.propietario_id || null,
      arriendo_actual: parseFloat(form.arriendo_actual) || 0,
      fecha_inicio_contrato: form.fecha_inicio_contrato || null,
      puntos_incremento_ipc: parseFloat(form.puntos_incremento_ipc) || 0,
      retencion_pct: parseFloat(form.retencion_pct) || 0,
      activo: form.activo,
    }
    if (editId) { await supabase.from('locales').update(payload).eq('id', editId) }
    else { await supabase.from('locales').insert(payload) }
    await cargar(); setOpen(false); setLoading(false)
  }

  async function aplicarIPC() {
    if (!ipcModal) return
    const ipc = parseFloat(ipcPorcentaje) || 0
    const resumen = ipcModal.map(l => {
      const total = ipc + l.puntos_incremento_ipc
      const nuevo = Math.round(l.arriendo_actual * (1 + total / 100))
      return { local: l, nuevo, total }
    })
    const msg = resumen.map(r => `${r.local.numero}: ${formatCOP(r.nuevo)} (+${r.total}%)`).join('\n')
    if (!confirm(`¿Aplicar nuevos arriendos?\n${msg}`)) return
    await Promise.all(resumen.map(r =>
      supabase.from('locales').update({ arriendo_actual: r.nuevo }).eq('id', r.local.id)
    ))
    await cargar(); setIpcModal(null)
  }

  async function abrirHistorial(l: Local) {
    setHistorialModal(l)
    const { data } = await supabase
      .from('facturas')
      .select('*, periodos(*)')
      .eq('local_id', l.id)
      .order('created_at', { ascending: false })
    if (data) setHistorial(data as HistorialItem[])
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const ipcResumen = ipcModal?.map(l => ({
    local: l,
    total: (parseFloat(ipcPorcentaje) || 0) + l.puntos_incremento_ipc,
    nuevo: Math.round(l.arriendo_actual * (1 + ((parseFloat(ipcPorcentaje) || 0) + l.puntos_incremento_ipc) / 100)),
  })) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Locales</h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Arriendos, contratos y propietarios</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button onClick={abrirNuevo}>+ Agregar local</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? 'Editar local' : 'Nuevo local'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Número / ID</Label>
                  <Input placeholder="Local 1" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
                </div>
                <div>
                  <Label>Inquilino / Nombre</Label>
                  <Input placeholder="Sonorama..." value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Propietario asignado</Label>
                <Select value={form.propietario_id} onValueChange={v => setForm({ ...form, propietario_id: v ?? '' })}>
                  <SelectTrigger>
                    {(() => {
                      const sel = propietarios.find(p => p.id === form.propietario_id)
                      return <span style={{ color: sel ? undefined : 'oklch(0.560 0.012 68)' }}>{sel ? sel.nombre : 'Seleccionar propietario'}</span>
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    {propietarios.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Arriendo actual ($)</Label>
                <Input type="number" placeholder="1500000" value={form.arriendo_actual} onChange={e => setForm({ ...form, arriendo_actual: e.target.value })} />
              </div>
              <div>
                <Label>Fecha inicio contrato</Label>
                <Input type="date" value={form.fecha_inicio_contrato} onChange={e => setForm({ ...form, fecha_inicio_contrato: e.target.value })} />
              </div>
              <div>
                <Label>Puntos adicionales al IPC (%)</Label>
                <Input type="number" step="0.5" placeholder="2" value={form.puntos_incremento_ipc} onChange={e => setForm({ ...form, puntos_incremento_ipc: e.target.value })} />
              </div>
              <div>
                <Label>Retención en la fuente (%)</Label>
                <Input type="number" step="0.1" placeholder="0" value={form.retencion_pct} onChange={e => setForm({ ...form, retencion_pct: e.target.value })} />
                <p className="text-xs mt-1" style={{ color: 'oklch(0.560 0.012 68)' }}>
                  Ej: 3.5 para Octus. Se descuenta del arriendo al calcular distribución.
                </p>
              </div>
              <Button className="w-full" onClick={guardar} disabled={loading || !form.numero}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {locales.length === 0 && (
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>No hay locales aún.</p>
        )}
        {(() => {
          // Agrupar locales con el mismo nombre (ej: Makeno ocupa 305 y 401)
          const grupos: Local[][] = []
          const vistos = new Set<string>()
          locales.forEach(l => {
            if (vistos.has(l.id)) return
            if (l.nombre) {
              const hermanos = locales.filter(x => x.nombre === l.nombre)
              hermanos.forEach(x => vistos.add(x.id))
              grupos.push(hermanos)
            } else {
              vistos.add(l.id)
              grupos.push([l])
            }
          })
          return grupos.map(grupo => {
            const principal = grupo[0]
            const esGrupo = grupo.length > 1
            const numerosLabel = grupo.map(x => x.numero).join(' y ')
            const arriendoTotal = grupo.reduce((s, x) => s + x.arriendo_actual, 0)
            return (
          <Card key={grupo.map(x=>x.id).join('-')}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>
                      {numerosLabel}{principal.nombre ? ` — ${principal.nombre}` : ''}
                    </p>
                    {esGrupo && (
                      <Badge variant="secondary" className="text-xs">{grupo.length} locales</Badge>
                    )}
                    {grupo.every(x => !x.activo) && <Badge variant="secondary">Inactivo</Badge>}
                  </div>
                  <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
                    Arriendo:{' '}
                    <span className="font-semibold" style={{ color: '#9A7B35' }}>
                      {esGrupo
                        ? `${grupo.map(x => formatCOP(x.arriendo_actual)).join(' + ')} = ${formatCOP(arriendoTotal)}`
                        : formatCOP(principal.arriendo_actual)
                      }
                    </span>
                    {' · '}
                    {esGrupo ? (
                      // Mostrar propietario de cada local si son distintos
                      (() => {
                        const props = grupo.map(x => ({ num: x.numero, prop: (x.propietarios as Propietario)?.nombre }))
                        const todosIguales = props.every(p => p.prop === props[0].prop)
                        return todosIguales
                          ? `Propietario: ${props[0].prop ?? 'Sin asignar'}`
                          : props.map(p => `${p.num}: ${p.prop ?? 'Sin asignar'}`).join(' · ')
                      })()
                    ) : (
                      `Propietario: ${(principal.propietarios as Propietario)?.nombre ?? 'Sin asignar'}`
                    )}
                  </p>
                  <p className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>
                    {principal.fecha_inicio_contrato
                      ? `Contrato desde: ${new Date(principal.fecha_inicio_contrato + 'T12:00:00').toLocaleDateString('es-CO')}`
                      : 'Sin fecha de contrato'}
                    {' · '}IPC +{principal.puntos_incremento_ipc}pts
                    {grupo.some(x => (x.retencion_pct ?? 0) > 0) && (
                      <span style={{ color: 'oklch(0.600 0.140 50)' }}>
                        {' · '}Retención {grupo[0].retencion_pct}%
                      </span>
                    )}
                  </p>
                </div>
                {/* Botones — se reorganizan en filas si hay muchos */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setIpcModal(grupo); setIpcPorcentaje('') }}>IPC</Button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {grupo.map(l => (
                      <Button key={l.id} variant="outline" size="sm" onClick={() => abrirHistorial(l)}>
                        {esGrupo ? `Hist. ${l.numero}` : 'Historial'}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {grupo.map(l => (
                      <Button key={l.id} variant="outline" size="sm" onClick={() => abrirEditar(l)}>
                        {esGrupo ? `Editar ${l.numero}` : 'Editar'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            )
          })
        })()}
      </div>

      {/* Modal IPC */}
      <Dialog open={!!ipcModal} onOpenChange={() => setIpcModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Aplicar incremento IPC</DialogTitle>
          </DialogHeader>
          {ipcModal && (
            <div className="space-y-4">
              {/* Un bloque por cada local del grupo */}
              <div className="space-y-2">
                {ipcModal.map(l => (
                  <div key={l.id} className="rounded-lg p-3" style={{ backgroundColor: 'oklch(0.945 0.012 72)' }}>
                    <p className="font-medium text-sm" style={{ color: 'oklch(0.185 0.020 55)' }}>
                      {l.numero}{l.nombre ? ` — ${l.nombre}` : ''}
                    </p>
                    <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
                      Arriendo actual: <span className="font-semibold" style={{ color: '#9A7B35' }}>{formatCOP(l.arriendo_actual)}</span>
                      {' · '}+{l.puntos_incremento_ipc}pts
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <Label>IPC oficial del año (%)</Label>
                <Input
                  type="number" step="0.1" placeholder="Ej: 9.28"
                  value={ipcPorcentaje}
                  onChange={e => setIpcPorcentaje(e.target.value)}
                />
                <p className="text-xs mt-1" style={{ color: 'oklch(0.560 0.012 68)' }}>
                  Consultable en dane.gov.co
                </p>
              </div>
              {ipcPorcentaje && ipcResumen.length > 0 && (
                <div className="rounded-lg p-4 border space-y-2" style={{ borderColor: 'oklch(0.880 0.060 68)', backgroundColor: 'oklch(0.970 0.040 60)' }}>
                  {ipcResumen.map(r => (
                    <div key={r.local.id}>
                      <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>
                        {r.local.numero} · IPC {ipcPorcentaje}% + {r.local.puntos_incremento_ipc}pts = <strong>{r.total}%</strong>
                      </p>
                      <p className="text-base font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>
                        Nuevo arriendo: <span style={{ color: '#9A7B35' }}>{formatCOP(r.nuevo)}</span>
                        <span className="text-xs font-normal ml-2" style={{ color: 'oklch(0.560 0.012 68)' }}>
                          (+{formatCOP(r.nuevo - r.local.arriendo_actual)})
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full" onClick={aplicarIPC} disabled={!ipcPorcentaje}>
                Aplicar {ipcModal.length > 1 ? `a los ${ipcModal.length} locales` : 'nuevo arriendo'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Historial */}
      <Dialog open={!!historialModal} onOpenChange={() => setHistorialModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Historial — {historialModal?.numero}{historialModal?.nombre ? ` ${historialModal.nombre}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {historial.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'oklch(0.520 0.015 60)' }}>
                No hay facturas registradas aún para este local.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid oklch(0.880 0.012 72)' }}>
                    {['Periodo', 'Servicios', 'Arriendo', 'Total', 'Estado'].map(h => (
                      <th key={h} className="text-left pb-2 pr-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'oklch(0.520 0.015 60)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historial.map((f, i) => {
                    const p = f.periodos
                    const pagado = f.estado_servicios === 'pagado' && f.estado_arriendo === 'pagado'
                    return (
                      <tr key={f.id} style={{ borderBottom: i < historial.length - 1 ? '1px solid oklch(0.945 0.012 72)' : 'none' }}>
                        <td className="py-2.5 pr-3 font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
                          {p ? `${MESES[p.mes - 1].slice(0, 3)} ${p.anio}` : '—'}
                        </td>
                        <td className="py-2.5 pr-3" style={{ color: 'oklch(0.400 0.018 58)' }}>{formatCOP(f.total_servicios)}</td>
                        <td className="py-2.5 pr-3" style={{ color: 'oklch(0.400 0.018 58)' }}>{formatCOP(f.arriendo)}</td>
                        <td className="py-2.5 pr-3 font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{formatCOP(f.total)}</td>
                        <td className="py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={pagado
                            ? { backgroundColor: '#dcfce7', color: '#15803d' }
                            : { backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.540 0.120 50)' }
                          }>
                            {pagado ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
