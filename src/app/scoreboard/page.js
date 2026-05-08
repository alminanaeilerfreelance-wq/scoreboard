'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, Minus, AlertTriangle, ArrowLeftRight,
  Clock, Trophy, Activity, Users, Zap, Crown, ArrowLeft, ArrowRight,
  Circle, ArrowUpRight, ArrowDownRight, X, Settings, Calendar, Loader2,
  Eye, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Logo, TeamLogo, Scoreboard, StatusPill, Modal } from '@/components/Scoreboard';
import { formatClock, quarterLabel, FOUL_TYPES } from '@/lib/defaults';
import { useMatch } from '@/hooks/useMatch';

export default function ScoreboardPage() {
  const { match, dispatch, loading, error } = useMatch({ pollMs: 1500 });
  const [activeTab, setActiveTab] = useState('plays');
  const [foulMenu, setFoulMenu] = useState({ open: false, team: null });
  const [subPanel, setSubPanel] = useState({ open: false, team: null, outId: null, inId: null });
  const [scoreFlash, setScoreFlash] = useState({ A: false, B: false });
  const prevScoreRef = useRef({ A: 0, B: 0 });

  // Score flash animation
  useEffect(() => {
    if (!match) return;
    const a = match.teams.A.score;
    const b = match.teams.B.score;
    if (a !== prevScoreRef.current.A) {
      setScoreFlash(s => ({ ...s, A: true }));
      setTimeout(() => setScoreFlash(s => ({ ...s, A: false })), 700);
    }
    if (b !== prevScoreRef.current.B) {
      setScoreFlash(s => ({ ...s, B: true }));
      setTimeout(() => setScoreFlash(s => ({ ...s, B: false })), 700);
    }
    prevScoreRef.current = { A: a, B: b };
  }, [match?.teams.A.score, match?.teams.B.score]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading match…
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-zinc-600" />
        </div>
        <div>
          <div className="font-display text-3xl mb-2">No active match</div>
          <div className="text-sm text-zinc-500 mb-6">Set up teams and rules in the admin dashboard, then launch a match.</div>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold btn-press transition" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', boxShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
            <Settings className="w-4 h-4" />
            <span className="uppercase tracking-wider text-sm">Go to Admin</span>
          </Link>
        </div>
      </div>
    );
  }

  const teamA = match.teams.A;
  const teamB = match.teams.B;
  const config = match.config;
  const inBonusA = (teamA.quarterFouls[match.quarter] || 0) >= config.bonusThreshold;
  const inBonusB = (teamB.quarterFouls[match.quarter] || 0) >= config.bonusThreshold;
  const isFinal = match.status === 'final';
  const isPre = match.status === 'pre';
  const isQuarterEnd = match.status === 'quarterEnd';

  return (
    <div className="min-h-screen court-bg" style={{ background: 'radial-gradient(ellipse at top, #15151c 0%, #08080d 60%, #050507 100%)' }}>
      <div className="max-w-[1480px] mx-auto px-6 py-6">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-amber-400 font-medium">{config.tournamentName}</div>
              <div className="font-display text-xl leading-none">{config.venue}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={match.status} />
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 px-3 py-2 rounded-md border border-zinc-800 bg-zinc-900/40">
              <Calendar className="w-3.5 h-3.5" />
              <span>{config.matchDate} · {config.matchTime}</span>
            </div>
            <Link href="/audience" target="_blank" className="text-xs uppercase tracking-wider text-zinc-400 hover:text-white px-3 py-2 rounded-md border border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 btn-press transition flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Audience
            </Link>
            <Link href="/" className="text-xs uppercase tracking-wider text-zinc-400 hover:text-white px-3 py-2 rounded-md border border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 btn-press transition flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Admin
            </Link>
          </div>
        </header>

        <div className="mb-5 px-4 py-2 rounded-md border border-zinc-900 bg-zinc-950/40 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-zinc-500">
          <span className="uppercase tracking-wider"><span className="text-zinc-600">Refs:</span> {config.refereeMain} · {config.refereeAssist}</span>
          <span className="uppercase tracking-wider"><span className="text-zinc-600">{teamA.name} Coach:</span> {teamA.coach}</span>
          <span className="uppercase tracking-wider"><span className="text-zinc-600">{teamB.name} Coach:</span> {teamB.coach}</span>
        </div>

        <Scoreboard
          teamA={teamA} teamB={teamB}
          quarter={match.quarter} isOT={match.isOvertime}
          gameClock={match.gameClock} shotClock={match.shotClock}
          possession={match.possession}
          isLive={match.clockRunning}
          scoreFlash={scoreFlash}
          inBonusA={inBonusA} inBonusB={inBonusB}
        />

        <GameControls match={match} dispatch={dispatch} isPre={isPre} isQuarterEnd={isQuarterEnd} isFinal={isFinal} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <TeamPanel team={teamA} match={match} dispatch={dispatch} side="left"
            onFoulClick={() => setFoulMenu({ open: true, team: 'A' })}
            onSubClick={() => setSubPanel({ open: true, team: 'A', outId: null, inId: null })}
            inBonus={inBonusA} disabled={isPre || isFinal} />
          <TeamPanel team={teamB} match={match} dispatch={dispatch} side="right"
            onFoulClick={() => setFoulMenu({ open: true, team: 'B' })}
            onSubClick={() => setSubPanel({ open: true, team: 'B', outId: null, inId: null })}
            inBonus={inBonusB} disabled={isPre || isFinal} />
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur overflow-hidden">
          <div className="flex border-b border-zinc-800">
            <TabButton active={activeTab === 'plays'} onClick={() => setActiveTab('plays')} icon={<Zap className="w-4 h-4" />} label="Play-by-Play" count={match.events.length} />
            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Users className="w-4 h-4" />} label="Box Score" />
            <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={<Trophy className="w-4 h-4" />} label="Team Stats" />
          </div>
          <div className="p-5">
            {activeTab === 'plays' && <PlayByPlay events={match.events} teams={match.teams} />}
            {activeTab === 'stats' && <BoxScore teams={match.teams} config={config} />}
            {activeTab === 'team' && <TeamStats teams={match.teams} />}
          </div>
        </div>

        <footer className="mt-8 mb-4 text-center text-xs text-zinc-600 tracking-wider">
          COURTCAST · LIVE SCOREBOARD · {new Date().getFullYear()}
        </footer>
      </div>

      {foulMenu.open && (
        <Modal onClose={() => setFoulMenu({ open: false, team: null })} title="Select foul type">
          <div className="grid grid-cols-2 gap-2">
            {FOUL_TYPES.map(ft => (
              <button
                key={ft}
                onClick={() => {
                  dispatch({ type: 'FOUL', team: foulMenu.team, foulType: ft });
                  setFoulMenu({ open: false, team: null });
                }}
                className="px-4 py-3 rounded-lg border border-zinc-800 hover:border-amber-500 hover:bg-amber-500/10 text-left btn-press transition group"
              >
                <div className="text-sm font-medium">{ft}</div>
                <div className="text-[10px] text-zinc-500 group-hover:text-amber-400 uppercase tracking-wider">Foul</div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {subPanel.open && (
        <SubModal
          team={match.teams[subPanel.team]}
          subPanel={subPanel}
          setSubPanel={setSubPanel}
          dispatch={dispatch}
        />
      )}
    </div>
  );
}

// ─── Game controls ──────────────────────────────────────────────

function GameControls({ match, dispatch, isPre, isQuarterEnd, isFinal }) {
  return (
    <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur p-3 flex flex-wrap items-center gap-2">
      {isPre ? (
        <button
          onClick={() => dispatch({ type: 'JUMP_BALL_START' })}
          className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-black btn-press transition"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 0 24px rgba(251,191,36,0.3)' }}
        >
          <Play className="w-4 h-4 fill-current" />
          <span className="uppercase tracking-wider text-sm">Tip Off</span>
        </button>
      ) : (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CLOCK' })}
          disabled={isFinal || isQuarterEnd}
          className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold btn-press transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={match.clockRunning
            ? { background: '#2a1a1a', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }
            : { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
        >
          {match.clockRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span className="uppercase tracking-wider text-sm">{match.clockRunning ? 'Pause' : 'Resume'}</span>
        </button>
      )}

      <CtrlBtn onClick={() => dispatch({ type: 'RESET_SHOT', short: false })} disabled={isFinal} icon={<RotateCcw className="w-3.5 h-3.5" />} label={`Shot ${match.config.shotClockSeconds}`} />
      <CtrlBtn onClick={() => dispatch({ type: 'RESET_SHOT', short: true })} disabled={isFinal} icon={<RotateCcw className="w-3.5 h-3.5" />} label={`Shot ${match.config.shotClockShort}`} />

      <div className="h-8 w-px bg-zinc-800 mx-1"></div>

      <CtrlBtn onClick={() => dispatch({ type: 'SET_POSSESSION', team: 'A' })} disabled={isFinal} icon={<ArrowLeft className="w-3.5 h-3.5" />} label={match.teams.A.abbr + ' Poss'} active={match.possession === 'A'} />
      <CtrlBtn onClick={() => dispatch({ type: 'SET_POSSESSION', team: 'B' })} disabled={isFinal} icon={<ArrowRight className="w-3.5 h-3.5" />} label={match.teams.B.abbr + ' Poss'} active={match.possession === 'B'} />

      <div className="flex-1"></div>

      {(isQuarterEnd || (match.gameClock === 0 && !isFinal)) && (
        <button
          onClick={() => dispatch({ type: 'NEXT_QUARTER' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold btn-press transition slide-in"
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', boxShadow: '0 0 20px rgba(167,139,250,0.3)' }}
        >
          <ChevronRight className="w-4 h-4" />
          <span className="uppercase tracking-wider text-sm">
            {match.quarter >= 4 && match.teams.A.score === match.teams.B.score ? 'Start Overtime' :
             match.quarter >= 4 ? 'End Game' :
             `Start Q${match.quarter + 1}`}
          </span>
        </button>
      )}
    </div>
  );
}

function CtrlBtn({ onClick, disabled, icon, label, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-medium btn-press transition disabled:opacity-30 disabled:cursor-not-allowed
        ${active ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white'}`}
    >
      {icon}{label}
    </button>
  );
}

// ─── Team panel ─────────────────────────────────────────────────

function TeamPanel({ team, match, dispatch, side, onFoulClick, onSubClick, inBonus, disabled }) {
  const config = match.config;
  const selectedId = match.selectedPlayer[team.id];
  const onCourt = team.players.filter(p => p.onCourt);
  const bench = team.players.filter(p => !p.onCourt && !p.fouledOut);
  const fouledOut = team.players.filter(p => p.fouledOut);
  const selected = team.players.find(p => p.id === selectedId);

  return (
    <div
      className="rounded-xl border bg-zinc-950/60 backdrop-blur overflow-hidden relative"
      style={{ borderColor: 'rgba(63,63,70,0.8)', boxShadow: `0 0 0 1px ${team.color}11, inset 0 1px 0 rgba(255,255,255,0.03)` }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800" style={{ background: `linear-gradient(90deg, ${team.color}18, transparent 70%)` }}>
        <div className="flex items-center gap-3">
          <TeamLogo team={team} size={40} />
          <div>
            <div className="font-display text-2xl leading-none">{team.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{team.city} · COACH {team.coach}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {inBonus && (
            <div className="text-[9px] uppercase tracking-wider px-2 py-1 rounded font-semibold" style={{ background: `${team.color}22`, color: team.color, border: `1px solid ${team.color}55` }}>In Bonus</div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="w-12 h-12 rounded-md flex items-center justify-center font-display text-2xl border-2 flex-shrink-0" style={{ borderColor: team.color, color: team.color, background: `${team.color}11` }}>
          {selected?.jersey ?? '–'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{selected?.name ?? 'No player selected'}</span>
            {selected?.captain && <Crown className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            {selected ? `${selected.pos} · ${selected.points} PTS · ${selected.fouls}/${config.foulLimit} FOULS` : 'Pick a player from roster'}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3 grid grid-cols-3 gap-2">
        <ScoreBtn label="+1" sublabel="FT" team={team} onClick={() => dispatch({ type: 'SCORE', team: team.id, points: 1 })} disabled={disabled || !selected || selected.fouledOut} />
        <ScoreBtn label="+2" sublabel="2PT" team={team} onClick={() => dispatch({ type: 'SCORE', team: team.id, points: 2 })} disabled={disabled || !selected || selected.fouledOut} />
        <ScoreBtn label="+3" sublabel="3PT" team={team} onClick={() => dispatch({ type: 'SCORE', team: team.id, points: 3 })} disabled={disabled || !selected || selected.fouledOut} />
      </div>

      <div className="px-5 pb-4 grid grid-cols-3 gap-2">
        <ActionBtn onClick={onFoulClick} disabled={disabled || !selected} icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Foul" tone="warn" />
        <ActionBtn onClick={() => dispatch({ type: 'TIMEOUT', team: team.id })} disabled={disabled || team.timeouts === 0} icon={<Clock className="w-3.5 h-3.5" />} label={`Timeout · ${team.timeouts}`} tone="info" />
        <ActionBtn onClick={onSubClick} disabled={disabled} icon={<ArrowLeftRight className="w-3.5 h-3.5" />} label="Sub" tone="neutral" />
      </div>

      <div className="px-5 pb-2">
        <button onClick={() => dispatch({ type: 'UNDO_SCORE', team: team.id })} className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
          <Minus className="w-3 h-3" /> Undo last score
        </button>
      </div>

      <div className="px-5 py-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            On Court · {onCourt.length}
          </div>
        </div>
        <div className="space-y-1 mb-3">
          {onCourt.map(p => (
            <PlayerRow key={p.id} player={p} team={team} config={config} selected={p.id === selectedId} onClick={() => dispatch({ type: 'SELECT_PLAYER', team: team.id, playerId: p.id })} />
          ))}
        </div>
        {bench.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 font-semibold mb-2 mt-3 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
              Bench · {bench.length}
            </div>
            <div className="space-y-1 opacity-60">
              {bench.map(p => <PlayerRow key={p.id} player={p} team={team} config={config} compact selected={false} />)}
            </div>
          </>
        )}
        {fouledOut.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-[0.25em] text-red-500/80 font-semibold mb-2 mt-3">Fouled Out · {fouledOut.length}</div>
            <div className="space-y-1 opacity-60">
              {fouledOut.map(p => <PlayerRow key={p.id} player={p} team={team} config={config} compact selected={false} foulOut />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreBtn({ label, sublabel, team, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative rounded-lg py-4 font-display text-3xl btn-press transition disabled:opacity-30 disabled:cursor-not-allowed group overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${team.color}, ${team.color}cc)`,
        color: '#fff',
        boxShadow: `0 4px 20px ${team.color}33, inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    >
      <span className="relative z-10">{label}</span>
      <span className="block text-[9px] uppercase tracking-[0.3em] font-ui font-semibold opacity-80 -mt-1">{sublabel}</span>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition"></div>
    </button>
  );
}

function ActionBtn({ onClick, disabled, icon, label, tone }) {
  const tones = {
    warn: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
    info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    neutral: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: '#d4d4d8' },
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg py-2.5 px-2 text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 btn-press transition disabled:opacity-30 disabled:cursor-not-allowed border"
      style={{ background: tones.bg, borderColor: tones.border, color: tones.text }}
    >
      {icon}<span>{label}</span>
    </button>
  );
}

function PlayerRow({ player, team, config, selected, onClick, compact, foulOut }) {
  const foulPercent = (player.fouls / config.foulLimit) * 100;
  return (
    <button
      onClick={onClick}
      disabled={!onClick || foulOut}
      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition text-left btn-press ${selected ? 'bg-white text-black' : 'hover:bg-white/5 text-zinc-200'}`}
      style={selected ? { boxShadow: `0 0 0 1px ${team.color}` } : {}}
    >
      <div className="w-9 h-9 rounded flex items-center justify-center font-display text-lg flex-shrink-0" style={selected ? { background: team.color, color: '#fff' } : { background: '#1a1a1a', color: team.color, border: `1px solid ${team.color}66` }}>
        {player.jersey}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium truncate ${selected ? 'text-black' : ''}`}>{player.name}</span>
          {player.captain && <Crown className={`w-3 h-3 ${selected ? 'text-amber-600' : 'text-amber-400'} flex-shrink-0`} />}
          {foulOut && <span className="text-[9px] uppercase font-bold text-red-400">FO</span>}
        </div>
        <div className={`text-[10px] uppercase tracking-wider ${selected ? 'text-zinc-600' : 'text-zinc-500'}`}>
          {player.pos} · {player.points} PTS · {player.fouls}F
        </div>
      </div>
      {!compact && (
        <div className="w-8 flex-shrink-0">
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${foulPercent}%`, background: player.fouls >= 4 ? '#f87171' : player.fouls >= 3 ? '#fbbf24' : team.color }}></div>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Tabs / Plays / Stats ───────────────────────────────────────

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-5 py-3.5 text-sm uppercase tracking-wider font-semibold border-b-2 transition ${active ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
      {icon}<span>{label}</span>
      {count > 0 && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? 'bg-white/10' : 'bg-zinc-800'}`}>{count}</span>}
    </button>
  );
}

function PlayByPlay({ events, teams }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-600">
        <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <div className="text-sm uppercase tracking-widest">No plays recorded yet</div>
        <div className="text-xs mt-1">Tip off to start the action</div>
      </div>
    );
  }
  return (
    <div className="max-h-[420px] overflow-y-auto scrollbar-thin pr-2 space-y-1">
      {events.map((ev, i) => <PlayRow key={ev.id} ev={ev} teams={teams} highlight={i === 0} />)}
    </div>
  );
}

function PlayRow({ ev, teams, highlight }) {
  const team = ev.team ? teams[ev.team] : null;
  const iconMap = {
    SCORE: <ArrowUpRight className="w-3.5 h-3.5" />,
    FOUL: <AlertTriangle className="w-3.5 h-3.5" />,
    FOUL_OUT: <X className="w-3.5 h-3.5" />,
    TIMEOUT: <Clock className="w-3.5 h-3.5" />,
    SUB: <ArrowLeftRight className="w-3.5 h-3.5" />,
    QUARTER_START: <Play className="w-3.5 h-3.5" />,
    QUARTER_END: <Pause className="w-3.5 h-3.5" />,
    TIPOFF: <Zap className="w-3.5 h-3.5" />,
    VIOLATION: <AlertTriangle className="w-3.5 h-3.5" />,
    FINAL: <Trophy className="w-3.5 h-3.5" />,
  };
  const colorMap = {
    SCORE: team ? team.color : '#22c55e',
    FOUL: '#f59e0b', FOUL_OUT: '#ef4444', TIMEOUT: '#3b82f6',
    SUB: '#71717a', QUARTER_START: '#a78bfa', QUARTER_END: '#a78bfa',
    TIPOFF: '#fbbf24', VIOLATION: '#ef4444', FINAL: '#fbbf24',
  };
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${highlight ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
      <div className="flex-shrink-0 text-[10px] font-mono text-zinc-500 tabular-nums w-16">{quarterLabel(ev.quarter, ev.quarter > 4)} · {ev.time}</div>
      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${colorMap[ev.type]}22`, color: colorMap[ev.type] }}>
        {iconMap[ev.type] || <Circle className="w-3 h-3" />}
      </div>
      {team ? (
        <div className="text-[10px] uppercase tracking-wider font-semibold w-10 flex-shrink-0" style={{ color: team.color }}>{team.abbr}</div>
      ) : <div className="w-10 flex-shrink-0"></div>}
      <div className="flex-1 text-sm text-zinc-200 truncate">{ev.desc}</div>
      {ev.type === 'SCORE' && (
        <div className="font-mono font-bold tabular-nums text-sm text-zinc-300 flex-shrink-0">
          <span style={{ color: teams.A.color }}>{ev.scoreA}</span>
          <span className="text-zinc-600 mx-1">–</span>
          <span style={{ color: teams.B.color }}>{ev.scoreB}</span>
        </div>
      )}
    </div>
  );
}

function BoxScore({ teams, config }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {['A', 'B'].map(k => <BoxScoreTable key={k} team={teams[k]} config={config} />)}
    </div>
  );
}

function BoxScoreTable({ team, config }) {
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-zinc-800" style={{ background: `linear-gradient(90deg, ${team.color}22, transparent)` }}>
        <TeamLogo team={team} size={32} />
        <div>
          <div className="font-display text-xl">{team.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">{team.coach}</div>
        </div>
        <div className="ml-auto font-display text-2xl tabular-nums" style={{ color: team.color }}>{team.score}</div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800/60">
            <th className="text-left px-3 py-2 font-semibold">Player</th>
            <th className="text-center px-2 py-2 font-semibold">PTS</th>
            <th className="text-center px-2 py-2 font-semibold">F</th>
            <th className="text-center px-2 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((p, i) => (
            <tr key={p.id} className={`border-b border-zinc-900/60 ${i % 2 ? 'bg-white/[0.01]' : ''}`}>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs w-6 text-zinc-500">#{p.jersey}</span>
                  <span className="text-zinc-200">{p.name}</span>
                  {p.captain && <Crown className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[10px] text-zinc-600 ml-8">{p.pos}</div>
              </td>
              <td className="text-center px-2 font-mono tabular-nums font-semibold">{p.points}</td>
              <td className="text-center px-2 font-mono tabular-nums" style={{ color: p.fouls >= config.foulLimit - 1 ? '#f87171' : p.fouls >= config.foulLimit - 2 ? '#fbbf24' : '#a1a1aa' }}>{p.fouls}</td>
              <td className="text-center px-2">
                {p.fouledOut ? <span className="text-[10px] uppercase font-bold text-red-400">FO</span> :
                 p.onCourt ? <span className="text-[10px] uppercase tracking-wider text-emerald-400">Court</span> :
                 <span className="text-[10px] uppercase tracking-wider text-zinc-600">Bench</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-xs font-semibold">
            <td className="px-3 py-2.5 uppercase tracking-wider text-zinc-400">Totals</td>
            <td className="text-center font-mono font-bold" style={{ color: team.color }}>{team.score}</td>
            <td className="text-center font-mono">{team.fouls}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TeamStats({ teams }) {
  const a = teams.A, b = teams.B;
  const rows = [
    { label: 'Final / Live Score', a: a.score, b: b.score, accent: true },
    { label: 'Total Fouls', a: a.fouls, b: b.fouls },
    { label: 'Q1 Fouls', a: a.quarterFouls[1] || 0, b: b.quarterFouls[1] || 0 },
    { label: 'Q2 Fouls', a: a.quarterFouls[2] || 0, b: b.quarterFouls[2] || 0 },
    { label: 'Q3 Fouls', a: a.quarterFouls[3] || 0, b: b.quarterFouls[3] || 0 },
    { label: 'Q4 Fouls', a: a.quarterFouls[4] || 0, b: b.quarterFouls[4] || 0 },
    { label: 'Timeouts Remaining', a: a.timeouts, b: b.timeouts },
    { label: 'Active Roster', a: a.players.filter(p => p.onCourt).length, b: b.players.filter(p => p.onCourt).length },
    { label: 'Fouled Out', a: a.players.filter(p => p.fouledOut).length, b: b.players.filter(p => p.fouledOut).length },
  ];
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 items-center px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold border-b border-zinc-800">
        <div className="col-span-3 text-right" style={{ color: a.color }}>{a.name}</div>
        <div className="col-span-6 text-center">Stat</div>
        <div className="col-span-3 text-left" style={{ color: b.color }}>{b.name}</div>
      </div>
      {rows.map((r, i) => {
        const max = Math.max(r.a, r.b, 1);
        return (
          <div key={i} className={`grid grid-cols-12 items-center px-3 py-2.5 rounded ${r.accent ? 'bg-white/[0.03]' : ''}`}>
            <div className={`col-span-3 text-right font-mono tabular-nums ${r.accent ? 'text-2xl font-display' : 'text-base'}`} style={{ color: a.color }}>{r.a}</div>
            <div className="col-span-6 px-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden flex justify-end">
                  <div className="h-full transition-all" style={{ width: `${(r.a / max) * 100}%`, background: a.color }}></div>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 text-center w-32">{r.label}</div>
                <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${(r.b / max) * 100}%`, background: b.color }}></div>
                </div>
              </div>
            </div>
            <div className={`col-span-3 text-left font-mono tabular-nums ${r.accent ? 'text-2xl font-display' : 'text-base'}`} style={{ color: b.color }}>{r.b}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Substitution modal ────────────────────────────────────────

function SubModal({ team, subPanel, setSubPanel, dispatch }) {
  const onCourt = team.players.filter(p => p.onCourt);
  const bench = team.players.filter(p => !p.onCourt && !p.fouledOut);
  const ready = subPanel.outId && subPanel.inId;

  const close = () => setSubPanel({ open: false, team: null, outId: null, inId: null });

  return (
    <Modal onClose={close} title={`Substitution · ${team.name}`}>
      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
            <ArrowDownRight className="w-3 h-3 text-red-400" /> Player Out (on court)
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
            {onCourt.map(p => (
              <button key={p.id} onClick={() => setSubPanel({ ...subPanel, outId: p.id })}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition text-left ${subPanel.outId === p.id ? 'bg-red-500/15 ring-1 ring-red-500/40' : 'hover:bg-white/5'}`}>
                <div className="w-8 h-8 rounded font-display flex items-center justify-center" style={{ background: `${team.color}22`, color: team.color }}>{p.jersey}</div>
                <div className="text-sm">{p.name}</div>
                <div className="ml-auto text-[10px] text-zinc-500 uppercase">{p.pos}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" /> Player In (bench)
          </div>
          <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin">
            {bench.length === 0 && <div className="text-xs text-zinc-600 px-2 py-3">No bench players available</div>}
            {bench.map(p => (
              <button key={p.id} onClick={() => setSubPanel({ ...subPanel, inId: p.id })}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition text-left ${subPanel.inId === p.id ? 'bg-emerald-500/15 ring-1 ring-emerald-500/40' : 'hover:bg-white/5'}`}>
                <div className="w-8 h-8 rounded font-display flex items-center justify-center" style={{ background: `${team.color}22`, color: team.color }}>{p.jersey}</div>
                <div className="text-sm">{p.name}</div>
                <div className="ml-auto text-[10px] text-zinc-500 uppercase">{p.pos}</div>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            dispatch({ type: 'SUB', team: subPanel.team, outId: subPanel.outId, inId: subPanel.inId });
            close();
          }}
          disabled={!ready}
          className="w-full py-3 rounded-lg font-semibold uppercase tracking-wider text-sm transition disabled:opacity-30 disabled:cursor-not-allowed btn-press"
          style={{ background: ready ? team.color : '#27272a', color: ready ? '#fff' : '#71717a' }}
        >
          Confirm Substitution
        </button>
      </div>
    </Modal>
  );
}
