# Nonlinear Equation Solver — Dark Quantum Lab

An interactive visual solver for nonlinear equations featuring stunning real-time 3D/2D visualizations of wave functions, phase portraits, and root-finding algorithms. Built with React, Three.js, and Canvas 2D.
[View Demo Video]([https://github.com/martin9020/NonLinear/assets/YOUR_ID/XXXXXX.mp4](https://github.com/martin9020/NonLinear/blob/main/src/Recording%202026-02-14%20160302.mp4))

<video width="100%" controls>
  <source src="src/Recording 2026-02-14 160302.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Features

### Visualization Modes

**3D Gaussian Wave Packet**
- Renders the Schrodinger wave function as a 3D helical tube: `y = Re(Psi)`, `z = Im(Psi)` along the x-axis
- Gaussian envelope outlines, floor projections of real and imaginary components
- Glowing particle effects, dynamic lighting that tracks the wave center
- Full orbit camera controls (rotate, zoom, pan)

**2D Phase Portraits**
- Vector field arrows showing flow direction and magnitude
- Integrated trajectories from a grid of initial conditions via RK4
- Click anywhere on the phase plane to add custom trajectories
- Animated flow particles streaming along the vector field

**Newton-Raphson Root Finding**
- Step-by-step animated visualization of Newton-Raphson iterations
- Tangent lines, vertical drops, and convergence path displayed per step
- Pulsing root markers with glow effects at found solutions
- Live convergence info: root value, f(x) residual, iteration count

### Preset Equations

| Preset | Type | Description |
|--------|------|-------------|
| Gaussian Wave Packet | Wave | 1D free-particle Schrodinger solution |
| Van der Pol Oscillator | System | Self-sustained oscillations with limit cycle |
| Simple Pendulum | System | Nonlinear pendulum phase portrait |
| Cubic Root Finding | Algebraic | Newton-Raphson iteration visualization |
| Duffing Oscillator | System | Chaotic forced oscillator |
| Lorenz System (x-z) | System | Strange attractor — deterministic chaos |

### Interactive Controls

- **Parameter sliders** with real-time updates (amplitude, wave number, frequency, damping, etc.)
- **Play/Pause** and **time scrub** for wave packet animations
- **Step forward/back** through Newton-Raphson iterations
- **Click-to-add** trajectories on phase portraits
- **Collapsible sidebars** for presets and parameters

### Numerical Solvers

- **Runge-Kutta 4th Order (RK4)** — ODE integration for phase portraits and trajectory computation
- **Newton-Raphson** — Root finding with full iteration history
- **Wave Packet** — Analytical Gaussian wave packet evaluation with real, imaginary, and probability density components

## Tech Stack

- **React 19** — UI framework with hooks-based state management
- **Three.js** — 3D wave packet visualization with custom buffer geometries
- **Canvas 2D** — Phase portraits and Newton-Raphson plots
- **Vite** — Build tool and dev server
- **JetBrains Mono** — Monospace typography via Google Fonts

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm

### Installation

```bash
git clone <repository-url>
cd NonLinear
npm install
```

### Development

```bash
npm run dev
```

The app opens automatically in your default browser at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

The built output goes to the `dist/` directory.

## Project Structure

```
NonLinear/
├── index.html              # Entry HTML with global styles and font import
├── vite.config.js          # Vite configuration with React plugin
├── package.json
├── src/
│   ├── main.jsx            # React root mount
│   ├── App.jsx             # Main layout, preset switching, state management
│   └── app/
│       ├── theme.js        # Color palette and glassmorphism styles
│       ├── presets.js       # Preset equation definitions and system functions
│       ├── solvers.js       # RK4, Newton-Raphson, wave packet math, color utils
│       ├── ParamSlider.jsx  # Reusable styled range input component
│       ├── WaveViz.jsx      # Three.js 3D wave packet visualization
│       ├── PhasePortrait.jsx # Canvas 2D phase portrait with flow particles
│       └── NewtonRaphson.jsx # Canvas 2D root-finding step visualization
└── .gitignore
```

## Design

The app follows a **"Dark Quantum Lab"** aesthetic — a near-black void with glowing mathematical structures:

- **Background**: `#0a0a0f` with subtle noise overlay
- **Primary glow**: Electric cyan `#00f0ff`
- **Accents**: Hot magenta `#ff2060`, soft violet `#8855ff`
- **UI panels**: Glassmorphism (frosted glass with backdrop blur)
- **Typography**: JetBrains Mono throughout for a scientific/technical feel

## License

ISC
