'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile?.rol === 'admin') {
      router.push('/admin/dashboard')
    } else if (profile?.rol === 'inquilino') {
      router.push('/mi-factura')
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'oklch(0.970 0.010 75)' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: 'oklch(0.185 0.020 55)' }}
      >
        <Logo size="md" variant="light" />

        <div>
          <blockquote
            className="text-2xl font-light leading-relaxed mb-6"
            style={{ color: 'oklch(0.880 0.012 72)' }}
          >
            "Gestión clara y profesional<br />para cada local."
          </blockquote>
          <p className="text-sm" style={{ color: 'oklch(0.600 0.015 60)' }}>
            Carrera 37 #10-37 · Medellín, Colombia
          </p>
        </div>

        {/* Decorative grid of squares */}
        <div className="flex gap-1.5 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-sm"
              style={{ backgroundColor: i < 7 ? '#9A7B35' : 'oklch(0.400 0.012 60)' }}
            />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Logo size="lg" variant="dark" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1
              className="text-2xl font-semibold mb-1"
              style={{ color: 'oklch(0.185 0.020 55)' }}
            >
              Bienvenido
            </h1>
            <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: 'oklch(0.300 0.018 58)' }}
              >
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: 'oklch(0.300 0.018 58)' }}
              >
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2 rounded-md"
                style={{
                  color: 'oklch(0.500 0.200 27)',
                  backgroundColor: 'oklch(0.970 0.040 27)',
                  border: '1px solid oklch(0.900 0.060 27)',
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 font-medium"
              disabled={loading}
              style={{
                backgroundColor: 'oklch(0.220 0.020 55)',
                color: 'oklch(0.970 0.010 75)',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: 'oklch(0.600 0.012 72)' }}>
            Casa La37 · Portal de administración
          </p>
        </div>
      </div>
    </div>
  )
}
