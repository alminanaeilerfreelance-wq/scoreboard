import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { matchReducer } from '@/lib/matchReducer';

const MATCH_ID = 'main';

export async function POST(req) {
  try {
    const action = await req.json();
    const db = await getDb();
    const current = await db.collection('match').findOne({ _id: MATCH_ID });
    if (!current) {
      return NextResponse.json({ error: 'No active match. Launch one from the admin first.' }, { status: 404 });
    }
    const { _id, ...state } = current;
    const next = matchReducer(state, action);
    next.updatedAt = new Date().toISOString();
    await db.collection('match').replaceOne(
      { _id: MATCH_ID },
      { _id: MATCH_ID, ...next }
    );
    return NextResponse.json(next);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
