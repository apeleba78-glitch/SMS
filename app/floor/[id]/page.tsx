'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type RoomCard = {
  room_id: string;
  room_name: string;
  floor_name: string;
  cleaning_cycle: string;
  open_issue_count: number;
  clean_done_today: boolean;
  check_done_ratio_today: number;
  shortage_count: number;
};

type TodayCleaningTask = {
  task_id: string;
  room_id: string;
  room_name: string;
  floor_name: string;
  task_date: string;
  completed_at: string | null;
  completed_by: string | null;
};

function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function FloorPage() {
  const params = useParams();
  const floorId = params.id as string;
  const [floorName, setFloorName] = useState<string>('');
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<TodayCleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function loadFloor() {
    const supabase = createClient();
    const p_date = todayISO();
    supabase
      .rpc('rpc_floor_room_cards', { p_floor_id: floorId, p_date })
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        const list = (data as RoomCard[]) ?? [];
        setRooms(list);
        if (list.length > 0) setFloorName(list[0].floor_name);
        else setFloorName('');
      });
  }

  function loadCleaningList() {
    const supabase = createClient();
    const p_date = todayISO();
    supabase.rpc('rpc_today_cleaning_list', { p_floor_id: floorId, p_date }).then(({ data }) => {
      setCleaningTasks((data as TodayCleaningTask[]) ?? []);
    });
  }

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    const p_date = todayISO();
    supabase.rpc('rpc_ensure_today_cleaning_tasks', { p_date }).then(() => {
      loadFloor();
      loadCleaningList();
    });
  }, [floorId]);

  async function doComplete(taskId: string) {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.rpc('rpc_cleaning_complete', { p_task_id: taskId, p_member_id: null });
    setActionLoading(false);
    loadFloor();
    loadCleaningList();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href="/" className="backLink">← 층 목록</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1 className="pageTitle" style={{ marginBottom: 0 }}>{floorName || '공간'} 목록</h1>
        <Link href={`/floor/${floorId}/bookings`} className="btnSecondary">예약 보기</Link>
      </div>

      {cleaningTasks.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>오늘 청소 대상</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {cleaningTasks.map((t) => (
              <li
                key={t.task_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0',
                  gap: 8,
                }}
              >
                <span>{t.room_name}</span>
                {t.completed_at ? (
                  <span className="cardBadge done">완료 {new Date(t.completed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                ) : (
                  <button
                    type="button"
                    className="btnPrimary"
                    onClick={() => doComplete(t.task_id)}
                    disabled={actionLoading}
                  >
                    완료 처리
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="card">이 층에 등록된 공간이 없습니다.</p>
      ) : (
        rooms.map((r) => (
          <Link key={r.room_id} href={`/room/${r.room_id}`} className="cardLink" style={{ display: 'block' }}>
            <strong>{r.room_name}</strong>
            <div className="cardRow">
              <span className={`cardBadge ${r.clean_done_today ? 'done' : 'neutral'}`}>
                청소 {r.clean_done_today ? '완료' : '미완료'}
              </span>
              <span className={`cardBadge ${r.open_issue_count > 0 ? 'danger' : 'neutral'}`}>
                이슈 {r.open_issue_count}건
              </span>
              <span className={`cardBadge ${r.check_done_ratio_today >= 1 ? 'done' : r.check_done_ratio_today > 0 ? 'progress' : 'neutral'}`}>
                점검 {Math.round(Number(r.check_done_ratio_today) * 100)}%
              </span>
              <span className={`cardBadge ${r.shortage_count > 0 ? 'warning' : 'neutral'}`}>
                비품 {r.shortage_count}건
              </span>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
