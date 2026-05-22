'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Local, Propietario } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type FormLocal = {
  numero: string
  nombre: string
  propietario_id: string
  arriendo_actual: string
  fecha_inicio_contrato: string
  puntos_incremento_ipc: string
  activo: boolean
}

const vacio: FormLocal = {
  numero: '',
  nombre: '',
  propietario_id: '',
  arriendo_actual: '',
  fecha_inicio_contrato: '',
  puntos_incremento_ipc: '0',
  activo: true,
}

export default function LocalesPage() {
  const [locales, setLocales] = useState<Local[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [form, setForm] = useState<FormLocal>(vacio)
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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

  function abrirNuevo() {
    setForm(vacio)
    setEditId(null)
    setOpen(true)
  }

  function abrirEditar(l: Local) {
    setForm({
      numero: l.numero,
      nombre: l.nombre ?? '',
      propietario_id: l.propietario_id ?? '',
      arriendo_actual: l.arriendo_actual.toString(),
      fecha_inicio_contrato: l.fecha_inicio_contrato ?? '',
      puntos_incremento_ipc: l.puntos_incremento_ipc.toString(),
      activo: l.activo,
    })
    setEditId(l.id)
    setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    const payload = {
      numero: form.numero,
      nombre: form.nombre || null,
      propietario_id: form.propietario_id || null,
      arriendo_actual: parseFloat(form.arriendo_actual) || 0,
      fecha_inicio_contrato: form.fecha_inicio_contrato || null,
      puntos_incremento_ipc: parseFloat(form.puntos_incremento_ipc) || 0,
      activo: form.activo,
    }
    if (editId) {
      await supabase.from('locales').update(payload).eq('id', editId)
    } else {
      await supabase.from('locales').insert(payload)
    }
    await cargar()
    setOpen(false)
    setLoading(false)
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Locales</h1>
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
                  <Label>Nombre (opcional)</Label>
                  <Input placeholder="Peluquería..." value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Propietario asignado</Label>
                <Select value={form.propietario_id} onValueChange={v => setForm({ ...form, propietario_id: v ?? '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propietario" />
                  </SelectTrigger>
                  <SelectContent>
                    {propietarios.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
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
              <Button className="w-full" onClick={guardar} disabled={loading || !form.numero}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {locales.length === 0 && (
          <p className="text-gray-500 text-sm">No hay locales aún. Agrega el primero.</p>
        )}
        {locales.map(l => (
          <Card key={l.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{l.numero}{l.nombre ? ` — ${l.nombre}` : ''}</p>
                  {!l.activo && <Badge variant="secondary">Inactivo</Badge>}
                </div>
                <p className="text-sm text-gray-500">
                  Arriendo: {formatCOP(l.arriendo_actual)} ·{' '}
                  Propietario: {(l.propietarios as Propietario)?.nombre ?? 'Sin asignar'}
                </p>
                <p className="text-sm text-gray-500">
                  {l.fecha_inicio_contrato
                    ? `Contrato desde: ${new Date(l.fecha_inicio_contrato).toLocaleDateString('es-CO')}`
                    : 'Sin fecha de contrato'}{' '}
                  · IPC +{l.puntos_incremento_ipc}pts
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => abrirEditar(l)}>Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
