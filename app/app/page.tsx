'use client';

import { useState, useCallback } from 'react';
import Topbar from '@/components/Topbar';
import { niches as defaultNiches, FREE_GENERATE_LIMIT, type Niche } from '@/lib/niches';
import { generatePrompts } from '@/lib/prompts';
import ShortsGenerator from '@/components/ShortsGenerator';

const s = {
  panel: {
    background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 84%, white), var(--color-surface))',
    border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
    borderRadius: '1rem',
    boxShadow: '0 6px 24px oklch(0.2 0.01 80 / 0.08)',
  } as React.CSSProperties,
  label: {
    fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--color-text-muted)', textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem',
  },
  input: {
    width: '100%', borderRadius: '0.9rem',
    border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
    background: 'var(--color-surface-2)', color: 'var(--color-text)',
    padding: '0.8rem 1rem', fontFamily: 'inherit', fontSize: '0.9rem',
  } as React.CSSProperties,
};

const EMPTY_CUSTOM: Omit<Niche, 'id' | 'access'> = {
  name: '',
  desc: '',
  defaultAudience: '',
  defaultTone: '',
  sampleOffer: '',
  instruction: '',
};

export default function AppPage() {
  const [licensed, setLicensed] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [activeNicheId, setActiveNicheId] = useState('umkm');
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState('');

  // Custom niches (Pro only)
  const [customNiches, setCustomNiches] = useState<Niche[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM);
  const [customFormError, setCustomFormError] = useState('');

  // Form fields
  const [objective, setObjective] = useState('jualan');
  const [platform, setPlatform] = useState('ChatGPT');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [offer, setOffer] = useState('');

  // Outputs
  const [simpleOut, setSimpleOut] = useState('');
  const [advancedOut, setAdvancedOut] = useState('');
  const [expertOut, setExpertOut] = useState('');

  // Copy button states
  const [copied, setCopied] = useState<string | null>(null);

  const allNiches = [...defaultNiches, ...customNiches];
  const activeNiche: Niche = allNiches.find((n) => n.id === activeNicheId) ?? defaultNiches[0];

  const canAccess = (niche: Niche) => niche.access === 'free' || licensed;

  function seedByNiche(niche: Niche) {
    setAudience(niche.defaultAudience);
    setTone(niche.defaultTone);
    setOffer(niche.sampleOffer);
  }

  function handleNicheClick(niche: Niche) {
    if (!canAccess(niche)) {
      document.getElementById('licenseKey')?.focus();
      return;
    }
    setActiveNicheId(niche.id);
    seedByNiche(niche);
    setSimpleOut('');
    setAdvancedOut('');
    setExpertOut('');
  }

  function handleRandomFill() {
    seedByNiche(activeNiche);
  }

  function handleGenerate() {
    if (!licensed && generatedCount >= FREE_GENERATE_LIMIT) {
      alert('Batas generate free sudah habis. Aktifkan lisensi untuk lanjut.');
      return;
    }
    if (!offer.trim()) {
      alert('Isi kolom "Produk / konteks / topik" dulu ya.');
      return;
    }

    const results = generatePrompts({
      niche: activeNiche,
      objective, platform,
      audience: audience || activeNiche.defaultAudience,
      tone: tone || activeNiche.defaultTone,
      offer,
    });

    setSimpleOut(results.simple);
    setAdvancedOut(results.advanced);
    setExpertOut(licensed ? results.expert : 'Aktifkan lisensi untuk membuka Expert prompt dan semua niche premium.');
    if (!licensed) setGeneratedCount((c) => c + 1);
  }

  async function handleActivate() {
    try {
      const res = await fetch('/api/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setLicensed(true);
        setLicenseError('');
      } else {
        setLicenseError('License key tidak valid atau tidak aktif.');
      }
    } catch {
      setLicenseError('Gagal menghubungi server. Coba lagi.');
    }
  }

  function handleReset() {
    setLicensed(false);
    setGeneratedCount(0);
    setLicenseKey('');
    setLicenseError('');
    setActiveNicheId('umkm');
    setCustomNiches([]);
    setShowCustomForm(false);
    setCustomForm(EMPTY_CUSTOM);
    seedByNiche(defaultNiches[0]);
    setSimpleOut('');
    setAdvancedOut('');
    setExpertOut('');
  }

  function handleDeleteCustomNiche(id: string) {
    setCustomNiches((prev) => prev.filter((n) => n.id !== id));
    if (activeNicheId === id) {
      setActiveNicheId('umkm');
      seedByNiche(defaultNiches[0]);
    }
  }

  function handleSaveCustomNiche() {
    if (!customForm.name.trim()) {
      setCustomFormError('Nama niche wajib diisi.');
      return;
    }
    if (!customForm.instruction.trim()) {
      setCustomFormError('Instruksi niche wajib diisi — ini yang membentuk kualitas prompt.');
      return;
    }
    const newNiche: Niche = {
      id: `custom-${Date.now()}`,
      access: 'pro',
      name: customForm.name.trim(),
      desc: customForm.desc.trim() || 'Custom niche',
      defaultAudience: customForm.defaultAudience.trim() || 'audiens target',
      defaultTone: customForm.defaultTone.trim() || 'profesional',
      sampleOffer: customForm.sampleOffer.trim() || 'Isi detail konteks di form.',
      instruction: customForm.instruction.trim(),
    };
    setCustomNiches((prev) => [...prev, newNiche]);
    setActiveNicheId(newNiche.id);
    seedByNiche(newNiche);
    setCustomForm(EMPTY_CUSTOM);
    setCustomFormError('');
    setShowCustomForm(false);
  }

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  }, []);

  return (
    <div style={{ minHeight: '100dvh' }}>
      <Topbar />

      <main style={{ width: 'min(calc(100% - 2rem), 1180px)', margin: '0 auto', padding: '2rem 0 3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem', alignItems: 'start' }}>

          {/* SIDEBAR */}
          <aside style={{ ...s.panel, padding: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Niche prompts</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Niche terkunci aktif setelah lisensi valid.
            </div>

            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {allNiches.map((niche) => {
                const accessible = canAccess(niche);
                const isActive = activeNicheId === niche.id;
                const isCustom = niche.id.startsWith('custom-');
                return (
                  <div key={niche.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleNicheClick(niche)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: '0.7rem', padding: '0.75rem 0.9rem',
                        borderRadius: '0.9rem', textAlign: 'left', width: '100%',
                        background: isActive
                          ? 'color-mix(in oklab, var(--color-primary-highlight) 42%, var(--color-surface))'
                          : 'transparent',
                        color: isActive ? 'var(--color-primary)' : accessible ? 'var(--color-text)' : 'var(--color-text-muted)',
                        border: isActive
                          ? '1px solid color-mix(in oklab, var(--color-primary) 18%, transparent)'
                          : '1px solid transparent',
                        cursor: accessible ? 'pointer' : 'default',
                        fontFamily: 'inherit',
                        paddingRight: isCustom ? '2.5rem' : undefined,
                      }}
                    >
                      <span>
                        <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>
                          {niche.name}
                          {isCustom && (
                            <span style={{
                              marginLeft: '0.4rem', fontSize: '0.65rem', padding: '0.15rem 0.4rem',
                              borderRadius: 9999, background: 'color-mix(in oklab, var(--color-primary) 15%, var(--color-surface))',
                              color: 'var(--color-primary)', fontWeight: 700, verticalAlign: 'middle',
                            }}>CUSTOM</span>
                          )}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{niche.desc}</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {isCustom ? 'Pro' : accessible ? (niche.access === 'free' ? 'Free' : 'Pro') : '🔒'}
                      </span>
                    </button>
                    {/* Delete button for custom niches */}
                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomNiche(niche.id)}
                        title="Hapus niche ini"
                        style={{
                          position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                          width: 22, height: 22, display: 'grid', placeItems: 'center',
                          borderRadius: '50%', border: 'none',
                          background: 'color-mix(in oklab, var(--color-warning) 15%, var(--color-surface))',
                          color: 'var(--color-warning)', fontSize: '0.7rem', cursor: 'pointer',
                        }}
                      >✕</button>
                    )}
                  </div>
                );
              })}

              {/* Tambah Custom Niche (Pro only) */}
              {licensed && (
                <button
                  onClick={() => { setShowCustomForm((v) => !v); setCustomFormError(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.7rem 0.9rem', borderRadius: '0.9rem', width: '100%',
                    background: 'transparent',
                    border: '1px dashed color-mix(in oklab, var(--color-primary) 35%, transparent)',
                    color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    marginTop: '0.25rem',
                  }}
                >
                  {showCustomForm ? '✕ Batal' : '+ Tambah niche custom'}
                </button>
              )}
            </div>

            {/* Custom Niche Form */}
            {licensed && showCustomForm && (
              <div style={{
                marginTop: '0.75rem', padding: '1rem',
                background: 'var(--color-surface-2)',
                border: '1px solid color-mix(in oklab, var(--color-primary) 25%, transparent)',
                borderRadius: '0.875rem',
                display: 'grid', gap: '0.7rem',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-primary)' }}>Niche baru</div>

                {[
                  { key: 'name', label: 'Nama niche *', placeholder: 'mis. E-Commerce, HR, Parenting' },
                  { key: 'desc', label: 'Deskripsi singkat', placeholder: 'mis. Copywriting produk online' },
                  { key: 'defaultAudience', label: 'Audiens default', placeholder: 'mis. seller marketplace baru' },
                  { key: 'defaultTone', label: 'Tone default', placeholder: 'mis. santai namun profesional' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ ...s.label, textTransform: 'none', fontSize: '0.72rem' }}>{label}</label>
                    <input
                      value={customForm[key as keyof typeof customForm]}
                      onChange={(e) => setCustomForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ ...s.input, padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ ...s.label, textTransform: 'none', fontSize: '0.72rem' }}>Instruksi niche * <span style={{ color: 'var(--color-text-faint)' }}>(paling penting!)</span></label>
                  <textarea
                    value={customForm.instruction}
                    onChange={(e) => setCustomForm((prev) => ({ ...prev, instruction: e.target.value }))}
                    placeholder="mis. Fokus pada konversi, pain point pembeli, dan bahasa yang memotivasi aksi beli."
                    style={{ ...s.input, minHeight: 80, resize: 'vertical', padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ ...s.label, textTransform: 'none', fontSize: '0.72rem' }}>Contoh offer/konteks</label>
                  <textarea
                    value={customForm.sampleOffer}
                    onChange={(e) => setCustomForm((prev) => ({ ...prev, sampleOffer: e.target.value }))}
                    placeholder="mis. Produk skincare local ingin boost penjualan di Shopee dengan promo 12.12."
                    style={{ ...s.input, minHeight: 60, resize: 'vertical', padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}
                  />
                </div>

                {customFormError && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>{customFormError}</div>
                )}

                <button
                  onClick={handleSaveCustomNiche}
                  style={{
                    padding: '0.75rem', borderRadius: '0.875rem',
                    background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
                    border: 'none', fontWeight: 700, fontFamily: 'inherit',
                    fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  Simpan niche
                </button>
              </div>
            )}

            {/* Status */}
            <div style={{
              marginTop: '0.75rem', padding: '0.9rem',
              background: 'var(--color-surface)',
              border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
              borderRadius: '0.875rem',
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Status akun</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.65rem',
                borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700,
                background: licensed
                  ? 'color-mix(in oklab, var(--color-success) 18%, var(--color-surface))'
                  : 'color-mix(in oklab, var(--color-warning) 18%, var(--color-surface))',
                color: licensed ? 'var(--color-success)' : 'var(--color-warning)',
              }}>
                {licensed ? 'License active' : 'Free mode'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                {licensed
                  ? `Semua niche terbuka · ${customNiches.length} custom niche`
                  : `Sisa generate: ${Math.max(0, FREE_GENERATE_LIMIT - generatedCount)}x`}
              </div>
            </div>
          </aside>

          {/* MAIN PANEL */}
          <section style={{ display: 'grid', gap: '1rem' }}>

            {/* YouTube Shorts niche — render ShortsGenerator */}
            {activeNicheId === 'youtube-shorts' && <ShortsGenerator />}

            {/* Generator biasa — sembunyikan kalau Shorts aktif */}
            <div style={{ ...s.panel, padding: '1.25rem', display: activeNicheId === 'youtube-shorts' ? 'none' : undefined }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Niche aktif</div>
                    <div style={{ fontWeight: 600 }}>{activeNiche.name}</div>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '0.35rem 0.65rem', borderRadius: 9999,
                    fontSize: '0.75rem', fontWeight: 700,
                    background: activeNiche.access === 'free'
                      ? 'color-mix(in oklab, var(--color-warning) 16%, var(--color-surface))'
                      : 'color-mix(in oklab, var(--color-primary) 15%, var(--color-surface))',
                    color: activeNiche.access === 'free' ? 'var(--color-warning)' : 'var(--color-primary)',
                  }}>
                    {activeNiche.id.startsWith('custom-') ? 'Custom niche' : activeNiche.access === 'free' ? 'Free niche' : 'Premium niche'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleRandomFill} style={{
                    padding: '0.75rem 1rem', borderRadius: 9999,
                    background: 'var(--color-surface)', color: 'var(--color-text)',
                    border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                    fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer',
                  }}>
                    Isi contoh
                  </button>
                  <button onClick={handleGenerate} style={{
                    padding: '0.75rem 1.1rem', borderRadius: 9999,
                    background: 'var(--color-primary)', color: 'var(--color-text-inverse)',
                    border: 'none', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer',
                  }}>
                    Generate prompt
                  </button>
                </div>
              </div>

              {/* Form + Output */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: '1rem' }}>

                {/* Form */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '0.9rem' }}>
                    <div>
                      <label style={s.label}>Objective</label>
                      <select value={objective} onChange={(e) => setObjective(e.target.value)} style={s.input}>
                        <option value="jualan">Jualan</option>
                        <option value="edukasi">Edukasi</option>
                        <option value="closing">Closing</option>
                        <option value="analisis">Analisis</option>
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Platform</label>
                      <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={s.input}>
                        <option value="ChatGPT">ChatGPT</option>
                        <option value="Claude">Claude</option>
                        <option value="Gemini">Gemini</option>
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Target audiens</label>
                      <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="mis. owner coffee shop Jakarta" style={s.input} />
                    </div>
                    <div>
                      <label style={s.label}>Tone</label>
                      <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="mis. persuasif, profesional, santai" style={s.input} />
                    </div>
                  </div>
                  <div>
                    <label style={s.label}>Produk / konteks / topik</label>
                    <textarea
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                      placeholder="Tulis produk, masalah, atau konteks yang ingin dijadikan prompt."
                      style={{ ...s.input, minHeight: 170, resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Outputs */}
                <div style={{ display: 'grid', gap: '0.9rem' }}>
                  {[
                    { id: 'simple', label: 'Simple prompt', hint: 'Cocok untuk user gratis.', value: simpleOut },
                    { id: 'advanced', label: 'Advanced prompt', hint: 'Struktur lebih detail dan siap iterasi.', value: advancedOut },
                    { id: 'expert', label: 'Expert prompt', hint: 'Khusus lisensi premium.', value: expertOut },
                  ].map((out) => (
                    <div key={out.id} style={{
                      padding: '0.9rem',
                      background: 'var(--color-surface)',
                      border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                      borderRadius: '0.875rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{out.label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{out.hint}</div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(out.value, out.id)}
                          style={{
                            padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
                            background: 'var(--color-surface-2)',
                            border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                            fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                            color: 'var(--color-text)',
                          }}
                        >
                          {copied === out.id ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={out.value}
                        placeholder="Klik Generate prompt untuk melihat hasil..."
                        style={{ ...s.input, minHeight: 100, resize: 'vertical', opacity: out.value ? 1 : 0.5 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* LICENSE SECTION — sembunyikan di niche Shorts */}
            <div id="license" style={{ display: activeNicheId === 'youtube-shorts' ? 'none' : 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ ...s.panel, padding: '1.25rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Aktivasi lisensi</div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: '0 0 1rem' }}>
                  Masukkan license key kamu untuk membuka semua niche premium.
                </p>
                <div style={{ marginBottom: '0.9rem' }}>
                  <label style={s.label}>License key</label>
                  <input
                    id="licenseKey"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="Masukkan key lisensi"
                    style={s.input}
                  />
                  {licenseError && <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-warning)' }}>{licenseError}</div>}
                  {licensed && <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-success)' }}>✓ Lisensi aktif! Semua niche + custom niche terbuka.</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={handleActivate} disabled={licensed} style={{
                    padding: '0.9rem 1.1rem', borderRadius: 9999,
                    background: licensed ? 'var(--color-surface)' : 'var(--color-primary)',
                    color: licensed ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
                    border: 'none', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.875rem',
                    cursor: licensed ? 'default' : 'pointer',
                  }}>
                    {licensed ? 'Sudah aktif' : 'Activate license'}
                  </button>
                  <button onClick={handleReset} style={{
                    padding: '0.9rem 1.1rem', borderRadius: 9999,
                    background: 'var(--color-surface)', color: 'var(--color-text)',
                    border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                    fontFamily: 'inherit', fontSize: '0.875rem', cursor: 'pointer',
                  }}>
                    Reset
                  </button>
                </div>
              </div>

            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
