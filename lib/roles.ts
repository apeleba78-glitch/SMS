/**
 * Phase 9: church_id 단위 권한.
 * PROJECT_BASELINE 7장: admin(전체), facility_lead(이슈 처리), facility_sublead(이슈 확인), staff(접수·완료 처리).
 * 로그인 미구현 시 role = null → 모든 버튼 노출(테스트용).
 */

export type ChurchRole = 'admin' | 'facility_lead' | 'facility_sublead' | 'staff' | 'external_cleaning';

const ROLE_ORDER: Record<ChurchRole, number> = {
  admin: 4,
  facility_lead: 3,
  facility_sublead: 2,
  staff: 1,
  external_cleaning: 0,
};

/** 역할이 최소 수준 이상인지 */
function hasAtLeast(role: ChurchRole | null, min: ChurchRole): boolean {
  if (!role) return true; // 비로그인: 테스트용 전체 허용
  return ROLE_ORDER[role] >= ROLE_ORDER[min];
}

/** 이슈 접수 가능 (staff 이상) */
export function canReceiveIssue(role: ChurchRole | null): boolean {
  return hasAtLeast(role, 'staff');
}

/** 이슈 확인 가능 (facility_sublead 이상) */
export function canConfirmIssue(role: ChurchRole | null): boolean {
  return hasAtLeast(role, 'facility_sublead');
}

/** 완료 처리 가능 (staff 이상) */
export function canProgressIssue(role: ChurchRole | null): boolean {
  return hasAtLeast(role, 'staff');
}

/** 해결 완료 가능 (facility_lead 이상) */
export function canResolveIssue(role: ChurchRole | null): boolean {
  return hasAtLeast(role, 'facility_lead');
}

/** 이슈 반려 가능 (facility_lead 이상) */
export function canRejectIssue(role: ChurchRole | null): boolean {
  return hasAtLeast(role, 'facility_lead');
}

/** 청소 완료 처리 가능 (staff 또는 external_cleaning) */
export function canCompleteCleaning(role: ChurchRole | null): boolean {
  if (!role) return true;
  return ['admin', 'facility_lead', 'facility_sublead', 'staff', 'external_cleaning'].includes(role);
}

/** 비품 등록/해제 (staff 이상) */
export function canManageSupply(role: ChurchRole | null): boolean {
  return hasAtLeast(role, 'staff');
}
