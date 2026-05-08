'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Loader2, Wifi } from 'lucide-react';
import { TeamLogo } from '@/components/Scoreboard';
import { formatClock, quarterLabel } from '@/lib/defaults';
import { useMatch } from '@/hooks/useMatch';

export default function AudiencePage() {
  const { match, loading } = useMatch({ pollMs: 1000, readOnly: true });
  const [scoreFlash, setScoreFlash] = useState({ A: false, B: false });
  const prev = useRef({ A: 0, B: 0 });

  useEffect(() => {
    if (!match) return;
    const a = match.teams.A.score, b = match.teams.B.score;
    if (a !== prev.current.A) {
      setScoreFlash(s => ({ ...s, A: true }));
      setTimeout(() => setScoreFlash(s => ({ ...s, A: false })), 800);
    }
    if (b !== prev.current.B) {
      setScoreFlash(s => ({ ...s, B: true }));
      setTimeout(() => setScoreFlash(s => ({ ...s, B: false })), 800);
    }
    prev.current = { A: a, B: b };
  }, [match?.teams.A.score, match?.teams.B.score]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mr-3" /> Connecting…</div>;
  }
  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <Trophy className="w-12 h-12 text-zinc-700" />
        <div className="font-display text-4xl">No active match</div>
        <div className="text-sm text-zinc-500">Waiting for an admin to launch a match…</div>
      </div>
    );
  }

  const a = match.teams.A, b = match.teams.B;
  const config = match.config;
  const inBonusA = (a.quarterFouls[match.quarter] || 0) >= config.bonusThreshold;
  const inBonusB = (b.quarterFouls[match.quarter] || 0) >= config.bonusThreshold;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at center, #15151c 0%, #08080d 60%, #050507 100%)' }}>

      {/* Top header */}
      <div className="px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 live-dot"></div>
          <div className="text-[11px] uppercase tracking-[0.4em] text-amber-400 font-semibold">{config.tournamentName}</div>
        </div>
        <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-medium">
          <span>{config.venue}</span>
          <span>{config.matchDate}</span>
          <span className="flex items-center gap-1.5"><Wifi className="w-3 h-3" /> Live</span>
        </div>
      </div>

      {/* Hero: massive score */}
      <div className="flex-1 grid grid-cols-12 items-center px-12 py-8 gap-8">
        {/* Team A */}
        <BigTeamBlock team={a} side="left" possession={match.possession === 'A'} flash={scoreFlash.A} inBonus={inBonusA} />

        {/* Center */}
        <div className="col-span-4 flex flex-col items-center text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-zinc-500 mb-2">{match.isOvertime ? 'Overtime' : 'Quarter'}</div>
          <div className="font-display leading-none mb-6" style={{ fontSize: '11rem', textShadow: '0 0 60px rgba(255,255,255,0.08)' }}>
            {quarterLabel(match.quarter, match.isOvertime)}
          </div>

          <div className="grid grid-cols-2 gap-8 mt-2 w-full max-w-md">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-2">Game Clock</div>
              <div className="font-mono font-bold tabular-nums leading-none" style={{ fontSize: '4.5rem', color: match.gameClock < 60 ? '#fbbf24' : '#fafafa' }}>
                {formatClock(match.gameClock)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-2">Shot Clock</div>
              <div className={`font-mono font-bold tabular-nums leading-none ${match.shotClock <= 5 && match.clockRunning ? 'shot-warn' : ''}`} style={{ fontSize: '4.5rem', color: match.shotClock <= 5 ? '#f59e0b' : '#fafafa' }}>
                {String(match.shotClock).padStart(2, '0')}
              </div>
            </div>
          </div>

          {match.clockRunning && (
            <div className="flex items-center gap-2 mt-8 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
              <div className="w-2 h-2 rounded-full bg-red-500 live-dot"></div>
              <span className="text-xs uppercase tracking-[0.4em] text-red-400 font-semibold">Live</span>
            </div>
          )}
          {match.status === 'final' && (
            <div className="mt-8 px-6 py-2 rounded-full bg-amber-500/15 border border-amber-500/40">
              <span className="text-sm uppercase tracking-[0.4em] text-amber-400 font-bold">Final</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <BigTeamBlock team={b} side="right" possession={match.possession === 'B'} flash={scoreFlash.B} inBonus={inBonusB} />
      </div>

      {/* Footer: latest play */}
      <LatestPlay events={match.events} teams={match.teams} />
    </div>
  );
}

function BigTeamBlock({ team, side, possession, flash, inBonus }) {
  const align = side === 'left' ? 'items-start text-left' : 'items-end text-right';
  return (
    <div className={`col-span-4 flex flex-col ${align} gap-4`}>
      <div className={`flex items-center gap-5 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <TeamLogo team={team} size={96} />
        <div className={side === 'right' ? 'text-right' : 'text-left'}>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-medium">{team.city}</div>
          <div className="font-display leading-none" style={{ fontSize: '4rem' }}>{team.name}</div>
          <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">Coach {team.coach}</div>
        </div>
      </div>

      <div className={`${flash ? 'flash-num' : ''}`}>
        <div className="font-display tabular-nums leading-none" style={{ fontSize: '14rem', color: team.color, textShadow: `0 0 80px ${team.color}55` }}>
          {String(team.score).padStart(2, '0')}
        </div>
      </div>

      <div className={`flex items-center gap-3 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <BigChip label="Fouls" value={team.fouls} warn={team.fouls >= 4} />
        <BigChip label="Timeouts" value={team.timeouts} />
        {inBonus && (
          <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold" style={{ background: `${team.color}22`, color: team.color, border: `1px solid ${team.color}55` }}>
            BONUS
          </span>
        )}
        {possession && (
          <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 font-bold">
            • Possession
          </span>
        )}
      </div>
    </div>
  );
}

function BigChip({ label, value, warn }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-md border border-zinc-800 bg-zinc-950/50">
      <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-semibold">{label}</span>
      <span className={`font-mono font-bold text-2xl ${warn ? 'text-amber-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function LatestPlay({ events, teams }) {
  const latest = events.find(e => e.type === 'SCORE') || events[0];
  if (!latest) {
    return <div className="px-12 py-6 border-t border-zinc-900 text-center text-xs uppercase tracking-[0.3em] text-zinc-600">Awaiting tipoff…</div>;
  }
  const team = latest.team ? teams[latest.team] : null;
  return (
    <div className="px-12 py-5 border-t border-zinc-900 bg-black/40 flex items-center gap-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold">Latest Play</div>
      <div className="flex-1 flex items-center gap-3">
        <div className="font-mono text-xs text-zinc-500 tabular-nums">{quarterLabel(latest.quarter, latest.quarter > 4)} · {latest.time}</div>
        {team && (
          <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded" style={{ background: `${team.color}22`, color: team.color }}>{team.abbr}</span>
        )}
        <div className="text-base text-zinc-200">{latest.desc}</div>
      </div>
      {latest.type === 'SCORE' && (
        <div className="font-mono font-bold tabular-nums text-lg">
          <span style={{ color: teams.A.color }}>{latest.scoreA}</span>
          <span className="text-zinc-700 mx-2">–</span>
          <span style={{ color: teams.B.color }}>{latest.scoreB}</span>
        </div>
      )}
    </div>
  );
}
