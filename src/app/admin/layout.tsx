import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg">Casa La37</span>
        <div className="flex gap-6 text-sm">
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-black">Dashboard</Link>
          <Link href="/admin/propietarios" className="text-gray-600 hover:text-black">Propietarios</Link>
          <Link href="/admin/locales" className="text-gray-600 hover:text-black">Locales</Link>
          <Link href="/admin/periodos" className="text-gray-600 hover:text-black">Periodos</Link>
          <Link href="/admin/lecturas" className="text-gray-600 hover:text-black">Lecturas</Link>
          <Link href="/admin/facturas" className="text-gray-600 hover:text-black">Facturas</Link>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
