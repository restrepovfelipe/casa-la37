'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors"
      style={{ color: 'oklch(0.520 0.015 60)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'oklch(0.945 0.012 72)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.185 0.020 55)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''
        ;(e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.520 0.015 60)'
      }}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 1C2.44772 1 2 1.44772 2 2V13C2 13.5523 2.44772 14 3 14H7.5C7.77614 14 8 13.7761 8 13.5C8 13.2239 7.77614 13 7.5 13H3V2H7.5C7.77614 2 8 1.77614 8 1.5C8 1.22386 7.77614 1 7.5 1H3ZM11.8536 4.64645C11.6583 4.45118 11.3417 4.45118 11.1464 4.64645C10.9512 4.84171 10.9512 5.15829 11.1464 5.35355L12.7929 7H6.5C6.22386 7 6 7.22386 6 7.5C6 7.77614 6.22386 8 6.5 8H12.7929L11.1464 9.64645C10.9512 9.84171 10.9512 10.1583 11.1464 10.3536C11.3417 10.5488 11.6583 10.5488 11.8536 10.3536L14.3536 7.85355C14.5488 7.65829 14.5488 7.34171 14.3536 7.14645L11.8536 4.64645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
      Cerrar sesión
    </button>
  )
}
