'use client';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatClock, quarterLabel } from '@/lib/defaults';

export function TeamLogo({ team, size = 48 }) {
  return (
    <div
      className="relative flex items-center justify-center font-display rounded-lg overflow-hidden border-2"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${team.color}, ${team.color}aa)`,
        borderColor: team.color,
        boxShadow: `0 0 24px ${team.color}33`,
      }}
    >
      <span style={{ fontSize: size * 0.45 }} className="text-white drop-shadow">{team.abbr}</span>
      <div className="absolute inset-0" style={{
        background: `repeating-linear-gradient(45deg, transparent 0 8px, rgba(0,0,0,0.08) 8px 9px)`
      }}></div>
    </div>
  );
}

export function StatChip({ label, value, warn }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-zinc-900/50">
      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">{label}</span>
      <span className={`font-mono font-bold ${warn ? 'text-amber-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

export function StatusPill({ status }) {
  const cfg = {
    pre: { label: 'Pregame', color: '#71717a', bg: 'rgba(113,113,122,0.15)', border: 'rgba(113,113,122,0.3)' },
    live: { label: 'Live', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' },
    paused: { label: 'Paused', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' },
    quarterEnd: { label: 'Quarter Break', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.4)' },
    final: { label: 'Final', color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)' },
  }[status] || { label: status, color: '#71717a', bg: 'rgba(113,113,122,0.15)', border: 'rgba(113,113,122,0.3)' };
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      {status === 'live' && <div className="w-1.5 h-1.5 rounded-full bg-current live-dot"></div>}
      <span className="text-xs uppercase tracking-widest font-semibold">{cfg.label}</span>
    </div>
  );
}

export function TeamBlock({ team, side, possession, flash, inBonus }) {
  const align = side === 'left' ? 'items-start text-left' : 'items-end text-right';
  return (
    <div className={`col-span-6 md:col-span-4 flex flex-col ${align} gap-2`}>
      <div className={`flex items-center gap-3 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <TeamLogo team={team} size={56} />
        <div className={side === 'right' ? 'text-right' : 'text-left'}>
          <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-medium">{team.city}</div>
          <div className="font-display text-3xl md:text-4xl leading-tight">{team.name}</div>
        </div>
      </div>

      <div className={`flex items-baseline ${side === 'right' ? 'justify-end' : 'justify-start'} gap-3 ${flash ? 'flash-num' : ''}`}>
        <div className="font-display tabular-nums leading-none" style={{ fontSize: '7.5rem', color: team.color, textShadow: `0 0 40px ${team.color}33` }}>
          {String(team.score).padStart(2, '0')}
        </div>
      </div>

      <div className={`flex items-center gap-3 text-xs ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        <StatChip label="FOULS" value={team.fouls} warn={team.fouls >= 4} />
        <StatChip label="T.O." value={team.timeouts} />
        {inBonus && (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-semibold"
                style={{ background: `${team.color}22`, color: team.color, border: `1px solid ${team.color}55` }}>
            BONUS
          </span>
        )}
        {possession && (
          <span className="text-[9px] uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10">
            • POSS
          </span>
        )}
      </div>
    </div>
  );
}

export function Scoreboard({ teamA, teamB, quarter, isOT, gameClock, shotClock, possession, isLive, scoreFlash, inBonusA, inBonusB }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-zinc-800 pill-glow grain"
         style={{ background: 'linear-gradient(180deg, #101015 0%, #07070a 100%)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: teamA.color }}></div>
      <div className="absolute right-0 top-0 bottom-0 w-1.5" style={{ background: teamB.color }}></div>

      <div className="grid grid-cols-12 items-center px-8 py-7 gap-4 relative">
        <TeamBlock team={teamA} side="left" possession={possession === 'A'} flash={scoreFlash?.A} inBonus={inBonusA} />

        <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{isOT ? 'Overtime' : 'Quarter'}</span>
          </div>
          <div className="font-display text-7xl md:text-8xl leading-none mb-2"
               style={{ color: '#fafafa', textShadow: '0 0 40px rgba(255,255,255,0.06)' }}>
            {quarterLabel(quarter, isOT)}
          </div>

          <div className="flex items-center gap-3 mb-3">
            {isLive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot"></div>
                <span className="text-[10px] uppercase tracking-widest text-red-400 font-semibold">Live</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 mt-1">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-1">Game Clock</div>
              <div className="font-mono font-bold text-4xl md:text-5xl tabular-nums"
                   style={{ color: gameClock < 60 ? '#fbbf24' : '#fafafa' }}>
                {formatClock(gameClock)}
              </div>
            </div>
            <div className="h-12 w-px bg-zinc-800"></div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-1">Shot Clock</div>
              <div className={`font-mono font-bold text-4xl md:text-5xl tabular-nums ${shotClock <= 5 && isLive ? 'shot-warn' : ''}`}
                   style={{ color: shotClock <= 5 ? '#f59e0b' : '#fafafa' }}>
                {String(shotClock).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className={`text-xs uppercase tracking-wider font-semibold transition ${possession === 'A' ? 'opacity-100' : 'opacity-30'}`}
                  style={{ color: teamA.color }}>
              <ArrowLeft className="w-3 h-3 inline -mt-0.5 mr-1" />
              {teamA.abbr}
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 px-2">poss</span>
            <span className={`text-xs uppercase tracking-wider font-semibold transition ${possession === 'B' ? 'opacity-100' : 'opacity-30'}`}
                  style={{ color: teamB.color }}>
              {teamB.abbr}
              <ArrowRight className="w-3 h-3 inline -mt-0.5 ml-1" />
            </span>
          </div>
        </div>

        <TeamBlock team={teamB} side="right" possession={possession === 'B'} flash={scoreFlash?.B} inBonus={inBonusB} />
      </div>
    </div>
  );
}

export function Logo() {
  return (
    <div className="relative w-11 h-11 rounded-lg flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
      <div className="absolute inset-1 rounded-md border border-black/30"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-7 h-7 text-black/70">
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3,20 Q20,8 37,20" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3,20 Q20,32 37,20" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <line x1="20" y1="3" x2="20" y2="37" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </div>
    </div>
  );
}

export function Modal({ children, onClose, title }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 max-w-md w-full slide-in"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{title}</div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ msg, kind }) {
  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#4ade80' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' },
    info: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', text: '#a5b4fc' },
  }[kind] || {};
  return (
    <div className="fixed bottom-6 right-6 z-50 toast-in">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border backdrop-blur"
           style={{ background: colors.bg, borderColor: colors.border, color: colors.text, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <span className="text-sm font-medium">{msg}</span>
      </div>
    </div>
  );
}
