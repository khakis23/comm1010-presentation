export const ACTIONS = { locked: 1, fasted: 3, deleted: 7 };
export const ACTION_NAMES = Object.keys(ACTIONS);
export const MAX_COUNT = 10;
export const INITIAL_ROUND = 'initial';
export const GOAL = 20;
export const SIMULATION_TARGET = 31;
export const EMPTY_BALLOT = Object.freeze({ locked: 0, fasted: 0, deleted: 0 });

export function score(ballot) {
  return ACTION_NAMES.reduce((points, action) => points + ballot[action] * ACTIONS[action], 0);
}

export function validBallot(ballot) {
  return Boolean(ballot) &&
    Object.keys(ballot).length === ACTION_NAMES.length &&
    ACTION_NAMES.every((action) =>
      Number.isInteger(ballot[action]) && ballot[action] >= 0 && ballot[action] <= MAX_COUNT,
    ) &&
    score(ballot) > 0;
}

export function tally(ballots) {
  const counts = { ...EMPTY_BALLOT };
  let voters = 0;
  for (const ballot of ballots) {
    if (!validBallot(ballot)) continue;
    voters += 1;
    for (const action of ACTION_NAMES) counts[action] += ballot[action];
  }
  return { counts, voters, points: score(counts) };
}

const simulation = [
  { locked: 1 }, { fasted: 1 }, { locked: 1 }, { deleted: 1 },
  { locked: 2 }, { fasted: 1 }, { locked: 1, fasted: 1 },
  { deleted: 1 }, { fasted: 1 },
];

export const SIMULATION_STEPS = simulation.length;

export function simulationBallot(index, points) {
  const remaining = SIMULATION_TARGET - points;
  if (remaining <= 0 || !simulation[index]) return null;
  const ballot = { ...EMPTY_BALLOT, ...simulation[index] };
  return score(ballot) <= remaining ? ballot : { ...EMPTY_BALLOT, locked: remaining };
}
