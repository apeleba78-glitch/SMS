'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { DEFAULT_CHURCH_ID } from '@/lib/constants';

type Floor = { id: string; name: string; sort_order: number };

export default function SettingsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  function load() {
    const supabase = createClient();
    supabase
      .from('floor')
      .select('id, name, sort_order')
      .eq('church_id', DEFAULT_CHURCH_ID)
      .order('sort_order')
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        setFloors((data as Floor[]) ?? []);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function addFloor() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    const { error: e } = await supabase.rpc('rpc_admin_floor_create', {
      p_church_id: DEFAULT_CHURCH_ID,
      p_name: name,
      p_sort_order: floors.length,
    });
    setAdding(false);
    if (e) {
      setError(e.message);
      return;
    }
    setNewName('');
    load();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href="/" className="backLink">← 홈</Link>
      <h1 className="pageTitle">설정 (총관리자)</h1>
      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>층 관리</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {floors.map((f) => (
            <li key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Link href={`/settings/floor/${f.id}`} style={{ fontWeight: 500 }}>{f.name}</Link>
              <span style={{ fontSize: 12, color: 'var(--color-neutral)' }}>공간 설정 →</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="층 이름 (예: 1층)"
            style={{ flex: 1, padding: 12, borderRadius: 14, border: '1px solid #e5e5e5' }}
            aria-label="층 이름"
          />
          <button type="button" className="btnPrimary" style={{ width: 'auto' }} onClick={addFloor} disabled={adding || !newName.trim()}>
            층 추가
          </button>
        </div>
      </div>
    </>
  );
}
