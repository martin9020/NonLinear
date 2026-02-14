// ─── Theme Colors & Shared Styles ────────────────────────────────────────────

export const C = {
  bg:        '#0a0a0f',
  panel:     'rgba(10, 12, 28, 0.75)',
  border:    'rgba(0, 240, 255, 0.15)',
  cyan:      '#00f0ff',
  magenta:   '#ff2060',
  violet:    '#8855ff',
  white:     '#f0f0f8',
  dimText:   '#667788',
  gridLine:  'rgba(0, 200, 255, 0.06)',
  sliderBg:  'rgba(0, 240, 255, 0.12)',
};

export const glass = {
  background: C.panel,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
};
