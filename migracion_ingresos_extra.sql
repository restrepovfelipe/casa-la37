-- ================================================================
-- CASA LA37 — Ingresos extraordinarios
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS ingresos_extra (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo_id  UUID REFERENCES periodos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  monto       DECIMAL(12,2) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ingresos_extra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access ingresos_extra" ON ingresos_extra;
CREATE POLICY "Admin full access ingresos_extra" ON ingresos_extra FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin'));

-- 2. Pago SURA enero 2026
--    SURA pagó $24.712.165 por el seguro de Hikani (nov + dic 2025 + ene 2026)
INSERT INTO ingresos_extra (periodo_id, descripcion, monto)
SELECT id, 'Pago SURA — seguro Hikani Local 205 (nov/dic 2025 + ene 2026)', 24712165
FROM periodos WHERE mes = 1 AND anio = 2026
ON CONFLICT DO NOTHING;

-- Verifica:
SELECT p.mes, p.anio, i.descripcion, i.monto
FROM ingresos_extra i
JOIN periodos p ON p.id = i.periodo_id
ORDER BY p.anio, p.mes;
