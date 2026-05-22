'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Propietario } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const vacio: Omit<Propietario, 'id' | 'created_at'> = {
  nombre: '',
  porcentaje_real: null,
  banco: null,
  tipo_cuenta: null,
  numero_cuenta: null,
  nequi: null,
}

export default function PropietariosPage() {
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [form, setForm] = useState(vacio)
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function cargar() {
    const { data } = await supabase.from('propietarios').select('*').order('nombre')
    if (data) setPropietarios(data)
  }

  useEffect(() => { cargar() }, [])

  function abrirNuevo() {
    setForm(vacio)
    setEditId(null)
    setOpen(true)
  }

  function abrirEditar(p: Propietario) {
    setForm({
      nombre: p.nombre,
      porcentaje_real: p.porcentaje_real,
      banco: p.banco,
      tipo_cuenta: p.tipo_cuenta,
      numero_cuenta: p.numero_cuenta,
      nequi: p.nequi,
    })
    setEditId(p.id)
    setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    if (editId) {
      await supabase.from('propietarios').update(form).eq('id', editId)
    } else {
      await supabase.from('propietarios').insert(form)
    }
    await cargar()
    setOpen(false)
    setLoading(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este propietario?')) return
    await supabase.from('propietarios').delete().eq('id', id)
    await cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Propietarios</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNuevo}>+ Agregar propietario</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? 'Editar propietario' : 'Nuevo propietario'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Porcentaje real (%)</Label>
                <Input type="number" step="0.01" value={form.porcentaje_real ?? ''} onChange={e => setForm({ ...form, porcentaje_real: parseFloat(e.target.value) || null })} />
              </div>
              <div>
                <Label>Banco</Label>
                <Input value={form.banco ?? ''} onChange={e => setForm({ ...form, banco: e.target.value || null })} />
              </div>
              <div>
                <Label>Tipo de cuenta</Label>
                <Input placeholder="Ahorros / Corriente" value={form.tipo_cuenta ?? ''} onChange={e => setForm({ ...form, tipo_cuenta: e.target.value || null })} />
              </div>
              <div>
                <Label>Número de cuenta</Label>
                <Input value={form.numero_cuenta ?? ''} onChange={e => setForm({ ...form, numero_cuenta: e.target.value || null })} />
              </div>
              <div>
                <Label>Nequi</Label>
                <Input placeholder="300 000 0000" value={form.nequi ?? ''} onChange={e => setForm({ ...form, nequi: e.target.value || null })} />
              </div>
              <Button className="w-full" onClick={guardar} disabled={loading || !form.nombre}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {propietarios.length === 0 && (
          <p className="text-gray-500 text-sm">No hay propietarios aún. Agrega el primero.</p>
        )}
        {propietarios.map(p => (
          <Card key={p.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{p.nombre}</p>
                <p className="text-sm text-gray-500">
                  {p.porcentaje_real != null ? `${p.porcentaje_real}%` : 'Sin porcentaje'} ·{' '}
                  {p.banco ?? 'Sin banco'} · {p.tipo_cuenta ?? ''} {p.numero_cuenta ?? ''}
                </p>
                {p.nequi && <p className="text-sm text-gray-500">Nequi: {p.nequi}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => abrirEditar(p)}>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => eliminar(p.id)}>Eliminar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
