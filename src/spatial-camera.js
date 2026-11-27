const DEG_TO_RAD = Math.PI / 180;

export const TRANSITIONS = {
  cut: { dx: 1.1, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0, scale: 1, duration: 0, ease: 'linear' },
  none: { dx: 1.1, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0, scale: 1, duration: 0, ease: 'linear' },
  slide: { dx: 1.02, dy: 0, dz: -0.08, rx: 0, ry: -6, rz: 0, scale: 1, duration: 680 },
  'slide-right': { dx: 1.02, dy: 0, dz: -0.08, rx: 0, ry: -6, rz: 0, scale: 1, duration: 680 },
  'slide-left': { dx: -1.02, dy: 0, dz: -0.08, rx: 0, ry: 6, rz: 0, scale: 1, duration: 680 },
  'slide-down': { dx: 0, dy: 1.02, dz: -0.08, rx: 8, ry: 0, rz: 0, scale: 1, duration: 680 },
  drop: { dx: 0, dy: 1.02, dz: -0.08, rx: 8, ry: 0, rz: 0, scale: 1, duration: 680 },
  'slide-up': { dx: 0, dy: -1.02, dz: -0.08, rx: -8, ry: 0, rz: 0, scale: 1, duration: 680 },
  rise: { dx: 0, dy: -1.02, dz: -0.08, rx: -8, ry: 0, rz: 0, scale: 1, duration: 680 },
  zoom: { dx: 0.16, dy: -0.02, dz: 0.04, rx: 0, ry: -6, rz: 0, scale: 0.45, duration: 780 },
  'zoom-in': { dx: 0.16, dy: -0.02, dz: 0.04, rx: 0, ry: -6, rz: 0, scale: 0.45, duration: 780 },
  'zoom-out': { dx: 1.15, dy: 0.04, dz: 0.04, rx: 0, ry: 10, rz: 0, scale: 1.65, duration: 820 },
  rotate: { dx: 0.84, dy: 0, dz: -0.04, rx: 0, ry: -38, rz: 0, scale: 0.92, duration: 780 },
  'rotate-right': { dx: 0.84, dy: 0, dz: -0.04, rx: 0, ry: -38, rz: 0, scale: 0.92, duration: 780 },
  'rotate-left': { dx: -0.84, dy: 0, dz: -0.04, rx: 0, ry: 38, rz: 0, scale: 0.92, duration: 780 },
  'tilt-up': { dx: 0, dy: -0.74, dz: -0.04, rx: -30, ry: 0, rz: 0, scale: 0.94, duration: 760 },
  'tilt-down': { dx: 0, dy: 0.74, dz: -0.04, rx: 30, ry: 0, rz: 0, scale: 0.94, duration: 760 },
  roll: { dx: 0.58, dy: 0.22, dz: -0.04, rx: 0, ry: -8, rz: 36, scale: 0.88, duration: 780 },
  'roll-right': { dx: 0.58, dy: 0.22, dz: -0.04, rx: 0, ry: -8, rz: 36, scale: 0.88, duration: 780 },
  'roll-left': { dx: -0.58, dy: 0.22, dz: -0.04, rx: 0, ry: 8, rz: -36, scale: 0.88, duration: 780 },
  swoop: { dx: 0.66, dy: -0.18, dz: -0.06, rx: 14, ry: -32, rz: 8, scale: 1.18, duration: 880 },
};

const DEFAULT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function identityMatrix() {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

/** Multiply two column-major 4x4 matrices. */
export function multiplyMatrices(a, b) {
  const out = new Array(16);
  for (let col = 0; col < 4; col += 1) {
    const c = col * 4;
    for (let row = 0; row < 4; row += 1) {
      out[c + row] =
        a[row] * b[c] +
        a[4 + row] * b[c + 1] +
        a[8 + row] * b[c + 2] +
        a[12 + row] * b[c + 3];
    }
  }
  return out;
}

/** Build a column-major 4x4 matrix for T(x, y, z) * Rz * Ry * Rx * S(scale). */
export function stepMatrix({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = 1 }) {
  const cx = Math.cos(rx * DEG_TO_RAD);
  const sx = Math.sin(rx * DEG_TO_RAD);
  const cy = Math.cos(ry * DEG_TO_RAD);
  const sy = Math.sin(ry * DEG_TO_RAD);
  const cz = Math.cos(rz * DEG_TO_RAD);
  const sz = Math.sin(rz * DEG_TO_RAD);

  const m00 = cz * cy * scale;
  const m10 = sz * cy * scale;
  const m20 = -sy * scale;

  const m01 = (cz * sy * sx - sz * cx) * scale;
  const m11 = (sz * sy * sx + cz * cx) * scale;
  const m21 = cy * sx * scale;

  const m02 = (cz * sy * cx + sz * sx) * scale;
  const m12 = (sz * sy * cx - cz * sx) * scale;
  const m22 = cy * cx * scale;

  return [
    m00, m10, m20, 0,
    m01, m11, m21, 0,
    m02, m12, m22, 0,
    x, y, z, 1,
  ];
}

/** Invert a column-major 4x4 matrix so camera moves bring target station flush to viewport. */
export function invertMatrix(m) {
  const inv = new Array(16);
  inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
  inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
  inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
  inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
  inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
  inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
  inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
  inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
  inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
  inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
  inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
  inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
  inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
  inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
  inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
  inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

  const det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  if (Math.abs(det) < 1e-10) return identityMatrix();
  const invDet = 1 / det;
  for (let i = 0; i < 16; i += 1) inv[i] *= invDet;
  return inv;
}

export function toCssMatrix3d(m) {
  const clean = m.map((v) => (Math.abs(v) < 1e-7 ? 0 : Number(v.toFixed(6))));
  return `matrix3d(${clean.join(', ')})`;
}

function readNum(dataset, key, fallback, minimum = -Infinity) {
  if (!dataset[key]?.trim()) return fallback;
  const parsed = Number(dataset[key]);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

/** Resolve relative step parameters from a station's data attributes. */
export function resolveStationStep(dataset, index) {
  const key = dataset.transition?.trim().toLowerCase();
  let preset = TRANSITIONS.slide;
  if (Object.hasOwn(TRANSITIONS, key)) preset = TRANSITIONS[key];
  else if (!key && index === 0) preset = { ...TRANSITIONS.none, duration: 680, ease: DEFAULT_EASE };
  return {
    dx: readNum(dataset, 'dx', preset.dx),
    dy: readNum(dataset, 'dy', preset.dy),
    dz: readNum(dataset, 'dz', preset.dz),
    rx: readNum(dataset, 'rx', preset.rx),
    ry: readNum(dataset, 'ry', preset.ry),
    rz: readNum(dataset, 'rz', preset.rz),
    scale: readNum(dataset, 'scale', preset.scale, Number.MIN_VALUE),
    duration: readNum(dataset, 'duration', preset.duration, 0),
    ease: dataset.ease || preset.ease || DEFAULT_EASE,
  };
}

export function createSpatialCamera(viewport, onStationChange) {
  const world = viewport?.querySelector('#stage-world');
  const elements = world?.querySelectorAll('[data-station]');
  if (!elements?.length) throw new Error('The presenter stage needs at least one station.');
  const stations = Array.from(elements, (element, index) => {
    const labelId = element.getAttribute('aria-labelledby')?.trim().split(/\s+/)[0];
    const label = labelId ? element.ownerDocument.getElementById(labelId) : null;
    const heading = (element.contains(label) ? label : element.querySelector('h1, h2, h3, h4, h5, h6')) ?? element;
    if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    return { element, heading, step: resolveStationStep(element.dataset, index) };
  });
  const startParam = Number(new URLSearchParams(globalThis.location?.search).get('station'));
  const hasStationLink = Number.isInteger(startParam) && startParam >= 1 && startParam <= stations.length;
  const initialIndex = hasStationLink ? startParam - 1 : 0;
  let active = initialIndex;
  let maxVisited = initialIndex;
  let matrices = [];
  let width;
  let height;

  function syncStationStates() {
    stations.forEach(({ element }, index) => {
      const isActive = index === active;
      element.inert = !isActive;
      element.toggleAttribute('data-active', isActive);
      element.dataset.visit = isActive ? 'active' : index <= maxVisited ? 'past' : 'future';
    });
  }

  function applyTransitionTiming(duration, ease) {
    world.style.setProperty('--camera-duration', `${duration}ms`);
    world.style.setProperty('--camera-ease', ease);
  }

  function aim() {
    world.style.transform = toCssMatrix3d(invertMatrix(matrices[active]));
  }

  function layout(nextWidth, nextHeight) {
    width = nextWidth;
    height = nextHeight;
    const depth = Math.max(width, 700);
    viewport.style.perspective = `${depth}px`;

    let current = identityMatrix();
    matrices = stations.map(({ element, step }, index) => {
      const local = stepMatrix({
        x: step.dx * width,
        y: step.dy * height,
        z: step.dz * depth,
        rx: step.rx,
        ry: step.ry,
        rz: step.rz,
        scale: step.scale,
      });
      current = index === 0 ? local : multiplyMatrices(current, local);
      element.style.transform = toCssMatrix3d(current);
      return current;
    });
    aim();
  }

  function announce(focus) {
    const { element, heading } = stations[active];
    const title = (heading === element ? element.getAttribute('aria-label') : heading.textContent)?.trim();
    if (focus) heading.focus({ preventScroll: true });
    onStationChange({ index: active + 1, total: stations.length, title: title || `Station ${active + 1}` });
  }

  function move(delta) {
    const next = active + delta;
    if (next < 0 || next >= stations.length) return;
    const timingStep = delta > 0 ? stations[next].step : stations[active].step;
    applyTransitionTiming(timingStep.duration, timingStep.ease);

    active = next;
    maxVisited = Math.max(active, maxVisited);
    syncStationStates();
    aim();
    announce(!viewport.inert);
  }

  syncStationStates();
  layout(viewport.clientWidth || 1280, viewport.clientHeight || 720);
  world.setAttribute('data-ready', '');
  function resize() {
    const nextWidth = viewport.clientWidth;
    const nextHeight = viewport.clientHeight;
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
    world.setAttribute('data-resizing', '');
    layout(nextWidth, nextHeight);
    world.getBoundingClientRect();
    world.removeAttribute('data-resizing');
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(viewport);
  else window.addEventListener('resize', resize);
  announce(false);

  return {
    hasStationLink,
    next: () => move(1),
    prev: () => move(-1),
    focus() {
      resize();
      stations[active].heading.focus({ preventScroll: true });
    },
  };
}
