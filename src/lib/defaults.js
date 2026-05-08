// Constants and default seed data — used by both the API (initial inserts)
// and the client (form defaults).

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'];
export const FOUL_TYPES = ['Personal', 'Shooting', 'Offensive', 'Technical', 'Flagrant'];
export const COLOR_PALETTE = [
  '#E11D48', '#DC2626', '#EA580C', '#F59E0B', '#CA8A04',
  '#65A30D', '#16A34A', '#059669', '#0891B2', '#0284C7',
  '#2563EB', '#4F46E5', '#7C3AED', '#A21CAF', '#DB2777',
  '#9F1239', '#1E40AF', '#064E3B', '#581C87', '#831843',
];

export const DEFAULT_CONFIG = {
  tournamentName: 'CITY HARDWOOD CLASSIC',
  venue: 'Riverside Arena',
  matchDate: new Date().toISOString().slice(0, 10),
  matchTime: '19:30',
  quarterMinutes: 10,
  overtimeMinutes: 5,
  shotClockSeconds: 24,
  shotClockShort: 14,
  foulLimit: 5,
  bonusThreshold: 5,
  timeoutsPerGame: 5,
  refereeMain: 'M. Castellanos',
  refereeAssist: 'D. Ferreira',
};

const blankPlayer = (id, jersey, name, pos, captain, onCourt) => ({
  id, jersey, name, pos, captain, onCourt,
  fouls: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouledOut: false,
});

export const DEFAULT_TEAM_A = {
  id: 'A', name: 'TIGERS', city: 'EAST CITY', abbr: 'TGR', color: '#E11D48',
  coach: 'R. Avalos', assistant: 'K. Mendez',
  score: 0, fouls: 0, timeouts: 5,
  quarterFouls: { 1: 0, 2: 0, 3: 0, 4: 0 },
  players: [
    blankPlayer('a1', 23, 'James Cooper', 'PG', true, true),
    blankPlayer('a2', 4, 'Liam Park', 'SG', false, true),
    blankPlayer('a3', 15, 'Tyrone Hill', 'SF', false, true),
    blankPlayer('a4', 34, 'Marcus Wells', 'PF', false, true),
    blankPlayer('a5', 0, 'Devin Carter', 'C', false, true),
    blankPlayer('a6', 7, 'Aaron King', 'G', false, false),
    blankPlayer('a7', 21, 'Noah Reed', 'F', false, false),
    blankPlayer('a8', 11, 'Eli Foster', 'C', false, false),
  ],
};

export const DEFAULT_TEAM_B = {
  id: 'B', name: 'WOLVES', city: 'NORTH HARBOR', abbr: 'WLV', color: '#2563EB',
  coach: 'S. Tanaka', assistant: 'J. Brooks',
  score: 0, fouls: 0, timeouts: 5,
  quarterFouls: { 1: 0, 2: 0, 3: 0, 4: 0 },
  players: [
    blankPlayer('b1', 11, 'Mike Davis', 'PG', true, true),
    blankPlayer('b2', 7, 'Jordan Lee', 'SG', false, true),
    blankPlayer('b3', 9, 'Carlos Ruiz', 'SF', false, true),
    blankPlayer('b4', 22, 'Andre Boyd', 'PF', false, true),
    blankPlayer('b5', 50, 'Damon Pierce', 'C', false, true),
    blankPlayer('b6', 14, 'Ryan Solis', 'G', false, false),
    blankPlayer('b7', 5, 'Tre Allen', 'F', false, false),
    blankPlayer('b8', 44, 'Hunter Brooks', 'C', false, false),
  ],
};

export function buildMatchState(config, teams) {
  // Reset gameplay fields, but keep admin-defined info.
  const reset = (t) => ({
    ...t,
    score: 0, fouls: 0, timeouts: config.timeoutsPerGame,
    quarterFouls: { 1: 0, 2: 0, 3: 0, 4: 0 },
    players: t.players.map(p => ({
      ...p, fouls: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouledOut: false,
    })),
  });
  const A = reset(teams.A);
  const B = reset(teams.B);
  const firstA = A.players.find(p => p.onCourt) || A.players[0];
  const firstB = B.players.find(p => p.onCourt) || B.players[0];
  return {
    teams: { A, B },
    quarter: 1,
    isOvertime: false,
    status: 'pre',
    possession: 'A',
    gameClock: config.quarterMinutes * 60,
    shotClock: config.shotClockSeconds,
    clockRunning: false,
    selectedPlayer: { A: firstA?.id, B: firstB?.id },
    events: [],
    config,
    updatedAt: new Date().toISOString(),
  };
}

export function validateTeam(team) {
  const errs = [];
  if (!team?.name?.trim()) errs.push('Team name required');
  if (!team?.abbr?.trim() || team.abbr.length < 2 || team.abbr.length > 4) errs.push('Abbreviation must be 2–4 chars');
  const starters = (team?.players || []).filter(p => p.onCourt).length;
  if (starters !== 5) errs.push(`${team?.name || 'Team'} must have exactly 5 starters (currently ${starters})`);
  if ((team?.players || []).length < 5) errs.push(`${team?.name || 'Team'} needs at least 5 players`);
  const jerseys = (team?.players || []).map(p => p.jersey);
  if (new Set(jerseys).size !== jerseys.length) errs.push(`${team?.name || 'Team'} has duplicate jersey numbers`);
  (team?.players || []).forEach(p => {
    if (!p.name?.trim()) errs.push(`Empty player name on ${team?.name || 'team'}`);
  });
  return errs;
}

export function formatClock(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function quarterLabel(q, isOT) {
  if (q <= 4) return `Q${q}`;
  return `OT${q - 4}`;
}
