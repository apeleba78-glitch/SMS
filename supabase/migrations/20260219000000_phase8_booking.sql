-- Phase 8: 공간 사용 스케줄(예약) — 특정 공간·날짜 기준 목록 조회, 한 화면 한 API

-- member_id nullable로 두어 비로그인 테스트 가능 (Phase 9에서 수행자 필수 시 검증)
ALTER TABLE room_booking
  ALTER COLUMN member_id DROP NOT NULL;

-- 날짜 기반 조회용 복합 인덱스 (해당 날짜에 걸친 예약 검색)
CREATE INDEX IF NOT EXISTS idx_room_booking_end_at ON room_booking(end_at);

-- =============================================================================
-- API: 특정 공간·날짜 기준 예약 목록 (해당 날짜와 겹치는 예약만, 필요한 컬럼만)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_room_booking_list(p_room_id uuid, p_date date)
RETURNS TABLE (
  id        uuid,
  start_at  timestamptz,
  end_at    timestamptz,
  purpose   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, start_at, end_at, purpose
  FROM room_booking
  WHERE room_id = p_room_id
    AND start_at::date <= p_date
    AND end_at::date >= p_date
  ORDER BY start_at;
$$;

COMMENT ON FUNCTION rpc_room_booking_list(uuid, date) IS '해당 공간·날짜에 걸친 예약 목록. 한 번 호출.';

-- =============================================================================
-- API: 날짜별 전체 예약 목록 (캘린더용, 한 번 호출)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_booking_list_by_date(p_floor_id uuid, p_date date)
RETURNS TABLE (
  id         uuid,
  room_id    uuid,
  room_name  text,
  start_at   timestamptz,
  end_at     timestamptz,
  purpose    text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT b.id, r.id, r.name, b.start_at, b.end_at, b.purpose
  FROM room_booking b
  JOIN room r ON r.id = b.room_id
  WHERE r.floor_id = p_floor_id
    AND b.start_at::date <= p_date
    AND b.end_at::date >= p_date
  ORDER BY b.start_at, r.name;
$$;

COMMENT ON FUNCTION rpc_booking_list_by_date(uuid, date) IS '층·날짜 기준 예약 목록. 캘린더/목록용.';

-- RLS: anon 읽기/쓰기 (테스트)
ALTER TABLE room_booking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_room_booking" ON room_booking;
CREATE POLICY "anon_select_room_booking" ON room_booking FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_room_booking" ON room_booking;
CREATE POLICY "anon_insert_room_booking" ON room_booking FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_room_booking" ON room_booking;
CREATE POLICY "anon_delete_room_booking" ON room_booking FOR DELETE TO anon USING (true);
