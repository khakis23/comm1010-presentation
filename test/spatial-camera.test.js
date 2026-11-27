import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TRANSITIONS,
  identityMatrix,
  invertMatrix,
  multiplyMatrices,
  resolveStationStep,
  stepMatrix,
  toCssMatrix3d,
} from '../src/spatial-camera.js';

function assertAlmostIdentity(matrix) {
  const id = identityMatrix();
  for (let i = 0; i < 16; i += 1) {
    assert.ok(Math.abs(matrix[i] - id[i]) < 1e-6, `index ${i}: ${matrix[i]} !== ${id[i]}`);
  }
}

test('invertMatrix restores identity for every transition preset', () => {
  const width = 1280;
  const height = 720;
  const depth = 1280;

  for (const [name, preset] of Object.entries(TRANSITIONS)) {
    const m = stepMatrix({
      x: preset.dx * width,
      y: preset.dy * height,
      z: preset.dz * depth,
      rx: preset.rx,
      ry: preset.ry,
      rz: preset.rz,
      scale: preset.scale,
    });
    const combined = multiplyMatrices(invertMatrix(m), m);
    assertAlmostIdentity(combined);
    assert.ok(toCssMatrix3d(m).startsWith('matrix3d('), name);
  }
});

test('chained multi-axis steps invert cleanly back to viewport origin', () => {
  let pose = identityMatrix();
  const sequence = ['rotate-right', 'zoom-in', 'slide-down', 'roll', 'zoom-out'];
  for (const name of sequence) {
    const step = resolveStationStep({ transition: name }, 1);
    pose = multiplyMatrices(pose, stepMatrix({
      x: step.dx * 1280,
      y: step.dy * 720,
      z: step.dz * 1280,
      rx: step.rx,
      ry: step.ry,
      rz: step.rz,
      scale: step.scale,
    }));
  }
  assertAlmostIdentity(multiplyMatrices(invertMatrix(pose), pose));
});

test('station overrides preserve valid zeroes and fall back for invalid transition values', () => {
  const slide = resolveStationStep({ transition: 'slide' }, 1);
  assert.deepEqual(resolveStationStep({ transition: 'constructor', dx: '', scale: '0', duration: '-1' }, 1), slide);
  assert.deepEqual(resolveStationStep({ transition: ' CUT ', dx: '0' }, 1), { ...TRANSITIONS.cut, dx: 0 });
  assert.equal(resolveStationStep({ dy: '0.5' }, 0).dy, 0.5);
});
