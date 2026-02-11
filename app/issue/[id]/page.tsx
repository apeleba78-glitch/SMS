'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { processIssueImage } from '@/lib/imageProcess';

type IssueDetail = {
  id: string;
  room_id: string;
  room_name: string;
  issue_type: string;
  description: string | null;
  status: string;
  before_image_path: string | null;
  after_image_path: string | null;
  received_at: string | null;
  confirmed_at: string | null;
  resolved_at: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  created_at: string;
  activity_logs: { id: string; kind: string; content: string | null; created_at: string }[] | null;
};

const STATUS_LABEL: Record<string, string> = {
  received: '접수',
  confirmed: '확인',
  in_progress: '처리중',
  resolved: '해결완료',
  rejected: '반려',
};

const ACTIVITY_KIND_LABEL: Record<string, string> = {
  received_note: '접수',
  process_memo: '처리 메모',
  resolution_note: '해결',
  reject_note: '반려',
  comment: '메모',
};

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = params.id as string;
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [afterFile, setAfterFile] = useState<File | null>(null);

  function load() {
    const supabase = createClient();
    supabase.rpc('rpc_issue_detail', { p_issue_id: issueId }).then(({ data, error: e }) => {
      setLoading(false);
      if (e) {
        setError(e.message);
        return;
      }
      const rows = (data as IssueDetail[]) ?? [];
      setDetail(rows[0] ?? null);
    });
  }

  useEffect(() => {
    load();
  }, [issueId]);

  async function doConfirm() {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.rpc('rpc_issue_confirm', { p_issue_id: issueId, p_member_id: null, p_content: null });
    setActionLoading(false);
    load();
  }

  async function doProgress() {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.rpc('rpc_issue_progress', { p_issue_id: issueId, p_member_id: null, p_content: null });
    setActionLoading(false);
    load();
  }

  async function doResolve() {
    setActionLoading(true);
    const supabase = createClient();
    if (afterFile) {
      try {
        const blob = await processIssueImage(afterFile);
        const path = `${issueId}/after.webp`;
        const { error: uploadErr } = await supabase.storage.from('issues').upload(path, blob, { contentType: 'image/webp', upsert: true });
        if (!uploadErr) {
          await supabase.from('issue').update({ after_image_path: path }).eq('id', issueId);
        }
      } catch (_) {
        setError('After 이미지 처리 실패.');
        setActionLoading(false);
        return;
      }
    }
    await supabase.rpc('rpc_issue_resolve', { p_issue_id: issueId, p_member_id: null, p_content: null });
    setAfterFile(null);
    setActionLoading(false);
    load();
  }

  async function doReject() {
    setActionLoading(true);
    const supabase = createClient();
    await supabase.rpc('rpc_issue_reject', { p_issue_id: issueId, p_member_id: null, p_reject_reason: rejectReason || null });
    setActionLoading(false);
    setRejectReason('');
    load();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;
  if (!detail) return <p className="card">이슈를 찾을 수 없습니다.</p>;

  const canAct = detail.status !== 'resolved' && detail.status !== 'rejected';

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Link href={`/room/${detail.room_id}/issues`} className="backLink">← 이슈 목록</Link>
        <Link href={`/room/${detail.room_id}`} className="backLink" style={{ marginLeft: 12 }}>공간으로</Link>
      </div>
      <h1 className="pageTitle">{detail.issue_type}</h1>
      <div className="card">
        <p style={{ color: 'var(--color-neutral)', fontSize: 14 }}>{detail.room_name}</p>
        <span className={`cardBadge ${detail.status === 'resolved' ? 'done' : detail.status === 'rejected' ? 'neutral' : detail.status === 'in_progress' ? 'progress' : 'warning'}`}>
          {STATUS_LABEL[detail.status] ?? detail.status}
        </span>
        {detail.description && <p style={{ marginTop: 12 }}>{detail.description}</p>}
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-neutral)' }}>
          접수 {detail.created_at ? new Date(detail.created_at).toLocaleString('ko-KR') : '-'}
          {detail.resolved_at && ` · 해결 ${new Date(detail.resolved_at).toLocaleString('ko-KR')}`}
          {detail.rejected_at && ` · 반려 ${new Date(detail.rejected_at).toLocaleString('ko-KR')}`}
        </p>
        {detail.reject_reason && <p style={{ marginTop: 8, color: 'var(--color-warning)' }}>반려 사유: {detail.reject_reason}</p>}
        {detail.before_image_path && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 14 }}>Before</p>
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/issues/${detail.before_image_path}`}
              alt="Before"
              style={{ maxWidth: '100%', borderRadius: 12, marginTop: 4 }}
            />
          </div>
        )}
        {detail.after_image_path && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 14 }}>After</p>
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/issues/${detail.after_image_path}`}
              alt="After"
              style={{ maxWidth: '100%', borderRadius: 12, marginTop: 4 }}
            />
          </div>
        )}
      </div>

      {detail.activity_logs && detail.activity_logs.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>활동 로그</h2>
          {detail.activity_logs.map((log) => (
            <div key={log.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>
              <span className="cardBadge neutral">{ACTIVITY_KIND_LABEL[log.kind] ?? log.kind}</span> {log.content ?? '-'}
              <span style={{ color: 'var(--color-neutral)', marginLeft: 8, fontSize: 12 }}>{new Date(log.created_at).toLocaleString('ko-KR')}</span>
            </div>
          ))}
        </div>
      )}

      {canAct && (
        <div className="card">
          <p style={{ marginBottom: 8, fontSize: 14 }}>상태 변경</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.status === 'received' && (
              <button type="button" className="btnPrimary" onClick={doConfirm} disabled={actionLoading}>확인</button>
            )}
            {(detail.status === 'received' || detail.status === 'confirmed') && (
              <button type="button" className="btnPrimary" style={{ background: 'var(--color-progress)' }} onClick={doProgress} disabled={actionLoading}>완료 처리</button>
            )}
            <label style={{ fontSize: 14 }}>해결 완료 시 After 사진 (선택)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
              style={{ marginTop: 4 }}
            />
            <button type="button" className="btnPrimary" style={{ background: 'var(--color-done)' }} onClick={doResolve} disabled={actionLoading}>해결 완료</button>
            <label style={{ fontSize: 14, marginTop: 4 }}>반려 사유 (취소 시 선택)</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="입력 시 취소 버튼으로 반려"
              style={{ padding: 12, borderRadius: 14, border: '1px solid #e5e5e5' }}
            />
            <button type="button" className="btnPrimary" style={{ background: 'var(--color-neutral)' }} onClick={doReject} disabled={actionLoading}>취소</button>
          </div>
        </div>
      )}
    </>
  );
}
