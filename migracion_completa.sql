-- =============================================================
-- CASA LA37 — Migración completa
-- Ejecutar en Supabase SQL Editor (puedes pegar todo de una vez)
-- =============================================================

-- ── 1. Nuevas columnas ────────────────────────────────────────
ALTER TABLE locales ADD COLUMN IF NOT EXISTS retencion_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE periodos ADD COLUMN IF NOT EXISTS tasa_seguridad DECIMAL(12,2) DEFAULT 0;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS retencion_total DECIMAL(12,2) DEFAULT 0;

-- ── 2. Tabla de gastos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gastos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo_id  UUID REFERENCES periodos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  monto       DECIMAL(12,2) NOT NULL,
  categoria   TEXT DEFAULT 'mantenimiento',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access gastos" ON gastos;
CREATE POLICY "Admin full access gastos" ON gastos FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

-- ── 3. Retención Octus (3.5% en los 4 locales) ───────────────
-- Ajusta los números si tus locales tienen otro formato
UPDATE locales SET retencion_pct = 3.5
  WHERE numero IN ('201','202','203','204')
     OR numero ILIKE '%201%' OR numero ILIKE '%202%'
     OR numero ILIKE '%203%' OR numero ILIKE '%204%';

-- ── 4. Porcentajes de distribución propietarios ───────────────
-- 4.5 partes: 4 propietarios al 22.22% + Junior al 11.12%
-- Ajusta los nombres si los escribiste diferente
UPDATE propietarios SET porcentaje_real = 22.22 WHERE nombre ILIKE '%Stella%' OR nombre ILIKE '%Ximena%';
UPDATE propietarios SET porcentaje_real = 22.22 WHERE nombre ILIKE '%Hector%' OR nombre ILIKE '%Héctor%';
UPDATE propietarios SET porcentaje_real = 22.22 WHERE nombre ILIKE '%Adriana%' OR nombre ILIKE '%Clara%';
UPDATE propietarios SET porcentaje_real = 11.12 WHERE nombre ILIKE '%Enrique%' OR nombre ILIKE '%Junior%';

-- ── 5. Arriendos actuales (Junio 2026 según Excel) ───────────
-- Verifica que los números coincidan con tu app antes de ejecutar
UPDATE locales SET arriendo_actual = 13704500 WHERE numero ILIKE '%101%';
UPDATE locales SET arriendo_actual = 2226000  WHERE numero ILIKE '%201%' AND nombre ILIKE '%Octus%';
UPDATE locales SET arriendo_actual = 1455000  WHERE numero ILIKE '%202%' AND nombre ILIKE '%Octus%';
UPDATE locales SET arriendo_actual = 1243000  WHERE numero ILIKE '%203%' AND nombre ILIKE '%Octus%';
UPDATE locales SET arriendo_actual = 1429000  WHERE numero ILIKE '%204%' AND nombre ILIKE '%Octus%';
UPDATE locales SET arriendo_actual = 9200000  WHERE numero ILIKE '%205%';
UPDATE locales SET arriendo_actual = 1956993  WHERE numero ILIKE '%301%';
UPDATE locales SET arriendo_actual = 2350000  WHERE numero ILIKE '%302%';
UPDATE locales SET arriendo_actual = 1960000  WHERE numero ILIKE '%303%';
UPDATE locales SET arriendo_actual = 2350000  WHERE numero ILIKE '%304%';
UPDATE locales SET arriendo_actual = 3890800  WHERE numero ILIKE '%305%';
UPDATE locales SET arriendo_actual = 2453000  WHERE numero ILIKE '%306%';
UPDATE locales SET arriendo_actual = 5509300  WHERE numero ILIKE '%401%';

-- ── 6. Periodos históricos Enero–Junio 2026 ──────────────────
-- Usamos DO para capturar los IDs y crear facturas y gastos
DO $$
DECLARE
  pid_ene UUID; pid_feb UUID; pid_mar UUID;
  pid_abr UUID; pid_may UUID; pid_jun UUID;

  l101 UUID; l201 UUID; l202 UUID; l203 UUID; l204 UUID;
  l205 UUID; l301 UUID; l302 UUID; l303 UUID; l304 UUID;
  l305 UUID; l306 UUID; l401 UUID;
BEGIN

  -- Obtener IDs de locales
  SELECT id INTO l101 FROM locales WHERE numero ILIKE '%101%' LIMIT 1;
  SELECT id INTO l201 FROM locales WHERE numero ILIKE '%201%' AND nombre ILIKE '%Octus%' LIMIT 1;
  SELECT id INTO l202 FROM locales WHERE numero ILIKE '%202%' AND nombre ILIKE '%Octus%' LIMIT 1;
  SELECT id INTO l203 FROM locales WHERE numero ILIKE '%203%' AND nombre ILIKE '%Octus%' LIMIT 1;
  SELECT id INTO l204 FROM locales WHERE numero ILIKE '%204%' AND nombre ILIKE '%Octus%' LIMIT 1;
  SELECT id INTO l205 FROM locales WHERE numero ILIKE '%205%' LIMIT 1;
  SELECT id INTO l301 FROM locales WHERE numero ILIKE '%301%' LIMIT 1;
  SELECT id INTO l302 FROM locales WHERE numero ILIKE '%302%' LIMIT 1;
  SELECT id INTO l303 FROM locales WHERE numero ILIKE '%303%' LIMIT 1;
  SELECT id INTO l304 FROM locales WHERE numero ILIKE '%304%' LIMIT 1;
  SELECT id INTO l305 FROM locales WHERE numero ILIKE '%305%' LIMIT 1;
  SELECT id INTO l306 FROM locales WHERE numero ILIKE '%306%' LIMIT 1;
  SELECT id INTO l401 FROM locales WHERE numero ILIKE '%401%' LIMIT 1;

  -- ── ENERO 2026 ──────────────────────────────────────────────
  INSERT INTO periodos (mes, anio, telesentinel, empleada, dias_aide, tasa_seguridad, estado, fecha_limite_pago)
  VALUES (1, 2026, 89000, 272000, 4, 0, 'cerrado', '2026-01-10')
  RETURNING id INTO pid_ene;

  -- Facturas Enero
  INSERT INTO facturas (local_id, periodo_id, arriendo, agua_total, luz_total, alarma_total, empleada_total,
    retencion_total, total_servicios, total, estado_servicios, estado_arriendo,
    fecha_pago_servicios, fecha_pago_arriendo) VALUES
  (l101, pid_ene, 12447300, 0, 0, 0, 0, 0, 0, 12447300, 'pagado', 'pagado', '2026-01-30', '2026-01-30'),
  (l201, pid_ene, 2040158, 0, 0, 0, 0, ROUND(2040158*0.035), 0, 2040158, 'pagado', 'pagado', '2026-01-09', '2026-01-09'),
  (l202, pid_ene, 1333602, 0, 0, 0, 0, ROUND(1333602*0.035), 0, 1333602, 'pagado', 'pagado', '2026-01-09', '2026-01-09'),
  (l203, pid_ene, 1139039, 0, 0, 0, 0, ROUND(1139039*0.035), 0, 1139039, 'pagado', 'pagado', '2026-01-09', '2026-01-09'),
  (l204, pid_ene, 1309587, 0, 0, 0, 0, ROUND(1309587*0.035), 0, 1309587, 'pagado', 'pagado', '2026-01-09', '2026-01-09'),
  (l301, pid_ene, 1956992, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956992+89000/7+272000/13, 'pagado', 'pagado', '2026-02-02', '2026-02-02'),
  (l302, pid_ene, 1956993, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956993+89000/7+272000/13, 'pagado', 'pagado', '2026-01-30', '2026-01-30'),
  (l303, pid_ene, 1960000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1960000+89000/7+272000/13, 'pagado', 'pagado', '2026-01-22', '2026-01-22'),
  (l304, pid_ene, 1757252, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1757252+89000/7+272000/13, 'pagado', 'pagado', '2026-01-09', '2026-01-09'),
  (l305, pid_ene, 3690800, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 3690800+89000/7+272000/13, 'pagado', 'pagado', '2026-01-30', '2026-01-30'),
  (l306, pid_ene, 2187900, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2187900+89000/7+272000/13, 'pagado', 'pagado', '2026-01-01', '2026-01-01'),
  (l401, pid_ene, 5509300, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 5509300+89000/7+272000/13, 'pagado', 'pagado', '2026-01-30', '2026-01-30')
  ON CONFLICT (local_id, periodo_id) DO NOTHING;

  -- Gastos Enero
  INSERT INTO gastos (periodo_id, descripcion, monto, categoria) VALUES
  (pid_ene, 'Cuota manejo tarjeta', 14900, 'admin'),
  (pid_ene, 'Retención Octus diciembre (mes anterior)', 203771, 'admin'),
  (pid_ene, 'Manguera y registro lavamanos', 40800, 'mantenimiento'),
  (pid_ene, 'Certificado tradición y libertad', 35900, 'admin'),
  (pid_ene, '5 mangueras Abastos', 90000, 'mantenimiento');

  -- ── FEBRERO 2026 ─────────────────────────────────────────────
  INSERT INTO periodos (mes, anio, telesentinel, empleada, dias_aide, tasa_seguridad, estado, fecha_limite_pago)
  VALUES (2, 2026, 89000, 272000, 4, 0, 'cerrado', '2026-02-10')
  RETURNING id INTO pid_feb;

  INSERT INTO facturas (local_id, periodo_id, arriendo, agua_total, luz_total, alarma_total, empleada_total,
    retencion_total, total_servicios, total, estado_servicios, estado_arriendo,
    fecha_pago_servicios, fecha_pago_arriendo) VALUES
  (l101, pid_feb, 12447300, 0, 0, 0, 0, 0, 0, 12447300, 'pagado', 'pagado', '2026-02-28', '2026-02-28'),
  (l201, pid_feb, 2040158, 0, 0, 0, 0, ROUND(2040158*0.035), 0, 2040158, 'pagado', 'pagado', '2026-02-06', '2026-02-06'),
  (l202, pid_feb, 1333602, 0, 0, 0, 0, ROUND(1333602*0.035), 0, 1333602, 'pagado', 'pagado', '2026-02-06', '2026-02-06'),
  (l203, pid_feb, 1139039, 0, 0, 0, 0, ROUND(1139039*0.035), 0, 1139039, 'pagado', 'pagado', '2026-02-06', '2026-02-06'),
  (l204, pid_feb, 1309587, 0, 0, 0, 0, ROUND(1309587*0.035), 0, 1309587, 'pagado', 'pagado', '2026-02-06', '2026-02-06'),
  (l301, pid_feb, 1956993, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956993+89000/7+272000/13, 'pagado', 'pagado', '2026-02-25', '2026-02-25'),
  (l302, pid_feb, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-02-05', '2026-02-05'),
  (l303, pid_feb, 1960000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1960000+89000/7+272000/13, 'pagado', 'pagado', '2026-02-16', '2026-02-16'),
  (l304, pid_feb, 1757252, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1757252+89000/7+272000/13, 'pagado', 'pagado', '2026-02-13', '2026-02-13'),
  (l305, pid_feb, 3690800, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 3690800+89000/7+272000/13, 'pagado', 'pagado', '2026-02-28', '2026-02-28'),
  (l306, pid_feb, 2187900, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2187900+89000/7+272000/13, 'pagado', 'pagado', '2026-02-01', '2026-02-01'),
  (l401, pid_feb, 5509300, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 5509300+89000/7+272000/13, 'pagado', 'pagado', '2026-02-28', '2026-02-28')
  ON CONFLICT (local_id, periodo_id) DO NOTHING;

  INSERT INTO gastos (periodo_id, descripcion, monto, categoria) VALUES
  (pid_feb, 'Cuota manejo tarjeta', 14900, 'admin'),
  (pid_feb, 'Retención Octus febrero', 203771, 'admin'),
  (pid_feb, 'Baldosas local 205', 196680, 'mantenimiento'),
  (pid_feb, 'Vidrios de las ventanas', 30000, 'mantenimiento'),
  (pid_feb, 'Boquilla', 15700, 'mantenimiento'),
  (pid_feb, 'Sikaseal silicona pegamento vidrios', 18900, 'mantenimiento'),
  (pid_feb, 'Trabajador (varios días)', 880000, 'mantenimiento'),
  (pid_feb, 'Empresa limpiadora de atrapagrasa', 450000, 'mantenimiento'),
  (pid_feb, 'Extractor del baño', 30000, 'mantenimiento'),
  (pid_feb, 'Vidrio', 4000, 'mantenimiento'),
  (pid_feb, 'Esquinero mortero tornillo', 16000, 'mantenimiento'),
  (pid_feb, 'Pintura Estucor', 115800, 'mantenimiento'),
  (pid_feb, 'Boquilla estuco tapón pegante', 52700, 'mantenimiento'),
  (pid_feb, 'Cemento blanco', 15000, 'mantenimiento'),
  (pid_feb, 'Granito blanco', 55200, 'mantenimiento'),
  (pid_feb, 'Broca tornillo anclaje concret', 22600, 'mantenimiento'),
  (pid_feb, 'Discos tornillos hexagonales', 126400, 'mantenimiento'),
  (pid_feb, 'Pintura negra anticorrosivo lijas', 138652, 'mantenimiento'),
  (pid_feb, 'Removedor estopa tiner', 31849, 'mantenimiento'),
  (pid_feb, 'Pintura tráfico disolvente brocha cinta', 66452, 'mantenimiento'),
  (pid_feb, 'Grapa silicona semicodos válvula PVC', 39900, 'mantenimiento'),
  (pid_feb, 'Pintura tráfico 1/4', 42000, 'mantenimiento');

  -- ── MARZO 2026 ───────────────────────────────────────────────
  INSERT INTO periodos (mes, anio, telesentinel, empleada, dias_aide, tasa_seguridad, estado, fecha_limite_pago)
  VALUES (3, 2026, 89000, 272000, 4, 0, 'cerrado', '2026-03-10')
  RETURNING id INTO pid_mar;

  INSERT INTO facturas (local_id, periodo_id, arriendo, agua_total, luz_total, alarma_total, empleada_total,
    retencion_total, total_servicios, total, estado_servicios, estado_arriendo,
    fecha_pago_servicios, fecha_pago_arriendo) VALUES
  (l101, pid_mar, 12447300, 0, 0, 0, 0, 0, 0, 12447300, 'pagado', 'pagado', '2026-03-30', '2026-03-30'),
  (l201, pid_mar, 2226000,  0, 0, 0, 0, ROUND(2226000*0.035), 0, 2226000, 'pagado', 'pagado', '2026-03-06', '2026-03-06'),
  (l202, pid_mar, 1455000,  0, 0, 0, 0, ROUND(1455000*0.035), 0, 1455000, 'pagado', 'pagado', '2026-03-06', '2026-03-06'),
  (l203, pid_mar, 1243000,  0, 0, 0, 0, ROUND(1243000*0.035), 0, 1243000, 'pagado', 'pagado', '2026-03-06', '2026-03-06'),
  (l204, pid_mar, 1429000,  0, 0, 0, 0, ROUND(1429000*0.035), 0, 1429000, 'pagado', 'pagado', '2026-03-06', '2026-03-06'),
  (l301, pid_mar, 1956993, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956993+89000/7+272000/13, 'pagado', 'pagado', '2026-03-27', '2026-03-27'),
  (l302, pid_mar, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-03-16', '2026-03-16'),
  (l303, pid_mar, 1960000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1960000+89000/7+272000/13, 'pagado', 'pagado', '2026-03-16', '2026-03-16'),
  (l304, pid_mar, 1757252, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1757252+89000/7+272000/13, 'pagado', 'pagado', '2026-03-12', '2026-03-12'),
  (l305, pid_mar, 3690800, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 3690800+89000/7+272000/13, 'pagado', 'pagado', '2026-03-30', '2026-03-30'),
  (l306, pid_mar, 2453000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2453000+89000/7+272000/13, 'pagado', 'pagado', '2026-03-05', '2026-03-05'),
  (l401, pid_mar, 5509300, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 5509300+89000/7+272000/13, 'pagado', 'pagado', '2026-03-30', '2026-03-30')
  ON CONFLICT (local_id, periodo_id) DO NOTHING;

  INSERT INTO gastos (periodo_id, descripcion, monto, categoria) VALUES
  (pid_mar, 'Cuota manejo tarjeta', 14900, 'admin'),
  (pid_mar, 'Retención Octus marzo', 222355, 'admin'),
  (pid_mar, 'Repuesto hidrolavadora', 180000, 'mantenimiento'),
  (pid_mar, 'Grifería lavaplatos', 79900, 'mantenimiento'),
  (pid_mar, 'Servicios EPM local 205 (desocupado)', 98300, 'servicios');

  -- ── ABRIL 2026 ───────────────────────────────────────────────
  INSERT INTO periodos (mes, anio, telesentinel, empleada, dias_aide, tasa_seguridad, estado, fecha_limite_pago)
  VALUES (4, 2026, 89000, 272000, 4, 0, 'cerrado', '2026-04-10')
  RETURNING id INTO pid_abr;

  INSERT INTO facturas (local_id, periodo_id, arriendo, agua_total, luz_total, alarma_total, empleada_total,
    retencion_total, total_servicios, total, estado_servicios, estado_arriendo,
    fecha_pago_servicios, fecha_pago_arriendo) VALUES
  (l101, pid_abr, 12447300, 0, 0, 0, 0, 0, 0, 12447300, 'pagado', 'pagado', '2026-04-29', '2026-04-29'),
  (l201, pid_abr, 2226000,  0, 0, 0, 0, ROUND(2226000*0.035), 0, 2226000, 'pagado', 'pagado', '2026-04-10', '2026-04-10'),
  (l202, pid_abr, 1455000,  0, 0, 0, 0, ROUND(1455000*0.035), 0, 1455000, 'pagado', 'pagado', '2026-04-10', '2026-04-10'),
  (l203, pid_abr, 1243000,  0, 0, 0, 0, ROUND(1243000*0.035), 0, 1243000, 'pagado', 'pagado', '2026-04-10', '2026-04-10'),
  (l204, pid_abr, 1429000,  0, 0, 0, 0, ROUND(1429000*0.035), 0, 1429000, 'pagado', 'pagado', '2026-04-10', '2026-04-10'),
  (l301, pid_abr, 1956993, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956993+89000/7+272000/13, 'pagado', 'pagado', '2026-04-23', '2026-04-23'),
  (l302, pid_abr, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-04-17', '2026-04-17'),
  (l303, pid_abr, 1960000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1960000+89000/7+272000/13, 'pagado', 'pagado', '2026-04-16', '2026-04-16'),
  (l304, pid_abr, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-04-08', '2026-04-08'),
  (l305, pid_abr, 3690800, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 3690800+89000/7+272000/13, 'pagado', 'pagado', '2026-04-30', '2026-04-30'),
  (l306, pid_abr, 2453000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2453000+89000/7+272000/13, 'pagado', 'pagado', '2026-04-06', '2026-04-06'),
  (l401, pid_abr, 5509300, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 5509300+89000/7+272000/13, 'pagado', 'pagado', '2026-04-30', '2026-04-30')
  ON CONFLICT (local_id, periodo_id) DO NOTHING;

  INSERT INTO gastos (periodo_id, descripcion, monto, categoria) VALUES
  (pid_abr, 'Cuota manejo tarjeta', 14900, 'admin'),
  (pid_abr, 'Retención Octus abril', 222355, 'admin'),
  (pid_abr, '50% pago rejas local 205', 900000, 'mantenimiento'),
  (pid_abr, 'Servicios del local 205 (desocupado)', 68831, 'servicios'),
  (pid_abr, 'Lanza de hidrolavadora Kärcher', 89900, 'mantenimiento');

  -- ── MAYO 2026 ────────────────────────────────────────────────
  INSERT INTO periodos (mes, anio, telesentinel, empleada, dias_aide, tasa_seguridad, estado, fecha_limite_pago)
  VALUES (5, 2026, 89000, 272000, 4, 0, 'cerrado', '2026-05-10')
  RETURNING id INTO pid_may;

  INSERT INTO facturas (local_id, periodo_id, arriendo, agua_total, luz_total, alarma_total, empleada_total,
    retencion_total, total_servicios, total, estado_servicios, estado_arriendo,
    fecha_pago_servicios, fecha_pago_arriendo) VALUES
  (l101, pid_may, 13704500, 0, 0, 0, 0, 0, 0, 13704500, 'pagado', 'pagado', '2026-06-01', '2026-06-01'),
  (l201, pid_may, 2226000,  0, 0, 0, 0, ROUND(2226000*0.035), 0, 2226000, 'pagado', 'pagado', '2026-05-08', '2026-05-08'),
  (l202, pid_may, 1455000,  0, 0, 0, 0, ROUND(1455000*0.035), 0, 1455000, 'pagado', 'pagado', '2026-05-08', '2026-05-08'),
  (l203, pid_may, 1243000,  0, 0, 0, 0, ROUND(1243000*0.035), 0, 1243000, 'pagado', 'pagado', '2026-05-08', '2026-05-08'),
  (l204, pid_may, 1429000,  0, 0, 0, 0, ROUND(1429000*0.035), 0, 1429000, 'pagado', 'pagado', '2026-05-08', '2026-05-08'),
  (l301, pid_may, 1956993, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956993+89000/7+272000/13, 'pagado', 'pagado', '2026-05-22', '2026-05-22'),
  (l302, pid_may, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-19', '2026-05-19'),
  (l303, pid_may, 1960000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1960000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-16', '2026-05-16'),
  (l304, pid_may, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-08', '2026-05-08'),
  (l305, pid_may, 3890800, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 3890800+89000/7+272000/13, 'pagado', 'pagado', '2026-05-28', '2026-05-28'),
  (l306, pid_may, 2453000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2453000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-06', '2026-05-06'),
  (l401, pid_may, 5509300, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 5509300+89000/7+272000/13, 'pagado', 'pagado', '2026-05-28', '2026-05-28')
  ON CONFLICT (local_id, periodo_id) DO NOTHING;

  INSERT INTO gastos (periodo_id, descripcion, monto, categoria) VALUES
  (pid_may, 'Cuota manejo tarjeta', 14900, 'admin'),
  (pid_may, 'Retención Octus mayo', 222355, 'admin'),
  (pid_may, '50% pago rejas local 205', 900000, 'mantenimiento'),
  (pid_may, 'Servicios del local 205 (desocupado)', 68831, 'servicios'),
  (pid_may, 'Candados', 127000, 'mantenimiento'),
  (pid_may, 'Copias llaves', 48000, 'mantenimiento');

  -- ── JUNIO 2026 ───────────────────────────────────────────────
  INSERT INTO periodos (mes, anio, telesentinel, empleada, dias_aide, tasa_seguridad, estado, fecha_limite_pago)
  VALUES (6, 2026, 89000, 272000, 4, 0, 'cerrado', '2026-06-10')
  RETURNING id INTO pid_jun;

  INSERT INTO facturas (local_id, periodo_id, arriendo, agua_total, luz_total, alarma_total, empleada_total,
    retencion_total, total_servicios, total, estado_servicios, estado_arriendo,
    fecha_pago_servicios, fecha_pago_arriendo) VALUES
  (l101, pid_jun, 13704500, 0, 0, 0, 0, 0, 0, 13704500, 'pagado', 'pagado', '2026-05-30', '2026-05-30'),
  (l201, pid_jun, 2226000,  0, 0, 0, 0, ROUND(2226000*0.035), 0, 2226000, 'pagado', 'pagado', '2026-06-06', '2026-06-06'),
  (l202, pid_jun, 1455000,  0, 0, 0, 0, ROUND(1455000*0.035), 0, 1455000, 'pagado', 'pagado', '2026-06-06', '2026-06-06'),
  (l203, pid_jun, 1243000,  0, 0, 0, 0, ROUND(1243000*0.035), 0, 1243000, 'pagado', 'pagado', '2026-06-06', '2026-06-06'),
  (l204, pid_jun, 1429000,  0, 0, 0, 0, ROUND(1429000*0.035), 0, 1429000, 'pagado', 'pagado', '2026-06-06', '2026-06-06'),
  (l205, pid_jun, 9200000,  0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 9200000+89000/7+272000/13, 'pagado', 'pagado', '2026-06-06', '2026-06-06'),
  (l301, pid_jun, 1956993, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1956993+89000/7+272000/13, 'pagado', 'pagado', '2026-05-22', '2026-05-22'),
  (l302, pid_jun, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-19', '2026-05-19'),
  (l303, pid_jun, 1960000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 1960000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-16', '2026-05-16'),
  (l304, pid_jun, 2350000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2350000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-08', '2026-05-08'),
  (l305, pid_jun, 3890800, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 3890800+89000/7+272000/13, 'pagado', 'pagado', '2026-05-28', '2026-05-28'),
  (l306, pid_jun, 2453000, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 2453000+89000/7+272000/13, 'pagado', 'pagado', '2026-05-06', '2026-05-06'),
  (l401, pid_jun, 5509300, 0, 0, 89000/7, 272000/13, 0, 89000/7+272000/13, 5509300+89000/7+272000/13, 'pagado', 'pagado', '2026-05-28', '2026-05-28')
  ON CONFLICT (local_id, periodo_id) DO NOTHING;

  INSERT INTO gastos (periodo_id, descripcion, monto, categoria) VALUES
  (pid_jun, 'Cuota manejo tarjeta', 14900, 'admin'),
  (pid_jun, 'Retención Octus junio', 222355, 'admin');

  RAISE NOTICE 'Migración histórica completada OK';
END $$;

-- =============================================================
-- FIN DE LA MIGRACIÓN
-- Verifica con: SELECT mes, anio, estado FROM periodos ORDER BY anio, mes;
-- =============================================================
