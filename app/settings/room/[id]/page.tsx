'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type CheckItem = { id: string; name: string; item_type: string; sort_order: number };
type InventoryItem = { id: string; item_name: string; quantity: number | null; sort_order: number };
type ScheduleRow = { id: string; day_of_week: number; start_time: string; end_time: string; purpose: string | null; sort_order: number };

const CHECK_TYPE_LABEL: Record<string, string> = {
  cleaning_before_photo: '관리전 사진',
  cleaning_after_photo: '관리후 사진',
  cleaning_before_after_photo: '관리전후 사진',
  cleaning_general: '일반 체크리스트',
  fire: '소방점검',
  electrical: '전기 점검',
  general: '일반',
};

const DAY_LABEL: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일' };

export default function SettingsRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const [roomName, setRoomName] = useState('');
  const [floorId, setFloorId] = useState<string | null>(null);
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCheckName, setNewCheckName] = useState('');
  const [newCheckType, setNewCheckType] = useState('cleaning_general');
  const [newInvName, setNewInvName] = useState('');
  const [newInvQty, setNewInvQty] = useState('');
  const [newSchedDay, setNewSchedDay] = useState(1);
  const [newSchedStart, setNewSchedStart] = useState('09:00');
  const [newSchedEnd, setNewSchedEnd] = useState('12:00');
  const [newSchedPurpose, setNewSchedPurpose] = useState('');

  function loadRoom() {
    const supabase = createClient();
    supabase.from('room').select('id, name, floor_id').eq('id', roomId).single().then(({ data }) => {
      if (data) {
        const d = data as { name: string; floor_id: string };
        setRoomName(d.name);
        setFloorId(d.floor_id);
      }
    });
  }

  function loadAll() {
    const supabase = createClient();
    Promise.all([
      supabase.rpc('rpc_admin_check_item_list', { p_room_id: roomId, p_type: null }),
      supabase.rpc('rpc_admin_inventory_list', { p_room_id: roomId }),
      supabase.rpc('rpc_admin_schedule_list', { p_room_id: roomId }),
    ]).then(([a, b, c]) => {
      setLoading(false);
      setCheckItems((a.data as CheckItem[]) ?? []);
      setInventory((b.data as InventoryItem[]) ?? []);
      setSchedules((c.data as ScheduleRow[]) ?? []);
      if (a.error) setError(a.error.message);
      if (b.error) setError(b.error.message);
      if (c.error) setError(c.error.message);
    });
  }

  useEffect(() => {
    loadRoom();
    loadAll();
  }, [roomId]);

  async function addCheckItem() {
    const name = newCheckName.trim();
    if (!name) return;
    const supabase = createClient();
    await supabase.rpc('rpc_admin_check_item_create', {
      p_room_id: roomId,
      p_name: name,
      p_item_type: newCheckType,
      p_sort_order: checkItems.length,
    });
    setNewCheckName('');
    loadAll();
  }

  async function deleteCheckItem(itemId: string) {
    const supabase = createClient();
    await supabase.rpc('rpc_admin_check_item_delete', { p_item_id: itemId });
    loadAll();
  }

  async function addInventory() {
    const name = newInvName.trim();
    if (!name) return;
    const supabase = createClient();
    await supabase.rpc('rpc_admin_inventory_create', {
      p_room_id: roomId,
      p_item_name: name,
      p_quantity: newInvQty ? parseInt(newInvQty, 10) : null,
      p_sort_order: inventory.length,
    });
    setNewInvName('');
    setNewInvQty('');
    loadAll();
  }

  async function deleteInventory(itemId: string) {
    const supabase = createClient();
    await supabase.rpc('rpc_admin_inventory_delete', { p_item_id: itemId });
    loadAll();
  }

  async function addSchedule() {
    const supabase = createClient();
    await supabase.rpc('rpc_admin_schedule_create', {
      p_room_id: roomId,
      p_day_of_week: newSchedDay,
      p_start_time: newSchedStart,
      p_end_time: newSchedEnd,
      p_purpose: newSchedPurpose.trim() || null,
      p_sort_order: schedules.length,
    });
    setNewSchedPurpose('');
    loadAll();
  }

  async function deleteSchedule(id: string) {
    const supabase = createClient();
    await supabase.rpc('rpc_admin_schedule_delete', { p_id: id });
    loadAll();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href={floorId ? `/settings/floor/${floorId}` : '/settings'} className="backLink">← 층 설정</Link>
      <h1 className="pageTitle">{roomName} 설정</h1>

      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>청소·점검 체크리스트</h2>
        <p style={{ fontSize: 12, color: 'var(--color-neutral)', marginBottom: 8 }}>
          관리전/후/전후 사진, 일반 체크, 소방·전기 점검 항목
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {checkItems.map((c) => (
            <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span>{c.name}</span>
              <span style={{ fontSize: 12, color: 'var(--color-neutral)' }}>
                {CHECK_TYPE_LABEL[c.item_type] ?? c.item_type}
                <button type="button" onClick={() => deleteCheckItem(c.id)} style={{ marginLeft: 8, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
              </span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            type="text"
            value={newCheckName}
            onChange={(e) => setNewCheckName(e.target.value)}
            placeholder="항목 이름"
            style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}
          />
          <select
            value={newCheckType}
            onChange={(e) => setNewCheckType(e.target.value)}
            style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}
          >
            {Object.entries(CHECK_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={addCheckItem} disabled={!newCheckName.trim()}>추가</button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>공간 비품·물품</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {inventory.map((i) => (
            <li key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span>{i.item_name}{i.quantity != null ? ` (${i.quantity})` : ''}</span>
              <button type="button" onClick={() => deleteInventory(i.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>삭제</button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newInvName}
            onChange={(e) => setNewInvName(e.target.value)}
            placeholder="비품명"
            style={{ flex: 1, minWidth: 100, padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}
          />
          <input
            type="number"
            value={newInvQty}
            onChange={(e) => setNewInvQty(e.target.value)}
            placeholder="수량"
            style={{ width: 70, padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}
          />
          <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={addInventory} disabled={!newInvName.trim()}>추가</button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>사용 스케줄 (반복)</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {schedules.map((s) => (
            <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
              <span>{DAY_LABEL[s.day_of_week] ?? s.day_of_week} {s.start_time}~{s.end_time}{s.purpose ? ` · ${s.purpose}` : ''}</span>
              <button type="button" onClick={() => deleteSchedule(s.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>삭제</button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select value={newSchedDay} onChange={(e) => setNewSchedDay(Number(e.target.value))} style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}>
            {Object.entries(DAY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input type="time" value={newSchedStart} onChange={(e) => setNewSchedStart(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }} />
          <input type="time" value={newSchedEnd} onChange={(e) => setNewSchedEnd(e.target.value)} style={{ padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }} />
          <input
            type="text"
            value={newSchedPurpose}
            onChange={(e) => setNewSchedPurpose(e.target.value)}
            placeholder="용도"
            style={{ flex: 1, minWidth: 80, padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}
          />
          <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={addSchedule}>추가</button>
        </div>
      </div>
    </>
  );
}
