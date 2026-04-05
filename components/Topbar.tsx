'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Topbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'blur(14px)',
      background: 'color-mix(in oklab, var(--color-bg) 82%, transparent)',
      borderBottom: '1px solid color-mix(in oklab, var(--color-text) 12%, transparent)',
    }}>
      <div style={{
        width: 'min(calc(100% - 2rem), 1180px)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.9rem 0',
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 700 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            display: 'grid', placeItems: 'center',
            color: 'var(--color-text-inverse)',
            background: 'linear-gradient(135deg, var(--color-primary), color-mix(in oklab, var(--color-primary) 50%, black))',
            boxShadow: '0 1px 2px oklch(0.2 0.01 80 / 0.06)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 19 19 5" />
              <path d="M9 5h10v10" />
              <path d="M5 9v10h10" />
            </svg>
          </div>
          <div>
            <div>PromptForge ID</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
              Prompt generator berlisensi
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAdmin && (
            <Link href="/admin" style={{
              padding: '0.45rem 0.75rem', borderRadius: 9999,
              background: 'var(--color-surface)',
              border: '1px solid color-mix(in oklab, var(--color-primary) 40%, transparent)',
              fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600,
            }}>
              ⚙ Admin
            </Link>
          )}

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-primary)' }}
                />
              )}
              <button
                onClick={() => signOut()}
                style={{
                  padding: '0.45rem 0.75rem', borderRadius: 9999,
                  background: 'var(--color-surface)',
                  border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                  fontSize: '0.8rem', color: 'var(--color-text-muted)', cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.75rem', borderRadius: 9999,
                background: 'var(--color-surface)',
                border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                fontSize: '0.8rem', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login Google
            </button>
          )}

          <Link href="/app" style={{
            padding: '0.65rem 1rem',
            borderRadius: 9999,
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 700,
          }}>
            Coba Generator
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle tema"
            style={{
              width: 42, height: 42,
              display: 'grid', placeItems: 'center',
              borderRadius: 9999,
              background: 'var(--color-surface)',
              border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
              fontSize: '1rem',
            }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </header>
  );
}
