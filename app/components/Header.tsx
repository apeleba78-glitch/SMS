'use client';

import Link from 'next/link';
import { useRolePreviewContext } from '@/lib/RolePreviewContext';
import { useEffectiveRole } from '@/lib/RolePreviewContext';
import { DEFAULT_CHURCH_ID } from '@/lib/constants';
import type { ChurchRole } from '@/lib/roles';

const ROLE_OPTIONS: { value: ChurchRole | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'admin', label: '총관리자' },
  { value: 'facility_lead', label: '팀장' },
  { value: 'facility_sublead', label: '부팀장' },
  { value: 'staff', label: '직원' },
  { value: 'external_cleaning', label: '청소외주' },
];

export default function Header() {
  const ctx = useRolePreviewContext();
  const previewRole = ctx?.previewRole ?? null;
  const setPreviewRole = ctx?.setPreviewRole;
  const role = useEffectiveRole(DEFAULT_CHURCH_ID);

  return (
    <header className="appHeader">
      <Link href="/" className="appHeaderTitle">공간 관리</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {role === 'admin' && (
          <Link href="/settings" className="btnSecondary" style={{ width: 'auto', padding: '6px 12px', fontSize: 12, lineHeight: 1.4 }}>
            설정
          </Link>
        )}
        {setPreviewRole && (
          <select
            value={previewRole ?? ''}
            onChange={(e) => setPreviewRole((e.target.value || null) as ChurchRole | null)}
            title="역할별 UI 보기"
            aria-label="역할 선택"
            style={{
              fontSize: 12,
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px solid #e5e5e5',
              background: '#fff',
              color: 'var(--color-neutral)',
            }}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <span className="appHeaderSub">테스트</span>
      </div>
    </header>
  );
}
