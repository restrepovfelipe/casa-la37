'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Factura, Gasto, Local, Periodo, Propietario, MESES } from '@/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function DistribucionPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [facturas, setFacturas] = useState<(Factura & { locales: Local })[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('propietarios').select('*').order('nombre'),
    ]).then(([{ data: per }, { data: props }]) => {
      if (per) setPeriodos(per)
      if (props) setPropietarios(props)
    })
  }, [])

  useEffect(() => {
    if (!periodoId) return
    const p = periodos.find(p => p.id === periodoId)
    setPeriodo(p ?? null)
    Promise.all([
      supabase.from('facturas').select('*, locales(*, propietarios(*))').eq('periodo_id', periodoId),
      supabase.from('gastos').select('*').eq('periodo_id', periodoId),
    ]).then(([{ data: facs }, { data: gas }]) => {
      if (facs) setFacturas(facs as (Factura & { locales: Local })[])
      if (gas) setGastos(gas as Gasto[])
    })
  }, [periodoId])

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Calcula distribución
  const totalArriendos = facturas.reduce((s, f) => s + f.arriendo, 0)
  const totalRetenciones = facturas.reduce((s, f) => s + (f.retencion_total ?? 0), 0)
  const totalServicios = facturas.reduce((s, f) => s + f.total_servicios, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const tasaSeguridad = periodo?.tasa_seguridad ?? 0
  const netoDistribuible = totalArriendos - totalRetenciones - totalGastos - tasaSeguridad

  const propietariosConPorcentaje = propietarios.filter(p => (p.porcentaje_real ?? 0) > 0)
  const totalPorcentaje = propietariosConPorcentaje.reduce((s, p) => s + (p.porcentaje_real ?? 0), 0)

  const distribucion = propietariosConPorcentaje.map(p => {
    const monto = Math.round(netoDistribuible * (p.porcentaje_real ?? 0) / 100)
    const cuatromil = Math.round(monto * 0.004)
    return {
      ...p,
      monto,
      cuatromil,
      neto: monto - cuatromil,
    }
  })

  const totalDistribuido = distribucion.reduce((s, d) => s + d.monto, 0)
  const cajaMenor = netoDistribuible - totalDistribuido

  function imprimir() {
    if (!periodo) return
    const rows = distribucion.map(d => `
      <tr>
        <td>${d.nombre}</td>
        <td style="text-align:right">${d.porcentaje_real}%</td>
        <td style="text-align:right">${formatCOP(d.monto)}</td>
        <td style="text-align:right" style="color:#a16207">−${formatCOP(d.cuatromil)}</td>
        <td style="text-align:right;font-weight:600">${formatCOP(d.neto)}</td>
        <td>${d.banco ? `${d.banco}` : ''}${d.nequi ? ` | Nequi: ${d.nequi}` : ''}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Distribución ${MESES[periodo.mes - 1]} ${periodo.anio}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color: #1C1409; padding: 40px; font-size: 13px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h1 span { color: #9A7B35; }
    .subtitle { color: #78614A; font-size: 12px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .box { background: #F8F4EF; border-radius: 6px; padding: 12px; }
    .box label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #78614A; display: block; margin-bottom: 4px; }
    .box .val { font-size: 15px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; color: #78614A; padding: 6px 0; border-bottom: 1px solid #E8E0D6; }
    td { padding: 10px 6px 10px 0; border-bottom: 1px solid #F0EBE3; font-size: 13px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E8E0D6; font-size: 11px; color: #78614A; text-align: center; }
  </style>
</head>
<body>
  <h1>Casa <span>La37</span> — Distribución</h1>
  <p class="subtitle">${MESES[periodo.mes - 1]} ${periodo.anio} · Generado ${new Date().toLocaleDateString('es-CO')}</p>
  <div class="grid">
    <div class="box"><label>Total arriendos</label><div class="val">${formatCOP(totalArriendos)}</div></div>
    <div class="box"><label>Retenciones</label><div class="val" style="color:#a16207">−${formatCOP(totalRetenciones)}</div></div>
    <div class="box"><label>Gastos</label><div class="val" style="color:#a16207">−${formatCOP(totalGastos + tasaSeguridad)}</div></div>
    <div class="box"><label>Neto a distribuir</label><div class="val" style="color:#9A7B35">${formatCOP(netoDistribuible)}</div></div>
  </div>
  <table>
    <thead><tr>
      <th>Propietario</th><th style="text-align:right">%</th>
      <th style="text-align:right">Bruto</th><th style="text-align:right">4×mil</th>
      <th style="text-align:right">Neto</th><th>Cuenta</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${cajaMenor !== 0 ? `<p style="margin-top:12px;font-size:12px;color:#78614A">Caja menor: ${formatCOP(cajaMenor)}</p>` : ''}
  <div class="footer">Casa La37 · Carrera 37 #10-37, Medellín</div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Distribución a propietarios</h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Cálculo del neto a transferir a cada propietario</p>
        </div>
      </div>

      <div className="mb-6 max-w-xs">
        <Label>Seleccionar periodo</Label>
        <Select value={periodoId} onValueChange={v => setPeriodoId(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Seleccionar periodo..." /></SelectTrigger>
          <SelectContent>
            {periodos.map(p => (
              <SelectItem key={p.id} value={p.id}>{MESES[p.mes - 1]} {p.anio}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!periodoId && (
        <p className="text-sm" style={{ color: 'oklch(0.560 0.012 68)' }}>Selecciona un periodo para ver la distribución.</p>
      )}

      {periodoId && facturas.length === 0 && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'oklch(0.960 0.040 60)', color: 'oklch(0.540 0.120 50)' }}>
          Este periodo aún no tiene facturas generadas. Ve a <strong>Facturas</strong> y genera las facturas primero.
        </div>
      )}

      {periodoId && facturas.length > 0 && (
        <>
          {/* Tabla de ingresos/gastos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total arriendos', value: totalArriendos, color: '#9A7B35' },
              { label: 'Retenciones', value: -totalRetenciones, color: totalRetenciones > 0 ? 'oklch(0.600 0.140 50)' : undefined },
              { label: 'Gastos del periodo', value: -(totalGastos + tasaSeguridad), color: (totalGastos + tasaSeguridad) > 0 ? 'oklch(0.540 0.180 30)' : undefined },
              { label: 'Neto a distribuir', value: netoDistribuible, color: '#9A7B35', bold: true },
            ].map(card => (
              <div key={card.label} className="rounded-xl p-4 border" style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'oklch(0.520 0.015 60)' }}>{card.label}</p>
                <p className={`text-lg font-semibold`} style={{ color: card.color ?? 'oklch(0.185 0.020 55)', fontWeight: card.bold ? 700 : 600 }}>
                  {card.value < 0 ? `−${formatCOP(-card.value)}` : formatCOP(card.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Desglose gastos */}
          {(gastos.length > 0 || tasaSeguridad > 0) && (
            <div className="rounded-xl border p-4 mb-6" style={{ borderColor: 'oklch(0.880 0.012 72)', backgroundColor: '#FFF' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'oklch(0.520 0.015 60)' }}>Desglose de gastos</p>
              <div className="space-y-1.5">
                {gastos.map(g => (
                  <div key={g.id} className="flex justify-between text-sm">
                    <span style={{ color: 'oklch(0.400 0.018 58)' }}>{g.descripcion}</span>
                    <span style={{ color: 'oklch(0.300 0.018 58)' }}>{formatCOP(g.monto)}</span>
                  </div>
                ))}
                {tasaSeguridad > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'oklch(0.600 0.140 50)' }}>Tasa de Seguridad (Gobernación)</span>
                    <span style={{ color: 'oklch(0.600 0.140 50)' }}>{formatCOP(tasaSeguridad)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
                  <span style={{ color: 'oklch(0.185 0.020 55)' }}>Total gastos</span>
                  <span style={{ color: 'oklch(0.540 0.180 30)' }}>{formatCOP(totalGastos + tasaSeguridad)}</span>
                </div>
              </div>
            </div>
          )}

          {propietariosConPorcentaje.length === 0 ? (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'oklch(0.960 0.040 60)', color: 'oklch(0.540 0.120 50)' }}>
              Los propietarios no tienen porcentaje configurado. Ve a <strong>Propietarios</strong> y asigna el porcentaje de participación a cada uno.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
                  {propietariosConPorcentaje.length} propietarios · {totalPorcentaje.toFixed(2)}% total
                </p>
                <Button variant="outline" size="sm" onClick={imprimir}>
                  Imprimir / PDF
                </Button>
              </div>

              <div className="grid gap-3 mb-6">
                {distribucion.map(d => (
                  <div
                    key={d.id}
                    className="rounded-xl border px-5 py-4"
                    style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{d.nombre}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.520 0.015 60)' }}>
                            {d.porcentaje_real}%
                          </span>
                        </div>
                        {d.banco && <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>{d.banco} · {d.tipo_cuenta} {d.numero_cuenta}</p>}
                        {d.nequi && <p className="text-xs" style={{ color: '#25D366' }}>Nequi: {d.nequi}</p>}
                        <p className="text-xs mt-1.5" style={{ color: 'oklch(0.560 0.012 68)' }}>
                          4×mil (transferencia): −{formatCOP(d.cuatromil)} → neto real a transferir: <strong style={{ color: 'oklch(0.300 0.018 58)' }}>{formatCOP(d.neto)}</strong>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-semibold" style={{ color: '#9A7B35' }}>{formatCOP(d.monto)}</p>
                        <p className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>bruto</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {cajaMenor !== 0 && (
                <div className="rounded-lg border px-4 py-3 flex items-center justify-between text-sm" style={{ borderColor: 'oklch(0.880 0.012 72)', backgroundColor: 'oklch(0.980 0.008 75)' }}>
                  <span style={{ color: 'oklch(0.400 0.018 58)' }}>Caja menor (sobrante/faltante por redondeo)</span>
                  <span className="font-semibold" style={{ color: 'oklch(0.300 0.018 58)' }}>{formatCOP(cajaMenor)}</span>
                </div>
              )}

              {/* Nota 4xmil */}
              <div className="mt-6 rounded-lg px-4 py-3 text-xs" style={{ backgroundColor: 'oklch(0.960 0.020 72)', color: 'oklch(0.520 0.015 60)' }}>
                <strong>Nota 4×mil:</strong> El impuesto GMF (Gravamen Movimientos Financieros) es 0,4% de cada transferencia bancaria.
                Los montos mostrados incluyen el cálculo del 4×mil para que veas exactamente cuánto vas a transferir.
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
