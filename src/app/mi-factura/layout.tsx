import { Logo } from '@/components/logo'
import { SignOutButton } from '@/components/sign-out-button'

export default function MiFacturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.970 0.010 75)' }}>
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}
      >
        <Logo size="sm" variant="dark" />
        <SignOutButton />
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
