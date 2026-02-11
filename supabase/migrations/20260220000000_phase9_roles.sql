-- Phase 9: 역할·권한 — church_id 단위 권한, 수행자 저장 검증
-- member/role/church: church_member, church_role_enum 이미 존재 (Phase 0)

-- =============================================================================
-- RPC: 로그인 사용자의 해당 교회 역할 조회 (메뉴·버튼 제어용)
-- =============================================================================

CREATE OR REPLACE FUNCTION rpc_member_role(p_church_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text
  FROM church_member
  WHERE church_id = p_church_id AND member_id = p_user_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION rpc_member_role(uuid, uuid) IS '교회별 사용자 역할. 없으면 null.';

-- RLS: church_member 조회는 SECURITY DEFINER로 처리. anon이 profile/church_member 직접 읽을 수 있도록 정책 추가 시 로그인 연동 후 적용.
-- 현재는 RPC로만 역할 조회.
