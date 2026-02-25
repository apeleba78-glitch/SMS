-- 총관리자 설정용 RPC (SECURITY DEFINER, 추후 역할 검증 추가 가능)

-- =============================================================================
-- 층(Floor) CRUD
-- =============================================================================
CREATE OR REPLACE FUNCTION rpc_admin_floor_create(p_church_id uuid, p_name text, p_sort_order smallint DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO floor (church_id, name, sort_order) VALUES (p_church_id, p_name, p_sort_order) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_floor_update(p_floor_id uuid, p_name text, p_sort_order smallint DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE floor SET name = p_name, sort_order = p_sort_order WHERE id = p_floor_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_floor_delete(p_floor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM floor WHERE id = p_floor_id;
END; $$;

-- =============================================================================
-- 공간(Room) CRUD (목록은 기존 floor room 조인 또는 별도 select)
-- =============================================================================
CREATE OR REPLACE FUNCTION rpc_admin_room_list(p_floor_id uuid)
RETURNS TABLE (id uuid, name text, cleaning_cycle text, cleaning_weekdays smallint[], is_active boolean, sort_order smallint)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT r.id, r.name, r.cleaning_cycle::text, r.cleaning_weekdays, COALESCE(r.is_active, true), 0::smallint
  FROM room r WHERE r.floor_id = p_floor_id ORDER BY r.name;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_room_create(p_floor_id uuid, p_name text, p_cleaning_cycle text DEFAULT 'daily', p_cleaning_weekdays smallint[] DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO room (floor_id, name, cleaning_cycle, cleaning_weekdays)
  VALUES (p_floor_id, p_name, p_cleaning_cycle::cleaning_cycle_enum, p_cleaning_weekdays)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_room_update(p_room_id uuid, p_name text, p_cleaning_cycle text DEFAULT 'daily', p_cleaning_weekdays smallint[] DEFAULT NULL, p_is_active boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE room SET name = p_name, cleaning_cycle = p_cleaning_cycle::cleaning_cycle_enum, cleaning_weekdays = p_cleaning_weekdays, is_active = p_is_active, updated_at = now() WHERE id = p_room_id;
END; $$;

-- =============================================================================
-- 체크리스트 항목 (check_template_item) CRUD — item_type 포함
-- =============================================================================
CREATE OR REPLACE FUNCTION rpc_admin_check_item_list(p_room_id uuid, p_type text DEFAULT NULL)
RETURNS TABLE (id uuid, name text, item_type text, sort_order smallint)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, name, item_type, sort_order FROM check_template_item
  WHERE room_id = p_room_id AND (p_type IS NULL OR item_type = p_type)
  ORDER BY sort_order, name;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_check_item_create(p_room_id uuid, p_name text, p_item_type text DEFAULT 'general', p_sort_order smallint DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO check_template_item (room_id, name, item_type, sort_order) VALUES (p_room_id, p_name, p_item_type, p_sort_order) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_check_item_update(p_item_id uuid, p_name text, p_sort_order smallint DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE check_template_item SET name = p_name, sort_order = p_sort_order WHERE id = p_item_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_check_item_delete(p_item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM check_template_item WHERE id = p_item_id;
END; $$;

-- =============================================================================
-- 공간 비품(room_inventory_item) CRUD
-- =============================================================================
CREATE OR REPLACE FUNCTION rpc_admin_inventory_list(p_room_id uuid)
RETURNS TABLE (id uuid, item_name text, quantity int, sort_order smallint)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, item_name, quantity, sort_order FROM room_inventory_item WHERE room_id = p_room_id ORDER BY sort_order, item_name;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_inventory_create(p_room_id uuid, p_item_name text, p_quantity int DEFAULT NULL, p_sort_order smallint DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO room_inventory_item (room_id, item_name, quantity, sort_order) VALUES (p_room_id, p_item_name, p_quantity, p_sort_order) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_inventory_update(p_item_id uuid, p_item_name text, p_quantity int DEFAULT NULL, p_sort_order smallint DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE room_inventory_item SET item_name = p_item_name, quantity = p_quantity, sort_order = p_sort_order WHERE id = p_item_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_inventory_delete(p_item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM room_inventory_item WHERE id = p_item_id;
END; $$;

-- =============================================================================
-- 사용 스케줄 템플릿(room_schedule_template) CRUD
-- =============================================================================
CREATE OR REPLACE FUNCTION rpc_admin_schedule_list(p_room_id uuid)
RETURNS TABLE (id uuid, day_of_week smallint, start_time time, end_time time, purpose text, sort_order smallint)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, day_of_week, start_time, end_time, purpose, sort_order FROM room_schedule_template WHERE room_id = p_room_id ORDER BY day_of_week, start_time;
$$;

CREATE OR REPLACE FUNCTION rpc_admin_schedule_create(p_room_id uuid, p_day_of_week smallint, p_start_time time, p_end_time time, p_purpose text DEFAULT NULL, p_sort_order smallint DEFAULT 0)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO room_schedule_template (room_id, day_of_week, start_time, end_time, purpose, sort_order)
  VALUES (p_room_id, p_day_of_week, p_start_time, p_end_time, p_purpose, p_sort_order) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_schedule_update(p_id uuid, p_day_of_week smallint, p_start_time time, p_end_time time, p_purpose text DEFAULT NULL, p_sort_order smallint DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE room_schedule_template SET day_of_week = p_day_of_week, start_time = p_start_time, end_time = p_end_time, purpose = p_purpose, sort_order = p_sort_order WHERE id = p_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_schedule_delete(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM room_schedule_template WHERE id = p_id;
END; $$;

-- anon이 설정용 RPC 호출 가능 (테스트/비로그인 시 총관리자 역할 선택으로 설정 화면 사용)
GRANT EXECUTE ON FUNCTION rpc_admin_floor_create(uuid, text, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_floor_update(uuid, text, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_floor_delete(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_room_list(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_room_create(uuid, text, text, smallint[]) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_room_update(uuid, text, text, smallint[], boolean) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_check_item_list(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_check_item_create(uuid, text, text, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_check_item_update(uuid, text, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_check_item_delete(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_inventory_list(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_inventory_create(uuid, text, int, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_inventory_update(uuid, text, int, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_inventory_delete(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_schedule_list(uuid) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_schedule_create(uuid, smallint, time, time, text, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_schedule_update(uuid, smallint, time, time, text, smallint) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_schedule_delete(uuid) TO anon;
