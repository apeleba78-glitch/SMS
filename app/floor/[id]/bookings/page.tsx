'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type BookingRow = {
  id: string;
  room_id: string;
  room_name: string;
  start_at: string;
  end_at: string;
  purpose: string | null;
};

function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function FloorBookingsPage() {
  const params = useParams();
  const floorId = params.id as string;
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    supabase.rpc('rpc_booking_list_by_date', { p_floor_id: floorId, p_date: date }).then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      setBookings((data as BookingRow[]) ?? []);
    });
  }, [floorId, date]);

  return (
    <>
      <Link href={`/floor/${floorId}`} className="backLink">← 공간 목록</Link>
      <h1 className="pageTitle">예약 목록</h1>
      <div className="card">
        <label style={{ fontSize: 14 }}>날짜</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #e5e5e5', marginTop: 4 }}
          aria-label="조회 날짜"
        />
      </div>
      {loading && <p className="card">로딩 중...</p>}
      {error && <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>}
      {!loading && !error && (
        <div className="card">
          {bookings.length === 0 ? (
            <p style={{ color: 'var(--color-neutral)', fontSize: 14 }}>해당 날짜 예약 없음</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {bookings.map((b) => (
                <li key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Link href={`/room/${b.room_id}`} style={{ fontWeight: 600 }}>
                    {b.room_name}
                  </Link>
                  <span style={{ marginLeft: 8, fontSize: 14 }}>
                    {new Date(b.start_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    ~{new Date(b.end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    {b.purpose && ` · ${b.purpose}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
