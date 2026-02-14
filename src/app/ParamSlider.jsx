import React from 'react';
import { C } from './theme';

export default function ParamSlider({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: C.dimText, marginBottom: 3,
      }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <span style={{ color: C.cyan, fontWeight: 600 }}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%', height: 4,
          appearance: 'none', WebkitAppearance: 'none',
          background: C.sliderBg, borderRadius: 2,
          outline: 'none', cursor: 'pointer',
          accentColor: C.cyan,
        }}
      />
    </div>
  );
}
