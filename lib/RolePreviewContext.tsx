'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRole } from '@/lib/useRole';
import type { ChurchRole } from '@/lib/roles';

type RolePreviewContextValue = {
  previewRole: ChurchRole | null;
  setPreviewRole: (role: ChurchRole | null) => void;
};

const RolePreviewContext = createContext<RolePreviewContextValue | null>(null);

export function RolePreviewProvider({ children }: { children: ReactNode }) {
  const [previewRole, setPreviewRole] = useState<ChurchRole | null>(null);
  const value: RolePreviewContextValue = {
    previewRole,
    setPreviewRole: useCallback((role: ChurchRole | null) => setPreviewRole(role), []),
  };
  return (
    <RolePreviewContext.Provider value={value}>
      {children}
    </RolePreviewContext.Provider>
  );
}

export function useRolePreviewContext(): RolePreviewContextValue | null {
  return useContext(RolePreviewContext);
}

/** 실제 역할(로그인)과 미리보기 역할을 합친 효과 역할. 미리보기 선택 시 해당 역할로 UI 제한. */
export function useEffectiveRole(churchId: string | null): ChurchRole | null {
  const ctx = useRolePreviewContext();
  const realRole = useRole(churchId);
  return ctx?.previewRole ?? realRole;
}
