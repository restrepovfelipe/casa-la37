'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Factura, Gasto, IngresoExtra, Local, Periodo, Propietario, MESES } from '@/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function DistribucionPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo | null>(null)
  const [facturas, setFacturas] = useState<(Factura & { locales: Local })[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [ingresos, setIngresos] = useState<IngresoExtra[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [ingModal, setIngModal] = useState<{ id?: string; descripcion: string; monto: string } | null>(null)
  const [savingIng, setSavingIng] = useState(false)
  const [calculandoHonorarios, setCalculandoHonorarios] = useState(false)
  const [guardandoCaja, setGuardandoCaja] = useState(false)

  const supabase = createClient()

  async function cargarPeriodos() {
    const [{ data: per }, { data: props }] = await Promise.all([
      supabase.from('periodos').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }),
      supabase.from('propietarios').select('*').order('nombre'),
    ])
    if (per) setPeriodos(per)
    if (props) setPropietarios(props)
  }

  useEffect(() => {
    cargarPeriodos()
  }, [])

  useEffect(() => {
    if (!periodoId) return
    const p = periodos.find(p => p.id === periodoId)
    setPeriodo(p ?? null)
    cargarDatos()
  }, [periodoId])

  async function cargarDatos() {
    const [{ data: facs }, { data: gas }, { data: ing }] = await Promise.all([
      supabase.from('facturas').select('*, locales(*, propietarios(*))').eq('periodo_id', periodoId),
      supabase.from('gastos').select('*').eq('periodo_id', periodoId),
      supabase.from('ingresos_extra').select('*').eq('periodo_id', periodoId).order('created_at'),
    ])
    if (facs) setFacturas(facs as (Factura & { locales: Local })[])
    if (gas) setGastos(gas as Gasto[])
    if (ing) setIngresos(ing as IngresoExtra[])
  }

  async function calcularHonorarios() {
    setCalculandoHonorarios(true)
    const base = facturas.reduce((s, f) => s + f.arriendo, 0)
      + ingresos.reduce((s, i) => s + i.monto, 0)
    const monto = Math.round(base * 0.10)
    const existente = gastos.find(g => g.descripcion.toLowerCase().includes('honorarios'))
    if (existente) {
      await supabase.from('gastos').update({ monto, descripcion: 'Honorarios administración (10%)' }).eq('id', existente.id)
    } else {
      await supabase.from('gastos').insert({
        periodo_id: periodoId,
        descripcion: 'Honorarios administración (10%)',
        monto,
        categoria: 'admin',
      })
    }
    await cargarDatos()
    setCalculandoHonorarios(false)
  }

  async function guardarIngreso() {
    if (!ingModal) return
    setSavingIng(true)
    const payload = {
      periodo_id: periodoId,
      descripcion: ingModal.descripcion,
      monto: parseFloat(ingModal.monto.replace(/\./g, '').replace(',', '.')) || 0,
    }
    if (ingModal.id) {
      await supabase.from('ingresos_extra').update(payload).eq('id', ingModal.id)
    } else {
      await supabase.from('ingresos_extra').insert(payload)
    }
    await cargarDatos()
    setIngModal(null)
    setSavingIng(false)
  }

  async function eliminarIngreso(id: string) {
    if (!confirm('¿Eliminar este ingreso?')) return
    await supabase.from('ingresos_extra').delete().eq('id', id)
    await cargarDatos()
  }

  async function guardarCajaMenor(valor: number) {
    setGuardandoCaja(true)
    await supabase.from('periodos').update({ caja_menor: valor }).eq('id', periodoId)
    await cargarPeriodos()
    // Re-sync periodo local
    setPeriodo(prev => prev ? { ...prev, caja_menor: valor } : prev)
    setGuardandoCaja(false)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // ── Caja menor del mes anterior ────────────────────────────────────────────
  const mesPrev = periodo ? (periodo.mes === 1 ? 12 : periodo.mes - 1) : 0
  const anioPrev = periodo ? (periodo.mes === 1 ? periodo.anio - 1 : periodo.anio) : 0
  const periodoPrev = periodos.find(p => p.mes === mesPrev && p.anio === anioPrev)
  const cajaMenorAnterior = periodoPrev?.caja_menor ?? 0

  // ── Cálculo ──────────────────────────────────────────────────────────────────
  const totalArriendos = facturas.reduce((s, f) => s + f.arriendo, 0)
  const totalRetenciones = facturas.reduce((s, f) => s + (f.retencion_total ?? 0), 0)
  const totalIngresosExtra = ingresos.reduce((s, i) => s + i.monto, 0)
  const tasaSeguridad = periodo?.tasa_seguridad ?? 0

  const esHonorario = (g: Gasto) => g.descripcion.toLowerCase().includes('honorarios')
  const esRetencionManual = (g: Gasto) => g.descripcion.toLowerCase().includes('retenci')

  // Excluir retenciones manuales: las facturas ya las calculan automáticamente
  const gastosEfectivos = gastos.filter(g => !esRetencionManual(g))
  const totalGastos = gastosEfectivos.reduce((s, g) => s + g.monto, 0)
  const retencionManualExcluida = gastos.filter(esRetencionManual).reduce((s, g) => s + g.monto, 0)

  // Honorarios — para mostrar en desglose y en panel de la administradora
  const honorariosAdmin = gastosEfectivos.filter(esHonorario).reduce((s, g) => s + g.monto, 0)

  // Neto final = arriendos + extras + caja_menor_anterior - retenciones(auto) - gastos(sin retención manual) - tasa
  const netoDistribuible = totalArriendos + totalIngresosExtra + cajaMenorAnterior - totalRetenciones - totalGastos - tasaSeguridad

  const propietariosConPct = propietarios.filter(p => (p.porcentaje_real ?? 0) > 0)
  const totalPct = propietariosConPct.reduce((s, p) => s + (p.porcentaje_real ?? 0), 0)

  const distribucion = propietariosConPct.map(p => {
    const monto = Math.round(netoDistribuible * (p.porcentaje_real ?? 0) / 100)
    const cuatromil = Math.round(monto * 0.004)
    const honorarios = p.es_administrador ? honorariosAdmin : 0
    return { ...p, monto, cuatromil, neto: monto - cuatromil, honorarios }
  })

  const totalDistribuido = distribucion.reduce((s, d) => s + d.monto, 0)
  const cajaMenor = netoDistribuible - totalDistribuido
  const cajaMenorGuardada = periodo?.caja_menor ?? 0
  const cajaMenorYaGuardada = cajaMenorGuardada === cajaMenor

  const periodoLabel = periodo ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : ''

  function imprimir() {
    if (!periodo) return
    const rows = distribucion.map(d => `
      <tr>
        <td>${d.nombre}${d.es_administrador ? ' <span style="font-size:10px;background:#FEF3C7;padding:1px 4px;border-radius:3px">Administ.</span>' : ''}</td>
        <td style="text-align:right">${d.porcentaje_real}%</td>
        <td style="text-align:right">${fmt(d.monto)}</td>
        <td style="text-align:right;color:#a16207">−${fmt(d.cuatromil)}</td>
        <td style="text-align:right;font-weight:600">${fmt(d.neto)}</td>
        <td style="font-size:11px">${[d.banco, d.tipo_cuenta, d.numero_cuenta].filter(Boolean).join(' · ')}${d.nequi ? ` | Nequi: ${d.nequi}` : ''}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Distribución ${MESES[periodo.mes - 1]} ${periodo.anio}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1C1409;padding:40px;font-size:13px}
h1{font-size:20px;margin-bottom:4px}h1 span{color:#9A7B35}.sub{color:#78614A;font-size:12px;margin-bottom:24px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.box{background:#F8F4EF;border-radius:6px;padding:12px}.box label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#78614A;display:block;margin-bottom:4px}
.box .val{font-size:15px;font-weight:600}
table{width:100%;border-collapse:collapse;margin-top:16px}
th{text-align:left;font-size:10px;text-transform:uppercase;color:#78614A;padding:6px 0;border-bottom:1px solid #E8E0D6}
td{padding:9px 6px 9px 0;border-bottom:1px solid #F0EBE3;font-size:13px;vertical-align:top}
.footer{margin-top:32px;padding-top:12px;border-top:1px solid #E8E0D6;font-size:11px;color:#78614A;text-align:center}</style>
</head><body>
<h1>Casa <span>La37</span> — Distribución</h1>
<p class="sub">${MESES[periodo.mes - 1]} ${periodo.anio} · ${new Date().toLocaleDateString('es-CO')}</p>
<div class="grid">
<div class="box"><label>Arriendos</label><div class="val">${fmt(totalArriendos)}</div></div>
${totalIngresosExtra > 0 ? `<div class="box"><label>Ingresos extra</label><div class="val" style="color:#15803d">+${fmt(totalIngresosExtra)}</div></div>` : ''}
${cajaMenorAnterior > 0 ? `<div class="box"><label>Caja menor anterior</label><div class="val" style="color:#15803d">+${fmt(cajaMenorAnterior)}</div></div>` : ''}
<div class="box"><label>Gastos totales</label><div class="val" style="color:#a16207">−${fmt(totalRetenciones + totalGastos + tasaSeguridad)}</div></div>
<div class="box"><label>Neto a distribuir</label><div class="val" style="color:#9A7B35">${fmt(netoDistribuible)}</div></div>
</div>
${honorariosAdmin > 0 ? `<div style="background:#FEF9F0;border:1px solid #E8D5A3;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#78614A">
  Honorarios de administración: ${fmt(honorariosAdmin)} (10% — pagados por el edificio a la administradora como salida)
</div>` : ''}
<table><thead><tr><th>Propietario</th><th style="text-align:right">%</th><th style="text-align:right">Bruto</th><th style="text-align:right">4×mil</th><th style="text-align:right">Neto</th><th>Cuenta</th></tr></thead>
<tbody>${rows}</tbody></table>
${cajaMenor !== 0 ? `<p style="margin-top:12px;font-size:12px;color:#78614A">Caja menor: ${fmt(cajaMenor)}</p>` : ''}
<div class="footer">Casa La37 · Carrera 37 #10-37, Medellín</div>
<script>window.onload=()=>window.print()</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: 'oklch(0.185 0.020 55)' }}>Distribución a propietarios</h1>
          <p className="text-sm" style={{ color: 'oklch(0.520 0.015 60)' }}>Neto a transferir a cada propietario por periodo</p>
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
          Este periodo no tiene facturas generadas. Ve a <strong>Facturas</strong> y genera las facturas primero.
        </div>
      )}

      {periodoId && facturas.length > 0 && (
        <>
          {/* Info retención excluida */}
          {retencionManualExcluida > 0 && (
            <div className="rounded-lg border px-4 py-3 mb-4 text-sm" style={{ backgroundColor: 'oklch(0.975 0.015 75)', borderColor: 'oklch(0.860 0.020 72)', color: 'oklch(0.500 0.015 60)' }}>
              Los gastos "Retención Octus" ({fmt(retencionManualExcluida)}) están excluidos del cálculo — las facturas ya la descuentan automáticamente ({fmt(totalRetenciones)}).
            </div>
          )}

          {/* Cards resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Arriendos', value: totalArriendos, color: 'oklch(0.185 0.020 55)' },
              { label: 'Ingresos extra', value: totalIngresosExtra, color: '#16a34a', prefix: '+', hide: totalIngresosExtra === 0 },
              { label: cajaMenorAnterior > 0 ? `Caja menor ${MESES[mesPrev - 1].toLowerCase()}` : '', value: cajaMenorAnterior, color: '#16a34a', prefix: '+', hide: cajaMenorAnterior === 0 },
              { label: 'Retenciones', value: -totalRetenciones, color: totalRetenciones > 0 ? 'oklch(0.600 0.140 50)' : 'oklch(0.560 0.012 68)' },
              { label: 'Gastos', value: -totalGastos - tasaSeguridad, color: totalGastos > 0 ? 'oklch(0.540 0.180 30)' : 'oklch(0.560 0.012 68)' },
              { label: 'Neto a distribuir', value: netoDistribuible, color: '#9A7B35', bold: true },
            ].filter(card => !card.hide && card.label).map(card => (
              <div key={card.label} className="rounded-xl p-4 border" style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'oklch(0.520 0.015 60)' }}>{card.label}</p>
                <p className="text-base font-semibold" style={{ color: card.color, fontWeight: card.bold ? 700 : 600 }}>
                  {card.value < 0
                    ? `−${fmt(-card.value)}`
                    : `${(card as { prefix?: string }).prefix ?? ''}${fmt(card.value)}`}
                </p>
              </div>
            ))}
          </div>

          {/* Honorarios banner */}
          {honorariosAdmin > 0 ? (
            <div className="rounded-xl border px-4 py-3 mb-6 flex items-center justify-between gap-3"
              style={{ backgroundColor: 'oklch(0.975 0.020 72)', borderColor: 'oklch(0.860 0.040 72)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'oklch(0.400 0.020 58)' }}>
                  Honorarios administración (10%): <strong>{fmt(honorariosAdmin)}</strong> — incluidos en gastos, pagados a la administradora por el edificio
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.560 0.015 60)' }}>
                  Todos los propietarios (incluida Ximena) reciben su % del neto restante por igual.
                </p>
              </div>
              <button
                onClick={calcularHonorarios}
                disabled={calculandoHonorarios}
                className="text-xs px-3 py-1.5 rounded-lg border flex-shrink-0"
                style={{ borderColor: 'oklch(0.700 0.020 72)', color: 'oklch(0.400 0.020 58)', backgroundColor: '#fff' }}
              >
                {calculandoHonorarios ? 'Calculando...' : 'Recalcular'}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-3 mb-6 flex items-center justify-between gap-3"
              style={{ borderColor: 'oklch(0.800 0.020 72)', backgroundColor: 'oklch(0.988 0.008 75)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'oklch(0.400 0.020 58)' }}>
                  Honorarios de administración (10%) no calculados
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'oklch(0.560 0.015 60)' }}>
                  Base: {fmt(totalArriendos + totalIngresosExtra)} → 10% = <strong>{fmt(Math.round((totalArriendos + totalIngresosExtra) * 0.10))}</strong>
                </p>
              </div>
              <button
                onClick={calcularHonorarios}
                disabled={calculandoHonorarios || facturas.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 font-medium"
                style={{ backgroundColor: 'oklch(0.520 0.020 58)', color: '#fff' }}
              >
                {calculandoHonorarios ? 'Calculando...' : '+ Calcular honorarios'}
              </button>
            </div>
          )}

          {/* Ingresos extraordinarios */}
          <div className="rounded-xl border p-4 mb-6" style={{ borderColor: 'oklch(0.880 0.012 72)', backgroundColor: '#FFF' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'oklch(0.520 0.015 60)' }}>
                Ingresos extraordinarios
              </p>
              <button
                onClick={() => setIngModal({ descripcion: '', monto: '' })}
                className="text-xs px-2 py-1 rounded border"
                style={{ borderColor: '#16a34a', color: '#16a34a' }}
              >
                + Agregar
              </button>
            </div>
            {ingresos.length === 0 ? (
              <p className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>
                Sin ingresos extraordinarios este periodo.
              </p>
            ) : (
              <div className="space-y-2">
                {ingresos.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'oklch(0.300 0.018 58)' }}>{ing.descripcion}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm" style={{ color: '#16a34a' }}>+{fmt(ing.monto)}</span>
                      <button onClick={() => setIngModal({ id: ing.id, descripcion: ing.descripcion, monto: ing.monto.toString() })}
                        className="text-xs px-2 py-0.5 rounded border"
                        style={{ borderColor: 'oklch(0.880 0.012 72)', color: 'oklch(0.520 0.015 60)' }}>Editar</button>
                      <button onClick={() => eliminarIngreso(ing.id)}
                        className="text-xs px-2 py-0.5 rounded border"
                        style={{ borderColor: 'oklch(0.880 0.040 30)', color: 'oklch(0.540 0.180 30)' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gastos desglose */}
          {(gastos.length > 0 || tasaSeguridad > 0) && (
            <div className="rounded-xl border p-4 mb-6" style={{ borderColor: 'oklch(0.880 0.012 72)', backgroundColor: '#FFF' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'oklch(0.520 0.015 60)' }}>Desglose de gastos</p>
              <div className="space-y-1.5">
                {gastos.map(g => {
                  const excluido = esRetencionManual(g)
                  return (
                    <div key={g.id} className="flex justify-between text-sm" style={{ opacity: excluido ? 0.45 : 1 }}>
                      <span style={{ color: esHonorario(g) ? 'oklch(0.450 0.060 58)' : 'oklch(0.400 0.018 58)' }}>
                        {g.descripcion}
                        {esHonorario(g) && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'oklch(0.965 0.020 72)', color: 'oklch(0.450 0.060 58)' }}>
                            → Administradora
                          </span>
                        )}
                        {excluido && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.560 0.012 68)' }}>
                            excluido (ya en facturas)
                          </span>
                        )}
                      </span>
                      <span style={{ color: excluido ? 'oklch(0.620 0.010 68)' : 'oklch(0.300 0.018 58)', textDecoration: excluido ? 'line-through' : 'none' }}>
                        {fmt(g.monto)}
                      </span>
                    </div>
                  )
                })}
                {tasaSeguridad > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'oklch(0.600 0.140 50)' }}>Tasa de Seguridad (Gobernación)</span>
                    <span style={{ color: 'oklch(0.600 0.140 50)' }}>{fmt(tasaSeguridad)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1.5 border-t" style={{ borderColor: 'oklch(0.880 0.012 72)' }}>
                  <span style={{ color: 'oklch(0.185 0.020 55)' }}>Total gastos</span>
                  <span style={{ color: 'oklch(0.540 0.180 30)' }}>{fmt(totalGastos + tasaSeguridad)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Distribución */}
          {propietariosConPct.length === 0 ? (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'oklch(0.960 0.040 60)', color: 'oklch(0.540 0.120 50)' }}>
              Los propietarios no tienen porcentaje configurado.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
                  {propietariosConPct.length} propietarios · {totalPct.toFixed(2)}% · {periodoLabel}
                </p>
                <Button variant="outline" size="sm" onClick={imprimir}>Imprimir / PDF</Button>
              </div>

              <div className="grid gap-3 mb-6">
                {distribucion.map(d => (
                  <div key={d.id} className="rounded-xl border px-5 py-4"
                    style={{ backgroundColor: '#FFF', borderColor: 'oklch(0.880 0.012 72)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold" style={{ color: 'oklch(0.185 0.020 55)' }}>{d.nombre}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'oklch(0.945 0.012 72)', color: 'oklch(0.520 0.015 60)' }}>
                            {d.porcentaje_real}%
                          </span>
                          {d.es_administrador && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'oklch(0.965 0.020 72)', color: 'oklch(0.450 0.060 58)' }}>
                              Administradora
                            </span>
                          )}
                        </div>
                        {(d.banco || d.tipo_cuenta || d.numero_cuenta) && (
                          <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>
                            {[d.banco, d.tipo_cuenta, d.numero_cuenta].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {d.nequi && <p className="text-xs" style={{ color: '#25D366' }}>Nequi: {d.nequi}</p>}
                        {/* Desglose para la administradora */}
                        {d.es_administrador && d.honorarios > 0 && (
                          <div className="mt-1.5 text-xs rounded-lg px-2.5 py-1.5 space-y-0.5"
                            style={{ backgroundColor: 'oklch(0.965 0.020 72)', color: 'oklch(0.420 0.030 60)' }}>
                            <div className="flex justify-between">
                              <span>Honorarios admin (10%)</span>
                              <span className="font-medium">{fmt(d.honorarios)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Propiedad {d.porcentaje_real}%</span>
                              <span className="font-medium">{fmt(d.monto)}</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-0.5 border-t" style={{ borderColor: 'oklch(0.880 0.020 72)' }}>
                              <span>Total recibe este mes</span>
                              <span style={{ color: '#9A7B35' }}>{fmt(d.monto + d.honorarios)}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs mt-1.5" style={{ color: 'oklch(0.560 0.012 68)' }}>
                          4×mil: −{fmt(d.cuatromil)} →{' '}
                          <strong style={{ color: 'oklch(0.300 0.018 58)' }}>transferir {fmt(d.neto)}</strong>
                          {d.es_administrador && d.honorarios > 0 && (
                            <span style={{ color: 'oklch(0.560 0.012 68)' }}> + {fmt(d.honorarios)} honorarios</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-semibold" style={{ color: '#9A7B35' }}>{fmt(d.monto)}</p>
                        <p className="text-xs" style={{ color: 'oklch(0.560 0.012 68)' }}>bruto</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Caja menor */}
              <div className="rounded-lg border px-4 py-3 flex items-center justify-between gap-4 text-sm"
                style={{ borderColor: cajaMenorYaGuardada ? 'oklch(0.800 0.040 145)' : 'oklch(0.880 0.012 72)', backgroundColor: cajaMenorYaGuardada ? 'oklch(0.975 0.015 145)' : 'oklch(0.980 0.008 75)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'oklch(0.300 0.018 58)' }}>
                    Caja menor {periodoLabel}
                    {cajaMenorYaGuardada && (
                      <span className="ml-2 text-xs" style={{ color: 'oklch(0.450 0.080 145)' }}>✓ guardada</span>
                    )}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.560 0.012 68)' }}>
                    Se arrastra como ingreso al siguiente mes ({cajaMenorAnterior > 0 ? `${MESES[mesPrev - 1]} aportó ${fmt(cajaMenorAnterior)}` : 'nada aportado del mes anterior'})
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-base font-semibold" style={{ color: 'oklch(0.300 0.018 58)' }}>{fmt(cajaMenor)}</span>
                  {!cajaMenorYaGuardada && (
                    <button
                      onClick={() => guardarCajaMenor(cajaMenor)}
                      disabled={guardandoCaja}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: 'oklch(0.520 0.020 58)', color: '#fff' }}
                    >
                      {guardandoCaja ? 'Guardando...' : 'Guardar para el siguiente mes'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Modal ingreso extra */}
      <Dialog open={!!ingModal} onOpenChange={() => setIngModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ingModal?.id ? 'Editar ingreso' : 'Nuevo ingreso extraordinario'}</DialogTitle>
          </DialogHeader>
          <p className="text-xs" style={{ color: 'oklch(0.520 0.015 60)' }}>
            Para seguros, retroactivos, multas por mora, o cualquier ingreso fuera del arriendo regular.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Descripción</Label>
              <Input placeholder="Ej: Pago SURA seguro local 205"
                value={ingModal?.descripcion ?? ''}
                onChange={e => setIngModal(prev => prev ? { ...prev, descripcion: e.target.value } : null)} />
            </div>
            <div>
              <Label>Monto ($)</Label>
              <Input type="number" placeholder="0"
                value={ingModal?.monto ?? ''}
                onChange={e => setIngModal(prev => prev ? { ...prev, monto: e.target.value } : null)} />
            </div>
            <Button className="w-full" onClick={guardarIngreso}
              disabled={savingIng || !ingModal?.descripcion || !ingModal?.monto}>
              {savingIng ? 'Guardando...' : ingModal?.id ? 'Guardar cambios' : 'Agregar ingreso'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
