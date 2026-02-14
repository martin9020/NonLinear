import React, { useEffect, useRef } from 'react';
import { C } from './theme';
import { newtonRaphsonSteps } from './solvers';

// ─── Newton-Raphson Root Finding Visualization (Canvas) ──────────────────────

export default function NewtonRaphson({ preset, params, stepIdx }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

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

    const fn = preset.fn;
    const dfn = preset.dfn;
    const xr = preset.xRange;
    const yr = preset.yRange;

    function toScreen(x, y) {
      return [
        ((x - xr[0]) / (xr[1] - xr[0])) * W,
        H - ((y - yr[0]) / (yr[1] - yr[0])) * H,
      ];
    }

    const steps = newtonRaphsonSteps(fn, dfn, params.x0);
    const showSteps = Math.min(stepIdx + 1, steps.length);

    let running = true;

    function draw() {
      if (!running) return;
      animRef.current = requestAnimationFrame(draw);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = C.gridLine;
      ctx.lineWidth = 0.5;
      for (let x = Math.ceil(xr[0]); x <= xr[1]; x++) {
        const [sx] = toScreen(x, 0);
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
      }
      for (let y = Math.ceil(yr[0]); y <= yr[1]; y++) {
        const [, sy] = toScreen(0, y);
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1;
      const [zx, zy] = toScreen(0, 0);
      ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(W, zy); ctx.stroke();

      // x-axis labels
      ctx.fillStyle = C.dimText;
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'center';
      for (let x = Math.ceil(xr[0]); x <= xr[1]; x++) {
        if (x === 0) continue;
        const [sx, sy] = toScreen(x, 0);
        ctx.fillText(x.toString(), sx, sy + 14);
      }

      // Function curve with glow
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = C.cyan;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let px = 0; px <= W; px += 1) {
        const x = xr[0] + (px / W) * (xr[1] - xr[0]);
        const y = fn(x);
        const [sx, sy] = toScreen(x, y);
        if (px === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // NR iteration steps
      for (let i = 1; i < showSteps; i++) {
        const step = steps[i];
        if (step.prevX === undefined) continue;
        drawIteration(ctx, step, i, showSteps, fn, xr, yr, toScreen);
      }

      // Pulsing root marker
      if (showSteps > 1) {
        drawRootMarker(ctx, steps[showSteps - 1], toScreen);
        drawConvergenceInfo(ctx, steps, showSteps, W, H);
      }

      // Starting point label
      if (showSteps >= 1) {
        const [sx, sy] = toScreen(steps[0].x, steps[0].fx);
        ctx.fillStyle = C.white;
        ctx.font = '11px "JetBrains Mono"';
        ctx.textAlign = 'left';
        ctx.fillText(`x₀ = ${steps[0].x.toFixed(2)}`, sx + 8, sy - 8);
        ctx.fillStyle = C.cyan;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [preset, params, stepIdx]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: 'default' }}
    />
  );
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function drawIteration(ctx, step, i, total, fn, xr, yr, toScreen) {
  const progress = i / total;

  // Tangent line
  const tangentExtent = 1.5;
  const tx1 = step.prevX - tangentExtent;
  const tx2 = step.prevX + tangentExtent;
  const ty1 = step.prevFx + step.slope * (tx1 - step.prevX);
  const ty2 = step.prevFx + step.slope * (tx2 - step.prevX);

  ctx.strokeStyle = `rgba(136, 85, 255, ${0.3 + 0.5 * progress})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  const [sx1, sy1] = toScreen(tx1, ty1);
  const [sx2, sy2] = toScreen(tx2, ty2);
  ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
  ctx.setLineDash([]);

  // Vertical drop from curve to x-axis
  const [nx, ny] = toScreen(step.x, step.fx);
  const [, nxAxis] = toScreen(step.x, 0);
  ctx.strokeStyle = `rgba(255, 32, 96, ${0.25 + 0.5 * progress})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx, nxAxis); ctx.stroke();
  ctx.setLineDash([]);

  // Point on the curve at previous x
  const [px, py] = toScreen(step.prevX, step.prevFx);
  ctx.fillStyle = `rgba(136, 85, 255, ${0.5 + 0.5 * progress})`;
  ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();

  // Point on x-axis (new x guess)
  ctx.fillStyle = `rgba(255, 32, 96, ${0.5 + 0.5 * progress})`;
  ctx.beginPath(); ctx.arc(nx, nxAxis, 3.5, 0, Math.PI * 2); ctx.fill();

  // Step label
  ctx.fillStyle = `rgba(102, 119, 136, ${0.3 + 0.5 * progress})`;
  ctx.font = '9px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillText(`x${subscript(i)}`, nx, nxAxis + 14);
}

function drawRootMarker(ctx, lastStep, toScreen) {
  const [rx, ry] = toScreen(lastStep.x, 0);
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
  const radius = 6 + pulse * 4;

  ctx.fillStyle = `rgba(0, 240, 255, ${0.4 + pulse * 0.6})`;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 12 + pulse * 15;
  ctx.beginPath(); ctx.arc(rx, ry, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Ring
  ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + pulse * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(rx, ry, radius + 4, 0, Math.PI * 2); ctx.stroke();
}

function drawConvergenceInfo(ctx, steps, showSteps, W, H) {
  const last = steps[showSteps - 1];
  ctx.fillStyle = C.white;
  ctx.font = '12px "JetBrains Mono"';
  ctx.textAlign = 'left';
  ctx.shadowColor = C.bg;
  ctx.shadowBlur = 4;

  const x = 20;
  const y = H - 70;
  ctx.fillStyle = C.dimText;
  ctx.fillText('ROOT FOUND', x, y);
  ctx.fillStyle = C.cyan;
  ctx.fillText(`x = ${last.x.toFixed(10)}`, x, y + 18);
  ctx.fillStyle = C.dimText;
  ctx.fillText(`f(x) = ${last.fx.toExponential(3)}`, x, y + 36);
  ctx.fillText(`${showSteps - 1} iteration${showSteps - 1 !== 1 ? 's' : ''}`, x, y + 54);
  ctx.shadowBlur = 0;
}

function subscript(n) {
  const sub = '₀₁₂₃₄₅₆₇₈₉';
  return String(n).split('').map(d => sub[parseInt(d)] || d).join('');
}
