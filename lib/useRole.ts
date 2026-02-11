'use client';

import { useState, useEffect } from 'react';
import type { ChurchRole } from '@/lib/roles';

/**
 * 로그인 연동 시: supabase.auth.getUser() → rpc_member_role(churchId, user.id) 호출해 role 설정.
 * 현재는 비로그인 가정 → null 반환 (모든 버튼 노출).
 */
export function useRole(churchId: string | null): ChurchRole | null {
  const [role, setRole] = useState<ChurchRole | null>(null);

  useEffect(() => {
    if (!churchId) {
      setRole(null);
      return;
    }
    // TODO: Supabase Auth 연동 시
    // const supabase = createClient();
    // supabase.auth.getUser().then(({ data: { user } }) => {
    //   if (!user) { setRole(null); return; }
    //   supabase.rpc('rpc_member_role', { p_church_id: churchId, p_user_id: user.id })
    //     .then(({ data }) => setRole((data as ChurchRole) ?? null));
    // });
    setRole(null);
  }, [churchId]);

  return role;
}
