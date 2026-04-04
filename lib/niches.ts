export type NicheAccess = 'free' | 'pro';

export interface Niche {
  id: string;
  name: string;
  access: NicheAccess;
  desc: string;
  defaultAudience: string;
  defaultTone: string;
  sampleOffer: string;
  instruction: string;
}

export const niches: Niche[] = [
  {
    id: 'umkm',
    name: 'Konten UMKM',
    access: 'free',
    desc: 'Caption, promo, iklan singkat',
    defaultAudience: 'owner UMKM makanan',
    defaultTone: 'persuasif hangat',
    sampleOffer: 'Produk kopi literan baru dengan margin bagus, target pekerja kantoran, ingin bikin promo weekend dan caption yang bisa menaikkan order.',
    instruction: 'Fokus pada penjualan, promo, dan bahasa yang mudah dipahami pelanggan lokal.',
  },
  {
    id: 'creator',
    name: 'Content Creator',
    access: 'free',
    desc: 'Hook, script, carousel',
    defaultAudience: 'creator edukasi bisnis',
    defaultTone: 'tajam dan engaging',
    sampleOffer: 'Butuh ide konten 7 hari tentang personal branding untuk pemula dengan format hook, angle, dan CTA.',
    instruction: 'Fokus pada hook, retention, struktur konten, dan CTA yang kuat.',
  },
  {
    id: 'freelance',
    name: 'Freelancer',
    access: 'pro',
    desc: 'Proposal, outreach, audit',
    defaultAudience: 'calon klien jasa digital',
    defaultTone: 'profesional meyakinkan',
    sampleOffer: 'Jasa pembuatan landing page untuk bisnis lokal yang belum punya website dan ingin lead masuk dari iklan.',
    instruction: 'Fokus pada kredibilitas, value proposition, dan closing klien.',
  },
  {
    id: 'trading',
    name: 'Trading Journal',
    access: 'pro',
    desc: 'Review trade, bias, checklist',
    defaultAudience: 'trader retail forex',
    defaultTone: 'objektif disiplin',
    sampleOffer: 'Mau review loss trading XAUUSD supaya bisa tahu kesalahan setup, emosi, dan pelanggaran risk management.',
    instruction: 'Fokus pada objektivitas, evaluasi setup, psikologi, dan manajemen risiko.',
  },
  {
    id: 'office',
    name: 'Kerja Kantoran',
    access: 'pro',
    desc: 'Memo, TOR, notulensi, ringkasan',
    defaultAudience: 'staf administrasi dan analis',
    defaultTone: 'formal jelas',
    sampleOffer: 'Butuh draft notulensi rapat dan ringkasan tindak lanjut dari diskusi lintas tim yang cukup panjang.',
    instruction: 'Fokus pada struktur formal, kejelasan poin, dan tindak lanjut yang rapi.',
  },
  {
    id: 'agency',
    name: 'Agency Copy',
    access: 'pro',
    desc: 'Landing page, ad angle, CTA',
    defaultAudience: 'brand owner dan marketing lead',
    defaultTone: 'strategis persuasif',
    sampleOffer: 'Perlu prompt untuk bikin copy landing page dan ad angle produk skincare lokal dengan positioning premium terjangkau.',
    instruction: 'Fokus pada positioning, market awareness, objection, dan conversion copy.',
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts AI',
    access: 'pro',
    desc: 'Generate gambar + suara + video prompt',
    defaultAudience: '',
    defaultTone: '',
    sampleOffer: '',
    instruction: '',
  },
];

export const FREE_GENERATE_LIMIT = 3;
export const VALID_LICENSE_KEY = 'PFID-PRO-2026';
