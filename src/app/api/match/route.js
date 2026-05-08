import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

const MATCH_ID = 'main';

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('match').findOne({ _id: MATCH_ID });
    if (!doc) {
      // No live match yet
      return NextResponse.json(null);
    }
    const { _id, ...match } = doc;
    return NextResponse.json(match);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    // Used for clock-tick persistence and any other partial updates
    const patch = await req.json();
    const db = await getDb();
    await db.collection('match').updateOne(
      { _id: MATCH_ID },
      { $set: { ...patch, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
