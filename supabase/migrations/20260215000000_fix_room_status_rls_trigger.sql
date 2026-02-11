-- room_status RLS 오류 수정: 이슈 INSERT/UPDATE 트리거가 room_status를 수정할 수 있도록
-- 트리거 함수를 SECURITY DEFINER로 변경 (소유자 권한으로 실행 → RLS 통과)

CREATE OR REPLACE FUNCTION issue_after_insert_room_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO room_status (room_id, status_date, open_issue_count, updated_at)
  VALUES (NEW.room_id, CURRENT_DATE, 1, now())
  ON CONFLICT (room_id, status_date) DO UPDATE SET
    open_issue_count = room_status.open_issue_count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION issue_after_update_room_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('resolved', 'rejected') AND OLD.status NOT IN ('resolved', 'rejected') THEN
    UPDATE room_status
    SET open_issue_count = GREATEST(0, open_issue_count - 1), updated_at = now()
    WHERE room_id = NEW.room_id AND status_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION issue_after_insert_room_status() IS '이슈 생성 시 room_status +1. SECURITY DEFINER로 RLS 우회.';
COMMENT ON FUNCTION issue_after_update_room_status() IS '이슈 해결/반려 시 room_status -1. SECURITY DEFINER로 RLS 우회.';
