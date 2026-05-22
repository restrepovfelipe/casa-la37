'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Factura, Local, Periodo, Propietario, MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function imprimir(factura: Factura & { locales: Local; periodos: Periodo }, formatCOP: (n: number) => string) {
  const local = factura.locales
  const periodo = factura.periodos
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura ${local?.numero} — ${MESES[periodo.mes - 1]} ${periodo.anio}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Georgia', serif; color: #1C1409; padding: 48px; font-size: 13px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #9A7B35; }
    .brand { font-size:22px; font-weight:700; }
    .brand span { color: #9A7B35; }
    .brand sub { font-size:11px; font-weight:400; color:#78614A; display:block; letter-spacing:0.1em; text-transform:uppercase; }
    .meta { text-align:right; }
    .meta h2 { font-size:16px; margin-bottom:4px; }
    .meta p { color:#78614A; font-size:12px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }
    .info-box { background:#F8F4EF; border-radius:6px; padding:14px; }
    .info-box h3 { font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:#9A7B35; margin-bottom:6px; }
    .info-box p { font-size:13px; font-weight:600; }
    .info-box small { font-size:11px; color:#78614A; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#78614A; padding:8px 0; border-bottom:1px solid #E8E0D6; }
    td { padding:10px 0; border-bottom:1px solid #F0EBE3; font-size:13px; }
    td.amount { text-align:right; font-variant-numeric:tabular-nums; }
    .total-row td { font-weight:700; border-top:2px solid #9A7B35; border-bottom:none; font-size:14px; padding-top:12px; }
    .footer { margin-top:40px; padding-top:16px; border-top:1px solid #E8E0D6; font-size:11px; color:#78614A; text-align:center; }
    .status { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
    .pagado { background:#dcfce7; color:#15803d; }
    .pendiente { background:#fef9c3; color:#a16207; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      Casa <span>La37</span>
      <sub>Cra. 37 #10-37, Medellín</sub>
    </div>
    <div class="meta">
      <h2>Factura de cobro</h2>
      <p>${MESES[periodo.mes - 1]} ${periodo.anio}</p>
      ${periodo.fecha_limite_pago ? `<p>Fecha límite: ${new Date(periodo.fecha_limite_pago + 'T12:00:00').toLocaleDateString('es-CO')}</p>` : ''}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Local</h3>
      <p>${local?.numero}</p>
      <small>${local?.nombre ?? ''}</small>
    </div>
    <div class="info-box">
      <h3>Arriendo mensual</h3>
      <p>${formatCOP(factura.arriendo)}</p>
      <small>Vigente este periodo</small>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th class="amount" style="text-align:right">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Agua (consumo)</td><td class="amount">${formatCOP(factura.agua_total)}</td></tr>
      <tr><td>Energía eléctrica</td><td class="amount">${formatCOP(factura.luz_total)}</td></tr>
      <tr><td>Alarmar (cuota proporcional)</td><td class="amount">${formatCOP(factura.alarma_total)}</td></tr>
      <tr><td>Empleada (cuota proporcional)</td><td class="amount">${formatCOP(factura.empleada_total)}</td></tr>
      <tr><td style="font-weight:600">Subtotal servicios</td><td class="amount" style="font-weight:600">${formatCOP(factura.total_servicios)}</td></tr>
      <tr><td>Arriendo</td><td class="amount">${formatCOP(factura.arriendo)}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row"><td>TOTAL DEL MES</td><td class="amount">${formatCOP(factura.total)}</td></tr>
    </tfoot>
  </table>

  <div style="display:flex; gap:16px; margin-bottom:28px;">
    <div>Estado servicios: <span class="status ${factura.estado_servicios}">${factura.estado_servicios}</span></div>
    <div>Estado arriendo: <span class="status ${factura.estado_arriendo}">${factura.estado_arriendo}</span></div>
  </div>

  ${factura.observaciones ? `<p style="background:#F8F4EF; padding:12px; border-radius:6px; font-size:12px; margin-bottom:20px;"><strong>Observaciones:</strong> ${factura.observaciones}</p>` : ''}

  <div class="footer">
    Casa La37 · Carrera 37 #10-37, Medellín · Factura generada el ${new Date().toLocaleDateString('es-CO')}
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

export default function FacturasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [facturas, setFacturas] = useState<(Factura & { locales: Local })[]>([])
  const [locales, setLocales] = useState<Local[]>([])
  const [generando, setGenerando] = useState(false)
  const [notasModal, setNotasModal] = useState<{ facturaId: string; texto: string } | null>(null)
  const supabase = createClient()

  const hoy = new Date()

  async function cargar() {
    const [{ data: per }, { data: loc }] = await Promise.all([
      supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('locales').select('*, propietarios(*)').eq('activo', true).order('numero'),
    ])
    if (per) setPeriodos(per)
    if (loc) setLocales(loc)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    if (!periodoId) return
    const p = periodos.find(p => p.id === periodoId)
    setPeriodo(p ?? null)
    cargarFacturas()
  }, [periodoId])

  async function cargarFacturas() {
    const { data } = await supabase
      .from('facturas')
      .select('*, locales(*, propietarios(*))')
      .eq('periodo_id', periodoId)
      .order('locales(numero)')
    if (data) setFacturas(data as (Factura & { locales: Local })[])
  }

  async function generarFacturas() {
    setGenerando(true)
    const { data: lects } = await supabase.from('lecturas').select('*').eq('periodo_id', periodoId)
    const numLocales = locales.length
    const alarmaXLocal = (periodo?.telesentinel ?? 0) / numLocales
    const empleadaXLocal = (periodo?.empleada ?? 0) / numLocales

    for (const local of locales) {
      const lectura = lects?.find(l => l.local_id === local.id)
      const agua = lectura?.agua_total ?? 0
      const luz = lectura?.luz_total ?? 0
      const totalServicios = agua + luz + alarmaXLocal + empleadaXLocal

      await supabase.from('facturas').upsert({
        local_id: local.id,
        periodo_id: periodoId,
        arriendo: local.arriendo_actual,
        agua_total: agua,
        luz_total: luz,
        alarma_total: alarmaXLocal,
        empleada_total: empleadaXLocal,
        total_servicios: totalServicios,
        total: local.arriendo_actual + totalServicios,
        estado_servicios: 'pendiente',
        estado_arriendo: 'pendiente',
      }, { onConflict: 'local_id,periodo_id' })
    }
    await cargarFacturas()
    setGenerando(false)
  }

  async function marcarPagado(facturaId: string, tipo: 'servicios' | 'arriendo') {
    const campo = tipo === 'servicios' ? 'estado_servicios' : 'estado_arriendo'
    const campofecha = tipo === 'servicios' ? 'fecha_pago_servicios' : 'fecha_pago_arriendo'
    await supabase.from('facturas').update({
      [campo]: 'pagado',
      [campofecha]: new Date().toISOString(),
    }).eq('id', facturaId)
    await cargarFacturas()
  }

  async function guardarNota(facturaId: string, texto: string) {
    await supabase.from('facturas').update({ observaciones: texto }).eq('id', facturaId)
    await cargarFacturas()
    setNotasModal(null)
  }

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const estaVencida = (f: Factura) => {
    if (!periodo?.fecha_limite_pago) return false
    return new Date(periodo.fecha_limite_pago) < hoy &&
      (f.estado_servicios === 'pendiente' || f.estado_arriendo === 'pendiente')
  }

  const totalServicios = facturas.reduce((s, f) => s + f.total_servicios, 0)
  const totalArriendos = facturas.reduce((s, f) => s + f.arriendo, 0)
  const serviciosPendientes = facturas.filter(f => f.estado_servicios === 'pendiente').length
  const arriendosPendientes = facturas.filter(f => f.estado_arriendo === 'pendiente').length

  const porPropietario: Record<string, { nombre: string; total: number; banco: string; nequi: string | null }> = {}
  facturas.forEach(f => {
    const prop = (f.locales as Local)?.propietarios as Propietario
    if (!prop) return
    if (!porPropietario[prop.id]) {
      porPropietario[prop.id] = {
        nombre: prop.nombre,
        total: 0,
        banco: `${prop.banco ?? ''} · ${prop.tipo_cuenta ?? ''} ${prop.numero_cuenta ?? ''}`.trim().replace(/^·\s*/, ''),
        nequi: prop.nequi,
      }
    }
    porPropietario[prop.id].total += f.arriendo
  })

  const vencidasCount = facturas.filter(f => estaVencida(f)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Facturas</h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Gestión de cobros por periodo</p>
        </div>
      </div>

      <div className="mb-6 max-w-xs">
        <Label>Seleccionar periodo</Label>
        <Select value={periodoId} onValueChange={(v) => setPeriodoId(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Seleccionar periodo..." /></SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.id} value={p.id}>{MESES[p.mes - 1]} {p.anio}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {periodoId && (
        <>
          {/* Alerta de vencimiento */}
          {periodo?.fecha_limite_pago && vencidasCount > 0 && (
            <div className="mb-5 rounded-lg px-4 py-3 flex items-center gap-2 text-sm" style={{ backgroundColor: 'oklch(0.960 0.060 30)', borderLeft: '4px solid oklch(0.540 0.180 30)', color: 'oklch(0.400 0.160 30)' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.4449 0.608765C8.0183 -0.107015 6.9817 -0.107015 6.5551 0.608765L0.161178 11.3368C-0.275824 12.07 0.252503 13 1.10608 13H13.8939C14.7475 13 15.2758 12.07 14.8388 11.3368L8.4449 0.608765ZM7.4141 1.12073C7.45288 1.05566 7.54712 1.05566 7.5859 1.12073L13.9798 11.8488C14.0196 11.9154 13.9715 12 13.8939 12H1.10608C1.02849 12 0.980454 11.9154 1.02018 11.8488L7.4141 1.12073ZM6.8269 4.48611C6.81221 4.10423 7.11783 3.78663 7.5 3.78663C7.88217 3.78663 8.18779 4.10423 8.1731 4.48611L8.01921 8.48701C8.00848 8.766 7.7792 8.98663 7.5 8.98663C7.2208 8.98663 6.99152 8.766 6.98079 8.48701L6.8269 4.48611ZM8.24989 10.476C8.24989 10.8902 7.9141 11.226 7.49989 11.226C7.08568 11.226 6.74989 10.8902 6.74989 10.476C6.74989 10.0618 7.08568 9.72599 7.49989 9.72599C7.9141 9.72599 8.24989 10.0618 8.24989 10.476Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
              <span><strong>{vencidasCount}</strong> factura{vencidasCount !== 1 ? 's' : ''} vencida{vencidasCount !== 1 ? 's' : ''} — la fecha límite ya pasó</span>
            </div>
          )}

          {/* Botones acción */}
          {facturas.length === 0 ? (
            <div className="mb-6">
              <p className="text-sm mb-3" style={{ color: 'oklch(0.520 0.015 60)' }}>No hay facturas para este periodo.</p>
              <Button onClick={generarFacturas} disabled={generando}>
                {generando ? 'Generando...' : 'Generar facturas'}
              </Button>
            </div>
          ) : (
            <div className="mb-5">
              <Button variant="outline" size="sm" onClick={generarFacturas} disabled={generando}>
                {generando ? 'Actualizando...' : 'Recalcular facturas'}
              </Button>
            </div>
          )}

          {/* Tarjetas de resumen */}
          {facturas.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total servicios', value: formatCOP(totalServicios), sub: `${serviciosPendientes} pendientes`, warn: serviciosPendientes > 0 },
                { label: 'Total arriendos', value: formatCOP(totalArriendos), sub: `${arriendosPendientes} pendientes`, warn: arriendosPendientes > 0 },
                { label: 'Pagar EPM + Agua', value: formatCOP(facturas.reduce((s, f) => s + f.agua_total + f.luz_total, 0)), sub: 'Servicios públicos', warn: false },
                { label: 'Alarmar + Empleada', value: formatCOP((periodo?.telesentinel ?? 0) + (periodo?.empleada ?? 0)), sub: 'Gastos comunes', warn: false },
              ].map(card => (
                <div key={card.label} className="rounded-xl p-4 border" style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}>
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>{card.label}</p>
                  <p className="text-lg font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{card.value}</p>
                  {card.sub && <p className="text-xs mt-1" style={{ color: card.warn ? 'oklch(0.600 0.140 50)' : 'oklch(0.560 0.012 68)' }}>{card.sub}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Facturas por local */}
          <div className="grid gap-4 mb-10">
            {facturas.map(f => {
              const local = f.locales as Local
              const prop = local?.propietarios as Propietario
              const vencida = estaVencida(f)

              return (
                <Card key={f.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header local */}
                    <div
                      className="px-5 py-3 flex items-center justify-between border-b"
                      style={{
                        borderColor: 'oklch(0.880 0.012 72)',
                        backgroundColor: vencida ? 'oklch(0.975 0.030 30)' : 'oklch(0.985 0.006 75)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: 'oklch(0.185 0.020 55)' }}>
                          {local?.numero}{local?.nombre ? ` — ${local.nombre}` : ''}
                        </span>
                        {vencida && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>
                          {prop?.nombre ?? 'Sin propietario'}
                        </span>
                        <button
                          onClick={() => imprimir(f as Factura & { locales: Local; periodos: Periodo }, formatCOP)}
                          className="text-xs px-2 py-1 rounded border transition-colors"
                          style={{ borderColor: 'oklch(0.880 0.012 72)', color: 'oklch(0.520 0.015 60)' }}
                          title="Imprimir factura"
                        >
                          Imprimir
                        </button>
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      {/* Desglose */}
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-sm mb-4">
                        {[
                          { l: 'Agua', v: f.agua_total },
                          { l: 'Energía', v: f.luz_total },
                          { l: 'Alarmar', v: f.alarma_total },
                          { l: 'Empleada', v: f.empleada_total },
                          { l: 'Subtotal servicios', v: f.total_servicios, bold: true },
                          { l: 'Arriendo', v: f.arriendo },
                        ].map(row => (
                          <div key={row.l} className="flex justify-between col-span-1">
                            <span style={{ color: 'oklch(0.520 0.015 60)', fontWeight: row.bold ? 600 : 400 }}>{row.l}</span>
                            <span style={{ color: 'oklch(0.300 0.018 58)', fontWeight: row.bold ? 600 : 400 }}>{formatCOP(row.v)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Estado de pago */}
                      <div
                        className="border-t pt-3 grid grid-cols-2 gap-3"
                        style={{ borderColor: 'oklch(0.880 0.012 72)' }}
                      >
                        {/* Servicios */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>
                            Servicios <span style={{ color: 'oklch(0.520 0.015 60)', fontWeight: 400 }}>{formatCOP(f.total_servicios)}</span>
                          </span>
                          {f.estado_servicios === 'pagado' ? (
                            <div className="text-right">
                              <Badge style={{ backgroundColor: '#16a34a' }} className="text-xs">Pagado</Badge>
                              {f.fecha_pago_servicios && (
                                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.560 0.012 68)' }}>
                                  {new Date(f.fecha_pago_servicios).toLocaleDateString('es-CO')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => marcarPagado(f.id, 'servicios')}>
                              Marcar pagado
                            </Button>
                          )}
                        </div>

                        {/* Arriendo */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>
                            Arriendo <span style={{ color: 'oklch(0.520 0.015 60)', fontWeight: 400 }}>{formatCOP(f.arriendo)}</span>
                          </span>
                          {f.estado_arriendo === 'pagado' ? (
                            <div className="text-right">
                              <Badge style={{ backgroundColor: '#16a34a' }} className="text-xs">Pagado</Badge>
                              {f.fecha_pago_arriendo && (
                                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.560 0.012 68)' }}>
                                  {new Date(f.fecha_pago_arriendo).toLocaleDateString('es-CO')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => marcarPagado(f.id, 'arriendo')}>
                              Marcar pagado
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Total + notas */}
                      <div
                        className="flex items-center justify-between mt-3 pt-3 border-t"
                        style={{ borderColor: 'oklch(0.880 0.012 72)' }}
                      >
                        <div>
                          <span className="font-semibold text-sm" style={{ color: 'oklch(0.185 0.020 55)' }}>
                            Total: {formatCOP(f.total)}
                          </span>
                          {f.observaciones && (
                            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.520 0.015 60)' }}>
                              📝 {f.observaciones}
                            </p>
                          )}
                        </div>
                        <button
                          className="text-xs underline"
                          style={{ color: 'oklch(0.520 0.015 60)' }}
                          onClick={() => setNotasModal({ facturaId: f.id, texto: f.observaciones ?? '' })}
                        >
                          {f.observaciones ? 'Editar nota' : '+ Agregar nota'}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Desembolsos a propietarios */}
          {Object.keys(porPropietario).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>
                Transferir arriendos a propietarios
              </h2>
              <div className="grid gap-3">
                {Object.values(porPropietario).map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl border px-5 py-4 flex items-center justify-between"
                    style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>{p.nombre}</p>
                      {p.banco && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.520 0.015 60)' }}>{p.banco}</p>}
                      {p.nequi && <p className="text-xs" style={{ color: '#25D366' }}>Nequi: {p.nequi}</p>}
                    </div>
                    <p className="text-xl font-semibold" style={{ color: '#9A7B35' }}>{formatCOP(p.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de notas */}
      <Dialog open={!!notasModal} onOpenChange={() => setNotasModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nota / observación</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded-md p-3 text-sm resize-none"
            style={{ borderColor: 'oklch(0.880 0.012 72)', minHeight: '100px' }}
            placeholder="Ej: Descuento acordado, cobro adicional, acuerdo de pago..."
            value={notasModal?.texto ?? ''}
            onChange={e => setNotasModal(prev => prev ? { ...prev, texto: e.target.value } : null)}
          />
          <Button
            className="w-full"
            onClick={() => notasModal && guardarNota(notasModal.facturaId, notasModal.texto)}
          >
            Guardar nota
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
