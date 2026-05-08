import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { DEFAULT_CONFIG, DEFAULT_TEAM_A, DEFAULT_TEAM_B } from '@/lib/defaults';

export async function POST() {
  try {
    const db = await getDb();
    await db.collection('config').replaceOne(
      { _id: 'main' },
      { _id: 'main', ...DEFAULT_CONFIG },
      { upsert: true }
    );
    await db.collection('teams').replaceOne(
      { _id: 'main' },
      { _id: 'main', A: DEFAULT_TEAM_A, B: DEFAULT_TEAM_B },
      { upsert: true }
    );
    await db.collection('match').deleteOne({ _id: 'main' });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
