'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Factura, Local, Periodo, MESES } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type FacturaConPeriodo = Factura & { periodos: Periodo; locales: Local }

export default function MiFacturaPage() {
  const [facturas, setFacturas] = useState<FacturaConPeriodo[]>([])
  const [local, setLocal] = useState<Local | null>(null)
  const [loading, setLoading] = useState(true)
  const [sinAcceso, setSinAcceso] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSinAcceso(true); setLoading(false); return }

      const { data: inquilino } = await supabase
        .from('inquilinos')
        .select('*, locales(*)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!inquilino || !inquilino.local_id) {
        setSinAcceso(true)
        setLoading(false)
        return
      }

      setLocal(inquilino.locales as Local)

      const { data: facts } = await supabase
        .from('facturas')
        .select('*, periodos(*), locales(*)')
        .eq('local_id', inquilino.local_id)
        .order('created_at', { ascending: false })

      if (facts) setFacturas(facts as FacturaConPeriodo[])
      setLoading(false)
    }
    cargar()
  }, [])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const hoy = new Date()

  function estaVencida(factura: FacturaConPeriodo) {
    const p = factura.periodos
    if (!p?.fecha_limite_pago) return false
    return new Date(p.fecha_limite_pago) < hoy &&
      (factura.estado_servicios === 'pendiente' || factura.estado_arriendo === 'pendiente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Cargando...</p>
      </div>
    )
  }

  if (sinAcceso) {
    return (
      <div className="text-center py-20">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'oklch(0.920 0.030 72)' }}
        >
          <svg width="24" height="24" viewBox="0 0 15 15" fill="none" style={{ color: '#9A7B35' }}>
            <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2" style={{ color: 'oklch(0.185 0.020 55)' }}>
          Sin acceso configurado
        </p>
        <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>
          Comunícate con el administrador para vincular tu cuenta a tu local.
        </p>
      </div>
    )
  }

  const pendientes = facturas.filter(f =>
    f.estado_servicios === 'pendiente' || f.estado_arriendo === 'pendiente'
  )
  const totalPendiente = pendientes.reduce((sum, f) =>
    sum +
    (f.estado_servicios === 'pendiente' ? f.total_servicios : 0) +
    (f.estado_arriendo === 'pendiente' ? f.arriendo : 0), 0)

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>
          Mi local
        </p>
        <h1 className="text-2xl font-semibold mb-0.5" style={{ color: 'oklch(0.185 0.020 55)' }}>
          {local?.numero}{local?.nombre ? ` — ${local.nombre}` : ''}
        </h1>
        <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Carrera 37 #10-37, Medellín</p>
      </div>

      {pendientes.length > 0 && (
        <div className="rounded-xl p-5 mb-8 border" style={{ backgroundColor: 'oklch(0.970 0.040 60)', borderColor: 'oklch(0.880 0.060 68)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9A7B35', letterSpacing: '0.08em' }}>
            Saldo pendiente
          </p>
          <p className="text-3xl font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>
            {formatCOP(totalPendiente)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.520 0.015 60)' }}>
            {pendientes.length} factura{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {facturas.length === 0 && (
        <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Aún no hay facturas generadas.</p>
      )}

      <div className="space-y-4">
        {facturas.map(f => {
          const p = f.periodos
          const vencida = estaVencida(f)
          const todoPagado = f.estado_servicios === 'pagado' && f.estado_arriendo === 'pagado'

          return (
            <Card key={f.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="px-5 py-3 flex items-center justify-between border-b"
                  style={{ borderColor: 'oklch(0.880 0.012 72)', backgroundColor: todoPagado ? 'oklch(0.960 0.020 145)' : 'oklch(0.985 0.006 75)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>
                      {MESES[p.mes - 1]} {p.anio}
                    </span>
                    {vencida && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
                    {todoPagado && <Badge className="text-xs" style={{ backgroundColor: '#16a34a' }}>Al día</Badge>}
                  </div>
                  {p.fecha_limite_pago && !todoPagado && (
                    <span className="text-xs" style={{ color: vencida ? 'oklch(0.540 0.180 30)' : 'oklch(0.520 0.015 60)' }}>
                      Límite: {new Date(p.fecha_limite_pago + 'T12:00:00').toLocaleDateString('es-CO')}
                    </span>
                  )}
                </div>

                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm mb-4">
                    {[
                      { label: 'Agua', val: f.agua_total },
                      { label: 'Energía', val: f.luz_total },
                      { label: 'Alarmar', val: f.alarma_total },
                      { label: 'Empleada', val: f.empleada_total },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span style={{ color: 'oklch(0.520 0.015 60)' }}>{row.label}</span>
                        <span style={{ color: 'oklch(0.300 0.018 58)' }}>{formatCOP(row.val)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-3" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
                    {/* Servicios */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>Servicios</span>
                        <span className="ml-2" style={{ color: 'oklch(0.520 0.015 60)' }}>{formatCOP(f.total_servicios)}</span>
                      </div>
                      {f.estado_servicios === 'pagado' ? (
                        <Badge style={{ backgroundColor: '#16a34a' }} className="text-xs">
                          Pagado {f.fecha_pago_servicios ? new Date(f.fecha_pago_servicios).toLocaleDateString('es-CO') : ''}
                        </Badge>
                      ) : f.link_pago_servicios ? (
                        <a
                          href={f.link_pago_servicios}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                          style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
                        >
                          <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
                            <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.25001 12.9621 2.30907C12.9861 2.36842 12.9996 2.43312 13 2.50014L13 2.50071L13 2.5C13 2.5 13 2.50041 13 2.5V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.806 2.09851 12.8536 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                          </svg>
                          Pagar servicios
                        </a>
                      ) : (
                        <Badge variant="outline" className="text-xs" style={{ color: '#b45309', borderColor: '#d97706' }}>Pendiente</Badge>
                      )}
                    </div>
                    {/* Arriendo */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>Arriendo</span>
                        <span className="ml-2" style={{ color: 'oklch(0.520 0.015 60)' }}>{formatCOP(f.arriendo)}</span>
                      </div>
                      {f.estado_arriendo === 'pagado' ? (
                        <Badge style={{ backgroundColor: '#16a34a' }} className="text-xs">
                          Pagado {f.fecha_pago_arriendo ? new Date(f.fecha_pago_arriendo).toLocaleDateString('es-CO') : ''}
                        </Badge>
                      ) : f.link_pago_arriendo ? (
                        <a
                          href={f.link_pago_arriendo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                          style={{ backgroundColor: '#1d4ed8', color: '#fff' }}
                        >
                          <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
                            <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.25001 12.9621 2.30907C12.9861 2.36842 12.9996 2.43312 13 2.50014L13 2.50071L13 2.5C13 2.5 13 2.50041 13 2.5V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.806 2.09851 12.8536 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                          </svg>
                          Pagar arriendo
                        </a>
                      ) : (
                        <Badge variant="outline" className="text-xs" style={{ color: '#b45309', borderColor: '#d97706' }}>Pendiente</Badge>
                      )}
                    </div>
                    <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
                      <span className="font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>Total del mes</span>
                      <span className="font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{formatCOP(f.total)}</span>
                    </div>
                  </div>

                  {f.observaciones && (
                    <p className="mt-3 text-xs px-3 py-2 rounded-md" style={{ backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.400 0.018 58)' }}>
                      Nota: {f.observaciones}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
