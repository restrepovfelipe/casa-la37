'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Local, Periodo, MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type LecturaForm = {
  agua_anterior: string
  agua_actual: string
  agua_precio_unitario: string
  luz_anterior: string
  luz_actual: string
  luz_precio_unitario: string
}

export default function LecturasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [locales, setLocales] = useState<Local[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [lecturas, setLecturas] = useState<Record<string, LecturaForm>>({})
  const [guardando, setGuardando] = useState<Record<string, boolean>>({})
  const [guardado, setGuardado] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  async function cargar() {
    const [{ data: per }, { data: loc }] = await Promise.all([
      supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('locales').select('*').eq('activo', true).order('numero'),
    ])
    if (per) setPeriodos(per)
    if (loc) setLocales(loc)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!periodoId) return
    cargarLecturas()
  }, [periodoId])

  async function cargarLecturas() {
    const { data } = await supabase
      .from('lecturas')
      .select('*')
      .eq('periodo_id', periodoId)

    const mapa: Record<string, LecturaForm> = {}
    locales.forEach(l => {
      const existente = data?.find(d => d.local_id === l.id)
      mapa[l.id] = {
        agua_anterior: existente?.agua_anterior?.toString() ?? '',
        agua_actual: existente?.agua_actual?.toString() ?? '',
        agua_precio_unitario: existente?.agua_precio_unitario?.toString() ?? '',
        luz_anterior: existente?.luz_anterior?.toString() ?? '',
        luz_actual: existente?.luz_actual?.toString() ?? '',
        luz_precio_unitario: existente?.luz_precio_unitario?.toString() ?? '',
      }
    })
    setLecturas(mapa)
  }

  function actualizar(localId: string, campo: keyof LecturaForm, valor: string) {
    setLecturas(prev => ({
      ...prev,
      [localId]: { ...prev[localId], [campo]: valor }
    }))
  }

  async function guardarLocal(localId: string) {
    setGuardando(prev => ({ ...prev, [localId]: true }))
    const f = lecturas[localId]
    const agua_consumo = parseFloat(f.agua_actual) - parseFloat(f.agua_anterior) || 0
    const luz_consumo = parseFloat(f.luz_actual) - parseFloat(f.luz_anterior) || 0

    const payload = {
      local_id: localId,
      periodo_id: periodoId,
      agua_anterior: parseFloat(f.agua_anterior) || 0,
      agua_actual: parseFloat(f.agua_actual) || 0,
      agua_precio_unitario: parseFloat(f.agua_precio_unitario) || 0,
      agua_total: agua_consumo * (parseFloat(f.agua_precio_unitario) || 0),
      luz_anterior: parseFloat(f.luz_anterior) || 0,
      luz_actual: parseFloat(f.luz_actual) || 0,
      luz_precio_unitario: parseFloat(f.luz_precio_unitario) || 0,
      luz_total: luz_consumo * (parseFloat(f.luz_precio_unitario) || 0),
    }

    await supabase.from('lecturas').upsert(payload, { onConflict: 'local_id,periodo_id' })
    setGuardando(prev => ({ ...prev, [localId]: false }))
    setGuardado(prev => ({ ...prev, [localId]: true }))
    setTimeout(() => setGuardado(prev => ({ ...prev, [localId]: false })), 2000)
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const calcularTotal = (localId: string) => {
    const f = lecturas[localId]
    if (!f) return 0
    const agua = (parseFloat(f.agua_actual) - parseFloat(f.agua_anterior) || 0) * (parseFloat(f.agua_precio_unitario) || 0)
    const luz = (parseFloat(f.luz_actual) - parseFloat(f.luz_anterior) || 0) * (parseFloat(f.luz_precio_unitario) || 0)
    return agua + luz
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lecturas de medidores</h1>
      </div>

      <div className="mb-6 max-w-xs">
        <Label>Seleccionar periodo</Label>
        <Select value={periodoId} onValueChange={(v) => setPeriodoId(v ?? '')}>
          <SelectTrigger>
            <span style={{ color: periodoId && periodos.find(p => p.id === periodoId) ? undefined : 'oklch(0.560 0.012 68)' }}>
              {(() => { const p = periodos.find(x => x.id === periodoId); return p ? `${MESES[p.mes - 1]} ${p.anio}` : 'Seleccionar periodo...' })()}
            </span>
          </SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {MESES[p.mes - 1]} {p.anio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!periodoId && (
        <p className="text-gray-500 text-sm">Selecciona un periodo para ingresar las lecturas.</p>
      )}

      {periodoId && (
        <div className="grid gap-6">
          {locales.map(local => {
            const f = lecturas[local.id] ?? {}
            const total = calcularTotal(local.id)
            return (
              <Card key={local.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{local.numero}{local.nombre ? ` — ${local.nombre}` : ''}</CardTitle>
                    {total > 0 && <Badge variant="outline">Servicios: {formatCOP(total)}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Agua */}
                    <div className="space-y-3">
                      <p className="font-medium text-sm text-blue-600">Agua</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Lectura anterior</Label>
                          <Input type="number" step="0.001" value={f.agua_anterior ?? ''} onChange={e => actualizar(local.id, 'agua_anterior', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Lectura actual</Label>
                          <Input type="number" step="0.001" value={f.agua_actual ?? ''} onChange={e => actualizar(local.id, 'agua_actual', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Precio/m³ ($)</Label>
                          <Input type="number" value={f.agua_precio_unitario ?? ''} onChange={e => actualizar(local.id, 'agua_precio_unitario', e.target.value)} />
                        </div>
                      </div>
                      {f.agua_anterior && f.agua_actual && (
                        <p className="text-xs text-gray-500">
                          Consumo: {(parseFloat(f.agua_actual) - parseFloat(f.agua_anterior)).toFixed(3)} m³ ·{' '}
                          {formatCOP((parseFloat(f.agua_actual) - parseFloat(f.agua_anterior)) * (parseFloat(f.agua_precio_unitario) || 0))}
                        </p>
                      )}
                    </div>

                    {/* Luz */}
                    <div className="space-y-3">
                      <p className="font-medium text-sm text-yellow-600">Energía</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Lectura anterior</Label>
                          <Input type="number" step="0.001" value={f.luz_anterior ?? ''} onChange={e => actualizar(local.id, 'luz_anterior', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Lectura actual</Label>
                          <Input type="number" step="0.001" value={f.luz_actual ?? ''} onChange={e => actualizar(local.id, 'luz_actual', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Precio/kWh ($)</Label>
                          <Input type="number" value={f.luz_precio_unitario ?? ''} onChange={e => actualizar(local.id, 'luz_precio_unitario', e.target.value)} />
                        </div>
                      </div>
                      {f.luz_anterior && f.luz_actual && (
                        <p className="text-xs text-gray-500">
                          Consumo: {(parseFloat(f.luz_actual) - parseFloat(f.luz_anterior)).toFixed(3)} kWh ·{' '}
                          {formatCOP((parseFloat(f.luz_actual) - parseFloat(f.luz_anterior)) * (parseFloat(f.luz_precio_unitario) || 0))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => guardarLocal(local.id)}
                      disabled={guardando[local.id]}
                      variant={guardado[local.id] ? 'outline' : 'default'}
                    >
                      {guardando[local.id] ? 'Guardando...' : guardado[local.id] ? '✓ Guardado' : 'Guardar lectura'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
