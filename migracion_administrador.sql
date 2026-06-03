-- ================================================================
-- CASA LA37 — Marcar propietaria administradora
-- Ximena recibe el 10% de honorarios PRIMERO (antes de repartir),
-- y luego también recibe su 22.22% como propietaria sobre lo que queda.
-- ================================================================

-- 1. Agregar columna es_administrador a propietarios
ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS es_administrador BOOLEAN DEFAULT FALSE;

-- 2. Marcar a Ximena como administradora
--    (ajusta el nombre si difiere en tu DB)
UPDATE propietarios
SET es_administrador = TRUE
WHERE nombre ILIKE '%ximena%';

-- Verifica:
SELECT nombre, porcentaje_real, es_administrador
FROM propietarios
ORDER BY nombre;
