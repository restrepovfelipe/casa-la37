import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/admin/dashboard`)
  }

  if (token_hash && type === 'recovery') {
    await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
