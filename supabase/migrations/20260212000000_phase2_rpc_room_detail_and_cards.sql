-- Phase 2: rpc_room_detail 구현 + rpc_floor_room_cards 추가
-- 공간 카드 4요소(청소 상태, 미해결 이슈 수, 점검 완료율, 부족 비품 수) 반환. 한 화면 한 API.
-- 반환 타입 변경 시 기존 함수를 먼저 제거해야 함.

DROP FUNCTION IF EXISTS rpc_room_detail(uuid, date);

-- =============================================================================
-- rpc_room_detail(room_id, date): 공간 상세 한 화면용 단일 RPC
-- =============================================================================

CREATE FUNCTION rpc_room_detail(p_room_id uuid, p_date date)
RETURNS TABLE (
  room_id                  uuid,
  floor_id                 uuid,
  room_name                text,
  floor_name               text,
  status_date              date,
  open_issue_count         int,
  clean_done_today         boolean,
  check_done_ratio_today   numeric,
  shortage_count           int,
  cleaning_cycle           cleaning_cycle_enum
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    f.id,
    r.name,
    f.name,
    p_date,
    COALESCE(rs.open_issue_count, 0)::int,
    COALESCE(rs.clean_done_today, false),
    COALESCE(rs.check_done_ratio_today, 0)::numeric(5,4),
    COALESCE(rs.shortage_count, 0)::int,
    r.cleaning_cycle
  FROM room r
  JOIN floor f ON f.id = r.floor_id
  LEFT JOIN room_status rs ON rs.room_id = r.id AND rs.status_date = p_date
  WHERE r.id = p_room_id;
$$;

COMMENT ON FUNCTION rpc_room_detail(uuid, date) IS '공간 상세 한 화면용. room + room_status(해당 날짜) 반환.';

-- =============================================================================
-- rpc_floor_room_cards(floor_id, date): 해당 층 공간 목록 + 4요소 (목록 화면 한 번 호출)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_floor_room_cards(p_floor_id uuid, p_date date)
RETURNS TABLE (
  room_id                  uuid,
  room_name                text,
  floor_name               text,
  cleaning_cycle           cleaning_cycle_enum,
  open_issue_count         int,
  clean_done_today         boolean,
  check_done_ratio_today   numeric,
  shortage_count           int
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    r.id,
    r.name,
    f.name,
    r.cleaning_cycle,
    COALESCE(rs.open_issue_count, 0)::int,
    COALESCE(rs.clean_done_today, false),
    COALESCE(rs.check_done_ratio_today, 0)::numeric(5,4),
    COALESCE(rs.shortage_count, 0)::int
  FROM room r
  JOIN floor f ON f.id = r.floor_id
  LEFT JOIN room_status rs ON rs.room_id = r.id AND rs.status_date = p_date
  WHERE r.floor_id = p_floor_id
  ORDER BY r.name;
$$;

COMMENT ON FUNCTION rpc_floor_room_cards(uuid, date) IS '층별 공간 카드 목록 + 4요소. 한 화면 한 API.';
