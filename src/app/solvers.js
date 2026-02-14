// ─── Numerical Solvers & Math Utilities ──────────────────────────────────────

// ── Runge-Kutta 4th Order ────────────────────────────────────────────────────

export function rk4Step(f, state, t, dt, params) {
  const k1 = f(state, t, params);
  const s2 = state.map((s, i) => s + 0.5 * dt * k1[i]);
  const k2 = f(s2, t + 0.5 * dt, params);
  const s3 = state.map((s, i) => s + 0.5 * dt * k2[i]);
  const k3 = f(s3, t + 0.5 * dt, params);
  const s4 = state.map((s, i) => s + dt * k3[i]);
  const k4 = f(s4, t + dt, params);
  return state.map((s, i) =>
    s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  );
}

export function rk4Integrate(f, state0, t0, tEnd, dt, params) {
  const trajectory = [{ t: t0, state: [...state0] }];
  let state = [...state0];
  let t = t0;
  while (t < tEnd) {
    state = rk4Step(f, state, t, dt, params);
    t += dt;
    trajectory.push({ t, state: [...state] });
  }
  return trajectory;
}

// ── Newton-Raphson ───────────────────────────────────────────────────────────

export function newtonRaphsonSteps(f, df, x0, maxIter = 20, tol = 1e-10) {
  const steps = [{ x: x0, fx: f(x0) }];
  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const fx = f(x);
    const dfx = df(x);
    if (Math.abs(dfx) < 1e-14) break;
    const xNew = x - fx / dfx;
    steps.push({
      x: xNew,
      fx: f(xNew),
      prevX: x,
      prevFx: fx,
      slope: dfx,
    });
    if (Math.abs(xNew - x) < tol) break;
    x = xNew;
  }
  return steps;
}

// ── Wave Packet ──────────────────────────────────────────────────────────────

export function wavePacket(x, t, params) {
  const { A, k, omega, a, v } = params;
  const dx = x - v * t;
  const envelope = A * Math.exp(-(dx * dx) / (4 * a * a));
  const phase = k * x - omega * t;
  return {
    real: envelope * Math.cos(phase),
    imag: envelope * Math.sin(phase),
    prob: envelope * envelope,
  };
}

// ── Color Utilities ──────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return a.map((v, i) => (v + (b[i] - v) * t) / 255);
}

/** Map a wave amplitude value to an RGB [0..1] triplet. */
export function amplitudeColor(val, maxVal) {
  const t = Math.min(Math.abs(val) / (maxVal || 1), 1);
  if (val >= 0) {
    if (t < 0.5) return lerpColor('#001840', '#00b8ff', t * 2);
    return lerpColor('#00b8ff', '#e0f8ff', (t - 0.5) * 2);
  }
  if (t < 0.5) return lerpColor('#180010', '#ff2060', t * 2);
  return lerpColor('#ff2060', '#ffe0e8', (t - 0.5) * 2);
}
