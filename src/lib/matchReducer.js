import { formatClock } from './defaults';

// The canonical game-state reducer. Runs on the server when an event is
// recorded, and on the client for optimistic UI. Pure function.

export function matchReducer(state, action) {
  const config = state.config;
  switch (action.type) {
    case 'TICK': {
      if (!state.clockRunning) return state;
      const newGame = Math.max(0, state.gameClock - 1);
      const newShot = Math.max(0, state.shotClock - 1);
      let next = { ...state, gameClock: newGame, shotClock: newShot };
      if (newGame === 0) {
        next.clockRunning = false;
        next.status = 'quarterEnd';
        next.events = [
          { id: makeId(), quarter: state.quarter, time: '00:00', team: null, type: 'QUARTER_END', desc: state.isOvertime ? `End of OT${state.quarter - 4}` : `End of Q${state.quarter}` },
          ...state.events,
        ];
      }
      if (newShot === 0 && newGame > 0) {
        next.clockRunning = false;
        next.shotClock = config.shotClockSeconds;
        next.possession = state.possession === 'A' ? 'B' : 'A';
        next.events = [
          { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team: state.possession, type: 'VIOLATION', desc: 'Shot clock violation — possession changes' },
          ...state.events,
        ];
      }
      return next;
    }

    case 'SET_CLOCK': {
      // Used by the server to persist clock value periodically without re-ticking
      return { ...state, gameClock: action.gameClock, shotClock: action.shotClock };
    }

    case 'TOGGLE_CLOCK': {
      if (state.gameClock === 0) return state;
      return { ...state, clockRunning: !state.clockRunning, status: state.clockRunning ? 'paused' : 'live' };
    }

    case 'RESET_SHOT': {
      return { ...state, shotClock: action.short ? config.shotClockShort : config.shotClockSeconds };
    }

    case 'SET_POSSESSION': {
      return { ...state, possession: action.team };
    }

    case 'SELECT_PLAYER': {
      return { ...state, selectedPlayer: { ...state.selectedPlayer, [action.team]: action.playerId } };
    }

    case 'SCORE': {
      const { team, points } = action;
      const playerId = action.playerId || state.selectedPlayer[team];
      const teams = { ...state.teams };
      const t = { ...teams[team] };
      t.score += points;
      t.players = t.players.map(p => p.id === playerId ? { ...p, points: p.points + points } : p);
      teams[team] = t;
      const player = t.players.find(p => p.id === playerId);
      const desc = `#${player.jersey} ${player.name} — ${points === 1 ? 'Free Throw made' : points === 2 ? '2PT made' : '3PT made'}`;
      return {
        ...state,
        teams,
        possession: team === 'A' ? 'B' : 'A',
        shotClock: config.shotClockSeconds,
        events: [
          { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team, type: 'SCORE', points, desc, scoreA: teams.A.score, scoreB: teams.B.score },
          ...state.events,
        ],
      };
    }

    case 'UNDO_SCORE': {
      const idx = state.events.findIndex(e => e.type === 'SCORE' && e.team === action.team);
      if (idx === -1) return state;
      const ev = state.events[idx];
      const teams = { ...state.teams };
      const t = { ...teams[action.team] };
      t.score = Math.max(0, t.score - ev.points);
      const match = ev.desc.match(/#(\d+)/);
      if (match) {
        const j = parseInt(match[1]);
        t.players = t.players.map(p => p.jersey === j ? { ...p, points: Math.max(0, p.points - ev.points) } : p);
      }
      teams[action.team] = t;
      return { ...state, teams, events: state.events.filter((_, i) => i !== idx) };
    }

    case 'FOUL': {
      const { team, foulType } = action;
      const playerId = action.playerId || state.selectedPlayer[team];
      const teams = { ...state.teams };
      const t = { ...teams[team] };
      t.fouls += 1;
      t.quarterFouls = { ...t.quarterFouls, [state.quarter]: (t.quarterFouls[state.quarter] || 0) + 1 };
      let foulOutEvent = null;
      t.players = t.players.map(p => {
        if (p.id !== playerId) return p;
        const newFouls = p.fouls + 1;
        const fouledOut = newFouls >= config.foulLimit;
        if (fouledOut && !p.fouledOut) {
          foulOutEvent = { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team, type: 'FOUL_OUT', desc: `#${p.jersey} ${p.name} fouled out` };
        }
        return { ...p, fouls: newFouls, fouledOut, onCourt: fouledOut ? false : p.onCourt };
      });
      teams[team] = t;
      const player = t.players.find(p => p.id === playerId);
      const events = [
        { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team, type: 'FOUL', desc: `#${player.jersey} ${player.name} — ${foulType} foul` },
        ...state.events,
      ];
      if (foulOutEvent) events.unshift(foulOutEvent);
      return { ...state, teams, clockRunning: false, status: 'paused', events };
    }

    case 'TIMEOUT': {
      const teams = { ...state.teams };
      const t = { ...teams[action.team] };
      if (t.timeouts <= 0) return state;
      t.timeouts -= 1;
      teams[action.team] = t;
      return {
        ...state, teams, clockRunning: false, status: 'paused',
        events: [
          { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team: action.team, type: 'TIMEOUT', desc: `${t.name} timeout (${t.timeouts} remaining)` },
          ...state.events,
        ],
      };
    }

    case 'SUB': {
      const { team, outId, inId } = action;
      const teams = { ...state.teams };
      const t = { ...teams[team] };
      const outP = t.players.find(p => p.id === outId);
      const inP = t.players.find(p => p.id === inId);
      if (!outP || !inP) return state;
      t.players = t.players.map(p => {
        if (p.id === outId) return { ...p, onCourt: false };
        if (p.id === inId) return { ...p, onCourt: true };
        return p;
      });
      teams[team] = t;
      return {
        ...state, teams,
        selectedPlayer: { ...state.selectedPlayer, [team]: state.selectedPlayer[team] === outId ? inId : state.selectedPlayer[team] },
        events: [
          { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team, type: 'SUB', desc: `Sub: #${inP.jersey} ${inP.name} IN, #${outP.jersey} ${outP.name} OUT` },
          ...state.events,
        ],
      };
    }

    case 'NEXT_QUARTER': {
      const { teams, quarter } = state;
      if (quarter >= 4 && teams.A.score !== teams.B.score) {
        return {
          ...state, status: 'final', clockRunning: false,
          events: [
            { id: makeId(), quarter, time: '00:00', team: null, type: 'FINAL', desc: `FINAL — ${teams.A.score > teams.B.score ? teams.A.name : teams.B.name} wins ${Math.max(teams.A.score, teams.B.score)}–${Math.min(teams.A.score, teams.B.score)}` },
            ...state.events,
          ],
        };
      }
      const nextQuarter = quarter + 1;
      const isOT = nextQuarter > 4;
      return {
        ...state,
        quarter: nextQuarter,
        isOvertime: isOT,
        gameClock: isOT ? config.overtimeMinutes * 60 : config.quarterMinutes * 60,
        shotClock: config.shotClockSeconds,
        clockRunning: false,
        status: 'paused',
        events: [
          { id: makeId(), quarter: nextQuarter, time: formatClock(isOT ? config.overtimeMinutes * 60 : config.quarterMinutes * 60), team: null, type: 'QUARTER_START', desc: isOT ? `Start of OT${nextQuarter - 4}` : `Start of Q${nextQuarter}` },
          ...state.events,
        ],
      };
    }

    case 'JUMP_BALL_START': {
      return {
        ...state, clockRunning: true, status: 'live',
        events: [
          { id: makeId(), quarter: state.quarter, time: formatClock(state.gameClock), team: null, type: 'TIPOFF', desc: 'Tipoff — game underway' },
          ...state.events,
        ],
      };
    }

    default:
      return state;
  }
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
