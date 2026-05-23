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

// GET /api/admin/users — listar todos los usuarios
export async function GET() {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profiles } = await supabaseAdmin.from('profiles').select('*')
  const { data: inquilinos } = await supabaseAdmin
    .from('inquilinos')
    .select('id, nombre, local_id, user_id, locales(numero, nombre)')

  const enriched = users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    profile: profiles?.find(p => p.id === u.id) ?? null,
    inquilino: inquilinos?.find(i => i.user_id === u.id) ?? null,
  }))

  return NextResponse.json({ users: enriched })
}

// POST /api/admin/users — crear usuario nuevo
export async function POST(request: NextRequest) {
  const admin = await verificarAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { email, password, nombre, rol, inquilino_id } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
  }

  // Crear usuario en auth
  const { data: { user: newUser }, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !newUser) {
    return NextResponse.json({ error: error?.message ?? 'Error creando usuario' }, { status: 500 })
  }

  // Crear o actualizar perfil (upsert por si el usuario ya existía)
  await supabaseAdmin.from('profiles').upsert({
    id: newUser.id,
    rol: rol ?? 'inquilino',
    nombre: nombre ?? email,
  }, { onConflict: 'id' })

  // Vincular al inquilino si se indicó
  if (inquilino_id) {
    await supabaseAdmin
      .from('inquilinos')
      .update({ user_id: newUser.id })
      .eq('id', inquilino_id)
  }

  return NextResponse.json({ user: { id: newUser.id, email: newUser.email } })
}
