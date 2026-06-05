'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Inquilino, Local } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FormInquilino = {
  local_id: string
  nombre: string
  email: string
  telefono: string
  activo: boolean
}

const vacio: FormInquilino = {
  local_id: '',
  nombre: '',
  email: '',
  telefono: '',
  activo: true,
}

export default function InquilinosPage() {
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([])
  const [locales, setLocales] = useState<Local[]>([])
  const [form, setForm] = useState<FormInquilino>(vacio)
  const [editId, setEditId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function cargar() {
    const [{ data: inq }, { data: loc }] = await Promise.all([
      supabase.from('inquilinos').select('*, locales(*)').order('created_at'),
      supabase.from('locales').select('*').eq('activo', true).order('numero'),
    ])
    if (inq) setInquilinos(inq)
    if (loc) setLocales(loc)
  }

  useEffect(() => { cargar() }, [])

  function abrirNuevo() {
    setForm(vacio)
    setEditId(null)
    setOpen(true)
  }

  function abrirEditar(i: Inquilino) {
    setForm({
      local_id: i.local_id ?? '',
      nombre: i.nombre,
      email: i.email ?? '',
      telefono: i.telefono ?? '',
      activo: i.activo,
    })
    setEditId(i.id)
    setOpen(true)
  }

  async function guardar() {
    setLoading(true)
    const payload = {
      local_id: form.local_id || null,
      nombre: form.nombre,
      email: form.email || null,
      telefono: form.telefono || null,
      activo: form.activo,
    }
    if (editId) {
      await supabase.from('inquilinos').update(payload).eq('id', editId)
    } else {
      await supabase.from('inquilinos').insert(payload)
    }
    await cargar()
    setOpen(false)
    setLoading(false)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este inquilino?')) return
    await supabase.from('inquilinos').delete().eq('id', id)
    await cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>
            Inquilinos
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            Contactos y datos de cada arrendatario
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button onClick={abrirNuevo}>+ Agregar inquilino</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? 'Editar inquilino' : 'Nuevo inquilino'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Local asignado</Label>
                <Select value={form.local_id} onValueChange={v => setForm({ ...form, local_id: v ?? '' })}>
                  <SelectTrigger>
                    {(() => {
                      const sel = locales.find(l => l.id === form.local_id)
                      const label = sel ? `${sel.numero}${sel.nombre ? ` — ${sel.nombre}` : ''}` : 'Seleccionar local'
                      return <span style={{ color: sel ? undefined : 'oklch(0.560 0.012 68)' }}>{label}</span>
                    })()}
                  </SelectTrigger>
                  <SelectContent className="w-[340px]">
                    {(() => {
                      // Agrupar locales con el mismo nombre (ej: Makeno 305+401)
                      const vistos = new Set<string>()
                      return locales.flatMap(l => {
                        if (vistos.has(l.id)) return []
                        const hermanos = l.nombre ? locales.filter(x => x.nombre === l.nombre) : [l]
                        hermanos.forEach(x => vistos.add(x.id))
                        const label = hermanos.map(x => x.numero).join(' y ') + (l.nombre ? ` — ${l.nombre}` : '')
                        // El value es el id del primero; para Makeno ambos locales quedan bajo este inquilino
                        return [
                          <SelectItem key={hermanos.map(x=>x.id).join('-')} value={l.id}>
                            {label}
                          </SelectItem>
                        ]
                      })
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nombre completo</Label>
                <Input
                  placeholder="Nombre del inquilino o empresa"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label>Teléfono / WhatsApp</Label>
                <Input
                  placeholder="300 000 0000"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={guardar} disabled={loading || !form.nombre}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {inquilinos.length === 0 && (
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            No hay inquilinos registrados aún.
          </p>
        )}
        {inquilinos.map(i => {
          const local = i.locales as Local
          return (
            <Card key={i.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>
                      {i.nombre}
                    </p>
                    {!i.activo && <Badge variant="secondary">Inactivo</Badge>}
                  </div>
                  <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
                    {local ? `${local.numero}${local.nombre ? ` — ${local.nombre}` : ''}` : 'Sin local asignado'}
                  </p>
                  <div className="flex gap-4 text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>
                    {i.telefono && (
                      <a
                        href={`https://wa.me/57${i.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                        style={{ color: '#25D366' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {i.telefono}
                      </a>
                    )}
                    {i.email && (
                      <a href={`mailto:${i.email}`} className="hover:underline">
                        {i.email}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirEditar(i)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => eliminar(i.id)}>Eliminar</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
