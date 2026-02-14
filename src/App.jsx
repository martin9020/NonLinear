import React, { useState, useCallback, useRef, useEffect } from 'react';
import { C, glass } from './app/theme';
import { PRESETS } from './app/presets';
import ParamSlider from './app/ParamSlider';
import WaveViz from './app/WaveViz';
import PhasePortrait from './app/PhasePortrait';
import NewtonRaphson from './app/NewtonRaphson';
import SurfaceViz from './app/SurfaceViz';

// ═════════════════════════════════════════════════════════════════════════════
// Main Application
// ═════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [params, setParams] = useState({ ...PRESETS[0].params });
  const [isPlaying, setIsPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [leftOpen, setLeftOpen] = useState(true);
  const [nrStepIdx, setNrStepIdx] = useState(0);
  const [userTrajectories, setUserTrajectories] = useState([]);

  const timeRef = useRef(0);
  const preset = PRESETS[presetIdx];
  const vizType = preset.type;

  // ── Preset switching ───────────────────────────────────────────────────
  const selectPreset = useCallback((idx) => {
    setPresetIdx(idx);
    setParams({ ...PRESETS[idx].params });
    setTime(0);
    timeRef.current = 0;
    setIsPlaying(true);
    setNrStepIdx(0);
    setUserTrajectories([]);
  }, []);

  const updateParam = useCallback((key, val) => {
    setParams(prev => ({ ...prev, [key]: val }));
  }, []);

  const addTrajectory = useCallback((ic) => {
    setUserTrajectories(prev => [...prev, ic]);
  }, []);

  // ── Time sync for wave and surface display ─────────────────────────────
  const handleTimeUpdate = useCallback((t) => {
    // Throttled update for display only
  }, []);

  useEffect(() => {
    if (vizType !== 'wave' && vizType !== 'surface') return;
    const id = setInterval(() => setTime(timeRef.current), 100);
    return () => clearInterval(id);
  }, [vizType]);

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div style={styles.root}>
      {/* ── Equation Bar ──────────────────────────────────────────── */}
      <div style={styles.eqBar}>
        <span style={styles.eqType}>{vizType.toUpperCase()}</span>
        <div style={styles.eqText}>{preset.equation}</div>
        <span style={styles.eqName}>{preset.name}</span>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────── */}
      <div style={styles.main}>
        {/* ── Left Sidebar ──────────────────────────────────────── */}
        <div style={{ ...styles.sidebar, width: leftOpen ? 210 : 36 }}>
          <button onClick={() => setLeftOpen(!leftOpen)} style={styles.collapseBtn}>
            {leftOpen ? '◁' : '▷'}
          </button>
          {leftOpen && (
            <div style={styles.presetList}>
              <div style={styles.sectionLabel}>Equations</div>
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => selectPreset(i)}
                  style={{
                    ...styles.presetBtn,
                    background: i === presetIdx ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                    borderColor: i === presetIdx ? `${C.cyan}44` : 'transparent',
                    color: i === presetIdx ? C.cyan : C.dimText,
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 9, opacity: 0.6 }}>{p.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Visualization ─────────────────────────────────────── */}
        <div style={styles.vizArea}>
          {vizType === 'wave' && (
            <WaveViz
              params={params}
              isPlaying={isPlaying}
              timeRef={timeRef}
              onTimeUpdate={handleTimeUpdate}
            />
          )}
          {vizType === 'system' && (
            <PhasePortrait
              preset={preset}
              params={params}
              userTrajectories={userTrajectories}
              onAddTrajectory={addTrajectory}
            />
          )}
          {vizType === 'surface' && (
            <SurfaceViz
              preset={preset}
              params={params}
              isPlaying={isPlaying}
              timeRef={timeRef}
            />
          )}
          {vizType === 'algebraic' && (
            <NewtonRaphson
              preset={preset}
              params={params}
              stepIdx={nrStepIdx}
            />
          )}

          {/* ── Floating Controls ───────────────────────────────── */}
          <div style={styles.floatingBar}>
            {vizType === 'wave' && (
              <>
                <button onClick={() => setIsPlaying(!isPlaying)} style={styles.playBtn}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <span style={styles.timeLabel}>
                  t = <span style={{ color: C.cyan }}>{time.toFixed(2)}</span>
                </span>
                <button
                  onClick={() => { timeRef.current = 0; setTime(0); }}
                  style={styles.ghostBtn}
                >
                  Reset
                </button>
              </>
            )}

            {vizType === 'surface' && (
              <>
                <button onClick={() => setIsPlaying(!isPlaying)} style={styles.playBtn}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <span style={styles.timeLabel}>
                  t = <span style={{ color: C.cyan }}>{time.toFixed(2)}</span>
                </span>
                <button
                  onClick={() => { timeRef.current = 0; setTime(0); }}
                  style={styles.ghostBtn}
                >
                  Reset
                </button>
              </>
            )}

            {vizType === 'algebraic' && (
              <>
                <button
                  onClick={() => setNrStepIdx(Math.max(0, nrStepIdx - 1))}
                  style={styles.ghostBtn}
                >
                  ◀ Prev
                </button>
                <span style={styles.timeLabel}>
                  Step <span style={{ color: C.cyan }}>{nrStepIdx}</span>
                </span>
                <button onClick={() => setNrStepIdx(nrStepIdx + 1)} style={styles.playBtn}>
                  Next ▶
                </button>
              </>
            )}

            {vizType === 'system' && (
              <>
                <span style={{ fontSize: 11, color: C.dimText }}>
                  Click to add trajectory
                </span>
                {userTrajectories.length > 0 && (
                  <button onClick={() => setUserTrajectories([])} style={styles.ghostBtn}>
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────── */}
        <div style={styles.rightPanel}>
          <div style={styles.sectionLabel}>Parameters</div>

          {preset.sliders?.map(s => (
            <ParamSlider
              key={s.key}
              label={s.label}
              value={params[s.key] ?? 0}
              min={s.min} max={s.max} step={s.step}
              onChange={v => updateParam(s.key, v)}
            />
          ))}

          {vizType === 'wave' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <ParamSlider
                label="Time scrub"
                value={time} min={0} max={60} step={0.1}
                onChange={v => { timeRef.current = v; setTime(v); }}
              />
            </div>
          )}

          <div style={styles.infoBox}>
            <div style={{ fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              {preset.name}
            </div>
            <div style={{ marginBottom: 6 }}>{preset.description}</div>
            {preset.equations?.map((eq, i) => (
              <div key={i} style={{ color: C.cyan, fontSize: 11, marginBottom: 2 }}>{eq}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Noise overlay ─────────────────────────────────────────── */}
      <div style={styles.noise} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════════════════════════════════════

const styles = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column',
    background: C.bg, overflow: 'hidden',
    position: 'relative',
  },
  eqBar: {
    ...glass,
    padding: '10px 24px',
    margin: '8px 8px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
    zIndex: 10, flexShrink: 0,
  },
  eqType: {
    fontSize: 9, letterSpacing: 2, color: C.dimText,
    background: 'rgba(0,240,255,0.06)',
    padding: '3px 8px', borderRadius: 3,
  },
  eqText: {
    fontSize: 20, fontWeight: 300, letterSpacing: 1, color: C.white,
    textShadow: `0 0 20px ${C.cyan}40, 0 0 40px ${C.cyan}20`,
  },
  eqName: {
    fontSize: 10, color: C.dimText, fontStyle: 'italic',
  },
  main: {
    flex: 1, display: 'flex', overflow: 'hidden', padding: 8, gap: 8,
  },
  sidebar: {
    ...glass,
    transition: 'width 0.3s ease',
    flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  collapseBtn: {
    background: 'none', border: 'none', color: C.cyan,
    cursor: 'pointer', padding: 8, fontSize: 16, fontFamily: 'inherit',
    textAlign: 'center',
  },
  presetList: {
    padding: '0 10px 10px', overflowY: 'auto', flex: 1,
  },
  sectionLabel: {
    fontSize: 9, textTransform: 'uppercase', letterSpacing: 2,
    color: C.dimText, marginBottom: 12,
  },
  presetBtn: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '10px 12px', marginBottom: 4,
    border: '1px solid transparent', borderRadius: 6,
    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  vizArea: {
    flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden',
  },
  floatingBar: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 12,
    ...glass,
    padding: '8px 20px', zIndex: 5,
  },
  playBtn: {
    background: 'none', border: `1px solid ${C.cyan}60`, borderRadius: 4,
    color: C.cyan, cursor: 'pointer', padding: '4px 12px',
    fontSize: 14, fontFamily: 'inherit',
  },
  ghostBtn: {
    background: 'none', border: `1px solid ${C.border}`, borderRadius: 4,
    color: C.dimText, cursor: 'pointer', padding: '4px 10px',
    fontSize: 11, fontFamily: 'inherit',
  },
  timeLabel: {
    fontSize: 12, color: C.dimText,
  },
  rightPanel: {
    ...glass,
    width: 230, flexShrink: 0, padding: 16, overflowY: 'auto',
  },
  infoBox: {
    marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`,
    fontSize: 10, color: C.dimText, lineHeight: 1.6,
  },
  noise: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
    opacity: 0.4,
    background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
  },
};
