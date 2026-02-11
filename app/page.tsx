'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { DEFAULT_CHURCH_ID } from '@/lib/constants';

type Floor = { id: string; name: string; sort_order: number };

const TIMEOUT_MSG = 'Supabase 연결이 되지 않습니다. 1) Supabase SQL Editor에서 RLS 정책(20260214000000_rls_policies_anon_read.sql) 실행 2) 시드(seed.sql) 실행 3) .env.local의 URL·키 확인 4) 터미널에서 서버 재시작(npm run dev) 후 새로고침';

export default function HomePage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStuckButton, setShowStuckButton] = useState(false);

  const fetchFloors = () => {
    setLoading(true);
    setError(null);
    setShowStuckButton(false);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setLoading(false);
      setError('.env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY가 있는지 확인하고, 저장 후 서버를 재시작하세요. (npm run dev)');
      return;
    }

    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      setLoading(false);
      setError(TIMEOUT_MSG);
    }, 5000);

    const stuckTimer = setTimeout(() => setShowStuckButton(true), 3000);

    const supabase = createClient();
    supabase
      .from('floor')
      .select('id, name, sort_order')
      .eq('church_id', DEFAULT_CHURCH_ID)
      .order('sort_order')
      .then(({ data, error: e }) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        clearTimeout(stuckTimer);
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        setFloors((data as Floor[]) ?? []);
      })
      .then(undefined, (err: unknown) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        clearTimeout(stuckTimer);
        setLoading(false);
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      clearTimeout(timer);
      clearTimeout(stuckTimer);
    };
  };

  useEffect(() => {
    const cleanup = fetchFloors();
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  const handleStuckClick = () => {
    setLoading(false);
    setError(TIMEOUT_MSG);
  };

  if (loading) {
    return (
      <div className="card">
        <p>로딩 중...</p>
        {showStuckButton && (
          <button type="button" className="btnPrimary" style={{ marginTop: 12 }} onClick={handleStuckClick}>
            로딩이 멈췄다면 클릭 (해결 방법 보기)
          </button>
        )}
      </div>
    );
  }
  if (error) return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>오류</p>
      <p style={{ marginBottom: 12 }}>{error}</p>
      <p style={{ fontSize: 14, color: 'var(--color-neutral)', marginBottom: 12 }}>
        체크: 1) .env.local 2) Supabase RLS 정책 SQL 실행 3) seed.sql 실행 4) 서버 재시작
      </p>
      <button type="button" className="btnPrimary" onClick={fetchFloors}>
        다시 시도
      </button>
    </div>
  );

  return (
    <>
      <div className="testFlowCard">
        <strong>테스트 흐름</strong>
        <ol>
          <li>아래에서 <strong>층</strong> 선택 → 해당 층 <strong>공간 카드</strong>(청소·이슈·점검·비품) 확인</li>
          <li>공간 카드 클릭 → <strong>공간 상세</strong> → 「이슈 목록」 또는 「이슈 접수」</li>
          <li>이슈 접수: 유형·설명 입력 후 <strong>저장</strong> → 이슈 상세에서 <strong>확인 / 완료 처리 / 해결 완료 / 취소</strong> 동작 확인</li>
        </ol>
      </div>
      <h1 className="pageTitle">층 선택</h1>
      {floors.length === 0 ? (
        <p className="card">등록된 층이 없습니다. Supabase에 시드 데이터(supabase/seed.sql)를 적용해 주세요.</p>
      ) : (
        floors.map((f) => (
          <Link key={f.id} href={`/floor/${f.id}`} className="cardLink">
            {f.name}
          </Link>
        ))
      )}
    </>
  );
}
