import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { DEFAULT_CONFIG } from '@/lib/defaults';

const CONFIG_ID = 'main';

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('config').findOne({ _id: CONFIG_ID });
    if (!doc) {
      // Seed defaults on first request
      await db.collection('config').insertOne({ _id: CONFIG_ID, ...DEFAULT_CONFIG });
      return NextResponse.json(DEFAULT_CONFIG);
    }
    const { _id, ...config } = doc;
    return NextResponse.json(config);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const db = await getDb();
    await db.collection('config').updateOne(
      { _id: CONFIG_ID },
      { $set: body },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
