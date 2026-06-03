-- ================================================================
-- CASA LA37 — Correcciones históricas
-- 1. Agregar honorarios de administración (10%) a cada mes
-- 2. Corregir Local 306 Ereo en ene/feb (fue pre-pagado en sep 2025)
-- ================================================================

DO $$
DECLARE
  pid_ene UUID; pid_feb UUID; pid_mar UUID;
  pid_abr UUID; pid_may UUID; pid_jun UUID;
  l306 UUID;
BEGIN
  SELECT id INTO pid_ene FROM periodos WHERE mes=1 AND anio=2026;
  SELECT id INTO pid_feb FROM periodos WHERE mes=2 AND anio=2026;
  SELECT id INTO pid_mar FROM periodos WHERE mes=3 AND anio=2026;
  SELECT id INTO pid_abr FROM periodos WHERE mes=4 AND anio=2026;
  SELECT id INTO pid_may FROM periodos WHERE mes=5 AND anio=2026;
  SELECT id INTO pid_jun FROM periodos WHERE mes=6 AND anio=2026;
  SELECT id INTO l306 FROM locales WHERE numero ILIKE '%306%' LIMIT 1;

  -- ── Honorarios administración (10% del ingreso total mensual) ──
  -- Enero: 10% de (arriendos sin Ereo + SURA pago) = 10% de $59,813,188
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria)
  VALUES (pid_ene, 'Honorarios administración (10%)', 5981319, 'admin')
  ON CONFLICT DO NOTHING;

  -- Febrero: 10% de arriendos = $3,549,403
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria)
  VALUES (pid_feb, 'Honorarios administración (10%)', 3549403, 'admin')
  ON CONFLICT DO NOTHING;

  -- Marzo: 10% de $38,477,645 = $3,847,764
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria)
  VALUES (pid_mar, 'Honorarios administración (10%)', 3847764, 'admin')
  ON CONFLICT DO NOTHING;

  -- Abril: 10% de $39,070,390 = $3,907,039
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria)
  VALUES (pid_abr, 'Honorarios administración (10%)', 3907039, 'admin')
  ON CONFLICT DO NOTHING;

  -- Mayo: 10% de $40,527,593 = $4,052,759
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria)
  VALUES (pid_may, 'Honorarios administración (10%)', 4052759, 'admin')
  ON CONFLICT DO NOTHING;

  -- Junio: 10% de $49,727,593 = $4,972,759
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria)
  VALUES (pid_jun, 'Honorarios administración (10%)', 4972759, 'admin')
  ON CONFLICT DO NOTHING;

  -- ── Local 306 Ereo: arriendo enero y febrero = 0 ──────────────
  -- Ereo pagó 6 meses por adelantado en septiembre 2025.
  -- Esos meses (oct/nov/dic 2025 + ene/feb 2026) NO generan nuevo ingreso de caja.
  UPDATE facturas
  SET arriendo = 0,
      total = total_servicios,
      observaciones = 'Ereo pagó 6 meses por adelantado en sep 2025. Sin nuevo ingreso de caja este mes.'
  WHERE local_id = l306
    AND periodo_id IN (pid_ene, pid_feb);

  RAISE NOTICE 'Correcciones aplicadas OK';
END $$;

-- Verifica honorarios por mes:
SELECT p.mes, p.anio, g.descripcion, g.monto
FROM gastos g
JOIN periodos p ON p.id = g.periodo_id
WHERE g.descripcion ILIKE '%honorarios%'
ORDER BY p.anio, p.mes;
