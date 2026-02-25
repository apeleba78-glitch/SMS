-- 총관리자 설정: 층·공간, 청소체크리스트(4타입), 공간별 비품, 사용 스케줄 템플릿

-- =============================================================================
-- 1) room.is_active (비활성 공간 제외용)
-- =============================================================================
ALTER TABLE room ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- =============================================================================
-- 2) 체크리스트 항목 타입: 청소(관리전/후/전후/일반), 소방, 전기, 일반
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE check_item_type_enum AS ENUM (
    'cleaning_before_photo',   -- 관리전 사진
    'cleaning_after_photo',    -- 관리후 사진
    'cleaning_before_after_photo', -- 관리전후 사진
    'cleaning_general',        -- 일반 체크리스트
    'fire',                    -- 소방점검
    'electrical',              -- 전기 점검
    'general'                  -- 기타 점검
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE check_template_item
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'general';

-- 기존 컬럼이 있으면 enum으로 바꾸지 않고 text 유지 (호환)
COMMENT ON COLUMN check_template_item.item_type IS 'cleaning_before_photo, cleaning_after_photo, cleaning_before_after_photo, cleaning_general, fire, electrical, general';

-- =============================================================================
-- 3) 점검 완료 시 사진 경로 (청소 사진 타입용)
-- =============================================================================
ALTER TABLE daily_check_plan
  ADD COLUMN IF NOT EXISTS before_image_path text,
  ADD COLUMN IF NOT EXISTS after_image_path text;

-- =============================================================================
-- 4) 공간별 비품/물품 마스터 (이 공간에 있는 것)
-- =============================================================================
CREATE TABLE IF NOT EXISTS room_inventory_item (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  item_name   text NOT NULL,
  quantity    int,
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_room_inventory_item_room_id ON room_inventory_item(room_id);

-- =============================================================================
-- 5) 공간 사용 스케줄 템플릿 (반복: 요일·시간대)
-- =============================================================================
CREATE TABLE IF NOT EXISTS room_schedule_template (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES room(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,  -- 1=월..7=일 (ISO)
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  purpose     text,
  sort_order  smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_room_schedule_template_room_id ON room_schedule_template(room_id);
