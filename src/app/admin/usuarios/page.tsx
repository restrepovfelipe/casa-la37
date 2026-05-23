'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Inquilino } from '@/types'

type UsuarioEnriquecido = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  profile: { rol: string; nombre: string | null } | null
  inquilino: { id: string; nombre: string; local_id: string | null; locales?: { numero: string; nombre: string | null } | null } | null
}

type FormNuevo = {
  email: string
  password: string
  nombre: string
  rol: 'admin' | 'inquilino'
  inquilino_id: string
}

const formVacio: FormNuevo = {
  email: '',
  password: '',
  nombre: '',
  rol: 'inquilino',
  inquilino_id: '',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioEnriquecido[]>([])
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([])
  const [loading, setLoading] = useState(true)
  const [openNuevo, setOpenNuevo] = useState(false)
  const [form, setForm] = useState<FormNuevo>(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal de reset contraseña
  const [resetModal, setResetModal] = useState<{ id: string; email: string } | null>(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [reseteando, setReseteando] = useState(false)

  const supabase = createClient()

  async function cargar() {
    setLoading(true)
    const [res, { data: inq }] = await Promise.all([
      fetch('/api/admin/users'),
      supabase.from('inquilinos').select('*, locales(*)').order('nombre'),
    ])
    if (res.ok) {
      const data = await res.json()
      setUsuarios(data.users ?? [])
    }
    if (inq) setInquilinos(inq)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function crearUsuario() {
    setGuardando(true)
    setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear usuario')
      setGuardando(false)
      return
    }
    await cargar()
    setOpenNuevo(false)
    setForm(formVacio)
    setGuardando(false)
  }

  async function resetPassword() {
    if (!resetModal) return
    setReseteando(true)
    const res = await fetch(`/api/admin/users/${resetModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: nuevaPassword }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error ?? 'Error cambiando contraseña')
      setReseteando(false)
      return
    }
    setResetModal(null)
    setNuevaPassword('')
    setReseteando(false)
    alert('Contraseña actualizada correctamente')
  }

  async function eliminarUsuario(id: string, email: string) {
    if (!confirm(`¿Eliminar el usuario ${email}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await cargar()
    } else {
      const data = await res.json()
      alert(data.error ?? 'Error eliminando usuario')
    }
  }

  // Inquilinos sin usuario asignado
  const inquilinosSinUsuario = inquilinos.filter(i => !usuarios.some(u => u.inquilino?.id === i.id))

  function formatFecha(iso: string | null) {
    if (!iso) return 'Nunca'
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>
            Usuarios
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            Cuentas de acceso al portal — admin e inquilinos
          </p>
        </div>
        <Button onClick={() => { setForm(formVacio); setError(null); setOpenNuevo(true) }}>
          + Nuevo usuario
        </Button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Cargando usuarios...</p>
      ) : (
        <div className="grid gap-3">
          {usuarios.length === 0 && (
            <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>No hay usuarios registrados.</p>
          )}
          {usuarios.map(u => {
            const esAdmin = u.profile?.rol === 'admin'
            const local = u.inquilino?.locales
            return (
              <Card key={u.id}>
                <CardContent className="pt-4 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm" style={{ color: 'oklch(0.185 0.020 55)' }}>
                        {u.profile?.nombre ?? u.email}
                      </p>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: esAdmin ? 'oklch(0.220 0.020 55)' : 'oklch(0.920 0.015 72)',
                          color: esAdmin ? '#FFF' : 'oklch(0.400 0.018 58)',
                        }}
                      >
                        {esAdmin ? 'Admin' : 'Inquilino'}
                      </Badge>
                      {u.inquilino && local && (
                        <Badge variant="outline" className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>
                          {local.numero}{local.nombre ? ` — ${local.nombre}` : ''}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>{u.email}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.600 0.012 72)' }}>
                      Último acceso: {formatFecha(u.last_sign_in_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    {/* Cambiar rol */}
                    <select
                      className="text-xs border rounded-md px-2 py-1.5 cursor-pointer"
                      style={{ borderColor: 'oklch(0.880 0.012 72)', color: 'oklch(0.300 0.018 58)', backgroundColor: '#FFF' }}
                      value={u.profile?.rol ?? 'inquilino'}
                      onChange={async (e) => {
                        await fetch(`/api/admin/users/${u.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ rol: e.target.value }),
                        })
                        await cargar()
                      }}
                    >
                      <option value="inquilino">Inquilino</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResetModal({ id: u.id, email: u.email ?? '' }); setNuevaPassword('') }}
                    >
                      Contraseña
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminarUsuario(u.id, u.email ?? '')}
                    >
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal nuevo usuario */}
      <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Rol</Label>
              <Select value={form.rol} onValueChange={v => setForm({ ...form, rol: v as 'admin' | 'inquilino' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquilino">Inquilino — solo ve su factura</SelectItem>
                  <SelectItem value="admin">Administrador — acceso total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.rol === 'inquilino' && (
              <div>
                <Label>Vincular a inquilino</Label>
                <Select value={form.inquilino_id} onValueChange={v => {
                  const inq = inquilinos.find(i => i.id === v)
                  setForm({ ...form, inquilino_id: v ?? '', nombre: inq?.nombre ?? form.nombre, email: inq?.email ?? form.email })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar inquilino" />
                  </SelectTrigger>
                  <SelectContent className="w-[340px]">
                    {inquilinosSinUsuario.map(i => {
                      const loc = i.locales as { numero: string; nombre: string | null } | undefined
                      return (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nombre}{loc ? ` — ${loc.numero}` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs mt-1" style={{ color: 'oklch(0.560 0.012 68)' }}>
                  Solo se muestran inquilinos sin cuenta asignada
                </p>
              </div>
            )}

            <div>
              <Label>Nombre para mostrar</Label>
              <Input
                placeholder="Nombre completo o empresa"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
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
            <div>
              <Label>Contraseña inicial</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs mt-1" style={{ color: 'oklch(0.560 0.012 68)' }}>
                Compártela con el inquilino y pídele que la cambie
              </p>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-md" style={{ backgroundColor: 'oklch(0.960 0.060 30)', color: 'oklch(0.400 0.160 30)' }}>
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={crearUsuario}
              disabled={guardando || !form.email || !form.password || form.password.length < 6}
            >
              {guardando ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal reset contraseña */}
      <Dialog open={!!resetModal} onOpenChange={() => setResetModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
            Usuario: <strong>{resetModal?.email}</strong>
          </p>
          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={nuevaPassword}
              onChange={e => setNuevaPassword(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={resetPassword}
            disabled={reseteando || nuevaPassword.length < 6}
          >
            {reseteando ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
