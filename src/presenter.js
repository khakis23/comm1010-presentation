import { ACTIONS, ACTION_NAMES, GOAL, SIMULATION_STEPS, SIMULATION_TARGET } from './ballots.js';
import jackCouchSvg from './assets/jack-couch.svg?raw';
import { createPresenterMode } from './presenter-mode.js';
import { drawQr } from './qr.js';
import { createSpatialCamera } from './spatial-camera.js';
import { createSync } from './sync.js';

const get = (id) => document.getElementById(id);
const jackScene = get('jack-couch-scene');
if (jackScene) jackScene.innerHTML = jackCouchSvg;
const viewport = get('stage-viewport');
const start = get('start-presentation');
const previous = get('stage-prev');
const next = get('stage-next');
const pauseAnimation = get('pause-opening-animation');
const simulate = get('board-simulate');
const reset = get('board-reset');
const shortcuts = get('single-key-shortcuts');
const board = createSync({ role: 'presenter' });
const camera = createSpatialCamera(viewport, (station) => {
  text('station-position', `Station ${station.index} / ${station.total}`);
  previous.disabled = station.index === 1;
  next.disabled = station.index === station.total;
  board.setStation(station);
});
const presentation = createPresenterMode({
  lobby: get('presenter-lobby'),
  stage: viewport,
  start,
  focusStation: camera.focus,
  onFullscreenUnavailable: () => announceStatus('Browser fullscreen is unavailable.'),
});
let simulation;

function announceStatus(message) {
  text('presenter-status', message);
  text('stage-status', message);
}

function stopSimulation() {
  if (!simulation) return;
  clearTimeout(simulation.timer);
  simulation = undefined;
  simulate.disabled = false;
}

const simulationDelays = [550, 850, 420, 1050, 560, 710, 430, 900];

function startSimulation() {
  if (simulation) return;
  const { round, points } = board.snapshot();
  if (points >= SIMULATION_TARGET) {
    announceStatus(`The board already has at least ${SIMULATION_TARGET} points.`);
    return;
  }

  const run = { round, index: 0, timer: undefined };
  simulation = run;
  if (document.activeElement === simulate) get('emergency-controls').querySelector('summary').focus();
  simulate.disabled = true;
  announceStatus('Simulating audience votes.');

  function tick() {
    if (simulation !== run) return;
    const current = board.snapshot();
    if (current.round !== run.round) {
      stopSimulation();
      announceStatus('Simulation stopped for the new round.');
      return;
    }
    if (run.index === SIMULATION_STEPS || current.points >= SIMULATION_TARGET) {
      stopSimulation();
      announceStatus('Simulation complete.');
      return;
    }
    board.addSimulation(run.round, run.index);
    if (simulation === run) {
      run.timer = window.setTimeout(tick, simulationDelays[run.index] ?? 500);
      run.index += 1;
    }
  }

  tick();
}

function resetBoard() {
  stopSimulation();
  board.reset();
  announceStatus('Voting board cleared.');
}

function text(id, value) {
  const element = get(id);
  const content = String(value);
  if (element.textContent !== content) element.textContent = content;
}

const connectionMessages = {
  local: 'Local voting is available in this browser.',
  connecting: 'Connecting to live voting…',
  ready: 'Live voting connected.',
  waiting: 'Waiting for the live room…',
  offline: 'Live voting disconnected. Simulation is available.',
  error: 'Live voting is unavailable. Simulation is available.',
};

get('board-progress').max = GOAL;
board.subscribe((state) => {
  if (simulation && simulation.round !== state.round) {
    stopSimulation();
    announceStatus('Simulation stopped for the new round.');
  }

  const goalAchieved = state.points >= GOAL;
  text('board-goal', `${GOAL} points`);
  text('board-points', state.points);
  text('board-voters', state.voters);
  get('board-progress').value = Math.min(state.points, GOAL);
  get('action-hub').dataset.goal = goalAchieved ? 'achieved' : 'pending';
  get('goal-achieved').hidden = !goalAchieved;
  get('board-simulated').hidden = state.simulated === 0;
  text('board-simulated', `Simulated votes included: ${state.simulated}`);
  text('board-announcement',
    `${state.points} points from ${state.voters} votes.${goalAchieved ? ' Goal achieved.' : ''}`,
  );
  for (const action of ACTION_NAMES) {
    const count = state.counts[action];
    text(`board-${action}`, `${count} ${count === 1 ? 'action' : 'actions'} · ${count * ACTIONS[action]} points`);
  }
  let connection = connectionMessages[state.status];
  if (state.pendingReset) {
    connection = state.resetFailed || state.status === 'error'
      ? 'The live reset could not be confirmed. Reset again to retry.'
      : 'Board cleared here. Waiting to reset the live room.';
  }
  get('board-connection').dataset.status = state.status;
  text('board-connection', connection);

  const controlMessages = {
    ready: 'Remote clicker available.',
    error: 'Firebase clicker unavailable.',
    offline: 'Firebase clicker disconnected.',
    rules: 'Remote clicker paused. Publish the Firebase database rules and reload the presenter.',
  };
  get('control-connection').dataset.status = state.controlStatus ?? state.status;
  text('control-connection', controlMessages[state.controlStatus] ?? '');
});

const voteUrl = new URL('./vote.html', location.href);
if (board.room) voteUrl.searchParams.set('room', board.room);
get('vote-link').href = voteUrl.href;
try {
  drawQr(get('vote-qr'), voteUrl);
} catch {
  get('qr-status').textContent = 'QR code unavailable. Use the voting link.';
}

const clickerUrl = new URL('./clicker.html', location.href);
clickerUrl.searchParams.set('room', board.room);
clickerUrl.hash = new URLSearchParams({ control: board.controlKey }).toString();
get('clicker-link').href = clickerUrl.href;
try {
  drawQr(get('clicker-qr'), clickerUrl, 3);
} catch {
  text('clicker-qr-label', 'Use the pairing link in Presenter tools.');
}
get('copy-clicker-link').disabled = false;
get('copy-clicker-link').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(clickerUrl.href);
    announceStatus('Clicker link copied.');
  } catch {
    announceStatus('Use the presenter clicker link to open or copy the address.');
  }
});

board.onCommand((command) => {
  switch (command) {
    case 'prev': camera.prev(); break;
    case 'next':
      if (!presentation.isPresenting()) presentation.enter();
      else camera.next();
      break;
    case 'simulate': startSimulation(); break;
    case 'reset': resetBoard(); break;
  }
});

previous.addEventListener('click', camera.prev);
next.addEventListener('click', camera.next);
start.addEventListener('click', () => presentation.enter({ fullscreen: true }));
get('exit-presentation').addEventListener('click', presentation.leave);
if (jackScene) {
  pauseAnimation.disabled = false;
  pauseAnimation.addEventListener('click', () => {
    const paused = jackScene.toggleAttribute('data-paused');
    pauseAnimation.setAttribute('aria-pressed', String(paused));
  });
}
simulate.addEventListener('click', startSimulation);
reset.addEventListener('click', resetBoard);
shortcuts.addEventListener('change', () => {
  for (const [control, key] of [[simulate, 'S'], [reset, 'R']]) {
    if (shortcuts.checked) control.setAttribute('aria-keyshortcuts', key);
    else control.removeAttribute('aria-keyshortcuts');
  }
});
const interactive = 'a, button, input, select, textarea, summary, [contenteditable]';
document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  const presenting = presentation.isPresenting();
  if (event.key === 'Escape' && presenting) {
    event.preventDefault();
    presentation.leave();
    return;
  }
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('input, select, textarea, [contenteditable]')) return;
  if (event.key === ' ' && target?.closest(interactive)) return;

  switch (event.key.toLowerCase()) {
    case 'arrowleft':
      if (!presenting) break;
      event.preventDefault();
      camera.prev();
      break;
    case ' ':
    case 'arrowright':
      if (!presenting) break;
      event.preventDefault();
      camera.next();
      break;
    case 'f':
      if (presenting && shortcuts.checked && !event.repeat) void presentation.toggleFullscreen();
      break;
    case 's':
      if (shortcuts.checked && !event.repeat) startSimulation();
      break;
    case 'r':
      if (shortcuts.checked && !event.repeat) resetBoard();
      break;
  }
});

const memory = get('memory-experiment');
const memoryButton = get('memory-decay');
const memoryCards = Array.from(memory.querySelectorAll('[data-memory-card]'));
memoryButton.addEventListener('click', () => {
  const decayed = memory.dataset.state === 'baseline';
  memory.dataset.state = decayed ? 'decayed' : 'baseline';
  memoryButton.setAttribute('aria-pressed', String(decayed));
  for (const card of memoryCards) card.hidden = decayed && card.hasAttribute('data-decays');
  const recalled = memoryCards.filter((card) => !card.hidden).length;
  text('memory-result', `${recalled} of ${memoryCards.length} example items recalled.`);
});

const lifespan = get('lifespan-hours');
function renderLifespan() {
  const hours = lifespan.valueAsNumber;
  const years = hours * 80 / 16;
  const format = (number) => number.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const hoursLabel = `${format(hours)} hours per day`;
  lifespan.setAttribute('aria-valuetext', hoursLabel);
  get('lifespan-result').value = `${hoursLabel} · ${format(years)} conscious years`;
}
lifespan.addEventListener('input', renderLifespan);
renderLifespan();

const friction = get('friction-protocol');
const frictionButton = get('friction-toggle');
frictionButton.addEventListener('click', () => {
  const shielded = friction.dataset.state === 'default';
  friction.dataset.state = shielded ? 'shielded' : 'default';
  frictionButton.setAttribute('aria-pressed', String(shielded));
  text('friction-state', shielded ? 'Biometric Shield active' : 'Default OS');
});

for (const control of [start, simulate, reset, memoryButton, lifespan, frictionButton]) {
  control.disabled = false;
}
if (camera.hasStationLink) presentation.enter();
