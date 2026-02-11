-- Phase 3: 이슈(문제) 관리 핵심
-- 생애주기: 접수 → 확인 → 처리중 → 해결완료/반려. 이벤트 기반 room_status 갱신. 활동 로그.

-- =============================================================================
-- 1) 이슈 INSERT 시 church_id 자동 설정 (room → floor → church)
-- =============================================================================

CREATE OR REPLACE FUNCTION set_issue_church_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.church_id IS NULL THEN
    SELECT f.church_id INTO NEW.church_id
    FROM room r
    JOIN floor f ON f.id = r.floor_id
    WHERE r.id = NEW.room_id;
  END IF;
  IF NEW.status = 'received' AND NEW.received_at IS NULL THEN
    NEW.received_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_issue_set_church_id ON issue;
CREATE TRIGGER trg_issue_set_church_id
  BEFORE INSERT ON issue
  FOR EACH ROW EXECUTE FUNCTION set_issue_church_id();

-- =============================================================================
-- 2) 이슈 INSERT 시 room_status.open_issue_count +1
-- =============================================================================

CREATE OR REPLACE FUNCTION issue_after_insert_room_status()
RETURNS TRIGGER
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_issue_after_insert_room_status ON issue;
CREATE TRIGGER trg_issue_after_insert_room_status
  AFTER INSERT ON issue
  FOR EACH ROW EXECUTE FUNCTION issue_after_insert_room_status();

-- =============================================================================
-- 3) 이슈 UPDATE 시 resolved/rejected 되면 room_status.open_issue_count -1
-- =============================================================================

CREATE OR REPLACE FUNCTION issue_after_update_room_status()
RETURNS TRIGGER
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_issue_after_update_room_status ON issue;
CREATE TRIGGER trg_issue_after_update_room_status
  AFTER UPDATE ON issue
  FOR EACH ROW EXECUTE FUNCTION issue_after_update_room_status();

-- =============================================================================
-- 4) issue_activity_log: member_id nullable (Phase 3 비로그인 허용)
-- =============================================================================

ALTER TABLE issue_activity_log ALTER COLUMN member_id DROP NOT NULL;

-- =============================================================================
-- 5) RPC: 이슈 상태 변경 (확인 / 처리중 / 해결 / 반려) + 활동 로그
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_issue_confirm(p_issue_id uuid, p_member_id uuid DEFAULT NULL, p_content text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE issue SET status = 'confirmed', confirmed_by = p_member_id, confirmed_at = now(), updated_at = now()
  WHERE id = p_issue_id AND status = 'received';
  INSERT INTO issue_activity_log (issue_id, member_id, kind, content)
  VALUES (p_issue_id, p_member_id, 'process_memo', COALESCE(p_content, '확인'));
END;
$$;

CREATE OR REPLACE FUNCTION rpc_issue_progress(p_issue_id uuid, p_member_id uuid DEFAULT NULL, p_content text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE issue SET status = 'in_progress', updated_at = now()
  WHERE id = p_issue_id AND status IN ('received', 'confirmed');
  INSERT INTO issue_activity_log (issue_id, member_id, kind, content)
  VALUES (p_issue_id, p_member_id, 'process_memo', COALESCE(p_content, '처리 중'));
END;
$$;

CREATE OR REPLACE FUNCTION rpc_issue_resolve(p_issue_id uuid, p_member_id uuid DEFAULT NULL, p_content text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE issue SET status = 'resolved', resolved_by = p_member_id, resolved_at = now(), updated_at = now()
  WHERE id = p_issue_id AND status NOT IN ('resolved', 'rejected');
  INSERT INTO issue_activity_log (issue_id, member_id, kind, content)
  VALUES (p_issue_id, p_member_id, 'resolution_note', COALESCE(p_content, '해결 완료'));
END;
$$;

CREATE OR REPLACE FUNCTION rpc_issue_reject(p_issue_id uuid, p_member_id uuid DEFAULT NULL, p_reject_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE issue SET status = 'rejected', rejected_by = p_member_id, rejected_at = now(), reject_reason = p_reject_reason, updated_at = now()
  WHERE id = p_issue_id AND status NOT IN ('resolved', 'rejected');
  INSERT INTO issue_activity_log (issue_id, member_id, kind, content)
  VALUES (p_issue_id, p_member_id, 'reject_note', COALESCE(p_reject_reason, '반려'));
END;
$$;

-- =============================================================================
-- 6) RPC: 이슈 목록 (공간 기준, 한 번 호출)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_issue_list(p_room_id uuid)
RETURNS TABLE (
  id          uuid,
  room_id     uuid,
  issue_type  text,
  description text,
  status      issue_status_enum,
  created_at  timestamptz,
  room_name   text
)
LANGUAGE sql
STABLE
AS $$
  SELECT i.id, i.room_id, i.issue_type, i.description, i.status, i.created_at, r.name
  FROM issue i
  JOIN room r ON r.id = i.room_id
  WHERE i.room_id = p_room_id
  ORDER BY i.created_at DESC;
$$;

-- =============================================================================
-- 7) RPC: 이슈 상세 (한 번 호출로 이슈 + 활동 로그)
-- =============================================================================

DROP TYPE IF EXISTS issue_detail_row CASCADE;
CREATE TYPE issue_detail_row AS (
  id                uuid,
  room_id           uuid,
  room_name         text,
  issue_type        text,
  description       text,
  status            issue_status_enum,
  received_at       timestamptz,
  confirmed_at      timestamptz,
  resolved_at       timestamptz,
  rejected_at       timestamptz,
  reject_reason     text,
  created_at        timestamptz,
  activity_logs     jsonb
);

CREATE OR REPLACE FUNCTION rpc_issue_detail(p_issue_id uuid)
RETURNS SETOF issue_detail_row
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  r issue_detail_row;
BEGIN
  SELECT
    i.id,
    i.room_id,
    rm.name,
    i.issue_type,
    i.description,
    i.status,
    i.received_at,
    i.confirmed_at,
    i.resolved_at,
    i.rejected_at,
    i.reject_reason,
    i.created_at,
    (SELECT jsonb_agg(jsonb_build_object(
      'id', l.id, 'kind', l.kind, 'content', l.content, 'created_at', l.created_at
    ) ORDER BY l.created_at)
     FROM issue_activity_log l WHERE l.issue_id = i.id)
  INTO r.id, r.room_id, r.room_name, r.issue_type, r.description, r.status,
       r.received_at, r.confirmed_at, r.resolved_at, r.rejected_at, r.reject_reason, r.created_at, r.activity_logs
  FROM issue i
  JOIN room rm ON rm.id = i.room_id
  WHERE i.id = p_issue_id;
  IF r.id IS NOT NULL THEN
    RETURN NEXT r;
  END IF;
  RETURN;
END;
$$;

COMMENT ON FUNCTION rpc_issue_confirm(uuid, uuid, text) IS '이슈 확인. 수행자·시간·활동 로그 저장.';
COMMENT ON FUNCTION rpc_issue_reject(uuid, uuid, text) IS '이슈 반려. 반려 사유·활동 로그 저장.';
