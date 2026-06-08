'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gasto, Periodo, MESES, CATEGORIAS_GASTO } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORIA_COLOR: Record<string, string> = {
  mantenimiento: 'oklch(0.600 0.120 200)',
  servicios: 'oklch(0.600 0.120 240)',
  admin: 'oklch(0.600 0.120 280)',
  impuesto: 'oklch(0.600 0.140 50)',
  otro: 'oklch(0.560 0.012 68)',
}

export default function GastosPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ descripcion: '', monto: '', categoria: 'mantenimiento' })
  const supabase = createClient()

  useEffect(() => {
    supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setPeriodos(data)
        const hoy = new Date()
        const actual = data.find(p => p.mes === hoy.getMonth() + 1 && p.anio === hoy.getFullYear())
        if (actual) setPeriodoId(actual.id)
      })
  }, [])

  useEffect(() => {
    if (!periodoId) return
    cargarGastos()
  }, [periodoId])

  async function cargarGastos() {
    const { data } = await supabase.from('gastos').select('*').eq('periodo_id', periodoId).order('categoria').order('created_at')
    if (data) setGastos(data as Gasto[])
  }

  function abrirNuevo() {
    setForm({ descripcion: '', monto: '', categoria: 'mantenimiento' })
    setEditId(null)
    setOpen(true)
  }

  function abrirEditar(g: Gasto) {
    setForm({ descripcion: g.descripcion, monto: g.monto.toString(), categoria: g.categoria })
    setEditId(g.id)
    setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    const payload = {
      periodo_id: periodoId,
      descripcion: form.descripcion,
      monto: parseFloat(form.monto) || 0,
      categoria: form.categoria,
    }
    if (editId) {
      await supabase.from('gastos').update(payload).eq('id', editId)
    } else {
      await supabase.from('gastos').insert(payload)
    }
    await cargarGastos()
    setOpen(false)
    setLoading(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('gastos').delete().eq('id', id)
    await cargarGastos()
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const total = gastos.reduce((s, g) => s + g.monto, 0)
  const porCategoria = gastos.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto
    return acc
  }, {} as Record<string, number>)

  const periodoActual = periodos.find(p => p.id === periodoId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Gastos del edificio</h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Mantenimiento, servicios e impuestos por periodo</p>
        </div>
      </div>

      <div className="mb-6 max-w-xs">
        <Label>Seleccionar periodo</Label>
        <Select value={periodoId} onValueChange={v => setPeriodoId(v ?? '')}>
          <SelectTrigger>
            <span style={{ color: periodoId && periodoActual ? undefined : 'oklch(0.560 0.012 68)' }}>
              {periodoActual ? `${MESES[periodoActual.mes - 1]} ${periodoActual.anio}` : 'Seleccionar periodo...'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.id} value={p.id}>{MESES[p.mes - 1]} {p.anio}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {periodoId && (
        <>
          {/* Resumen rápido */}
          {gastos.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl p-4 border col-span-2 lg:col-span-1" style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'oklch(0.520 0.015 60)' }}>Total gastos</p>
                <p className="text-2xl font-semibold" style={{ color: 'oklch(0.540 0.180 30)' }}>{formatCOP(total)}</p>
              </div>
              {Object.entries(porCategoria).map(([cat, monto]) => (
                <div key={cat} className="rounded-xl p-4 border" style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: CATEGORIA_COLOR[cat] ?? 'oklch(0.560 0.012 68)' }}>
                    {CATEGORIAS_GASTO[cat] ?? cat}
                  </p>
                  <p className="text-lg font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{formatCOP(monto)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
              {gastos.length} gasto{gastos.length !== 1 ? 's' : ''} registrado{gastos.length !== 1 ? 's' : ''} en {periodoActual ? `${MESES[periodoActual.mes - 1]} ${periodoActual.anio}` : ''}
            </p>
            <Button onClick={abrirNuevo}>+ Agregar gasto</Button>
          </div>

          <div className="grid gap-2">
            {gastos.length === 0 && (
              <p className="text-sm py-8 text-center" style={{ color: 'oklch(0.520 0.015 60)' }}>
                No hay gastos registrados para este periodo.
              </p>
            )}
            {gastos.map(g => (
              <Card key={g.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORIA_COLOR[g.categoria] ?? 'oklch(0.560 0.012 68)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'oklch(0.185 0.020 55)' }}>{g.descripcion}</p>
                      <p className="text-xs" style={{ color: CATEGORIA_COLOR[g.categoria] ?? 'oklch(0.560 0.012 68)' }}>
                        {CATEGORIAS_GASTO[g.categoria] ?? g.categoria}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-semibold text-sm" style={{ color: 'oklch(0.300 0.018 58)' }}>{formatCOP(g.monto)}</p>
                    <button
                      onClick={() => abrirEditar(g)}
                      className="text-xs px-2 py-1 rounded border"
                      style={{ borderColor: 'oklch(0.880 0.012 72)', color: 'oklch(0.520 0.015 60)' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(g.id)}
                      className="text-xs px-2 py-1 rounded border"
                      style={{ borderColor: 'oklch(0.880 0.040 30)', color: 'oklch(0.540 0.180 30)' }}
                    >
                      ×
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Descripción</Label>
              <Input
                placeholder="Ej: Reparación puerta local 205"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div>
              <Label>Monto ($)</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v ?? 'otro' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIAS_GASTO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={guardar} disabled={loading || !form.descripcion || !form.monto}>
              {loading ? 'Guardando...' : editId ? 'Guardar cambios' : 'Agregar gasto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
