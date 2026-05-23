'use client'

import { useState } from 'react'
import { Logo } from '@/components/logo'
import { SignOutButton } from '@/components/sign-out-button'
import { NavLink } from '@/components/nav-link'

const navLinks = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 1.5C2 1.22386 2.22386 1 2.5 1H12.5C12.7761 1 13 1.22386 13 1.5V13.5C13 13.7761 12.7761 14 12.5 14H2.5C2.22386 14 2 13.7761 2 13.5V1.5ZM3 2V13H12V2H3ZM4 4.5C4 4.22386 4.22386 4 4.5 4H10.5C10.7761 4 11 4.22386 11 4.5C11 4.77614 10.7761 5 10.5 5H4.5C4.22386 5 4 4.77614 4 4.5ZM4 7.5C4 7.22386 4.22386 7 4.5 7H10.5C10.7761 7 11 7.22386 11 7.5C11 7.77614 10.7761 8 10.5 8H4.5C4.22386 8 4 7.77614 4 7.5ZM4 10.5C4 10.2239 4.22386 10 4.5 10H7.5C7.77614 10 8 10.2239 8 10.5C8 10.7761 7.77614 11 7.5 11H4.5C4.22386 11 4 10.7761 4 10.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/inquilinos',
    label: 'Inquilinos',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 2C1 1.44772 1.44772 1 2 1H8C8.55228 1 9 1.44772 9 2V4H13C13.5523 4 14 4.44772 14 5V13C14 13.5523 13.5523 14 13 14H8H2C1.44772 14 1 13.5523 1 13V2ZM8 13H13V5H9V13H8ZM7 13V2H2V13H7ZM3 4.5C3 4.22386 3.22386 4 3.5 4H5.5C5.77614 4 6 4.22386 6 4.5C6 4.77614 5.77614 5 5.5 5H3.5C3.22386 5 3 4.77614 3 4.5ZM3 6.5C3 6.22386 3.22386 6 3.5 6H5.5C5.77614 6 6 6.22386 6 6.5C6 6.77614 5.77614 7 5.5 7H3.5C3.22386 7 3 6.77614 3 6.5ZM3 8.5C3 8.22386 3.22386 8 3.5 8H5.5C5.77614 8 6 8.22386 6 8.5C6 8.77614 5.77614 9 5.5 9H3.5C3.22386 9 3 8.77614 3 8.5ZM10 7.5C10 7.22386 10.2239 7 10.5 7H11.5C11.7761 7 12 7.22386 12 7.5C12 7.77614 11.7761 8 11.5 8H10.5C10.2239 8 10 7.77614 10 7.5ZM10 9.5C10 9.22386 10.2239 9 10.5 9H11.5C11.7761 9 12 9.22386 12 9.5C12 9.77614 11.7761 10 11.5 10H10.5C10.2239 10 10 9.77614 10 9.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/propietarios',
    label: 'Propietarios',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/locales',
    label: 'Locales',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 1H13C13.5523 1 14 1.44772 14 2V13C14 13.5523 13.5523 14 13 14H2C1.44772 14 1 13.5523 1 13V2C1 1.44772 1.44772 1 2 1ZM2 2V13H7V2H2ZM8 2V13H13V2H8ZM3 4.5C3 4.22386 3.22386 4 3.5 4H5.5C5.77614 4 6 4.22386 6 4.5C6 4.77614 5.77614 5 5.5 5H3.5C3.22386 5 3 4.77614 3 4.5ZM9 4.5C9 4.22386 9.22386 4 9.5 4H11.5C11.7761 4 12 4.22386 12 4.5C12 4.77614 11.7761 5 11.5 5H9.5C9.22386 5 9 4.77614 9 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/periodos',
    label: 'Periodos',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 1C4.77614 1 5 1.22386 5 1.5V2H10V1.5C10 1.22386 10.2239 1 10.5 1C10.7761 1 11 1.22386 11 1.5V2H12.5C13.3284 2 14 2.67157 14 3.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V3.5C1 2.67157 1.67157 2 2.5 2H4V1.5C4 1.22386 4.22386 1 4.5 1ZM10 3V3.5C10 3.77614 10.2239 4 10.5 4C10.7761 4 11 3.77614 11 3.5V3H12.5C12.7761 3 13 3.22386 13 3.5V5H2V3.5C2 3.22386 2.22386 3 2.5 3H4V3.5C4 3.77614 4.22386 4 4.5 4C4.77614 4 5 3.77614 5 3.5V3H10ZM2 6V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V6H2Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/lecturas',
    label: 'Lecturas',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 0C7.77614 0 8 0.223858 8 0.5V2.5C8 2.77614 7.77614 3 7.5 3C7.22386 3 7 2.77614 7 2.5V0.5C7 0.223858 7.22386 0 7.5 0ZM7.5 4C5.567 4 4 5.567 4 7.5C4 8.889 4.786 10.094 5.95 10.707V12.5C5.95 12.776 6.174 13 6.45 13H8.55C8.826 13 9.05 12.776 9.05 12.5V10.707C10.214 10.094 11 8.889 11 7.5C11 5.567 9.433 4 7.5 4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/facturas',
    label: 'Facturas',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2.5C3 2.22386 3.22386 2 3.5 2H11.5C11.7761 2 12 2.22386 12 2.5V13.5C12 13.6818 11.9014 13.8492 11.7424 13.9373C11.5834 14.0254 11.3891 14.0203 11.235 13.924L7.5 11.5896L3.765 13.924C3.61087 14.0203 3.41659 14.0254 3.25762 13.9373C3.09864 13.8492 3 13.6818 3 13.5V2.5ZM4 3V12.5227L7.235 10.576C7.38913 10.4797 7.58341 10.4797 7.73754 10.576L11 12.5227V3H4ZM5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6H9.5C9.77614 6 10 5.77614 10 5.5C10 5.22386 9.77614 5 9.5 5H5.5ZM5 7.5C5 7.22386 5.22386 7 5.5 7H9.5C9.77614 7 10 7.22386 10 7.5C10 7.77614 9.77614 8 9.5 8H5.5C5.22386 8 5 7.77614 5 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 9.02057 12.727 9.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.12em' }}>
          Administración
        </p>
        {navLinks.map(link => (
          <div key={link.href} onClick={() => setMobileOpen(false)}>
            <NavLink href={link.href} icon={link.icon} label={link.label} />
          </div>
        ))}
      </nav>
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
        <p className="px-3 text-[10px]" style={{ color: 'oklch(0.600 0.012 72)' }}>Cra. 37 #10-37, Medellín</p>
        <SignOutButton />
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'oklch(0.970 0.010 75)' }}>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r"
        style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
          <Logo size="sm" variant="dark" />
        </div>
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col w-64 border-r transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}
      >
        <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
          <Logo size="sm" variant="dark" />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded"
            style={{ color: 'oklch(0.520 0.015 60)' }}
          >
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
          style={{ backgroundColor: '#FFFFFF', borderColor: 'oklch(0.880 0.012 72)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md"
            style={{ color: 'oklch(0.300 0.018 58)' }}
          >
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
              <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            </svg>
          </button>
          <Logo size="sm" variant="dark" />
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
