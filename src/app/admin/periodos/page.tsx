'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Periodo, MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const estadoColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  borrador: 'secondary',
  facturado: 'default',
  cerrado: 'outline',
}

const anioActual = new Date().getFullYear()
const mesActual = new Date().getMonth() + 1

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    mes: mesActual.toString(),
    anio: anioActual.toString(),
    telesentinel: '',
    empleada: '',
    fecha_limite_pago: '',
  })
  const supabase = createClient()

  async function cargar() {
    const { data } = await supabase
      .from('periodos')
      .select('*')
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })
    if (data) setPeriodos(data)
  }

  useEffect(() => { cargar() }, [])

  async function guardar() {
    setLoading(true)
    await supabase.from('periodos').insert({
      mes: parseInt(form.mes),
      anio: parseInt(form.anio),
      telesentinel: parseFloat(form.telesentinel) || 0,
      empleada: parseFloat(form.empleada) || 0,
      fecha_limite_pago: form.fecha_limite_pago || null,
      estado: 'borrador',
    })
    await cargar()
    setOpen(false)
    setLoading(false)
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from('periodos').update({ estado }).eq('id', id)
    await cargar()
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Periodos de facturación</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button>+ Nuevo periodo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo periodo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mes</Label>
                  <Select value={form.mes} onValueChange={v => setForm({ ...form, mes: v ?? '' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Año</Label>
                  <Input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Alarmar ($)</Label>
                <Input type="number" placeholder="89000" value={form.telesentinel} onChange={e => setForm({ ...form, telesentinel: e.target.value })} />
              </div>
              <div>
                <Label>Empleada ($)</Label>
                <Input type="number" placeholder="120000" value={form.empleada} onChange={e => setForm({ ...form, empleada: e.target.value })} />
              </div>
              <div>
                <Label>Fecha límite de pago</Label>
                <Input type="date" value={form.fecha_limite_pago} onChange={e => setForm({ ...form, fecha_limite_pago: e.target.value })} />
              </div>
              <Button className="w-full" onClick={guardar} disabled={loading}>
                {loading ? 'Guardando...' : 'Crear periodo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {periodos.length === 0 && (
          <p className="text-gray-500 text-sm">No hay periodos aún. Crea el primero.</p>
        )}
        {periodos.map(p => (
          <Card key={p.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{MESES[p.mes - 1]} {p.anio}</p>
                  <Badge variant={estadoColor[p.estado]}>{p.estado}</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Alarmar: {formatCOP(p.telesentinel)} · Empleada: {formatCOP(p.empleada)}
                  {p.fecha_limite_pago && ` · Límite: ${new Date(p.fecha_limite_pago).toLocaleDateString('es-CO')}`}
                </p>
              </div>
              <div className="flex gap-2">
                {p.estado === 'borrador' && (
                  <Button size="sm" onClick={() => cambiarEstado(p.id, 'facturado')}>
                    Marcar facturado
                  </Button>
                )}
                {p.estado === 'facturado' && (
                  <Button size="sm" variant="outline" onClick={() => cambiarEstado(p.id, 'cerrado')}>
                    Cerrar periodo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
