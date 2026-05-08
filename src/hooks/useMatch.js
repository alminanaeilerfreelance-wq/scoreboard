'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Live match hook — polls the server for canonical state and exposes a
// dispatch() that POSTs actions to the event endpoint. Lightweight enough
// to drive the audience display in read-only mode and the scoreboard in
// active-control mode.
export function useMatch({ pollMs = 1500, readOnly = false } = {}) {
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUpdatedRef = useRef(null);
  const inflightRef = useRef(false);

  const fetchMatch = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    try {
      const r = await fetch('/api/match', { cache: 'no-store' });
      if (!r.ok) throw new Error('Failed to load match');
      const data = await r.json();
      // Only swap state when the server has a newer version, so user input
      // isn't disturbed by polling.
      if (data && data.updatedAt !== lastUpdatedRef.current) {
        lastUpdatedRef.current = data.updatedAt;
        setMatch(data);
      } else if (!data) {
        setMatch(null);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      inflightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchMatch();
    const id = setInterval(fetchMatch, pollMs);
    return () => clearInterval(id);
  }, [fetchMatch, pollMs]);

  const dispatch = useCallback(async (action) => {
    if (readOnly) return;
    // Optimistic: assume success, refresh from server immediately after.
    try {
      const r = await fetch('/api/match/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || 'Action failed');
      }
      const next = await r.json();
      lastUpdatedRef.current = next.updatedAt;
      setMatch(next);
    } catch (e) {
      setError(e.message);
    }
  }, [readOnly]);

  // Local-only clock tick: server only persists on real events; the second-
  // by-second decrement is animated client-side and pushed up every 5s.
  useEffect(() => {
    if (!match || !match.clockRunning) return;
    const id = setInterval(() => {
      setMatch(m => {
        if (!m || !m.clockRunning) return m;
        const newGame = Math.max(0, m.gameClock - 1);
        const newShot = Math.max(0, m.shotClock - 1);
        return { ...m, gameClock: newGame, shotClock: newShot };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [match?.clockRunning]);

  // Push clock state up every 5 seconds so other clients catch up.
  useEffect(() => {
    if (readOnly || !match || !match.clockRunning) return;
    const id = setInterval(() => {
      fetch('/api/match', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameClock: match.gameClock, shotClock: match.shotClock }),
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [match?.clockRunning, match?.gameClock, match?.shotClock, readOnly]);

  return { match, dispatch, loading, error, refresh: fetchMatch, setMatch };
}
