import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()
  return profile?.rol === 'admin' ? user : null
}

// PATCH /api/admin/users/[id] — cambiar contraseña
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Cambiar contraseña
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: body.password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Cambiar rol
  if (body.rol) {
    await supabaseAdmin.from('profiles').upsert(
      { id, rol: body.rol },
      { onConflict: 'id' }
    )
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/users/[id] — eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  // Desvincular inquilino
  await supabaseAdmin.from('inquilinos').update({ user_id: null }).eq('user_id', id)
  // Eliminar perfil
  await supabaseAdmin.from('profiles').delete().eq('id', id)
  // Eliminar usuario de auth
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
