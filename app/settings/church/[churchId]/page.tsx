'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type Floor = { id: string; name: string; sort_order: number };

export default function SettingsChurchPage() {
  const params = useParams();
  const churchId = params.churchId as string;
  const [churchName, setChurchName] = useState('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  function loadChurch() {
    const supabase = createClient();
    supabase.from('church').select('id, name').eq('id', churchId).single().then(({ data }) => {
      if (data) setChurchName((data as { name: string }).name);
    });
  }

  function loadFloors() {
    const supabase = createClient();
    supabase
      .from('floor')
      .select('id, name, sort_order')
      .eq('church_id', churchId)
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
    loadChurch();
    loadFloors();
  }, [churchId]);

  async function addFloor() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const supabase = createClient();
    const { error: e } = await supabase.rpc('rpc_admin_floor_create', {
      p_church_id: churchId,
      p_name: name,
      p_sort_order: floors.length,
    });
    setAdding(false);
    if (e) {
      setError(e.message);
      return;
    }
    setNewName('');
    loadFloors();
  }

  if (loading) return <p className="card">로딩 중...</p>;
  if (error) return <p className="card" style={{ color: 'var(--color-danger)' }}>오류: {error}</p>;

  return (
    <>
      <Link href="/settings" className="backLink">← 설정</Link>
      <h1 className="pageTitle">{churchName || '건물'} 층 관리</h1>
      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>층 목록</h2>
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
