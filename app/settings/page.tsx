'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

type Church = { id: string; name: string; timezone: string };

export default function SettingsPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const TIMEZONE_KO = 'Asia/Seoul';

  function load() {
    const supabase = createClient();
    supabase
      .from('church')
      .select('id, name, timezone')
      .order('name')
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        setChurches((data as Church[]) ?? []);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function addChurch() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    const { error: e } = await supabase.rpc('rpc_admin_church_create', {
      p_name: name,
      p_timezone: TIMEZONE_KO,
    });
    setAdding(false);
    if (e) {
      setError(e.message);
      return;
    }
    setNewName('');
    load();
  }

  function startEdit(c: Church) {
    setEditingId(c.id);
    setEditName(c.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  async function saveEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    const supabase = createClient();
    const { error: e } = await supabase.rpc('rpc_admin_church_update', {
      p_church_id: editingId,
      p_name: name,
      p_timezone: TIMEZONE_KO,
    });
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    cancelEdit();
    load();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href="/" className="backLink">← 홈</Link>
      <h1 className="pageTitle">설정 (총관리자)</h1>
      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>건물(교회) 관리</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {churches.map((c) => (
            <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              {editingId === c.id ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="건물 이름"
                    style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 12, border: '1px solid #e5e5e5' }}
                    aria-label="건물 이름"
                  />
                  <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={saveEdit} disabled={saving || !editName.trim()}>
                    저장
                  </button>
                  <button type="button" className="btnSecondary" style={{ width: 'auto' }} onClick={cancelEdit} disabled={saving}>
                    취소
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <Link href={`/settings/church/${c.id}`} style={{ fontWeight: 500 }}>{c.name}</Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button type="button" onClick={() => startEdit(c)} style={{ fontSize: 12, color: 'var(--color-progress)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      수정
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--color-neutral)' }}>층 관리 →</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--color-neutral)' }}>건물 추가</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="건물 이름 (예: 본당, 교육관)"
              style={{ flex: 1, minWidth: 140, padding: 12, borderRadius: 14, border: '1px solid #e5e5e5' }}
              aria-label="건물 이름"
            />
            <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={addChurch} disabled={adding || !newName.trim()}>
              건물 추가
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
