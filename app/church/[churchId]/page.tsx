'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type Floor = { id: string; name: string; sort_order: number };
type Room = { id: string; name: string; floor_id: string };
type RoomStatusRow = { room_id: string; open_issue_count: number; clean_done_today: boolean; shortage_count: number };

type ViewTab = 'all' | 'cleaning' | 'shortage' | 'issues';

function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function roomMatchesTab(
  st: RoomStatusRow | undefined,
  tab: ViewTab
): boolean {
  if (tab === 'all') return true;
  const issues = st?.open_issue_count ?? 0;
  const cleanDone = st?.clean_done_today ?? false;
  const shortage = st?.shortage_count ?? 0;
  if (tab === 'cleaning') return !cleanDone;
  if (tab === 'shortage') return shortage > 0;
  if (tab === 'issues') return issues > 0;
  return true;
}

export default function ChurchFloorsPage() {
  const params = useParams();
  const churchId = params.churchId as string;
  const [churchName, setChurchName] = useState('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [statusByRoomId, setStatusByRoomId] = useState<Record<string, RoomStatusRow>>({});
  const [tab, setTab] = useState<ViewTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const today = todayISO();
    supabase.from('church').select('id, name').eq('id', churchId).single().then(({ data }) => {
      if (data) setChurchName((data as { name: string }).name);
    });
    supabase
      .from('floor')
      .select('id, name, sort_order')
      .eq('church_id', churchId)
      .order('sort_order')
      .then(({ data: floorData, error: e }) => {
        if (e) {
          setLoading(false);
          setError(e.message);
          return;
        }
        const floorList = (floorData as Floor[]) ?? [];
        setFloors(floorList);
        if (floorList.length === 0) {
          setLoading(false);
          setRoomsByFloor({});
          setStatusByRoomId({});
          return;
        }
        const floorIds = floorList.map((f) => f.id);
        supabase
          .from('room')
          .select('id, name, floor_id, is_active')
          .in('floor_id', floorIds)
          .order('name')
          .then(({ data: roomData }) => {
            const allRooms = (roomData as (Room & { is_active?: boolean })[]) ?? [];
            const rooms = allRooms.filter((r) => r.is_active !== false);
            const byFloor: Record<string, Room[]> = {};
            floorIds.forEach((fid) => { byFloor[fid] = rooms.filter((r) => r.floor_id === fid); });
            setRoomsByFloor(byFloor);
            if (rooms.length === 0) {
              setLoading(false);
              setStatusByRoomId({});
              return;
            }
            const roomIds = rooms.map((r) => r.id);
            supabase
              .from('room_status')
              .select('room_id, open_issue_count, clean_done_today, shortage_count')
              .in('room_id', roomIds)
              .eq('status_date', today)
              .then(({ data: statusData }) => {
                setLoading(false);
                const rows = (statusData as RoomStatusRow[]) ?? [];
                const byRoom: Record<string, RoomStatusRow> = {};
                rows.forEach((s) => { byRoom[s.room_id] = s; });
                setStatusByRoomId(byRoom);
              });
          });
      });
  }, [churchId]);

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  const tabs: { id: ViewTab; label: string }[] = [
    { id: 'all', label: '전체 보기' },
    { id: 'cleaning', label: '청소 미완료' },
    { id: 'shortage', label: '비품 부족' },
    { id: 'issues', label: '이슈 발생' },
  ];

  const floorsToShow =
    tab === 'all'
      ? floors
      : floors.filter((f) =>
          (roomsByFloor[f.id] ?? []).some((r) => roomMatchesTab(statusByRoomId[r.id], tab))
        );

  return (
    <>
      <Link href="/" className="backLink">← 건물 선택</Link>
      <h1 className="pageTitle">{churchName || '건물'} 층·공간</h1>

      <div role="tablist" className="card" style={{ padding: 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-label={t.label}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '12px 8px',
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 500,
                border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--color-progress)' : '2px solid transparent',
                background: tab === t.id ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                color: tab === t.id ? 'var(--color-progress)' : 'var(--color-neutral)',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {floors.length === 0 ? (
        <p className="card">이 건물에 등록된 층이 없습니다. 설정에서 층을 추가해 주세요.</p>
      ) : floorsToShow.length === 0 ? (
        <p className="card" style={{ color: 'var(--color-neutral)' }}>
          {tab === 'all' ? '등록된 공간이 없습니다.' : '해당하는 공간이 없습니다.'}
        </p>
      ) : (
        floorsToShow.map((f) => {
          const rooms = (roomsByFloor[f.id] ?? []).filter((r) => roomMatchesTab(statusByRoomId[r.id], tab));
          const showAllRooms = tab === 'all';
          const list = showAllRooms ? (roomsByFloor[f.id] ?? []) : rooms;
          return (
            <div key={f.id} className="card">
              <p style={{ fontWeight: 600, marginBottom: 12 }}>{f.name}</p>
              {list.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--color-neutral)' }}>등록된 공간 없음</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {list.map((r) => {
                    const st = statusByRoomId[r.id];
                    const issues = st?.open_issue_count ?? 0;
                    const cleanDone = st?.clean_done_today ?? false;
                    const shortage = st?.shortage_count ?? 0;
                    return (
                      <Link key={r.id} href={`/room/${r.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: 12 }}>
                        <p style={{ fontWeight: 600, marginBottom: 8 }}>{r.name}</p>
                        <div style={{ fontSize: 13, color: 'var(--color-neutral)', display: 'flex', flexWrap: 'wrap', gap: '12px 16px' }}>
                          <span style={issues > 0 ? { color: 'var(--color-danger)' } : undefined}>
                            미해결 이슈 {issues}건
                          </span>
                          <span>
                            청소 {cleanDone ? '완료 ✓' : '미완료'}
                          </span>
                          {shortage > 0 && (
                            <span style={{ color: 'var(--color-warning)' }}>
                              부족 비품 {shortage}건
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
