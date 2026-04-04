'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Topbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.45rem 0.75rem', borderRadius: 9999,
            background: 'var(--color-surface)',
            border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
            fontSize: '0.8rem', color: 'var(--color-text-muted)',
          }}>
            Free: 2 niche · Pro: semua niche
          </div>
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
