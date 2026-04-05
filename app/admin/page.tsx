'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Topbar from '@/components/Topbar';

interface License {
  id: number;
  license_key: string;
  email: string | null;
  is_active: number;
  created_at: string;
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState('');

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) fetchLicenses();
  }, [isAdmin]);

  async function fetchLicenses() {
    setLoading(true);
    const res = await fetch('/api/admin/licenses');
    const data = await res.json();
    setLicenses(data);
    setLoading(false);
  }

  async function addLicense() {
    if (!newKey.trim()) return;
    const res = await fetch('/api/admin/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: newKey, email: newEmail }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg('✅ License berhasil ditambahkan!');
      setNewKey('');
      setNewEmail('');
      fetchLicenses();
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setTimeout(() => setMsg(''), 3000);
  }

  async function toggleLicense(id: number, current: number) {
    await fetch('/api/admin/licenses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: current ? 0 : 1 }),
    });
    fetchLicenses();
  }

  function generateKey() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewKey(`PFID-PRO-${rand}`);
  }

  if (status === 'loading') return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Login diperlukan</div>
          <button
            onClick={() => signIn('google')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: 9999, background: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', border: 'none' }}
          >
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚫</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Akses ditolak</div>
          <div>Kamu tidak punya izin untuk halaman ini.</div>
        </div>
      </div>
    );
  }

  const totalActive = licenses.filter((l) => l.is_active).length;
  const totalInactive = licenses.filter((l) => !l.is_active).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Topbar />
      <main style={{ width: 'min(calc(100% - 2rem), 1100px)', margin: '0 auto', padding: '2rem 0' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Admin Dashboard</h1>
          <div style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>PromptForge ID — Kelola license key</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total License', value: licenses.length, color: 'var(--color-primary)' },
            { label: 'Aktif', value: totalActive, color: '#22c55e' },
            { label: 'Nonaktif', value: totalInactive, color: '#ef4444' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--color-surface)',
              border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
              borderRadius: '1rem', padding: '1.25rem',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Add License Form */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
          borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Tambah License Key</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>License Key</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="PFID-PRO-XXXXX"
                style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.75rem', border: '1px solid color-mix(in oklab, var(--color-text) 15%, transparent)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Email Pembeli</label>
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@pembeli.com"
                style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.75rem', border: '1px solid color-mix(in oklab, var(--color-text) 15%, transparent)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <button onClick={generateKey} style={{ padding: '0.7rem 1rem', borderRadius: '0.75rem', border: '1px solid color-mix(in oklab, var(--color-text) 15%, transparent)', background: 'var(--color-surface-2)', color: 'var(--color-text)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600 }}>
              🎲 Generate
            </button>
            <button onClick={addLicense} style={{ padding: '0.7rem 1.25rem', borderRadius: '0.75rem', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
              + Tambah
            </button>
          </div>
          {msg && <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>{msg}</div>}
        </div>

        {/* License Table */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
          borderRadius: '1rem', overflow: 'hidden',
        }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid color-mix(in oklab, var(--color-text) 8%, transparent)', fontWeight: 700 }}>
            Semua License ({licenses.length})
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-2)' }}>
                  {['License Key', 'Email', 'Tanggal', 'Status', 'Aksi'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {licenses.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: '1px solid color-mix(in oklab, var(--color-text) 6%, transparent)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}>{l.license_key}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{l.email || '—'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{new Date(l.created_at).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem', borderRadius: 9999,
                        fontSize: '0.75rem', fontWeight: 700,
                        background: l.is_active ? '#dcfce7' : '#fee2e2',
                        color: l.is_active ? '#16a34a' : '#dc2626',
                      }}>
                        {l.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button
                        onClick={() => toggleLicense(l.id, l.is_active)}
                        style={{
                          padding: '0.35rem 0.75rem', borderRadius: 9999,
                          border: '1px solid color-mix(in oklab, var(--color-text) 15%, transparent)',
                          background: 'transparent', color: 'var(--color-text)',
                          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        }}
                      >
                        {l.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada license</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
