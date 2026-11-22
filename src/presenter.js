import { ACTIONS, ACTION_NAMES, GOAL, SIMULATION_STEPS, SIMULATION_TARGET } from './ballots.js';
import { drawVoteQr } from './qr.js';
import { createSync } from './sync.js';

const get = (id) => document.getElementById(id);
const deck = get('presentation');
const slides = Array.from(deck.querySelectorAll('.slide'));
const previous = get('slide-previous');
const next = get('slide-next');
const fullscreen = get('slide-fullscreen');
const simulate = get('board-simulate');
const reset = get('board-reset');
const shortcuts = get('single-key-shortcuts');
const progress = get('slide-progress');
const status = get('presenter-status');
const board = createSync({ presenter: true });
let active = 0;
let simulation;
let swipe;
progress.max = slides.length;

function showSlide(index, focus = true) {
  active = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, position) => { slide.hidden = position !== active; });
  get('slide-position').textContent = `Slide ${active + 1} of ${slides.length}`;
  progress.value = active + 1;
  previous.disabled = active === 0;
  next.disabled = active === slides.length - 1;
  if (focus) slides[active].querySelector('h1').focus();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    status.textContent = 'Fullscreen is unavailable in this browser.';
  }
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
    status.textContent = 'The board already has at least 31 points.';
    return;
  }

  const run = { round, index: 0, timer: undefined };
  simulation = run;
  if (document.activeElement === simulate) slides[active].querySelector('h1').focus();
  simulate.disabled = true;
  status.textContent = 'Simulating audience votes.';

  function tick() {
    if (simulation !== run) return;
    const current = board.snapshot();
    if (current.round !== run.round) {
      stopSimulation();
      status.textContent = 'Simulation stopped for the new round.';
      return;
    }
    if (run.index === SIMULATION_STEPS || current.points >= SIMULATION_TARGET) {
      stopSimulation();
      status.textContent = 'Simulation complete.';
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
  status.textContent = 'Voting board cleared.';
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

board.subscribe((state) => {
  if (simulation && simulation.round !== state.round) {
    stopSimulation();
    status.textContent = 'Simulation stopped for the new round.';
  }

  const goalAchieved = state.points >= GOAL;
  text('board-goal', `${GOAL} points`);
  text('board-points', state.points);
  text('board-voters', state.voters);
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
  text('board-connection', connection);
});

const voteUrl = new URL('./vote.html', location.href);
if (board.room) voteUrl.searchParams.set('room', board.room);
get('vote-link').href = voteUrl.href;
try {
  drawVoteQr(get('vote-qr'), voteUrl);
} catch {
  get('qr-status').textContent = 'QR code unavailable. Use the voting link.';
}

previous.addEventListener('click', () => showSlide(active - 1));
next.addEventListener('click', () => showSlide(active + 1));
fullscreen.addEventListener('click', toggleFullscreen);
simulate.addEventListener('click', startSimulation);
reset.addEventListener('click', resetBoard);
document.addEventListener('fullscreenchange', () => {
  fullscreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
});

const interactive = 'a, button, input, select, textarea, summary, [contenteditable]';
document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
      event.isComposing || event.target.closest('input, select, textarea, [contenteditable]')) return;

  switch (event.code) {
    case 'ArrowLeft':
      event.preventDefault();
      if (active > 0) showSlide(active - 1);
      break;
    case 'Space':
      if (event.target.closest(interactive)) break;
      // Space and Right Arrow both advance.
    case 'ArrowRight':
      event.preventDefault();
      if (active < slides.length - 1) showSlide(active + 1);
      break;
    case 'KeyF':
      if (shortcuts.checked && !event.repeat) void toggleFullscreen();
      break;
    case 'KeyS':
      if (shortcuts.checked && !event.repeat) startSimulation();
      break;
    case 'KeyR':
      if (shortcuts.checked && !event.repeat) resetBoard();
      break;
  }
});

deck.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch' || !event.isPrimary || event.target.closest(interactive)) return;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
  deck.setPointerCapture(event.pointerId);
});
deck.addEventListener('pointerup', (event) => {
  if (swipe?.id !== event.pointerId) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  swipe = undefined;
  if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    const index = active + (dx < 0 ? 1 : -1);
    if (index >= 0 && index < slides.length) showSlide(index);
  }
});
deck.addEventListener('lostpointercapture', () => { swipe = undefined; });

fullscreen.disabled = false;
simulate.disabled = false;
reset.disabled = false;
showSlide(0, false);
