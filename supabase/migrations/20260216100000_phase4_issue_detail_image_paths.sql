-- Phase 4: 이슈 상세 RPC에 before/after 이미지 경로 포함

DROP FUNCTION IF EXISTS rpc_issue_detail(uuid);
DROP TYPE IF EXISTS issue_detail_row CASCADE;

CREATE TYPE issue_detail_row AS (
  id                uuid,
  room_id           uuid,
  room_name         text,
  issue_type        text,
  description       text,
  status            issue_status_enum,
  before_image_path text,
  after_image_path  text,
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
    i.before_image_path,
    i.after_image_path,
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
       r.before_image_path, r.after_image_path,
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
