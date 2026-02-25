'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type RoomRow = { id: string; name: string; cleaning_cycle: string; is_active: boolean };

const CYCLE_LABEL: Record<string, string> = {
  daily: '매일',
  twice_weekly: '주 2회',
  weekly: '주 1회',
  other: '기타',
};

export default function SettingsFloorPage() {
  const params = useParams();
  const floorId = params.id as string;
  const [floorName, setFloorName] = useState('');
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [adding, setAdding] = useState(false);

  function loadFloor() {
    const supabase = createClient();
    supabase.from('floor').select('id, name').eq('id', floorId).single().then(({ data }) => {
      if (data) setFloorName((data as { name: string }).name);
    });
  }

  function loadRooms() {
    const supabase = createClient();
    supabase.rpc('rpc_admin_room_list', { p_floor_id: floorId }).then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      setRooms((data as RoomRow[]) ?? []);
    });
  }

  useEffect(() => {
    loadFloor();
    loadRooms();
  }, [floorId]);

  async function addRoom() {
    const name = newRoomName.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    await supabase.rpc('rpc_admin_room_create', {
      p_floor_id: floorId,
      p_name: name,
      p_cleaning_cycle: 'daily',
    });
    setAdding(false);
    setNewRoomName('');
    loadRooms();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href="/settings" className="backLink">← 설정</Link>
      <h1 className="pageTitle">{floorName || '층'} 공간</h1>
      <div className="card">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {rooms.map((r) => (
            <li key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Link href={`/settings/room/${r.id}`} style={{ fontWeight: 500 }}>
                {r.name}
                {!r.is_active && <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--color-neutral)' }}>(비활성)</span>}
              </Link>
              <span style={{ fontSize: 12, color: 'var(--color-neutral)' }}>{CYCLE_LABEL[r.cleaning_cycle] ?? r.cleaning_cycle} →</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="공간 이름"
            style={{ flex: 1, padding: 12, borderRadius: 14, border: '1px solid #e5e5e5' }}
            aria-label="공간 이름"
          />
          <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={addRoom} disabled={adding || !newRoomName.trim()}>
            공간 추가
          </button>
        </div>
      </div>
    </>
  );
}
