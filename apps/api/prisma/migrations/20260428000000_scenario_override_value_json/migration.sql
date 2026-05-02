-- P0.3: Convert scenario_overrides.override_value from TEXT/VARCHAR to JSONB.
--
-- Rationale: storing override values as untyped strings allowed malformed
-- numeric/boolean payloads to round-trip silently and corrupt projections at
-- read time. Validation now happens at the API write boundary
-- (scenarioOverrideSchema in @finance-app/validation) and the column stores
-- the typed JSON value directly.
--
-- Pre-alpha assumption: rows in this column are short string fragments
-- ("12500", "0.04", "monthly", an ISO date, etc) that may NOT all parse as
-- valid JSON literals. To avoid an aborted migration, we wrap every
-- existing value as a JSON string. Application code reads only via the
-- validated path, so wrapped legacy strings will fail validation on next
-- read and the user will be prompted to recreate the override — which is
-- the intended outcome for malformed data.
--
-- If you have not deployed yet (pre-alpha), running this on an empty table
-- is a no-op cast.

ALTER TABLE "scenario_overrides"
  ALTER COLUMN "override_value" TYPE JSONB
  USING to_jsonb("override_value");
