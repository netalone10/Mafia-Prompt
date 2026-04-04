import type { Niche } from './niches';

interface GenerateInput {
  niche: Niche;
  objective: string;
  platform: string;
  audience: string;
  tone: string;
  offer: string;
}

export function generatePrompts(input: GenerateInput) {
  const { niche, objective, platform, audience, tone, offer } = input;

  const simple = `Bertindak sebagai ahli ${niche.name}. Buat output untuk tujuan ${objective} di ${platform}. Target audiens: ${audience}. Tone: ${tone}. Konteks: ${offer}. ${niche.instruction} Berikan hasil yang langsung bisa dipakai.`;

  const advanced = `Kamu adalah spesialis ${niche.name}. Tugasmu adalah menyusun output berkualitas tinggi untuk objective ${objective}.

Konteks utama:
- Platform AI: ${platform}
- Audiens: ${audience}
- Tone: ${tone}
- Input bisnis/topik: ${offer}
- Aturan niche: ${niche.instruction}

Instruksi kerja:
1. Analisis kebutuhan user secara ringkas.
2. Susun output yang paling relevan untuk objective tersebut.
3. Gunakan struktur yang rapi, spesifik, dan tidak generik.
4. Berikan 3 variasi sudut pendekatan.
5. Akhiri dengan saran iterasi lanjutan agar hasil bisa ditingkatkan.`;

  const expert = `Berperanlah sebagai senior strategist untuk niche ${niche.name}. Saya ingin kamu menghasilkan output kelas premium, bukan jawaban generik.

DATA INPUT
- Objective: ${objective}
- Platform tujuan: ${platform}
- Audiens inti: ${audience}
- Tone komunikasi: ${tone}
- Konteks/detail: ${offer}

FRAMEWORK WAJIB
- Mulai dengan diagnosis singkat tentang kebutuhan user.
- Tampilkan asumsi penting yang kamu pakai.
- Bangun output utama yang spesifik, persuasive, dan relevan dengan niche.
- Sertakan 3 versi: conservative, balanced, aggressive.
- Sertakan checklist kualitas agar user bisa menilai hasil.
- Jika konteks kurang, buat pertanyaan klarifikasi paling penting di akhir.

BATASAN
- Hindari filler, kalimat klise, dan saran yang terlalu umum.
- Pastikan setiap bagian bisa langsung dipakai atau diedit ringan.
- ${niche.instruction}`;

  return { simple, advanced, expert };
}
