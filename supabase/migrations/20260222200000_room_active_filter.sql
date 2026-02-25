-- 층/공간 목록에서 비활성(is_active=false) 공간 제외

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
LANGUAGE sql STABLE
AS $$
  SELECT r.id, r.name, f.name, r.cleaning_cycle,
    COALESCE(rs.open_issue_count, 0)::int,
    COALESCE(rs.clean_done_today, false),
    COALESCE(rs.check_done_ratio_today, 0)::numeric(5,4),
    COALESCE(rs.shortage_count, 0)::int
  FROM room r
  JOIN floor f ON f.id = r.floor_id
  LEFT JOIN room_status rs ON rs.room_id = r.id AND rs.status_date = p_date
  WHERE r.floor_id = p_floor_id AND COALESCE(r.is_active, true) = true
  ORDER BY r.name;
$$;

-- rpc_room_detail은 단일 room 조회이므로 비활성이라도 상세 진입은 허용 (또는 404 처리는 앱에서)
-- 여기서는 목록만 비활성 제외.
