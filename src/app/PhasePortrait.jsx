import React, { useEffect, useRef } from 'react';
import { C } from './theme';
import { rk4Integrate } from './solvers';

// ─── 2D Phase Portrait Visualization (Canvas) ───────────────────────────────

export default function PhasePortrait({ preset, params, userTrajectories, onAddTrajectory }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const W = container.clientWidth;
    const H = container.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const xr = preset.xRange || [-5, 5];
    const yr = preset.yRange || [-5, 5];
    const dim = preset.dim || 2;
    const pxIdx = preset.projX ?? 0;
    const pyIdx = preset.projY ?? 1;
    const sys = preset.systemFn;

    // ── Coordinate transforms ────────────────────────────────────────────
    function toScreen(sx, sy) {
      return [
        ((sx - xr[0]) / (xr[1] - xr[0])) * W,
        H - ((sy - yr[0]) / (yr[1] - yr[0])) * H,
      ];
    }
    function toWorld(px, py) {
      return [
        xr[0] + (px / W) * (xr[1] - xr[0]),
        yr[0] + ((H - py) / H) * (yr[1] - yr[0]),
      ];
    }

    // ── Initialize flow particles ────────────────────────────────────────
    function makeInitState() {
      if (dim === 3) {
        return [
          xr[0] + Math.random() * (xr[1] - xr[0]),
          yr[0] + Math.random() * (yr[1] - yr[0]),
          (yr[0] + yr[1]) / 2 + (Math.random() - 0.5) * 10,
        ];
      }
      return [
        xr[0] + Math.random() * (xr[1] - xr[0]),
        yr[0] + Math.random() * (yr[1] - yr[0]),
      ];
    }

    const flowCount = 180;
    if (!particlesRef.current || particlesRef.current.length !== flowCount) {
      particlesRef.current = Array.from({ length: flowCount }, () => ({
        state: makeInitState(),
        age: Math.random() * 100,
        maxAge: 80 + Math.random() * 80,
      }));
    }
    const flowParticles = particlesRef.current;

    // ── Pre-compute trajectories ─────────────────────────────────────────
    const gridN = dim === 3 ? 3 : 4;
    const defaultICs = [];
    for (let i = 0; i < gridN; i++) {
      for (let j = 0; j < gridN; j++) {
        const sx = xr[0] + (i + 0.5) * (xr[1] - xr[0]) / gridN;
        const sy = yr[0] + (j + 0.5) * (yr[1] - yr[0]) / gridN;
        defaultICs.push(dim === 3 ? [sx, sy, (yr[0] + yr[1]) / 2] : [sx, sy]);
      }
    }
    const defaultTrajs = defaultICs.map(ic => {
      const traj = rk4Integrate(sys, ic, 0, 30, 0.03, params);
      return traj.map(pt => toScreen(pt.state[pxIdx], pt.state[pyIdx]));
    });

    const userTrajs = userTrajectories.map(ic => {
      const traj = rk4Integrate(sys, ic, 0, 40, 0.02, params);
      return traj.map(pt => toScreen(pt.state[pxIdx], pt.state[pyIdx]));
    });

    // ── Animation loop ───────────────────────────────────────────────────
    let running = true;

    function drawFrame() {
      if (!running) return;
      animRef.current = requestAnimationFrame(drawFrame);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx, W, H, xr, yr, toScreen);
      drawAxes(ctx, W, H, xr, yr, toScreen);
      drawVectorField(ctx, W, H, xr, yr, dim, pxIdx, pyIdx, sys, params, toScreen);
      drawDefaultTrajectories(ctx, defaultTrajs);
      drawUserTrajectories(ctx, userTrajs);
      advanceAndDrawParticles(ctx, flowParticles, sys, params, dim, pxIdx, pyIdx, xr, yr, toScreen, makeInitState);
    }

    animRef.current = requestAnimationFrame(drawFrame);

    // ── Click to add initial condition ───────────────────────────────────
    function handleClick(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const [wx, wy] = toWorld(mx, my);
      const ic = dim === 3 ? [wx, wy, (yr[0] + yr[1]) / 2] : [wx, wy];
      onAddTrajectory(ic);
    }
    canvas.addEventListener('click', handleClick);

    const onResize = () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      canvas.width = w2 * dpr;
      canvas.height = h2 * dpr;
      canvas.style.width = w2 + 'px';
      canvas.style.height = h2 + 'px';
    };
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', onResize);
    };
  }, [preset, params, userTrajectories, onAddTrajectory]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: 'crosshair' }}
    />
  );
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function drawGrid(ctx, W, H, xr, yr, toScreen) {
  ctx.strokeStyle = C.gridLine;
  ctx.lineWidth = 0.5;
  const xStep = niceStep((xr[1] - xr[0]) / 8);
  const yStep = niceStep((yr[1] - yr[0]) / 8);
  for (let x = Math.ceil(xr[0] / xStep) * xStep; x <= xr[1]; x += xStep) {
    const [sx] = toScreen(x, 0);
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
  }
  for (let y = Math.ceil(yr[0] / yStep) * yStep; y <= yr[1]; y += yStep) {
    const [, sy] = toScreen(0, y);
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
  }
}

function drawAxes(ctx, W, H, xr, yr, toScreen) {
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  ctx.lineWidth = 1;
  const [zx, zy] = toScreen(0, 0);
  ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(W, zy); ctx.stroke();
}

function drawVectorField(ctx, W, H, xr, yr, dim, pxIdx, pyIdx, sys, params, toScreen) {
  const n = 20;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const sx = xr[0] + (i / n) * (xr[1] - xr[0]);
      const sy = yr[0] + (j / n) * (yr[1] - yr[0]);
      const state = dim === 3 ? [sx, sy, (yr[0] + yr[1]) / 2] : [sx, sy];
      const d = sys(state, 0, params);
      const dx = d[pxIdx], dy = d[pyIdx];
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag < 1e-8) continue;

      const scale = Math.min(mag, 3) / mag;
      const len = ((xr[1] - xr[0]) / n) * 0.3;
      const [scx, scy] = toScreen(sx, sy);
      const ndx = (dx * scale * len / (xr[1] - xr[0])) * W;
      const ndy = -(dy * scale * len / (yr[1] - yr[0])) * H;
      const alpha = Math.min(mag * 0.25, 0.45);

      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(scx, scy);
      ctx.lineTo(scx + ndx, scy + ndy);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(ndy, ndx);
      const headLen = 3;
      ctx.beginPath();
      ctx.moveTo(scx + ndx, scy + ndy);
      ctx.lineTo(
        scx + ndx - headLen * Math.cos(angle - 0.4),
        scy + ndy - headLen * Math.sin(angle - 0.4)
      );
      ctx.moveTo(scx + ndx, scy + ndy);
      ctx.lineTo(
        scx + ndx - headLen * Math.cos(angle + 0.4),
        scy + ndy - headLen * Math.sin(angle + 0.4)
      );
      ctx.stroke();
    }
  }
}

function drawDefaultTrajectories(ctx, trajs) {
  ctx.lineWidth = 1;
  trajs.forEach(traj => {
    if (traj.length < 2) return;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(traj[0][0], traj[0][1]);
    for (let i = 1; i < traj.length; i++) ctx.lineTo(traj[i][0], traj[i][1]);
    ctx.stroke();
  });
}

function drawUserTrajectories(ctx, trajs) {
  trajs.forEach(traj => {
    if (traj.length < 2) return;
    ctx.lineWidth = 2.5;
    for (let i = 1; i < traj.length; i++) {
      const t = i / traj.length;
      ctx.strokeStyle = `rgba(255, 32, 96, ${0.2 + 0.8 * t})`;
      ctx.beginPath();
      ctx.moveTo(traj[i - 1][0], traj[i - 1][1]);
      ctx.lineTo(traj[i][0], traj[i][1]);
      ctx.stroke();
    }
    // Start dot
    ctx.fillStyle = C.magenta;
    ctx.shadowColor = C.magenta;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(traj[0][0], traj[0][1], 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function advanceAndDrawParticles(ctx, particles, sys, params, dim, pxIdx, pyIdx, xr, yr, toScreen, makeInitState) {
  const dt = 0.04;
  particles.forEach(fp => {
    const d = sys(fp.state, 0, params);
    for (let k = 0; k < fp.state.length; k++) fp.state[k] += d[k] * dt;
    fp.age++;

    const oob =
      fp.state[pxIdx] < xr[0] - 2 || fp.state[pxIdx] > xr[1] + 2 ||
      fp.state[pyIdx] < yr[0] - 2 || fp.state[pyIdx] > yr[1] + 2 ||
      !isFinite(fp.state[0]) || !isFinite(fp.state[1]);

    if (fp.age > fp.maxAge || oob) {
      fp.state = makeInitState();
      fp.age = 0;
    }

    const [sx, sy] = toScreen(fp.state[pxIdx], fp.state[pyIdx]);
    const alpha = Math.min(fp.age / 12, 1) * Math.max(0, 1 - fp.age / fp.maxAge);
    ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function niceStep(rough) {
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  if (frac <= 1.5) return pow;
  if (frac <= 3.5) return 2 * pow;
  if (frac <= 7.5) return 5 * pow;
  return 10 * pow;
}
