import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_BALLOT, GOAL, MAX_COUNT, SIMULATION_STEPS, SIMULATION_TARGET,
  score, simulationBallot, tally, validBallot,
} from '../src/ballots.js';

test('applies the action weights to both a ballot and the board', () => {
  const first = { locked: 2, fasted: 1, deleted: 1 };
  const second = { locked: 3, fasted: 2, deleted: 0 };
  assert.equal(score(first), 12);
  assert.deepEqual(tally([first, second, EMPTY_BALLOT, null]), {
    counts: { locked: 5, fasted: 3, deleted: 1 },
    voters: 2,
    points: 21,
  });
});

test('rejects empty, unbounded, fractional and malformed ballots', () => {
  const invalid = [
    null, EMPTY_BALLOT, { locked: 1 },
    { ...EMPTY_BALLOT, locked: -1 },
    { ...EMPTY_BALLOT, fasted: 0.5 },
    { ...EMPTY_BALLOT, deleted: '1' },
    { ...EMPTY_BALLOT, locked: MAX_COUNT + 1 },
    { ...EMPTY_BALLOT, locked: 1, extra: 0 },
  ];
  for (const ballot of invalid) assert.equal(validBallot(ballot), false);
  assert.equal(validBallot({ locked: MAX_COUNT, fasted: MAX_COUNT, deleted: MAX_COUNT }), true);
});

test('simulation reaches the target from every board below it with valid, gradual arrivals', () => {
  for (let initial = 0; initial < SIMULATION_TARGET; initial += 1) {
    let points = initial;
    let arrivals = 0;
    for (let index = 0; index < SIMULATION_STEPS; index += 1) {
      const ballot = simulationBallot(index, points);
      if (!ballot) continue;
      assert.ok(validBallot(ballot));
      points += score(ballot);
      arrivals += 1;
    }
    assert.equal(points, SIMULATION_TARGET);
    if (initial === 0) assert.equal(arrivals, SIMULATION_STEPS);
  }
  assert.ok(SIMULATION_TARGET > GOAL);
  assert.equal(simulationBallot(0, SIMULATION_TARGET), null);
});
