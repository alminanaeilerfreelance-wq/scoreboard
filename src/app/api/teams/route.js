import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { DEFAULT_TEAM_A, DEFAULT_TEAM_B } from '@/lib/defaults';

const TEAMS_ID = 'main';

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('teams').findOne({ _id: TEAMS_ID });
    if (!doc) {
      const seed = { _id: TEAMS_ID, A: DEFAULT_TEAM_A, B: DEFAULT_TEAM_B };
      await db.collection('teams').insertOne(seed);
      return NextResponse.json({ A: DEFAULT_TEAM_A, B: DEFAULT_TEAM_B });
    }
    const { _id, ...teams } = doc;
    return NextResponse.json(teams);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json(); // { A: {...}, B: {...} }
    if (!body.A || !body.B) {
      return NextResponse.json({ error: 'Both teams A and B required' }, { status: 400 });
    }
    const db = await getDb();
    await db.collection('teams').updateOne(
      { _id: TEAMS_ID },
      { $set: { A: body.A, B: body.B } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
