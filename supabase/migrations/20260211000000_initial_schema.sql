-- Phase 0: 공간 관리 시스템 초기 스키마
-- PROJECT_BASELINE.md 및 단계별_구현_프롬프트.md 준수
-- 모든 시간: timestamptz, 상태: enum, FK 인덱스 적용

-- =============================================================================
-- ENUMS (magic string 금지)
-- =============================================================================

CREATE TYPE issue_status_enum AS ENUM (
  'received',    -- 접수
  'confirmed',   -- 확인
  'in_progress', -- 처리중
  'resolved',    -- 해결완료
  'rejected'     -- 반려
);

CREATE TYPE cleaning_cycle_enum AS ENUM (
  'daily',
  'twice_weekly',
  'weekly',
  'other'
);

CREATE TYPE church_role_enum AS ENUM (
  'admin',
  'facility_lead',
  'facility_sublead',
  'staff',
  'external_cleaning'
);

CREATE TYPE issue_activity_kind_enum AS ENUM (
  'received_note',
  'process_memo',
  'resolution_note',
  'reject_note',
  'comment'
);

-- =============================================================================
-- CORE: Church → Floor → Room
-- =============================================================================

CREATE TABLE church (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  timezone   text NOT NULL DEFAULT 'Asia/Seoul',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE floor (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  uuid NOT NULL REFERENCES church(id) ON DELETE CASCADE,
  name       text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_floor_church_id ON floor(church_id);

CREATE TABLE room (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        uuid NOT NULL REFERENCES floor(id) ON DELETE CASCADE,
  name            text NOT NULL,
  cleaning_cycle  cleaning_cycle_enum NOT NULL DEFAULT 'daily',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_floor_id ON room(floor_id);

-- =============================================================================
-- STATUS: room_status (현재 상태 전용, 이벤트 기반 갱신)
-- =============================================================================

CREATE TABLE room_status (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id                  uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  status_date              date NOT NULL,
  open_issue_count         int NOT NULL DEFAULT 0,
  clean_done_today         boolean NOT NULL DEFAULT false,
  check_done_ratio_today   numeric(5,4) NOT NULL DEFAULT 0,
  shortage_count           int NOT NULL DEFAULT 0,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, status_date)
);

CREATE INDEX idx_room_status_room_id ON room_status(room_id);
CREATE INDEX idx_room_status_status_date ON room_status(status_date);
CREATE INDEX idx_room_status_room_date ON room_status(room_id, status_date);

-- =============================================================================
-- MEMBER & ROLE (church_id 단위)
-- =============================================================================

CREATE TABLE profile (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE church_member (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  uuid NOT NULL REFERENCES church(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  role       church_role_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(church_id, member_id)
);

CREATE INDEX idx_church_member_church_id ON church_member(church_id);
CREATE INDEX idx_church_member_member_id ON church_member(member_id);

-- =============================================================================
-- ISSUE (이슈 테이블 + 활동 로그 분리)
-- =============================================================================

CREATE TABLE issue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id         uuid NOT NULL REFERENCES church(id) ON DELETE CASCADE,
  room_id           uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  issue_type        text NOT NULL,
  description       text,
  status            issue_status_enum NOT NULL DEFAULT 'received',
  before_image_path text,
  after_image_path  text,
  received_by       uuid REFERENCES profile(id),
  received_at       timestamptz,
  confirmed_by      uuid REFERENCES profile(id),
  confirmed_at      timestamptz,
  resolved_by       uuid REFERENCES profile(id),
  resolved_at       timestamptz,
  rejected_by       uuid REFERENCES profile(id),
  rejected_at       timestamptz,
  reject_reason     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_room_id ON issue(room_id);
CREATE INDEX idx_issue_church_id ON issue(church_id);
CREATE INDEX idx_issue_status ON issue(status);
CREATE INDEX idx_issue_created_at ON issue(created_at);

CREATE TABLE issue_activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid NOT NULL REFERENCES issue(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES profile(id),
  kind        issue_activity_kind_enum NOT NULL,
  content     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_activity_log_issue_id ON issue_activity_log(issue_id);
CREATE INDEX idx_issue_activity_log_created_at ON issue_activity_log(created_at);

-- =============================================================================
-- CLEANING (일일 할당·완료 기록, 로그/상태 분리)
-- =============================================================================

CREATE TABLE daily_cleaning_task (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  task_date     date NOT NULL,
  assigned_to   uuid REFERENCES profile(id),
  completed_at  timestamptz,
  completed_by  uuid REFERENCES profile(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, task_date)
);

CREATE INDEX idx_daily_cleaning_task_room_id ON daily_cleaning_task(room_id);
CREATE INDEX idx_daily_cleaning_task_task_date ON daily_cleaning_task(task_date);
CREATE INDEX idx_daily_cleaning_task_room_date ON daily_cleaning_task(room_id, task_date);

-- =============================================================================
-- CHECKLIST (공간별 템플릿·일일 계획·완료 기록)
-- =============================================================================

CREATE TABLE check_template_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  name        text NOT NULL,
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_check_template_item_room_id ON check_template_item(room_id);

CREATE TABLE daily_check_plan (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  plan_date         date NOT NULL,
  template_item_id  uuid NOT NULL REFERENCES check_template_item(id) ON DELETE CASCADE,
  completed_at      timestamptz,
  completed_by      uuid REFERENCES profile(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, plan_date, template_item_id)
);

CREATE INDEX idx_daily_check_plan_room_id ON daily_check_plan(room_id);
CREATE INDEX idx_daily_check_plan_plan_date ON daily_check_plan(plan_date);
CREATE INDEX idx_daily_check_plan_room_date ON daily_check_plan(room_id, plan_date);

-- =============================================================================
-- SUPPLY SHORTAGE (공간별 부족 비품, room_status.shortage_count 이벤트 갱신)
-- =============================================================================

CREATE TABLE room_supply_shortage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  item_name    text NOT NULL,
  reported_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  reported_by  uuid REFERENCES profile(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_supply_shortage_room_id ON room_supply_shortage(room_id);
CREATE INDEX idx_room_supply_shortage_reported_at ON room_supply_shortage(reported_at);

-- =============================================================================
-- BOOKING (사용 스케줄, Phase 8)
-- =============================================================================

CREATE TABLE room_booking (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES profile(id),
  start_at   timestamptz NOT NULL,
  end_at     timestamptz NOT NULL,
  purpose    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_booking_room_id ON room_booking(room_id);
CREATE INDEX idx_room_booking_start_at ON room_booking(start_at);
CREATE INDEX idx_room_booking_room_start ON room_booking(room_id, start_at);

-- =============================================================================
-- RPC STUB: rpc_room_detail(room_id, date) — 한 화면 = 한 API
-- 반환 타입만 정의, 본문은 빈 결과 (Phase 2에서 구현)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_room_detail(p_room_id uuid, p_date date)
RETURNS TABLE (
  room_id                  uuid,
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
  -- Phase 0: 스텁. Phase 2에서 실제 조인·반환 구현
  SELECT
    r.id,
    r.name,
    f.name,
    p_date,
    0::int,
    false,
    0::numeric,
    0::int,
    r.cleaning_cycle
  FROM room r
  JOIN floor f ON f.id = r.floor_id
  WHERE r.id = p_room_id
  LIMIT 0;  -- 빈 결과로 스텁
$$;

COMMENT ON FUNCTION rpc_room_detail(uuid, date) IS '공간 상세 한 화면용 단일 RPC. Phase 2에서 room_status 등 연동 구현.';
