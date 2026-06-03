'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Propietario } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type FormProp = {
  nombre: string
  porcentaje_real: number | null
  banco: string | null
  tipo_cuenta: string | null
  numero_cuenta: string | null
  nequi: string | null
  es_administrador: boolean
}

const vacio: FormProp = {
  nombre: '',
  porcentaje_real: null,
  banco: null,
  tipo_cuenta: null,
  numero_cuenta: null,
  nequi: null,
  es_administrador: false,
}

export default function PropietariosPage() {
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [form, setForm] = useState<FormProp>(vacio)
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
      es_administrador: p.es_administrador ?? false,
    })
    setEditId(p.id)
    setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    const payload = {
      nombre: form.nombre,
      porcentaje_real: form.porcentaje_real,
      banco: form.banco || null,
      tipo_cuenta: form.tipo_cuenta || null,
      numero_cuenta: form.numero_cuenta || null,
      nequi: form.nequi || null,
      es_administrador: form.es_administrador,
    }
    if (editId) {
      await supabase.from('propietarios').update(payload).eq('id', editId)
    } else {
      await supabase.from('propietarios').insert(payload)
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
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Propietarios</h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Socios y porcentajes de participación</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
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
                <Input
                  type="number"
                  step="0.01"
                  placeholder="22.22"
                  value={form.porcentaje_real ?? ''}
                  onChange={e => setForm({ ...form, porcentaje_real: parseFloat(e.target.value) || null })}
                />
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

              {/* Administrador toggle */}
              <div
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer select-none"
                style={{
                  borderColor: form.es_administrador ? 'oklch(0.860 0.060 80)' : 'oklch(0.880 0.012 72)',
                  backgroundColor: form.es_administrador ? 'oklch(0.975 0.025 80)' : 'transparent',
                }}
                onClick={() => setForm(f => ({ ...f, es_administrador: !f.es_administrador }))}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border text-xs font-bold"
                  style={{
                    backgroundColor: form.es_administrador ? 'oklch(0.700 0.100 75)' : 'transparent',
                    borderColor: form.es_administrador ? 'oklch(0.700 0.100 75)' : 'oklch(0.700 0.015 72)',
                    color: '#fff',
                  }}
                >
                  {form.es_administrador ? '✓' : ''}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>Administradora del edificio</p>
                  <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>
                    Recibe el 10% de honorarios de administración antes del reparto, además de su % de propiedad.
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={guardar} disabled={loading || !form.nombre}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {propietarios.length === 0 && (
          <p className="text-sm" style={{ color: 'oklch(0.560 0.012 68)' }}>No hay propietarios aún.</p>
        )}
        {propietarios.map(p => (
          <Card key={p.id} style={{ borderColor: p.es_administrador ? 'oklch(0.860 0.060 80)' : undefined }}>
            <CardContent className="pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{p.nombre}</p>
                  {p.es_administrador && (
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: 'oklch(0.975 0.025 80)', color: 'oklch(0.450 0.100 65)' }}
                    >
                      Administradora
                    </span>
                  )}
                  {p.porcentaje_real != null && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.520 0.015 60)' }}
                    >
                      {p.porcentaje_real}%
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
                  {[p.banco, p.tipo_cuenta, p.numero_cuenta].filter(Boolean).join(' · ') || 'Sin datos bancarios'}
                </p>
                {p.nequi && <p className="text-xs" style={{ color: '#25D366' }}>Nequi: {p.nequi}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
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
