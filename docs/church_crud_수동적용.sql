-- Supabase SQL Editor에 붙여넣어 실행하세요. (rpc_admin_church_update 등이 없을 때)

CREATE OR REPLACE FUNCTION rpc_admin_church_create(p_name text, p_timezone text DEFAULT 'Asia/Seoul')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO church (name, timezone) VALUES (p_name, p_timezone) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_church_update(p_church_id uuid, p_name text, p_timezone text DEFAULT 'Asia/Seoul')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE church SET name = p_name, timezone = p_timezone, updated_at = now() WHERE id = p_church_id;
END; $$;

CREATE OR REPLACE FUNCTION rpc_admin_church_delete(p_church_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM church WHERE id = p_church_id;
END; $$;

GRANT EXECUTE ON FUNCTION rpc_admin_church_create(text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_church_update(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION rpc_admin_church_delete(uuid) TO anon;
