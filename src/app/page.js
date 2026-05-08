'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Shield, Users, Rocket, Save, RotateCcw, Check, AlertTriangle,
  Calendar, Clock, Eye, ClipboardList, UserPlus, Trash2, Crown, Plus, Minus,
  Loader2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Logo, TeamLogo, Toast } from '@/components/Scoreboard';
import {
  DEFAULT_CONFIG, DEFAULT_TEAM_A, DEFAULT_TEAM_B, COLOR_PALETTE,
  POSITIONS, validateTeam,
} from '@/lib/defaults';

export default function AdminPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [teams, setTeams] = useState({ A: DEFAULT_TEAM_A, B: DEFAULT_TEAM_B });
  const [section, setSection] = useState('match');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const showToast = useCallback((msg, kind = 'info') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2400);
  }, []);

  // Load config + teams from API
  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([
          fetch('/api/config').then(r => r.json()),
          fetch('/api/teams').then(r => r.json()),
        ]);
        if (c && !c.error) setConfig({ ...DEFAULT_CONFIG, ...c });
        if (t && !t.error) setTeams(t);
      } catch (e) {
        showToast('Failed to load — check MongoDB connection', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  // Debounced save: config
  useEffect(() => {
    if (loading) return;
    setSaving(true);
    const id = setTimeout(async () => {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaving(false);
    }, 600);
    return () => clearTimeout(id);
  }, [config, loading]);

  // Debounced save: teams
  useEffect(() => {
    if (loading) return;
    setSaving(true);
    const id = setTimeout(async () => {
      await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teams),
      });
      setSaving(false);
    }, 600);
    return () => clearTimeout(id);
  }, [teams, loading]);

  const errsA = validateTeam(teams.A);
  const errsB = validateTeam(teams.B);
  const totalErrs = errsA.length + errsB.length;
  const ready = totalErrs === 0;

  const handleLaunch = async () => {
    if (!ready) {
      showToast(errsA[0] || errsB[0] || 'Setup incomplete', 'error');
      return;
    }
    setLaunching(true);
    try {
      const r = await fetch('/api/match/launch', { method: 'POST' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Launch failed');
      showToast('Match launched — opening scoreboard', 'success');
      setTimeout(() => window.location.href = '/scoreboard', 600);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLaunching(false);
    }
  };

  const handleResetAll = async () => {
    setConfirmReset(false);
    try {
      await fetch('/api/match/reset', { method: 'POST' });
      setConfig(DEFAULT_CONFIG);
      setTeams({ A: DEFAULT_TEAM_A, B: DEFAULT_TEAM_B });
      showToast('All data reset to defaults', 'info');
    } catch (e) {
      showToast('Reset failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        <Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading admin console…
      </div>
    );
  }

  const sections = [
    { id: 'match', label: 'Match Setup', icon: <Settings className="w-4 h-4" />, desc: 'Tournament, venue, rules' },
    { id: 'teams', label: 'Teams', icon: <Shield className="w-4 h-4" />, desc: 'Identity & branding' },
    { id: 'roster', label: 'Rosters', icon: <Users className="w-4 h-4" />, desc: 'Players & lineups' },
    { id: 'review', label: 'Review & Launch', icon: <Rocket className="w-4 h-4" />, desc: 'Final check' },
  ];

  return (
    <div className="min-h-screen court-bg" style={{ background: 'radial-gradient(ellipse at top, #15151c 0%, #08080d 60%, #050507 100%)' }}>
      <div className="max-w-[1480px] mx-auto px-6 py-6">

        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Logo />
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-medium">CourtCast</div>
              <div className="font-display text-xl leading-none">ADMIN DASHBOARD</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/scoreboard" className="text-xs uppercase tracking-wider text-zinc-400 hover:text-white px-3 py-2 rounded-md border border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 btn-press transition flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Scoreboard
            </Link>
            <Link href="/audience" target="_blank" className="text-xs uppercase tracking-wider text-zinc-400 hover:text-white px-3 py-2 rounded-md border border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 btn-press transition flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Audience Display
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 px-3 py-2 rounded-md border border-zinc-800 bg-zinc-900/40">
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-3.5 h-3.5 text-emerald-500" /> Saved to DB</>
              )}
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs uppercase tracking-wider text-zinc-400 hover:text-white px-3 py-2 rounded-md border border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 btn-press transition"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Reset to Defaults
            </button>
            <button
              onClick={handleLaunch}
              disabled={!ready || launching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold btn-press transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: ready && !launching ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#27272a',
                color: ready && !launching ? '#000' : '#71717a',
                boxShadow: ready && !launching ? '0 0 20px rgba(251,191,36,0.3)' : 'none',
              }}
            >
              {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              <span className="uppercase tracking-wider text-sm">{launching ? 'Launching' : 'Launch Match'}</span>
            </button>
          </div>
        </header>

        <SetupProgress teams={teams} errsA={errsA} errsB={errsB} />

        <div className="grid grid-cols-12 gap-5 mt-5">
          <aside className="col-span-12 md:col-span-3">
            <nav className="rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur overflow-hidden">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 border-b border-zinc-900 last:border-b-0 transition text-left ${
                    section === s.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    section === s.id ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
                  }`}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${section === s.id ? 'text-white' : 'text-zinc-300'}`}>{s.label}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.desc}</div>
                  </div>
                  {section === s.id && <div className="w-1 h-8 bg-amber-500 rounded-full"></div>}
                </button>
              ))}
            </nav>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold">Setup Status</div>
              <MiniStat label={teams.A.name || 'Team A'} value={`${teams.A.players.length} players`} ok={errsA.length === 0} accent={teams.A.color} />
              <MiniStat label={teams.B.name || 'Team B'} value={`${teams.B.players.length} players`} ok={errsB.length === 0} accent={teams.B.color} />
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total issues</span>
                  <span className={totalErrs === 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {totalErrs === 0 ? 'Ready' : `${totalErrs} to fix`}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <main className="col-span-12 md:col-span-9">
            {section === 'match' && <MatchConfigPanel config={config} setConfig={setConfig} />}
            {section === 'teams' && <TeamsPanel teams={teams} setTeams={setTeams} />}
            {section === 'roster' && <RosterPanel teams={teams} setTeams={setTeams} onShowToast={showToast} />}
            {section === 'review' && <ReviewPanel config={config} teams={teams} errsA={errsA} errsB={errsB} onLaunch={handleLaunch} ready={ready} launching={launching} />}
          </main>
        </div>

        <footer className="mt-8 mb-4 text-center text-xs text-zinc-600 tracking-wider">
          COURTCAST · ADMIN CONSOLE · {new Date().getFullYear()}
        </footer>
      </div>

      {toast && <Toast {...toast} />}

      {confirmReset && (
        <ConfirmModal
          title="Reset all data?"
          message="This wipes match config, both teams, all rosters and any saved match state in MongoDB. There's no undo."
          confirmLabel="Reset everything"
          onCancel={() => setConfirmReset(false)}
          onConfirm={handleResetAll}
        />
      )}
    </div>
  );
}

// ─── Setup progress ribbon ────────────────────────────────────────

function SetupProgress({ teams, errsA, errsB }) {
  const items = [
    { label: 'Match Rules', done: true },
    { label: 'Team A Identity', done: !!teams.A.name && !!teams.A.abbr },
    { label: 'Team B Identity', done: !!teams.B.name && !!teams.B.abbr },
    { label: 'Roster A Valid', done: errsA.length === 0 },
    { label: 'Roster B Valid', done: errsB.length === 0 },
  ];
  const doneCount = items.filter(i => i.done).length;
  const pct = (doneCount / items.length) * 100;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-semibold">Setup Progress</div>
        <div className="text-xs font-mono tabular-nums text-zinc-400">{doneCount} of {items.length}</div>
      </div>
      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-3">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
        ></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600'
            }`}>
              {item.done ? <Check className="w-2.5 h-2.5" /> : <span className="block w-2 h-2 rounded-full bg-current"></span>}
            </div>
            <span className={`text-[11px] uppercase tracking-wider ${item.done ? 'text-zinc-300' : 'text-zinc-600'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, ok, accent }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }}></div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{label}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{value}</div>
      </div>
      {ok ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
    </div>
  );
}

// ─── Match config ────────────────────────────────────────────────

function MatchConfigPanel({ config, setConfig }) {
  const update = (patch) => setConfig({ ...config, ...patch });
  return (
    <div className="space-y-5">
      <SectionCard icon={<Calendar className="w-4 h-4" />} title="Match Information" subtitle="Tournament, venue and game-time details that surface on the scoreboard.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tournament / League"><input className="field-input" value={config.tournamentName} onChange={e => update({ tournamentName: e.target.value })} placeholder="e.g. City Hardwood Classic" /></Field>
          <Field label="Venue"><input className="field-input" value={config.venue} onChange={e => update({ venue: e.target.value })} placeholder="Arena name" /></Field>
          <Field label="Match Date"><input type="date" className="field-input" value={config.matchDate} onChange={e => update({ matchDate: e.target.value })} /></Field>
          <Field label="Tip-off Time"><input type="time" className="field-input" value={config.matchTime} onChange={e => update({ matchTime: e.target.value })} /></Field>
          <Field label="Lead Referee"><input className="field-input" value={config.refereeMain} onChange={e => update({ refereeMain: e.target.value })} placeholder="Lead official" /></Field>
          <Field label="Assistant Referee"><input className="field-input" value={config.refereeAssist} onChange={e => update({ refereeAssist: e.target.value })} placeholder="Assistant official" /></Field>
        </div>
      </SectionCard>

      <SectionCard icon={<Clock className="w-4 h-4" />} title="Game Rules" subtitle="These values drive the live scoreboard timers and limits.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <NumberField label="Quarter Length" suffix="min" min={4} max={20} value={config.quarterMinutes} onChange={v => update({ quarterMinutes: v })} />
          <NumberField label="Overtime Length" suffix="min" min={2} max={15} value={config.overtimeMinutes} onChange={v => update({ overtimeMinutes: v })} />
          <NumberField label="Shot Clock" suffix="sec" min={10} max={35} value={config.shotClockSeconds} onChange={v => update({ shotClockSeconds: v })} />
          <NumberField label="Reset (Off. Reb.)" suffix="sec" min={8} max={20} value={config.shotClockShort} onChange={v => update({ shotClockShort: v })} />
          <NumberField label="Foul Limit" suffix="per player" min={3} max={6} value={config.foulLimit} onChange={v => update({ foulLimit: v })} />
          <NumberField label="Bonus Threshold" suffix="team fouls" min={3} max={8} value={config.bonusThreshold} onChange={v => update({ bonusThreshold: v })} />
          <NumberField label="Timeouts / Game" suffix="per team" min={2} max={8} value={config.timeoutsPerGame} onChange={v => update({ timeoutsPerGame: v })} />
        </div>
      </SectionCard>

      <SectionCard icon={<Eye className="w-4 h-4" />} title="Live Preview" subtitle="How the match info will appear at the top of the scoreboard.">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-semibold mb-1">{config.tournamentName || 'Tournament Name'}</div>
          <div className="font-display text-2xl mb-3">{config.venue || 'Venue Name'}</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-400">
            <span>{config.matchDate} · {config.matchTime}</span>
            <span>{config.quarterMinutes}min quarters · {config.shotClockSeconds}s shot clock</span>
            <span>Foul out at {config.foulLimit} · Bonus at {config.bonusThreshold}</span>
            <span>Refs: {config.refereeMain} · {config.refereeAssist}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Teams panel ─────────────────────────────────────────────────

function TeamsPanel({ teams, setTeams }) {
  const updateTeam = (id, patch) => setTeams({ ...teams, [id]: { ...teams[id], ...patch } });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <TeamForm team={teams.A} onChange={(p) => updateTeam('A', p)} sideLabel="Home" />
      <TeamForm team={teams.B} onChange={(p) => updateTeam('B', p)} sideLabel="Visitor" />
    </div>
  );
}

function TeamForm({ team, onChange, sideLabel }) {
  return (
    <SectionCard icon={<Shield className="w-4 h-4" style={{ color: team.color }} />} title={team.name || 'Untitled Team'} subtitle={`${sideLabel} side · branding & coaching staff`} accent={team.color}>
      <div className="rounded-lg border border-zinc-800 p-4 mb-5" style={{ background: `linear-gradient(135deg, ${team.color}18, transparent 70%)` }}>
        <div className="flex items-center gap-3">
          <TeamLogo team={team} size={56} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-medium">{team.city || 'CITY'}</div>
            <div className="font-display text-3xl leading-tight">{team.name || 'TEAM NAME'}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Coach: {team.coach || '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Team Name"><input className="field-input" value={team.name} onChange={e => onChange({ name: e.target.value.toUpperCase() })} placeholder="e.g. TIGERS" maxLength={20} /></Field>
        <Field label="City / Region"><input className="field-input" value={team.city} onChange={e => onChange({ city: e.target.value.toUpperCase() })} placeholder="e.g. EAST CITY" maxLength={20} /></Field>
        <Field label="Abbreviation" hint="2–4 chars"><input className="field-input font-mono uppercase" value={team.abbr} onChange={e => onChange({ abbr: e.target.value.toUpperCase().slice(0, 4) })} placeholder="TGR" maxLength={4} /></Field>
        <Field label="Team Color"><ColorPicker value={team.color} onChange={c => onChange({ color: c })} /></Field>
        <Field label="Head Coach"><input className="field-input" value={team.coach} onChange={e => onChange({ coach: e.target.value })} placeholder="Head coach name" /></Field>
        <Field label="Assistant Coach"><input className="field-input" value={team.assistant} onChange={e => onChange({ assistant: e.target.value })} placeholder="Assistant coach" /></Field>
      </div>
    </SectionCard>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 rounded-md overflow-hidden border-2 flex-shrink-0" style={{ borderColor: value, boxShadow: `0 0 16px ${value}55` }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      <input className="field-input font-mono uppercase" value={value} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} maxLength={7} />
      <div className="flex gap-1 flex-shrink-0">
        {COLOR_PALETTE.slice(0, 6).map(c => (
          <button key={c} onClick={() => onChange(c)} className="w-5 h-5 rounded transition hover:scale-110" style={{ background: c, outline: value === c ? '2px solid white' : 'none', outlineOffset: 1 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Roster panel ────────────────────────────────────────────────

function RosterPanel({ teams, setTeams, onShowToast }) {
  const [active, setActive] = useState('A');
  const team = teams[active];
  const updateTeam = (patch) => setTeams({ ...teams, [active]: { ...teams[active], ...patch } });

  const startersCount = team.players.filter(p => p.onCourt).length;
  const captainCount = team.players.filter(p => p.captain).length;

  const addPlayer = () => {
    if (team.players.length >= 15) { onShowToast('Roster cap is 15 players', 'error'); return; }
    const usedJerseys = new Set(team.players.map(p => p.jersey));
    let j = 1; while (usedJerseys.has(j)) j++;
    const newP = {
      id: `${active}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      jersey: j, name: 'New Player', pos: 'G', captain: false, onCourt: false,
      fouls: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouledOut: false,
    };
    updateTeam({ players: [...team.players, newP] });
  };

  const updatePlayer = (id, patch) => {
    let players = team.players.map(p => p.id === id ? { ...p, ...patch } : p);
    if (patch.captain === true) players = players.map(p => p.id === id ? p : { ...p, captain: false });
    if (patch.onCourt === true) {
      const onCourtNow = players.filter(p => p.onCourt).length;
      if (onCourtNow > 5) { onShowToast('Only 5 starters allowed on court', 'error'); return; }
    }
    updateTeam({ players });
  };

  const removePlayer = (id) => {
    if (team.players.length <= 5) { onShowToast('Need at least 5 players on the roster', 'error'); return; }
    updateTeam({ players: team.players.filter(p => p.id !== id) });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur p-1.5 flex gap-1.5">
        {['A', 'B'].map(id => {
          const t = teams[id];
          const isActive = active === id;
          const errs = validateTeam(t);
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition btn-press ${isActive ? '' : 'hover:bg-white/5'}`}
              style={isActive ? { background: `linear-gradient(135deg, ${t.color}33, ${t.color}11)`, boxShadow: `inset 0 0 0 1px ${t.color}` } : {}}
            >
              <TeamLogo team={t} size={36} />
              <div className="text-left flex-1 min-w-0">
                <div className="font-display text-lg leading-none">{t.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">
                  {t.players.length} players · {t.players.filter(p => p.onCourt).length}/5 starters
                </div>
              </div>
              {errs.length > 0 ? (
                <div className="flex items-center gap-1 text-amber-400 text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" /><span>{errs.length}</span>
                </div>
              ) : (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RosterStat label="Total Roster" value={team.players.length} hint="max 15" />
        <RosterStat label="Starters" value={`${startersCount}/5`} ok={startersCount === 5} warn={startersCount !== 5} />
        <RosterStat label="Captain" value={captainCount === 1 ? team.players.find(p => p.captain)?.name?.split(' ')[0] || '—' : 'None'} warn={captainCount !== 1} />
        <RosterStat label="Bench" value={team.players.length - startersCount} />
      </div>

      <SectionCard
        icon={<Users className="w-4 h-4" style={{ color: team.color }} />}
        title={`${team.name} Roster`}
        subtitle="Set jersey numbers, positions, captain and starter status"
        accent={team.color}
        action={
          <button onClick={addPlayer} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs uppercase tracking-wider font-semibold btn-press transition" style={{ background: team.color, color: '#fff' }}>
            <UserPlus className="w-3.5 h-3.5" /> Add Player
          </button>
        }
      >
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            <div className="col-span-2">Jersey</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Pos.</div>
            <div className="col-span-1 text-center">Cpt.</div>
            <div className="col-span-2 text-center">Starter</div>
            <div className="col-span-1"></div>
          </div>
          {team.players.map(p => (
            <PlayerEditRow key={p.id} player={p} accent={team.color} onUpdate={patch => updatePlayer(p.id, patch)} onRemove={() => removePlayer(p.id)} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function RosterStat({ label, value, hint, ok, warn }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">{label}</div>
      <div className="flex items-baseline justify-between mt-1">
        <span className={`font-display text-2xl ${ok ? 'text-emerald-400' : warn ? 'text-amber-400' : 'text-white'}`}>{value}</span>
        {hint && <span className="text-[10px] text-zinc-600 uppercase">{hint}</span>}
      </div>
    </div>
  );
}

function PlayerEditRow({ player, accent, onUpdate, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-lg border border-zinc-900 hover:border-zinc-800 transition">
      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded font-display text-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}55` }}>#</div>
          <input type="number" min={0} max={99} className="field-input font-mono" value={player.jersey} onChange={e => onUpdate({ jersey: Math.max(0, Math.min(99, parseInt(e.target.value) || 0)) })} />
        </div>
      </div>
      <div className="col-span-4"><input className="field-input" value={player.name} onChange={e => onUpdate({ name: e.target.value })} placeholder="Player name" /></div>
      <div className="col-span-2">
        <select className="field-input" value={player.pos} onChange={e => onUpdate({ pos: e.target.value })}>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="col-span-1 flex justify-center">
        <Toggle checked={player.captain} onChange={v => onUpdate({ captain: v })} icon={<Crown className="w-3 h-3" />} accent="#fbbf24" />
      </div>
      <div className="col-span-2 flex justify-center">
        <Toggle checked={player.onCourt} onChange={v => onUpdate({ onCourt: v })} accent={accent} label={player.onCourt ? 'COURT' : 'BENCH'} />
      </div>
      <div className="col-span-1 flex justify-end">
        <button onClick={onRemove} className="w-8 h-8 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, accent, label, icon }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition btn-press text-[10px] uppercase tracking-wider font-semibold ${checked ? '' : 'border border-zinc-800 text-zinc-600'}`}
      style={checked ? { background: `${accent}22`, color: accent, border: `1px solid ${accent}55` } : {}}
    >
      {icon}
      {label && <span>{label}</span>}
      {!label && !icon && (
        <div className={`w-7 h-3.5 rounded-full relative transition ${checked ? '' : 'bg-zinc-800'}`} style={checked ? { background: accent } : {}}>
          <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition ${checked ? 'left-3.5' : 'left-0.5'}`}></div>
        </div>
      )}
    </button>
  );
}

// ─── Review panel ────────────────────────────────────────────────

function ReviewPanel({ config, teams, errsA, errsB, onLaunch, ready, launching }) {
  const allErrs = [...errsA, ...errsB];
  return (
    <div className="space-y-5">
      <SectionCard icon={<ClipboardList className="w-4 h-4" />} title="Match Summary" subtitle="Confirm everything before tip-off.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryRow label="Tournament" value={config.tournamentName} />
          <SummaryRow label="Venue" value={config.venue} />
          <SummaryRow label="Date · Time" value={`${config.matchDate} · ${config.matchTime}`} />
          <SummaryRow label="Officials" value={`${config.refereeMain} / ${config.refereeAssist}`} />
          <SummaryRow label="Format" value={`4 × ${config.quarterMinutes} min · ${config.shotClockSeconds}s shot clock`} />
          <SummaryRow label="Limits" value={`Foul-out at ${config.foulLimit} · Bonus at ${config.bonusThreshold} · ${config.timeoutsPerGame} timeouts`} />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReviewTeamCard team={teams.A} errs={errsA} sideLabel="HOME" />
        <ReviewTeamCard team={teams.B} errs={errsB} sideLabel="VISITOR" />
      </div>

      {allErrs.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">Fix before launch</span>
          </div>
          <ul className="space-y-1 text-sm text-amber-200/80">
            {allErrs.map((e, i) => <li key={i}>· {e}</li>)}
          </ul>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button
          onClick={onLaunch}
          disabled={!ready || launching}
          className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold btn-press transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: ready ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : '#27272a',
            color: ready ? '#000' : '#71717a',
            boxShadow: ready ? '0 0 32px rgba(251,191,36,0.4)' : 'none',
          }}
        >
          {launching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
          <span className="font-display text-2xl tracking-wider">{launching ? 'LAUNCHING…' : 'LAUNCH MATCH'}</span>
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-0.5">{label}</div>
      <div className="text-sm text-zinc-200">{value || '—'}</div>
    </div>
  );
}

function ReviewTeamCard({ team, errs, sideLabel }) {
  const starters = team.players.filter(p => p.onCourt);
  const bench = team.players.filter(p => !p.onCourt);
  return (
    <SectionCard icon={<Shield className="w-4 h-4" style={{ color: team.color }} />} title={team.name || '—'} subtitle={`${sideLabel} · ${team.coach || 'No coach assigned'}`} accent={team.color}>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
        <TeamLogo team={team} size={48} />
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">{team.city}</div>
          <div className="font-display text-2xl">{team.name}</div>
        </div>
        <div className="ml-auto text-right">
          {errs.length === 0 ? (
            <div className="flex items-center gap-1 text-emerald-400 text-xs uppercase tracking-wider"><Check className="w-3.5 h-3.5" /> Ready</div>
          ) : (
            <div className="flex items-center gap-1 text-amber-400 text-xs uppercase tracking-wider"><AlertTriangle className="w-3.5 h-3.5" /> {errs.length} issue{errs.length > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-2">Starting Five</div>
      <div className="space-y-1 mb-4">
        {starters.length === 0 && <div className="text-sm text-zinc-600">No starters set</div>}
        {starters.map(p => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded font-display flex items-center justify-center flex-shrink-0" style={{ background: `${team.color}22`, color: team.color }}>{p.jersey}</div>
            <span className="text-zinc-200">{p.name}</span>
            {p.captain && <Crown className="w-3 h-3 text-amber-400" />}
            <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-500">{p.pos}</span>
          </div>
        ))}
      </div>

      {bench.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-2">Bench · {bench.length}</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {bench.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-zinc-400">
                <span className="font-mono text-zinc-600">#{p.jersey}</span>
                <span className="truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}

// ─── Primitives ──────────────────────────────────────────────────

function SectionCard({ icon, title, subtitle, children, accent, action }) {
  return (
    <section className="rounded-xl border bg-zinc-950/60 backdrop-blur overflow-hidden" style={{ borderColor: 'rgba(63,63,70,0.8)', boxShadow: accent ? `0 0 0 1px ${accent}11` : 'none' }}>
      <header className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
        {icon && <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl leading-none">{title}</div>
          {subtitle && <div className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">{subtitle}</div>}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-1.5 flex items-center gap-2">
        <span>{label}</span>
        {hint && <span className="text-zinc-600 normal-case tracking-normal text-[10px]">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, suffix }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition btn-press text-zinc-400">
          <Minus className="w-3 h-3" />
        </button>
        <input type="number" className="field-input text-center font-mono" value={value} min={min} max={max} onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))} />
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition btn-press text-zinc-400">
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {suffix && <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">{suffix}</div>}
    </Field>
  );
}

function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onCancel}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 max-w-md w-full slide-in" onClick={e => e.stopPropagation()} style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">{title}</div>
        <div className="text-sm text-zinc-300 mb-5">{message}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm uppercase tracking-wider btn-press transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md font-semibold text-sm uppercase tracking-wider btn-press transition" style={{ background: '#dc2626', color: '#fff' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
