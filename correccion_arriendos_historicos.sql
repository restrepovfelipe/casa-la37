-- ================================================================
-- CASA LA37 — Corrección arriendos históricos ene-jun 2026
-- Problema: la migración insertó facturas con arriendo = 0 para
-- varios locales porque los valores de locales.arriendo_actual
-- no estaban cargados en ese momento.
-- Este script los actualiza usando el arriendo_actual actual.
-- ================================================================

-- 1. Corregir arriendos = 0 en todos los meses (ene-jun 2026)
--    EXCEPTO casos legítimos de $0:
--    - Local 306 en enero y febrero (Ereo pagó por adelantado en sep 2025)
--    - Local 205 en todos los meses (desocupado, se maneja por separado)

UPDATE facturas f
SET
  arriendo        = l.arriendo_actual,
  retencion_total = ROUND(l.arriendo_actual * COALESCE(l.retencion_pct, 0) / 100),
  total           = f.total_servicios
                    + l.arriendo_actual
                    - ROUND(l.arriendo_actual * COALESCE(l.retencion_pct, 0) / 100)
FROM locales l
JOIN periodos p ON p.id = f.periodo_id
WHERE f.local_id = l.id
  AND p.anio = 2026
  AND p.mes  BETWEEN 1 AND 6
  AND f.arriendo = 0
  -- Excluir Local 306 en ene/feb (arriendo $0 es correcto)
  AND NOT (l.numero ILIKE '%306%' AND p.mes IN (1, 2))
  -- Excluir Local 205 (desocupado — verificar mes a mes)
  AND l.numero NOT ILIKE '%205%';

-- 2. Verifica resultado: arriendos por local y mes
SELECT
  p.mes,
  p.anio,
  l.numero,
  l.nombre,
  f.arriendo,
  f.retencion_total,
  f.total
FROM facturas f
JOIN periodos p ON p.id = f.periodo_id
JOIN locales  l ON l.id = f.local_id
WHERE p.anio = 2026 AND p.mes BETWEEN 1 AND 6
ORDER BY p.mes, l.numero;
