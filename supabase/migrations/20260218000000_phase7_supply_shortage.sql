-- Phase 7: 비품 부족 — 등록/해제, room_status.shortage_count 이벤트 기반 갱신
-- rpc_room_detail / 공간 카드는 이미 shortage_count 반환 (Phase 2)

-- =============================================================================
-- 1) room_supply_shortage 변경 시 room_status.shortage_count 갱신 (SECURITY DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION room_supply_shortage_after_insert_room_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.resolved_at IS NULL THEN
    INSERT INTO room_status (room_id, status_date, shortage_count, updated_at)
    VALUES (NEW.room_id, (NEW.reported_at)::date, 1, now())
    ON CONFLICT (room_id, status_date)
    DO UPDATE SET shortage_count = room_status.shortage_count + 1, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION room_supply_shortage_after_update_room_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.resolved_at IS NULL AND NEW.resolved_at IS NOT NULL THEN
    INSERT INTO room_status (room_id, status_date, shortage_count, updated_at)
    VALUES (NEW.room_id, (NEW.reported_at)::date, 0, now())
    ON CONFLICT (room_id, status_date)
    DO UPDATE SET shortage_count = GREATEST(0, room_status.shortage_count - 1), updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supply_shortage_insert_room_status ON room_supply_shortage;
CREATE TRIGGER trg_supply_shortage_insert_room_status
  AFTER INSERT ON room_supply_shortage
  FOR EACH ROW EXECUTE FUNCTION room_supply_shortage_after_insert_room_status();

DROP TRIGGER IF EXISTS trg_supply_shortage_update_room_status ON room_supply_shortage;
CREATE TRIGGER trg_supply_shortage_update_room_status
  AFTER UPDATE OF resolved_at ON room_supply_shortage
  FOR EACH ROW EXECUTE FUNCTION room_supply_shortage_after_update_room_status();

-- =============================================================================
-- 2) API: 공간별 부족 비품 목록 (한 번 호출)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_room_supply_shortage_list(p_room_id uuid)
RETURNS TABLE (
  id          uuid,
  item_name   text,
  reported_at timestamptz,
  resolved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, item_name, reported_at, resolved_at
  FROM room_supply_shortage
  WHERE room_id = p_room_id
  ORDER BY reported_at DESC;
$$;

COMMENT ON FUNCTION rpc_room_supply_shortage_list(uuid) IS '공간별 부족 비품 목록.';

-- =============================================================================
-- 3) API: 부족 비품 등록 (수행자 선택)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_supply_shortage_add(p_room_id uuid, p_item_name text, p_reported_by uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO room_supply_shortage (room_id, item_name, reported_by)
  VALUES (p_room_id, p_item_name, p_reported_by)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION rpc_supply_shortage_add(uuid, text, uuid) IS '부족 비품 등록. 트리거로 room_status.shortage_count 반영.';

-- =============================================================================
-- 4) API: 부족 비품 해제(해결)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_supply_shortage_resolve(p_shortage_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE room_supply_shortage
  SET resolved_at = now()
  WHERE id = p_shortage_id AND resolved_at IS NULL;
END;
$$;

COMMENT ON FUNCTION rpc_supply_shortage_resolve(uuid) IS '부족 비품 해제. 트리거로 room_status.shortage_count 감소.';

-- RLS: anon이 shortage 조회/등록/해제 가능하도록 (테스트용). 테이블 정책 추가.
ALTER TABLE room_supply_shortage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_room_supply_shortage" ON room_supply_shortage;
CREATE POLICY "anon_select_room_supply_shortage" ON room_supply_shortage FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_room_supply_shortage" ON room_supply_shortage;
CREATE POLICY "anon_insert_room_supply_shortage" ON room_supply_shortage FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_room_supply_shortage" ON room_supply_shortage;
CREATE POLICY "anon_update_room_supply_shortage" ON room_supply_shortage FOR UPDATE TO anon USING (true) WITH CHECK (true);
