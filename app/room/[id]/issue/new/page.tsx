'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { processIssueImage } from '@/lib/imageProcess';

const ISSUE_TYPES = ['파손', '고장', '청소 불량', '기타'];

export default function NewIssuePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: e2 } = await supabase
      .from('issue')
      .insert({ room_id: roomId, issue_type: issueType || '기타', description: description || null, status: 'received' })
      .select('id')
      .single();
    if (e2) {
      setSubmitting(false);
      setError(e2.message);
      return;
    }
    const issueId = data?.id;
    if (beforeFile && issueId) {
      try {
        const blob = await processIssueImage(beforeFile);
        const path = `${issueId}/before.webp`;
        const { error: uploadErr } = await supabase.storage.from('issues').upload(path, blob, { contentType: 'image/webp', upsert: true });
        if (!uploadErr) {
          await supabase.from('issue').update({ before_image_path: path }).eq('id', issueId);
        }
      } catch (_) {
        setError('이미지 처리 실패. 사진 없이 저장되었습니다.');
      }
    }
    setSubmitting(false);
    if (issueId) router.push(`/issue/${issueId}`);
  }

  return (
    <>
      <Link href={`/room/${roomId}`} className="backLink">← 공간으로</Link>
      <h1 className="pageTitle">이슈 접수</h1>
      <form onSubmit={handleSubmit} className="card">
        {error && <p style={{ color: 'var(--color-danger)', marginBottom: 12 }}>{error}</p>}
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>문제 유형</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #e5e5e5', marginBottom: 16 }}
        >
          <option value="">선택</option>
          {ISSUE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>상세 설명</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #e5e5e5', marginBottom: 16, resize: 'vertical' }}
          placeholder="내용을 입력하세요"
        />
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Before 사진 (선택)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
          style={{ marginBottom: 16, fontSize: 14 }}
        />
        <button type="submit" className="btnPrimary" disabled={submitting}>
          {submitting ? '저장 중…' : '저장'}
        </button>
      </form>
    </>
  );
}
