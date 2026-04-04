import Link from 'next/link';
import Topbar from '@/components/Topbar';

const pricingPlans = [
  {
    tier: 'Free',
    price: 'Rp0',
    desc: 'Untuk akuisisi user awal.',
    features: ['2 niche aktif', '3 generate per sesi', 'Simple & Advanced prompt'],
    recommended: false,
  },
  {
    tier: 'Pro License',
    price: 'Rp99k',
    desc: 'Sekali bayar untuk unlock semua niche.',
    features: ['Semua 6 niche', 'Output Expert level', 'Copy dan bundle prompt'],
    recommended: true,
  },
  {
    tier: 'Agency',
    price: 'Custom',
    desc: 'White-label dan lisensi tim.',
    features: ['Niche custom', 'Export branded', 'Multi seat'],
    recommended: false,
  },
];

const valueProps = [
  { title: 'Structured prompt', desc: 'User isi form, bukan nulis dari nol.' },
  { title: 'License gating', desc: 'Niche premium otomatis terkunci sampai key valid.' },
  { title: 'Niche first', desc: 'Fokus ke kategori yang orang rela bayar.' },
];

const metrics = [
  { value: '2', label: 'Niche gratis untuk validasi market' },
  { value: '6', label: 'Niche premium terkunci oleh lisensi' },
  { value: '3', label: 'Level output: Simple, Advanced, Expert' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100dvh' }}>
      <Topbar />

      <main style={{ width: 'min(calc(100% - 2rem), 1180px)', margin: '0 auto', padding: '2rem 0 3rem' }}>

        {/* HERO */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(300px, 55%, 660px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {/* Left: Copy */}
          <div style={{
            background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 84%, white), var(--color-surface))',
            border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
            borderRadius: '1rem',
            boxShadow: '0 6px 24px oklch(0.2 0.01 80 / 0.08)',
            padding: 'clamp(1.4rem, 2vw, 2rem)',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '1rem', padding: '0.45rem 0.75rem',
              borderRadius: 9999, background: 'var(--color-primary-highlight)',
              color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700,
            }}>
              Web app · lisensi key · freemium
            </div>

            <h1 style={{
              margin: '0 0 1rem',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}>
              Generate prompt yang siap dipakai dan siap dijual.
            </h1>

            <p style={{ margin: '0 0 1.25rem', maxWidth: '52ch', color: 'var(--color-text-muted)' }}>
              Template ini punya alur freemium, pilihan niche, generator prompt berbasis form,
              dan sistem aktivasi lisensi untuk demo MVP.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/app" style={{
                padding: '0.9rem 1.25rem', borderRadius: 9999,
                background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
                fontWeight: 700, fontSize: '0.875rem', display: 'inline-block',
              }}>
                Coba demo generator
              </Link>
              <Link href="/app#license" style={{
                padding: '0.9rem 1.25rem', borderRadius: 9999,
                background: 'transparent', color: 'var(--color-text)',
                fontWeight: 700, fontSize: '0.875rem', display: 'inline-block',
                border: '1px solid color-mix(in oklab, var(--color-text) 12%, transparent)',
              }}>
                Lihat sistem lisensi
              </Link>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginTop: '1.5rem' }}>
              {metrics.map((m) => (
                <div key={m.value} style={{
                  padding: '0.95rem',
                  background: 'var(--color-surface-2)',
                  borderRadius: '0.875rem',
                  border: '1px solid color-mix(in oklab, var(--color-text) 8%, transparent)',
                }}>
                  <strong style={{ display: 'block', fontSize: '1.5rem', lineHeight: 1.1 }}>{m.value}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pricing + Value */}
          <div style={{
            background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 84%, white), var(--color-surface))',
            border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
            borderRadius: '1rem',
            boxShadow: '0 6px 24px oklch(0.2 0.01 80 / 0.08)',
            padding: '1rem',
            display: 'grid',
            gap: '1rem',
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Rancangan paket</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {pricingPlans.map((plan) => (
                  <div key={plan.tier} style={{
                    padding: '0.9rem',
                    background: plan.recommended
                      ? 'color-mix(in oklab, var(--color-primary-highlight) 35%, var(--color-surface))'
                      : 'var(--color-surface)',
                    border: plan.recommended
                      ? '2px solid color-mix(in oklab, var(--color-primary) 42%, transparent)'
                      : '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                    borderRadius: '0.875rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{plan.tier}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0.3rem 0' }}>{plan.price}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{plan.desc}</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start', fontSize: '0.8rem' }}>
                          <span style={{ width: 7, height: 7, marginTop: '0.35rem', borderRadius: 999, background: 'var(--color-success)', flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Value pembeda</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {valueProps.map((v) => (
                  <div key={v.title} style={{
                    padding: '0.9rem',
                    background: 'var(--color-surface)',
                    border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                    borderRadius: '0.875rem',
                  }}>
                    <h3 style={{ margin: '0 0 0.3rem', fontSize: '0.9rem' }}>{v.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{v.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
