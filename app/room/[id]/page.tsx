'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useEffectiveRole } from '@/lib/RolePreviewContext';
import { canManageSupply, canReceiveIssue } from '@/lib/roles';
import { DEFAULT_CHURCH_ID } from '@/lib/constants';

type RoomDetail = {
  room_id: string;
  floor_id: string;
  room_name: string;
  floor_name: string;
  status_date: string;
  open_issue_count: number;
  clean_done_today: boolean;
  check_done_ratio_today: number;
  shortage_count: number;
  cleaning_cycle: string;
};

type SupplyShortage = {
  id: string;
  item_name: string;
  reported_at: string;
  resolved_at: string | null;
};

type RoomBooking = {
  id: string;
  start_at: string;
  end_at: string;
  purpose: string | null;
};

function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = params.id as string;
  const role = useEffectiveRole(DEFAULT_CHURCH_ID);
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [shortages, setShortages] = useState<SupplyShortage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookPurpose, setBookPurpose] = useState('');

  function loadDetail() {
    const supabase = createClient();
    const p_date = todayISO();
    supabase.rpc('rpc_room_detail', { p_room_id: roomId, p_date }).then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      const rows = (data as RoomDetail[]) ?? [];
      setDetail(rows[0] ?? null);
    });
  }

  function loadShortages() {
    const supabase = createClient();
    supabase.rpc('rpc_room_supply_shortage_list', { p_room_id: roomId }).then(({ data }) => {
      setShortages((data as SupplyShortage[]) ?? []);
    });
  }

  function loadBookings() {
    const supabase = createClient();
    const p_date = todayISO();
    supabase.rpc('rpc_room_booking_list', { p_room_id: roomId, p_date }).then(({ data }) => {
      setBookings((data as RoomBooking[]) ?? []);
    });
  }

  useEffect(() => {
    setLoading(true);
    loadDetail();
    loadShortages();
    loadBookings();
  }, [roomId]);

  async function addShortage() {
    const name = newItemName.trim();
    if (!name) return;
    setActionLoading(true);
    const supabase = createClient();
    await supabase.rpc('rpc_supply_shortage_add', { p_room_id: roomId, p_item_name: name, p_reported_by: null });
    setNewItemName('');
    setActionLoading(false);
    loadDetail();
    loadShortages();
  }

  async function resolveShortage(id: string) {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.rpc('rpc_supply_shortage_resolve', { p_shortage_id: id });
    setActionLoading(false);
    loadDetail();
    loadShortages();
  }

  async function addBooking() {
    if (!bookStart || !bookEnd) return;
    setActionLoading(true);
    const supabase = createClient();
    await supabase.from('room_booking').insert({
      room_id: roomId,
      start_at: bookStart,
      end_at: bookEnd,
      purpose: bookPurpose.trim() || null,
      member_id: null,
    });
    setBookStart('');
    setBookEnd('');
    setBookPurpose('');
    setActionLoading(false);
    loadBookings();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;
  if (!detail) return <p className="card">공간 정보를 찾을 수 없습니다.</p>;

  const cycleLabel: Record<string, string> = {
    daily: '매일',
    twice_weekly: '주 2회',
    weekly: '주 1회',
    other: '기타',
  };

  return (
    <>
      <Link href={detail.floor_id ? `/floor/${detail.floor_id}` : '/'} className="backLink">
        ← 공간 목록
      </Link>
      <h1 className="pageTitle">{detail.room_name}</h1>
      <div className="card">
        <p style={{ color: 'var(--color-neutral)', fontSize: 14 }}>{detail.floor_name} · 청소 주기 {cycleLabel[detail.cleaning_cycle] ?? detail.cleaning_cycle}</p>
        <div className="cardRow">
          <span className={`cardBadge ${detail.clean_done_today ? 'done' : 'neutral'}`}>
            청소 {detail.clean_done_today ? '완료' : '미완료'}
          </span>
          <span className={`cardBadge ${detail.open_issue_count > 0 ? 'danger' : 'neutral'}`}>
            미해결 이슈 {detail.open_issue_count}건
          </span>
        </div>
        <div className="cardRow">
          <span className={`cardBadge ${detail.check_done_ratio_today >= 1 ? 'done' : detail.check_done_ratio_today > 0 ? 'progress' : 'neutral'}`}>
            점검 완료율 {Math.round(Number(detail.check_done_ratio_today) * 100)}%
          </span>
          <span className={`cardBadge ${detail.shortage_count > 0 ? 'warning' : 'neutral'}`}>
            부족 비품 {detail.shortage_count}건
          </span>
        </div>
      </div>
      {canManageSupply(role) && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>부족 비품</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {shortages.length === 0 ? (
              <li style={{ padding: '8px 0', color: 'var(--color-neutral)', fontSize: 14 }}>등록된 부족 비품 없음</li>
            ) : (
              shortages.map((s) => (
                <li
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #f0f0f0',
                    gap: 8,
                  }}
                >
                  <span>{s.item_name}</span>
                  {s.resolved_at ? (
                    <span className="cardBadge done">해제</span>
                  ) : (
                    <button
                      type="button"
                      className="btnPrimary"
                      onClick={() => resolveShortage(s.id)}
                      disabled={actionLoading}
                    >
                      해제
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="비품명"
              style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 14, border: '1px solid #e5e5e5' }}
              aria-label="부족 비품명"
            />
            <button type="button" className="btnPrimary" onClick={addShortage} disabled={actionLoading || !newItemName.trim()}>
              저장
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>오늘 예약</h2>
        {bookings.length === 0 ? (
          <p style={{ color: 'var(--color-neutral)', fontSize: 14 }}>오늘 예약 없음</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bookings.map((b) => (
              <li key={b.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
                {new Date(b.start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                ~{new Date(b.end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                {b.purpose && ` · ${b.purpose}`}
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 14 }}>예약 추가</label>
          <input
            type="datetime-local"
            value={bookStart}
            onChange={(e) => setBookStart(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #e5e5e5', marginTop: 4 }}
            aria-label="시작 일시"
          />
          <input
            type="datetime-local"
            value={bookEnd}
            onChange={(e) => setBookEnd(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #e5e5e5', marginTop: 8 }}
            aria-label="종료 일시"
          />
          <input
            type="text"
            value={bookPurpose}
            onChange={(e) => setBookPurpose(e.target.value)}
            placeholder="용도"
            style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #e5e5e5', marginTop: 8 }}
            aria-label="용도"
          />
          <button type="button" className="btnPrimary" style={{ marginTop: 8 }} onClick={addBooking} disabled={actionLoading || !bookStart || !bookEnd}>
            저장
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href={`/room/${roomId}/issues`} className="btnPrimary" style={{ display: 'block', textAlign: 'center' }}>
          이슈 목록
        </Link>
        {canReceiveIssue(role) && (
          <Link href={`/room/${roomId}/issue/new`} className="btnSecondary">
            이슈 접수
          </Link>
        )}
      </div>
    </>
  );
}
