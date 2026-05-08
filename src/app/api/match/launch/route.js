import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { buildMatchState, validateTeam, DEFAULT_CONFIG, DEFAULT_TEAM_A, DEFAULT_TEAM_B } from '@/lib/defaults';

const MATCH_ID = 'main';
const CONFIG_ID = 'main';
const TEAMS_ID = 'main';

export async function POST() {
  try {
    const db = await getDb();
    const configDoc = await db.collection('config').findOne({ _id: CONFIG_ID });
    const teamsDoc = await db.collection('teams').findOne({ _id: TEAMS_ID });

    const config = configDoc ? (() => { const { _id, ...c } = configDoc; return c; })() : DEFAULT_CONFIG;
    const teams = teamsDoc
      ? { A: teamsDoc.A, B: teamsDoc.B }
      : { A: DEFAULT_TEAM_A, B: DEFAULT_TEAM_B };

    // Validate
    const errs = [...validateTeam(teams.A), ...validateTeam(teams.B)];
    if (errs.length) {
      return NextResponse.json({ error: errs[0], errors: errs }, { status: 400 });
    }

    const fresh = buildMatchState(config, teams);

    await db.collection('match').replaceOne(
      { _id: MATCH_ID },
      { _id: MATCH_ID, ...fresh },
      { upsert: true }
    );

    return NextResponse.json(fresh);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
