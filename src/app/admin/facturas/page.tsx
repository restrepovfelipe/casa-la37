'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Factura, Local, Periodo, Propietario, MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function whatsAppArriendo(factura: Factura & { locales: Local; periodos: Periodo }, formatCOP: (n: number) => string, telefono?: string | null) {
  const local = factura.locales
  const periodo = factura.periodos

  const texto = `🏢 *Casa La37 — ${local?.numero}${local?.nombre ? ` ${local.nombre}` : ''}*
📅 *${MESES[periodo.mes - 1]} ${periodo.anio}*

🏠 *Arriendo del mes: ${formatCOP(factura.arriendo)}*

Por favor realizar el pago a más tardar el día 1 del mes.

_Carrera 37 #10-37, Medellín_`

  const tel = telefono ? `57${telefono.replace(/\D/g, '')}` : ''
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, '_blank')
}

function whatsAppServicios(factura: Factura & { locales: Local; periodos: Periodo }, formatCOP: (n: number) => string, telefono?: string | null) {
  const local = factura.locales
  const periodo = factura.periodos
  const limite = periodo?.fecha_limite_pago
    ? `\n📆 Fecha límite: ${new Date(periodo.fecha_limite_pago + 'T12:00:00').toLocaleDateString('es-CO')}`
    : ''

  const texto = `🏢 *Casa La37 — ${local?.numero}${local?.nombre ? ` ${local.nombre}` : ''}*
📅 *Servicios ${MESES[periodo.mes - 1]} ${periodo.anio}*

💧 Agua: ${formatCOP(factura.agua_total)}
⚡ Energía: ${formatCOP(factura.luz_total)}
🔒 Alarmar: ${formatCOP(factura.alarma_total)}
🧹 Empleada: ${formatCOP(factura.empleada_total)}
━━━━━━━━━━━━━━━━
📋 *Total servicios: ${formatCOP(factura.total_servicios)}*${limite}

_Carrera 37 #10-37, Medellín_`

  const tel = telefono ? `57${telefono.replace(/\D/g, '')}` : ''
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, '_blank')
}

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
  // Usar iframe en lugar de popup para evitar bloqueo de popups
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html.replace('<script>window.onload = () => { window.print(); }</script>', ''))
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => { try { document.body.removeChild(iframe) } catch (_) {} }, 3000)
  }, 400)
}

export default function FacturasPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [facturas, setFacturas] = useState<(Factura & { locales: Local })[]>([])
  const [locales, setLocales] = useState<Local[]>([])
  const [inquilinos, setInquilinos] = useState<{ local_id: string | null; telefono: string | null }[]>([])
  const [generando, setGenerando] = useState(false)
  const [notasModal, setNotasModal] = useState<{ facturaId: string; texto: string } | null>(null)
  const [linksModal, setLinksModal] = useState<{
    facturaId: string
    link_servicios: string
    link_arriendo: string
  } | null>(null)
  const supabase = createClient()

  const hoy = new Date()

  async function cargar() {
    const [{ data: per }, { data: loc }, { data: inq }] = await Promise.all([
      supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('locales').select('*, propietarios(*)').eq('activo', true).order('numero'),
      supabase.from('inquilinos').select('local_id, telefono').eq('activo', true),
    ])
    if (per) setPeriodos(per)
    if (loc) setLocales(loc)
    if (inq) setInquilinos(inq)
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

  // Determina si un local paga Alarmar (solo pisos 3xx y 4xx)
  function localPagaAlarmar(numero: string): boolean {
    const nums = numero.match(/\d+/g) ?? []
    return nums.some(n => { const v = parseInt(n); return v >= 300 && v < 500 })
  }

  async function generarFacturas() {
    setGenerando(true)
    const [{ data: lects }, { data: existentes }] = await Promise.all([
      supabase.from('lecturas').select('*').eq('periodo_id', periodoId),
      supabase.from('facturas')
        .select('local_id, estado_servicios, estado_arriendo, fecha_pago_servicios, fecha_pago_arriendo')
        .eq('periodo_id', periodoId),
    ])
    const localesConAlarma = locales.filter(l => localPagaAlarmar(l.numero))
    const alarmaXLocal = localesConAlarma.length > 0
      ? (periodo?.telesentinel ?? 0) / localesConAlarma.length
      : 0
    const empleadaXLocal = locales.length > 0
      ? (periodo?.empleada ?? 0) / locales.length
      : 0

    for (const local of locales) {
      const lectura = lects?.find(l => l.local_id === local.id)
      const agua = lectura?.agua_total ?? 0
      const luz = lectura?.luz_total ?? 0
      const alarma = localPagaAlarmar(local.numero) ? alarmaXLocal : 0
      const totalServicios = agua + luz + alarma + empleadaXLocal
      const retencion = Math.round(local.arriendo_actual * (local.retencion_pct ?? 0) / 100)
      // Preservar el estado de pago existente al recalcular
      const existente = existentes?.find(e => e.local_id === local.id)

      await supabase.from('facturas').upsert({
        local_id: local.id,
        periodo_id: periodoId,
        arriendo: local.arriendo_actual,
        agua_total: agua,
        luz_total: luz,
        alarma_total: alarma,
        empleada_total: empleadaXLocal,
        total_servicios: totalServicios,
        retencion_total: retencion,
        total: local.arriendo_actual + totalServicios,
        estado_servicios: existente?.estado_servicios ?? 'pendiente',
        estado_arriendo: existente?.estado_arriendo ?? 'pendiente',
        fecha_pago_servicios: existente?.fecha_pago_servicios ?? null,
        fecha_pago_arriendo: existente?.fecha_pago_arriendo ?? null,
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

  async function guardarLinks(facturaId: string, link_servicios: string, link_arriendo: string) {
    await supabase.from('facturas').update({
      link_pago_servicios: link_servicios || null,
      link_pago_arriendo: link_arriendo || null,
    }).eq('id', facturaId)
    await cargarFacturas()
    setLinksModal(null)
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

  // Distribution model: use porcentaje_real if set, else fall back to per-local arriendo
  const [propietariosAll, setPropietariosAll] = useState<Propietario[]>([])
  useEffect(() => {
    supabase.from('propietarios').select('*').order('nombre').then(({ data }) => { if (data) setPropietariosAll(data) })
  }, [])

  const totalArriendosDistrib = facturas.reduce((s, f) => s + f.arriendo, 0)
  const totalRetencion = facturas.reduce((s, f) => s + (f.retencion_total ?? 0), 0)
  const usarModeloDistrib = propietariosAll.some(p => (p.porcentaje_real ?? 0) > 0)

  const porPropietario: Record<string, { nombre: string; total: number; banco: string; nequi: string | null; porcentaje: number }> = {}

  if (usarModeloDistrib && facturas.length > 0) {
    // Model: net = arriendos - retenciones, distributed by porcentaje_real
    const neto = totalArriendosDistrib - totalRetencion
    propietariosAll.forEach(prop => {
      if ((prop.porcentaje_real ?? 0) <= 0) return
      porPropietario[prop.id] = {
        nombre: prop.nombre,
        total: Math.round(neto * (prop.porcentaje_real ?? 0) / 100),
        banco: `${prop.banco ?? ''} · ${prop.tipo_cuenta ?? ''} ${prop.numero_cuenta ?? ''}`.trim().replace(/^·\s*/, ''),
        nequi: prop.nequi,
        porcentaje: prop.porcentaje_real ?? 0,
      }
    })
  } else {
    // Fallback: sum arriendos per propietario
    facturas.forEach(f => {
      const prop = (f.locales as Local)?.propietarios as Propietario
      if (!prop) return
      if (!porPropietario[prop.id]) {
        porPropietario[prop.id] = {
          nombre: prop.nombre,
          total: 0,
          banco: `${prop.banco ?? ''} · ${prop.tipo_cuenta ?? ''} ${prop.numero_cuenta ?? ''}`.trim().replace(/^·\s*/, ''),
          nequi: prop.nequi,
          porcentaje: 0,
        }
      }
      porPropietario[prop.id].total += f.arriendo
    })
  }

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
          <SelectTrigger>
            <span style={{ color: periodoId && periodo ? undefined : 'oklch(0.560 0.012 68)' }}>
              {periodo ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : 'Seleccionar periodo...'}
            </span>
          </SelectTrigger>
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
              const telefono = inquilinos.find(i => i.local_id === local?.id)?.telefono

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
                        {/* WhatsApp Arriendo */}
                        <button
                          onClick={() => whatsAppArriendo(f as Factura & { locales: Local; periodos: Periodo }, formatCOP, telefono)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors"
                          style={{ borderColor: '#25D366', color: '#25D366' }}
                          title="Enviar arriendo por WhatsApp (día 1)"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Arriendo
                        </button>
                        {/* WhatsApp Servicios */}
                        <button
                          onClick={() => whatsAppServicios(f as Factura & { locales: Local; periodos: Periodo }, formatCOP, telefono)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors"
                          style={{ borderColor: '#25D366', color: '#25D366' }}
                          title="Enviar servicios por WhatsApp (después del 15)"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Servicios
                        </button>
                        {/* Links de pago */}
                        <button
                          onClick={() => setLinksModal({
                            facturaId: f.id,
                            link_servicios: f.link_pago_servicios ?? '',
                            link_arriendo: f.link_pago_arriendo ?? '',
                          })}
                          className="text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1"
                          style={{
                            borderColor: (f.link_pago_servicios || f.link_pago_arriendo) ? '#2563eb' : 'oklch(0.880 0.012 72)',
                            color: (f.link_pago_servicios || f.link_pago_arriendo) ? '#2563eb' : 'oklch(0.520 0.015 60)',
                          }}
                          title="Links de pago para el inquilino"
                        >
                          <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
                            <path d="M8.51194 3.00541C9.18829 2.54594 10.0435 2.53694 10.6788 2.95419C10.8231 3.04893 10.9771 3.1993 11.389 3.61119C11.8009 4.02307 11.9513 4.17714 12.046 4.32141C12.4633 4.95675 12.4543 5.81192 11.9948 6.48827C11.8899 6.64264 11.7276 6.80834 11.3006 7.23548L10.6819 7.85414C10.4867 8.04936 10.4867 8.36595 10.6819 8.56117C10.8772 8.7564 11.1938 8.7564 11.389 8.56117L12.0077 7.94251C12.4358 7.51452 12.6394 7.31017 12.7998 7.0768C13.4922 6.06168 13.5087 4.76259 12.8422 3.7302C12.6849 3.49166 12.4748 3.28165 12.0961 2.90295C11.7174 2.52426 11.5074 2.31425 11.2688 2.15692C10.2364 1.49036 8.93734 1.50687 7.92222 2.19922C7.68885 2.35963 7.48445 2.56322 7.0565 2.99117L6.43784 3.60983C6.24261 3.80505 6.24261 4.12164 6.43784 4.31686C6.63306 4.51208 6.94965 4.51208 7.14487 4.31686L7.76353 3.6982C8.19062 3.27111 8.35761 3.10879 8.51194 3.00541ZM4.31686 6.43784C4.51208 6.24261 4.51208 5.92603 4.31686 5.73081C4.12164 5.53558 3.80505 5.53558 3.60983 5.73081L2.99117 6.34947C2.56322 6.77742 2.35963 6.98181 2.19922 7.21518C1.50687 8.2303 1.49036 9.52939 2.15692 10.5618C2.31425 10.8003 2.52426 11.0104 2.90295 11.3891C3.28165 11.7678 3.49166 11.9778 3.7302 12.1351C4.76259 12.8017 6.06168 12.7852 7.0768 12.0928C7.31017 11.9324 7.51452 11.7288 7.94251 11.3008L8.56117 10.682C8.7564 10.4868 8.7564 10.1702 8.56117 9.97499C8.36595 9.77977 8.04936 9.77977 7.85414 9.97499L7.23548 10.5937C6.80834 11.0208 6.64264 11.1831 6.48827 11.2879C5.81192 11.7474 4.95675 11.7564 4.32141 11.3391C4.17714 11.2444 4.02307 11.094 3.61119 10.6821C3.1993 10.2702 3.04893 10.1162 2.95419 9.97191C2.53694 9.33657 2.54594 8.48141 3.00541 7.80506C3.10879 7.65073 3.27111 7.48374 3.6982 7.05665L4.31686 6.43784ZM9.62172 6.08492C9.81694 5.88969 9.81694 5.57311 9.62172 5.37789C9.42649 5.18266 9.10991 5.18266 8.91469 5.37789L5.37789 8.91469C5.18266 9.10991 5.18266 9.42649 5.37789 9.62172C5.57311 9.81694 5.88969 9.81694 6.08492 9.62172L9.62172 6.08492Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                          </svg>
                          Links
                        </button>
                        {/* Imprimir */}
                        <button
                          onClick={() => imprimir(f as Factura & { locales: Local; periodos: Periodo }, formatCOP)}
                          className="text-xs px-2 py-1 rounded border transition-colors"
                          style={{ borderColor: 'oklch(0.880 0.012 72)', color: 'oklch(0.520 0.015 60)' }}
                          title="Imprimir / guardar PDF"
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
                          ...((f.retencion_total ?? 0) > 0 ? [{ l: 'Retención fuente', v: -(f.retencion_total), warn: true }] : []),
                        ].map(row => (
                          <div key={row.l} className="flex justify-between col-span-1">
                            <span style={{ color: (row as {warn?: boolean}).warn ? 'oklch(0.600 0.140 50)' : 'oklch(0.520 0.015 60)', fontWeight: row.bold ? 600 : 400 }}>{row.l}</span>
                            <span style={{ color: (row as {warn?: boolean}).warn ? 'oklch(0.600 0.140 50)' : 'oklch(0.300 0.018 58)', fontWeight: row.bold ? 600 : 400 }}>{(row as {warn?: boolean}).warn ? `−${formatCOP(f.retencion_total)}` : formatCOP(row.v)}</span>
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
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'oklch(0.520 0.015 60)', letterSpacing: '0.08em' }}>
                Distribución a propietarios
              </h2>
              {usarModeloDistrib && (
                <div className="rounded-lg px-4 py-2.5 mb-4 flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ backgroundColor: 'oklch(0.960 0.020 72)', border: '1px solid oklch(0.880 0.012 72)' }}>
                  <span style={{ color: 'oklch(0.520 0.015 60)' }}>Total arriendos: <strong style={{ color: 'oklch(0.185 0.020 55)' }}>{formatCOP(totalArriendosDistrib)}</strong></span>
                  {totalRetencion > 0 && <span style={{ color: 'oklch(0.600 0.140 50)' }}>Retenciones: <strong>−{formatCOP(totalRetencion)}</strong></span>}
                  <span style={{ color: '#9A7B35' }}>Neto a distribuir: <strong>{formatCOP(totalArriendosDistrib - totalRetencion)}</strong></span>
                </div>
              )}
              <div className="grid gap-3">
                {Object.values(porPropietario).map((p, i) => {
                  const cuatromil = Math.round(p.total * 0.004)
                  return (
                    <div
                      key={i}
                      className="rounded-xl border px-5 py-4 flex items-center justify-between"
                      style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: 'oklch(0.185 0.020 55)' }}>{p.nombre}</p>
                          {p.porcentaje > 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.520 0.015 60)' }}>{p.porcentaje}%</span>}
                        </div>
                        {p.banco && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.520 0.015 60)' }}>{p.banco}</p>}
                        {p.nequi && <p className="text-xs" style={{ color: '#25D366' }}>Nequi: {p.nequi}</p>}
                        {cuatromil > 0 && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.560 0.012 68)' }}>4×mil: −{formatCOP(cuatromil)} → neto {formatCOP(p.total - cuatromil)}</p>}
                      </div>
                      <p className="text-xl font-semibold" style={{ color: '#9A7B35' }}>{formatCOP(p.total)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de links de pago */}
      <Dialog open={!!linksModal} onOpenChange={() => setLinksModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Links de pago</DialogTitle>
          </DialogHeader>
          <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>
            Pega los links de pago (Bold, Nequi, Bancolombia, etc.). El inquilino verá botones de pago directo en su portal.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Link para pagar servicios</Label>
              <p className="text-xs mb-1" style={{ color: 'oklch(0.560 0.012 68)' }}>
                Cuenta compartida de servicios comunes
              </p>
              <Input
                placeholder="https://cobro.bold.co/... o link de Nequi"
                value={linksModal?.link_servicios ?? ''}
                onChange={e => setLinksModal(prev => prev ? { ...prev, link_servicios: e.target.value } : null)}
              />
            </div>
            <div>
              <Label>Link para pagar arriendo</Label>
              <p className="text-xs mb-1" style={{ color: 'oklch(0.560 0.012 68)' }}>
                Cuenta del propietario del local
              </p>
              <Input
                placeholder="https://cobro.bold.co/... o link de Nequi"
                value={linksModal?.link_arriendo ?? ''}
                onChange={e => setLinksModal(prev => prev ? { ...prev, link_arriendo: e.target.value } : null)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => linksModal && guardarLinks(linksModal.facturaId, linksModal.link_servicios, linksModal.link_arriendo)}
            >
              Guardar links
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
