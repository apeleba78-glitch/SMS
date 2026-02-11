'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type IssueRow = {
  id: string;
  room_id: string;
  issue_type: string;
  description: string | null;
  status: string;
  created_at: string;
  room_name: string;
};

const STATUS_LABEL: Record<string, string> = {
  received: '접수',
  confirmed: '확인',
  in_progress: '처리중',
  resolved: '해결완료',
  rejected: '반려',
};

export default function RoomIssuesPage() {
  const params = useParams();
  const roomId = params.id as string;
  const [roomName, setRoomName] = useState('');
  const [list, setList] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc('rpc_issue_list', { p_room_id: roomId }).then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      const rows = (data as IssueRow[]) ?? [];
      setList(rows);
      if (rows.length > 0) setRoomName(rows[0].room_name);
    });
  }, [roomId]);

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href={`/room/${roomId}`} className="backLink">← 공간으로</Link>
      <h1 className="pageTitle">{roomName || '이슈'} 목록</h1>
      {list.length === 0 ? (
        <p className="card">등록된 이슈가 없습니다.</p>
      ) : (
        list.map((i) => (
          <Link key={i.id} href={`/issue/${i.id}`} className="cardLink" style={{ display: 'block' }}>
            <strong>{i.issue_type}</strong>
            <span className={`cardBadge ${i.status === 'resolved' ? 'done' : i.status === 'rejected' ? 'neutral' : i.status === 'in_progress' ? 'progress' : 'warning'}`} style={{ marginLeft: 8 }}>
              {STATUS_LABEL[i.status] ?? i.status}
            </span>
            {i.description && <p style={{ marginTop: 8, fontSize: 14, color: 'var(--color-neutral)' }}>{i.description.slice(0, 80)}{i.description.length > 80 ? '…' : ''}</p>}
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--color-neutral)' }}>{new Date(i.created_at).toLocaleString('ko-KR')}</p>
          </Link>
        ))
      )}
      <div style={{ marginTop: 16 }}>
        <Link href={`/room/${roomId}/issue/new`} className="btnPrimary" style={{ display: 'block', textAlign: 'center' }}>
          이슈 접수
        </Link>
      </div>
    </>
  );
}
