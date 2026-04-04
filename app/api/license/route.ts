import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ valid: false, message: 'Key tidak valid.' }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      'SELECT * FROM licenses WHERE license_key = ? AND is_active = 1 LIMIT 1',
      [key.trim()]
    );

    if (rows.length > 0) {
      return NextResponse.json({ valid: true, message: 'Lisensi aktif!' });
    } else {
      return NextResponse.json({ valid: false, message: 'Key tidak ditemukan atau tidak aktif.' });
    }
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ valid: false, message: 'Server error.' }, { status: 500 });
  }
}
