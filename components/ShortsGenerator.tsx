'use client';

import { useState, useCallback } from 'react';

// --- VISUAL STYLES ---
const STYLES = [
  { id: 'cinematic', icon: '🎬', label: 'Cinematic Realism', mod: 'Cinematic lighting, hyper-realistic, 8k resolution, highly detailed, photorealistic, cinematic shot, center composition' },
  { id: 'ghibli', icon: '🍃', label: 'Anime Ghibli', mod: 'Studio Ghibli style, Hayao Miyazaki, vibrant colors, beautiful anime background, highly detailed 2D animation, magical atmosphere, center focused' },
  { id: 'cartoon', icon: '🎨', label: 'Western Cartoon', mod: '2D western cartoon style, flat colors, clean lines, comic book style, vibrant, expressive, animated series style' },
  { id: 'pixar', icon: '🧸', label: 'Pixar 3D', mod: 'Pixar 3D animation style, Disney style, soft lighting, highly detailed 3D, expressive characters, cute, rendered in unreal engine' },
  { id: 'anime', icon: '🌸', label: 'Japanese Anime', mod: 'High quality anime style, detailed background, Makoto Shinkai style, vibrant colors, cinematic anime lighting' },
  { id: 'cyberpunk', icon: '🏙️', label: 'Cyberpunk Sci-Fi', mod: 'Cyberpunk style, neon lights, futuristic, dark and gritty, highly detailed sci-fi, dystopian city' },
  { id: 'dark_fantasy', icon: '🐉', label: 'Dark Fantasy', mod: 'Dark fantasy art, gothic, moody lighting, highly detailed, epic composition, trending on artstation' },
  { id: '3d_unreal', icon: '🎮', label: '3D Unreal Engine', mod: 'High quality 3D render, unreal engine 5, octane render, detailed textures, cinematic lighting, masterpiece' },
];

// --- HELPERS ---
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<any> {
  let delay = 1500;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error?.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, delay));
      delay *= 1.5;
    }
  }
}

function force9x16(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const target = 9 / 16;
      let { width, height } = img;
      if (Math.abs(width / height - target) < 0.01) { resolve(dataUrl); return; }
      let cw = width, ch = height;
      if (width / height > target) cw = height * target;
      else ch = width / target;
      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, (width - cw) / 2, (height - ch) / 2, cw, ch, 0, 0, cw, ch);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Gagal crop gambar'));
    img.src = dataUrl;
  });
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = window.atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function pcmToWav(pcm: ArrayBuffer, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const v = new DataView(buf);
  const ws = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + pcm.byteLength, true);
  ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, pcm.byteLength, true);
  new Uint8Array(buf, 44).set(new Uint8Array(pcm));
  return new Blob([v], { type: 'audio/wav' });
}

function extractJSON(text: string): any[] {
  try {
    const m = text.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    return JSON.parse(text);
  } catch {
    throw new Error('Gagal membaca format skrip dari AI.');
  }
}

function downloadFile(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

interface SceneCard {
  sceneNumber: number;
  narration: string;
  imagePrompt: string;
  videoMotionPrompt: string;
  imageUrl: string | null;
  audioUrl: string | null;
  imageStatus: 'pending' | 'processing' | 'done' | 'error';
  audioStatus: 'pending' | 'processing' | 'done' | 'error';
  imageError: string;
  audioError: string;
}

const s = {
  input: {
    width: '100%', borderRadius: '0.9rem',
    border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
    background: 'var(--color-surface-2)', color: 'var(--color-text)',
    padding: '0.8rem 1rem', fontFamily: 'inherit', fontSize: '0.875rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.72rem', fontWeight: 700 as const,
    color: 'var(--color-text-muted)', textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', display: 'block' as const, marginBottom: '0.4rem',
  },
};

export default function ShortsGenerator() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [topic, setTopic] = useState('');
  const [styleId, setStyleId] = useState('cinematic');
  const [voice, setVoice] = useState('Kore');
  const [sceneCount, setSceneCount] = useState(5);
  const [showStyleModal, setShowStyleModal] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [scenes, setScenes] = useState<SceneCard[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast('Prompt disalin!')).catch(() => showToast('Gagal salin.'));
  };

  const updateScene = (i: number, updates: Partial<SceneCard>) => {
    setScenes(prev => { const a = [...prev]; a[i] = { ...a[i], ...updates }; return a; });
  };

  const genImage = async (prompt: string, styleObj: typeof STYLES[0]) => {
    const full = `${prompt}, ${styleObj.mod}`;
    const res = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instances: { prompt: full }, parameters: { sampleCount: 1, aspectRatio: '9:16' } }) }
    );
    const b64 = res?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error('Gambar kosong');
    return await force9x16(`data:image/png;base64,${b64}`);
  };

  const genAudio = async (text: string) => {
    const res = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
          model: 'gemini-2.5-flash-preview-tts',
        }),
      }
    );
    const part = res?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!part) throw new Error('Audio kosong');
    const sr = parseInt(part.mimeType.match(/rate=(\d+)/)?.[1] ?? '24000');
    const wav = pcmToWav(base64ToBuffer(part.data), sr);
    return URL.createObjectURL(wav);
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) { setError('Masukkan Gemini API key dulu.'); return; }
    if (!topic.trim()) { setError('Masukkan topik dulu.'); return; }

    setIsGenerating(true); setError(''); setScenes([]);
    setProgress(`Menyusun naskah (${sceneCount} adegan)...`);

    try {
      const styleObj = STYLES.find(s => s.id === styleId)!;

      const scriptRes = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Create an engaging script for a short-form vertical video about: "${topic}". Must be in English. Split into EXACTLY ${sceneCount} scenes. For each scene: narrationText (words to speak), imagePrompt (visual description, no text overlays), videoMotionPrompt (camera/animation instructions for AI video tools).` }] }],
            systemInstruction: { parts: [{ text: 'You are an expert video producer. Output strictly as a JSON array.' }] },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    sceneNumber: { type: 'INTEGER' },
                    narrationText: { type: 'STRING' },
                    imagePrompt: { type: 'STRING' },
                    videoMotionPrompt: { type: 'STRING' },
                  },
                  required: ['sceneNumber', 'narrationText', 'imagePrompt', 'videoMotionPrompt'],
                },
              },
            },
          }),
        }
      );

      const raw = scriptRes?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Gagal menyusun naskah.');
      const data = extractJSON(raw).slice(0, sceneCount);

      const initial: SceneCard[] = data.map((d: any, i: number) => ({
        sceneNumber: d.sceneNumber ?? i + 1,
        narration: d.narrationText,
        imagePrompt: d.imagePrompt,
        videoMotionPrompt: d.videoMotionPrompt ?? 'Slow cinematic zoom in',
        imageUrl: null, audioUrl: null,
        imageStatus: 'pending', audioStatus: 'pending',
        imageError: '', audioError: '',
      }));
      setScenes(initial);

      for (let i = 0; i < initial.length; i++) {
        setProgress(`Visual & Audio Adegan ${i + 1}/${initial.length}...`);
        updateScene(i, { imageStatus: 'processing', audioStatus: 'processing' });

        const [imgRes, audRes] = await Promise.all([
          genImage(initial[i].imagePrompt, styleObj).then(url => ({ ok: true, url })).catch(e => ({ ok: false, msg: e.message })),
          genAudio(initial[i].narration).then(url => ({ ok: true, url })).catch(e => ({ ok: false, msg: e.message })),
        ]);

        updateScene(i, {
          imageUrl: imgRes.ok ? (imgRes as any).url : null,
          imageStatus: imgRes.ok ? 'done' : 'error',
          imageError: imgRes.ok ? '' : 'Diblokir filter / gagal generate.',
          audioUrl: audRes.ok ? (audRes as any).url : null,
          audioStatus: audRes.ok ? 'done' : 'error',
          audioError: audRes.ok ? '' : 'Gagal generate suara.',
        });

        if (i < initial.length - 1) await new Promise(r => setTimeout(r, 1000));
      }

      setProgress('Selesai!');
      setTimeout(() => setIsGenerating(false), 800);
    } catch (e: any) {
      setError(`Gagal: ${e.message}`);
      setIsGenerating(false);
    }
  };

  const handleRetry = async (i: number, type: 'image' | 'audio') => {
    const scene = scenes[i];
    const styleObj = STYLES.find(s => s.id === styleId)!;
    if (type === 'image') {
      updateScene(i, { imageStatus: 'processing', imageError: '' });
      try {
        const url = await genImage(scene.imagePrompt, styleObj);
        updateScene(i, { imageUrl: url, imageStatus: 'done' });
      } catch (e: any) {
        updateScene(i, { imageStatus: 'error', imageError: 'Masih gagal. Coba topik lain.' });
      }
    } else {
      updateScene(i, { audioStatus: 'processing', audioError: '' });
      try {
        const url = await genAudio(scene.narration);
        updateScene(i, { audioUrl: url, audioStatus: 'done' });
      } catch {
        updateScene(i, { audioStatus: 'error', audioError: 'Gagal retry audio.' });
      }
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    let count = 0;
    for (const scene of scenes) {
      if (scene.imageUrl && scene.imageStatus === 'done') {
        downloadFile(scene.imageUrl, `Scene_${scene.sceneNumber}_Image.png`);
        count++; await new Promise(r => setTimeout(r, 600));
      }
      if (scene.audioUrl && scene.audioStatus === 'done') {
        downloadFile(scene.audioUrl, `Scene_${scene.sceneNumber}_Audio.wav`);
        count++; await new Promise(r => setTimeout(r, 600));
      }
    }
    setIsDownloading(false);
    if (!count) showToast('Belum ada aset yang siap didownload.');
  };

  const selectedStyle = STYLES.find(s => s.id === styleId)!;

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'var(--color-text)', color: 'var(--color-text-inverse)',
          padding: '0.6rem 1.25rem', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 700,
          boxShadow: '0 6px 24px oklch(0.2 0.01 80 / 0.2)',
        }}>
          ✓ {toast}
        </div>
      )}

      {/* API Key Panel */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 84%, white), var(--color-surface))',
        border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
        borderRadius: '1rem',
        boxShadow: '0 6px 24px oklch(0.2 0.01 80 / 0.08)',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔑 Gemini API Key</span>
          <span style={{
            fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: 9999,
            background: 'color-mix(in oklab, var(--color-warning) 16%, var(--color-surface))',
            color: 'var(--color-warning)', fontWeight: 700,
          }}>WAJIB</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIza..."
            style={{ ...s.input, flex: 1 }}
          />
          <button onClick={() => setShowKey(v => !v)} style={{
            padding: '0 1rem', borderRadius: '0.9rem', border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
            background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer',
          }}>
            {showKey ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
          Dapatkan gratis di <strong>aistudio.google.com</strong>. Key hanya disimpan di browser kamu.
        </div>
      </div>

      {/* Generator Form */}
      <div style={{
        padding: '1.25rem',
        background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-surface) 84%, white), var(--color-surface))',
        border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
        borderRadius: '1rem',
        boxShadow: '0 6px 24px oklch(0.2 0.01 80 / 0.08)',
        marginBottom: '1rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>🌍 Global Shorts AI</div>
          <span style={{
            fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 9999,
            background: 'color-mix(in oklab, var(--color-primary) 15%, var(--color-surface))',
            color: 'var(--color-primary)', fontWeight: 700,
          }}>PRO</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            🚀 Topik Bebas · 🎥 AI Video Prompt · 🇬🇧 Auto English
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', alignItems: 'start' }}>

          {/* Left: Inputs */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={s.label}>Topik Fakta / Cerita</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={isGenerating}
                placeholder="Contoh: The history of the Roman Empire, 3 facts about black holes, etc..."
                style={{ ...s.input, minHeight: 90, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Visual Style */}
              <div>
                <label style={s.label}>Visual Style</label>
                <button
                  onClick={() => !isGenerating && setShowStyleModal(true)}
                  disabled={isGenerating}
                  style={{
                    ...s.input, display: 'flex', alignItems: 'center', gap: '0.5rem',
                    textAlign: 'left', cursor: isGenerating ? 'default' : 'pointer',
                    width: '100%', justifyContent: 'flex-start',
                  }}
                >
                  <span>{selectedStyle.icon}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedStyle.label}
                  </span>
                </button>
              </div>

              {/* Voiceover */}
              <div>
                <label style={s.label}>Voiceover</label>
                <select value={voice} onChange={e => setVoice(e.target.value)} disabled={isGenerating} style={s.input}>
                  <option value="Kore">👩🏻 Kore (Clear)</option>
                  <option value="Aoede">👩🏼 Aoede (Pro)</option>
                  <option value="Fenrir">👨🏻 Fenrir (Deep)</option>
                  <option value="Puck">👨🏼 Puck (Energetic)</option>
                </select>
              </div>
            </div>

            {/* Scene Count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ ...s.label, margin: 0 }}>Jumlah Adegan</label>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: 9999,
                  background: 'color-mix(in oklab, var(--color-primary) 15%, var(--color-surface))',
                  color: 'var(--color-primary)',
                }}>
                  {sceneCount} Adegan
                </span>
              </div>
              <input
                type="range" min={4} max={10} value={sceneCount}
                onChange={e => setSceneCount(parseInt(e.target.value))}
                disabled={isGenerating}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: isGenerating ? 'default' : 'pointer' }}
              />
            </div>
          </div>

          {/* Right: Generate Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 160 }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.875rem',
                background: isGenerating ? 'var(--color-surface-offset)' : 'var(--color-primary)',
                color: isGenerating ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
                border: 'none', fontWeight: 700, fontFamily: 'inherit',
                fontSize: '0.95rem', cursor: isGenerating ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isGenerating ? '⏳ Generating...' : '⚡ Generate Shorts'}
            </button>

            {isGenerating && (
              <div style={{
                fontSize: '0.75rem', color: 'var(--color-primary)',
                textAlign: 'center', fontWeight: 600,
                padding: '0.5rem', background: 'color-mix(in oklab, var(--color-primary) 8%, var(--color-surface))',
                borderRadius: '0.75rem', border: '1px solid color-mix(in oklab, var(--color-primary) 20%, transparent)',
              }}>
                {progress}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: 'color-mix(in oklab, var(--color-warning) 10%, var(--color-surface))',
            border: '1px solid color-mix(in oklab, var(--color-warning) 30%, transparent)',
            borderRadius: '0.875rem', fontSize: '0.85rem', color: 'var(--color-warning)', fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {scenes.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Hasil Storyboard <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({scenes.length} adegan)</span>
            </div>
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              style={{
                padding: '0.6rem 1rem', borderRadius: 9999,
                background: 'var(--color-text)', color: 'var(--color-text-inverse)',
                border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: isDownloading ? 'wait' : 'pointer',
              }}
            >
              {isDownloading ? 'Mengunduh...' : '↓ Download Semua'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {scenes.map((scene, i) => (
              <div key={i} style={{
                background: 'var(--color-surface)',
                border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
                borderRadius: '1rem', overflow: 'hidden',
                boxShadow: '0 2px 8px oklch(0.2 0.01 80 / 0.06)',
              }}>
                {/* Scene number badge */}
                <div style={{ padding: '0.6rem 0.9rem', background: 'var(--color-surface-offset)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Adegan {scene.sceneNumber}</span>
                  <span style={{
                    fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 9999,
                    background: scene.imageStatus === 'done' && scene.audioStatus === 'done'
                      ? 'color-mix(in oklab, var(--color-success) 15%, var(--color-surface))'
                      : 'color-mix(in oklab, var(--color-warning) 15%, var(--color-surface))',
                    color: scene.imageStatus === 'done' && scene.audioStatus === 'done' ? 'var(--color-success)' : 'var(--color-warning)',
                    fontWeight: 700,
                  }}>
                    {scene.imageStatus === 'done' && scene.audioStatus === 'done' ? '✓ Selesai' : 'Proses...'}
                  </span>
                </div>

                {/* Image */}
                <div style={{ aspectRatio: '9/16', background: 'var(--color-surface-offset)', position: 'relative', maxHeight: 320, overflow: 'hidden' }}>
                  {scene.imageStatus === 'pending' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)' }}>
                      <span style={{ fontSize: '2rem' }}>⏳</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Menunggu...</span>
                    </div>
                  )}
                  {scene.imageStatus === 'processing' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                      <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-highlight)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}>Membuat gambar...</span>
                    </div>
                  )}
                  {scene.imageStatus === 'done' && scene.imageUrl && (
                    <>
                      <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => downloadFile(scene.imageUrl!, `Scene_${scene.sceneNumber}_Image.png`)}
                        style={{
                          position: 'absolute', bottom: '0.5rem', right: '0.5rem',
                          padding: '0.4rem 0.7rem', borderRadius: '0.75rem',
                          background: 'rgba(255,255,255,0.92)', color: 'var(--color-text)',
                          border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >↓ Gambar</button>
                    </>
                  )}
                  {scene.imageStatus === 'error' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', margin: '0.5rem 0' }}>{scene.imageError}</span>
                      <button onClick={() => handleRetry(i, 'image')} style={{ padding: '0.4rem 0.8rem', borderRadius: '0.75rem', background: 'var(--color-warning)', color: '#fff', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '0.9rem', display: 'grid', gap: '0.75rem' }}>
                  {/* Narasi */}
                  <p style={{ margin: 0, fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    "{scene.narration}"
                  </p>

                  {/* Audio */}
                  {scene.audioStatus === 'pending' && (
                    <div style={{ height: 36, background: 'var(--color-surface-offset)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--color-text-faint)' }}>
                      Menunggu antrean suara...
                    </div>
                  )}
                  {scene.audioStatus === 'processing' && (
                    <div style={{ height: 36, background: 'color-mix(in oklab, var(--color-primary) 8%, var(--color-surface))', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      Generating suara...
                    </div>
                  )}
                  {scene.audioStatus === 'done' && scene.audioUrl && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <audio controls src={scene.audioUrl} style={{ flex: 1, height: 36 }} />
                      <button onClick={() => downloadFile(scene.audioUrl!, `Scene_${scene.sceneNumber}_Audio.wav`)} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.75rem', background: 'var(--color-primary-highlight)', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                        ↓
                      </button>
                    </div>
                  )}
                  {scene.audioStatus === 'error' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.75rem', background: 'color-mix(in oklab, var(--color-warning) 10%, var(--color-surface))', borderRadius: '0.75rem', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>⚠️ {scene.audioError}</span>
                      <button onClick={() => handleRetry(i, 'audio')} style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: 'var(--color-warning)', color: '#fff', border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Video Motion Prompt */}
                  <div style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid color-mix(in oklab, var(--color-text) 8%, transparent)',
                    borderRadius: '0.75rem', padding: '0.7rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🎥 Video Prompt
                      </span>
                      <button onClick={() => copyText(scene.videoMotionPrompt)} style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.1rem 0.4rem' }}>
                        Salin
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {scene.videoMotionPrompt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div style={{
            padding: '0.9rem 1rem',
            background: 'color-mix(in oklab, var(--color-primary) 8%, var(--color-surface))',
            border: '1px solid color-mix(in oklab, var(--color-primary) 20%, transparent)',
            borderRadius: '0.875rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6,
          }}>
            💡 <strong>Trik:</strong> Unduh gambar → salin <em>Video Prompt</em> tiap kartu → paste ke <strong>Luma / Kling / Runway</strong> untuk generate video-nya!
          </div>
        </div>
      )}

      {/* Style Modal */}
      {showStyleModal && (
        <div
          onClick={() => setShowStyleModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'oklch(0.1 0 0 / 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)', borderRadius: '1.25rem',
              width: '100%', maxWidth: 400, maxHeight: '80vh',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              border: '1px solid color-mix(in oklab, var(--color-text) 10%, transparent)',
              boxShadow: '0 20px 60px oklch(0.1 0 0 / 0.3)',
            }}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid color-mix(in oklab, var(--color-text) 8%, transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Pilih Visual Style</span>
              <button onClick={() => setShowStyleModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              {STYLES.map((style, idx) => (
                <button
                  key={style.id}
                  onClick={() => { setStyleId(style.id); setShowStyleModal(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.9rem 1.25rem', textAlign: 'left',
                    background: styleId === style.id ? 'color-mix(in oklab, var(--color-primary-highlight) 40%, var(--color-surface))' : 'transparent',
                    border: 'none',
                    borderBottom: idx < STYLES.length - 1 ? '1px solid color-mix(in oklab, var(--color-text) 6%, transparent)' : 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    color: styleId === style.id ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{style.icon}</span>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{style.label}</span>
                  </div>
                  {styleId === style.id && <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
