import { createSync } from './sync.js';

const get = (id) => document.getElementById(id);
const sync = createSync({ role: 'clicker' });
const stationLabel = get('clicker-station');
const connection = get('clicker-connection');
const feedback = get('clicker-feedback');
const commands = document.querySelectorAll('[data-command]');

const messages = {
  local: 'Connected to the presenter in this browser.',
  ready: 'Connected to the presenter.',
  connecting: 'Connecting to Firebase…',
  waiting: 'Waiting for the presenter. Open the current clicker link from the stage.',
  offline: 'Firebase disconnected. Waiting to reconnect…',
  error: 'The presenter connection is unavailable.',
};

function text(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

sync.subscribe(({ station, status, controlStatus }) => {
  const paired = Boolean(sync.room && sync.controlKey);
  const connectionStatus = controlStatus ?? (status === 'local' ? 'waiting' : status);
  const ready = paired && station && ['local', 'ready'].includes(connectionStatus);
  connection.dataset.status = paired ? connectionStatus : 'unpaired';
  text(connection, paired ? (messages[connectionStatus] ?? messages.error) : 'Open the paired clicker link from the presenter stage.');
  text(stationLabel, station ? `Station ${station.index} / ${station.total} · ${station.title}` : 'Waiting for the presenter…');

  for (const button of commands) {
    button.disabled = !ready;
    const atBoundary = station && ((button.dataset.command === 'prev' && station.index === 1)
      || (button.dataset.command === 'next' && station.index === station.total));
    button.setAttribute('aria-disabled', String(!ready || atBoundary));
  }
});

let latestTap = 0;
for (const button of commands) {
  button.addEventListener('click', async () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    navigator.vibrate?.(50);
    const tap = ++latestTap;
    feedback.textContent = '';
    try {
      await sync.sendCommand(button.dataset.command);
    } catch {
      if (tap === latestTap) feedback.textContent = 'Command delivery could not be confirmed.';
    }
  });
}

const timer = get('speech-timer');
const elapsedLabel = get('timer-elapsed');
const targetLabel = get('timer-target');
const targets = { before: 'Target 7–9 minutes', 'in-range': 'Within 7–9 minutes', past: 'Over 9 minutes' };
const start = timer.querySelector('[data-timer="start"]');
const pause = timer.querySelector('[data-timer="pause"]');
const reset = timer.querySelector('[data-timer="reset"]');
let startedAt;
let elapsed = 0;

function renderTimer() {
  const running = startedAt !== undefined;
  const seconds = Math.floor((elapsed + (running ? performance.now() - startedAt : 0)) / 1000);
  const minutesText = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsText = String(seconds % 60).padStart(2, '0');
  text(elapsedLabel, `${minutesText}:${secondsText}`);
  timer.dataset.running = String(running);
  const target = seconds < 420 ? 'before' : seconds <= 540 ? 'in-range' : 'past';
  timer.dataset.target = target;
  text(targetLabel, targets[target]);
  start.disabled = running;
  pause.disabled = !running;
  reset.disabled = !running && elapsed === 0;
}

start.addEventListener('click', () => {
  startedAt = performance.now();
  renderTimer();
  pause.focus();
});
pause.addEventListener('click', () => {
  elapsed += performance.now() - startedAt;
  startedAt = undefined;
  renderTimer();
  start.focus();
});
reset.addEventListener('click', () => {
  elapsed = 0;
  startedAt = undefined;
  renderTimer();
  start.focus();
});
renderTimer();
setInterval(renderTimer, 200);
