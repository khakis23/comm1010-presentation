import assert from 'node:assert/strict';
import test from 'node:test';
import { readStation } from '../src/presenter-control.js';

test('the clicker reads the last station of the expanded deck', () => {
  const station = { index: 15, total: 15, title: 'Action and Telemetry Hub' };
  assert.deepEqual(readStation(station), station);
  assert.equal(readStation({ ...station, index: 16 }), null);
  assert.equal(readStation({ ...station, total: 15.5 }), null);
  assert.equal(readStation({ ...station, total: 0 }), null);
  assert.equal(readStation({ ...station, title: ' ' }), null);
});

test('older station updates without a total keep the five-station range', () => {
  const station = { index: 5, title: 'Action Hub' };
  assert.deepEqual(readStation(station), { ...station, total: 5 });
  assert.equal(readStation({ ...station, index: 6 }), null);
});
