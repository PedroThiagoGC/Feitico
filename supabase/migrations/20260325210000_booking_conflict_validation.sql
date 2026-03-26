-- Migration: booking_conflict_validation
-- Adiciona validação server-side de conflito de agendamento via trigger BEFORE INSERT/UPDATE.
-- Garante integridade mesmo quando múltiplos clientes gravam simultaneamente.

-- ─── 1. Função de verificação de conflito ────────────────────────────────────

CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_professional_id UUID,
  p_booking_date DATE,
  p_booking_time TIME,
  p_total_occupied_minutes INTEGER,
  p_exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  p_start_min INTEGER;
  p_end_min   INTEGER;
  conflict_count INTEGER;
BEGIN
  -- Walk-in ou sem tempo definido: sem conflito de horário
  IF p_booking_time IS NULL OR p_total_occupied_minutes IS NULL OR p_total_occupied_minutes <= 0 THEN
    RETURN FALSE;
  END IF;

  p_start_min := EXTRACT(HOUR FROM p_booking_time)::INTEGER * 60
               + EXTRACT(MINUTE FROM p_booking_time)::INTEGER;
  p_end_min   := p_start_min + p_total_occupied_minutes;

  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE professional_id = p_professional_id
    AND booking_date = p_booking_date
    AND booking_time IS NOT NULL
    AND status IN ('pending', 'confirmed')
    AND (p_exclude_id IS NULL OR id != p_exclude_id)
    AND (
      EXTRACT(HOUR FROM booking_time)::INTEGER * 60
      + EXTRACT(MINUTE FROM booking_time)::INTEGER
    ) < p_end_min
    AND (
      EXTRACT(HOUR FROM booking_time)::INTEGER * 60
      + EXTRACT(MINUTE FROM booking_time)::INTEGER
      + COALESCE(total_occupied_minutes, total_duration, 30)
    ) > p_start_min;

  RETURN conflict_count > 0;
END;
$$;

-- ─── 2. Função trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_booking_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só valida agendamentos com horário definido e profissional atribuído
  IF NEW.booking_time IS NOT NULL AND NEW.professional_id IS NOT NULL THEN
    IF check_booking_conflict(
      NEW.professional_id,
      NEW.booking_date::DATE,
      NEW.booking_time::TIME,
      NEW.total_occupied_minutes,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) THEN
      RAISE EXCEPTION 'BOOKING_CONFLICT'
        USING DETAIL = 'Profissional já possui agendamento neste horário.',
              HINT   = 'Escolha outro horário ou profissional.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 3. Trigger na tabela bookings ───────────────────────────────────────────

DROP TRIGGER IF EXISTS booking_conflict_check ON bookings;

CREATE TRIGGER booking_conflict_check
  BEFORE INSERT OR UPDATE OF booking_time, professional_id, total_occupied_minutes, status
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_booking_conflict();

-- ─── 4. Comentários para DBA ─────────────────────────────────────────────────

-- Função RPC pública para pre-check client-side opcional
COMMENT ON FUNCTION check_booking_conflict IS
  'Verifica conflito de agendamento para um profissional em data/hora específica. Retorna TRUE se há conflito.';

-- ─── 5. Grant de execução via RPC Supabase ───────────────────────────────────

GRANT EXECUTE ON FUNCTION check_booking_conflict(UUID, DATE, TIME, INTEGER, UUID) TO anon, authenticated;
