import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

function isAdmin(email?: string | null) {
  return email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
}

// GET — list semua license
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [rows]: any = await pool.query(
    'SELECT * FROM licenses ORDER BY created_at DESC'
  );
  return NextResponse.json(rows);
}

// POST — tambah license baru
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { license_key, email } = await req.json();
  if (!license_key) {
    return NextResponse.json({ error: 'License key wajib diisi' }, { status: 400 });
  }

  try {
    await pool.query(
      'INSERT INTO licenses (license_key, email) VALUES (?, ?)',
      [license_key.trim(), email || null]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Key sudah ada' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}

// PATCH — toggle aktif/nonaktif
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, is_active } = await req.json();
  await pool.query('UPDATE licenses SET is_active = ? WHERE id = ?', [is_active, id]);
  return NextResponse.json({ success: true });
}
