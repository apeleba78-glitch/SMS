-- Phase 5: 청소 관리 — 주기 설정, 오늘 청소 목록 사전 생성, 완료 시 room_status 갱신
-- PROJECT_BASELINE: 실시간 계산 금지, 이벤트 기반 상태 업데이트

-- =============================================================================
-- 1) room.cleaning_weekdays: 주 2회/주 1회 시 요일 지정 (ISO 1=월..7=일, null이면 기본값 사용)
-- =============================================================================

ALTER TABLE room
  ADD COLUMN IF NOT EXISTS cleaning_weekdays smallint[] DEFAULT NULL;

COMMENT ON COLUMN room.cleaning_weekdays IS '청소 요일(ISO: 1=월..7=일). daily는 무시, twice_weekly 기본 [1,4], weekly 기본 [1]';

-- =============================================================================
-- 2) 오늘 청소할 공간 목록 사전 생성 (idempotent). 호출 시 해당 날짜 기준 누락 task만 INSERT
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_ensure_today_cleaning_tasks(p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_cleaning_task (room_id, task_date)
  SELECT r.id, p_date
  FROM room r
  WHERE (
    (r.cleaning_cycle = 'daily')
    OR (r.cleaning_cycle = 'twice_weekly' AND extract(isodow from p_date) = ANY(COALESCE(r.cleaning_weekdays, array[1, 4]::smallint[])))
    OR (r.cleaning_cycle = 'weekly'    AND extract(isodow from p_date) = ANY(COALESCE(r.cleaning_weekdays, array[1]::smallint[])))
    OR (r.cleaning_cycle = 'other'    AND extract(isodow from p_date) = ANY(COALESCE(r.cleaning_weekdays, array[1]::smallint[])))
  )
  ON CONFLICT (room_id, task_date) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION rpc_ensure_today_cleaning_tasks(date) IS '해당 날짜 기준 청소 대상 공간에 daily_cleaning_task 없으면 생성. idempotent.';

-- =============================================================================
-- 3) 오늘 청소 목록 조회 (층별 선택 가능). task_id, room_id, room_name, 완료 여부 등
-- =============================================================================

DROP TYPE IF EXISTS today_cleaning_row CASCADE;
CREATE TYPE today_cleaning_row AS (
  task_id       uuid,
  room_id       uuid,
  room_name     text,
  floor_name    text,
  task_date     date,
  completed_at  timestamptz,
  completed_by  uuid
);

CREATE OR REPLACE FUNCTION rpc_today_cleaning_list(p_floor_id uuid, p_date date)
RETURNS SETOF today_cleaning_row
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    r.id,
    r.name,
    f.name,
    t.task_date,
    t.completed_at,
    t.completed_by
  FROM daily_cleaning_task t
  JOIN room r ON r.id = t.room_id
  JOIN floor f ON f.id = r.floor_id
  WHERE t.task_date = p_date
    AND (p_floor_id IS NULL OR r.floor_id = p_floor_id)
  ORDER BY f.sort_order, r.name;
$$;

COMMENT ON FUNCTION rpc_today_cleaning_list(uuid, date) IS '오늘 청소 대상 목록. p_floor_id null이면 전체.';

-- =============================================================================
-- 4) 청소 완료: 담당자·완료 시간 기록 + room_status.clean_done_today = true
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_cleaning_complete(p_task_id uuid, p_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id  uuid;
  v_date     date;
BEGIN
  SELECT t.room_id, t.task_date INTO v_room_id, v_date
  FROM daily_cleaning_task t
  WHERE t.id = p_task_id;
  IF v_room_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE daily_cleaning_task
  SET completed_at = now(), completed_by = p_member_id
  WHERE id = p_task_id;

  INSERT INTO room_status (room_id, status_date, clean_done_today, updated_at)
  VALUES (v_room_id, v_date, true, now())
  ON CONFLICT (room_id, status_date)
  DO UPDATE SET clean_done_today = true, updated_at = now();
END;
$$;

COMMENT ON FUNCTION rpc_cleaning_complete(uuid, uuid) IS '청소 완료 처리. task 완료 + room_status.clean_done_today 갱신.';
