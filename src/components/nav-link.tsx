'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
      style={{
        backgroundColor: active ? 'oklch(0.920 0.030 72)' : undefined,
        color: active ? '#9A7B35' : 'oklch(0.400 0.018 58)',
        fontWeight: active ? 500 : 400,
      }}
    >
      <span style={{ opacity: active ? 1 : 0.55 }}>{icon}</span>
      {label}
    </Link>
  )
}
