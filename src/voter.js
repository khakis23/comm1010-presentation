import { EMPTY_BALLOT, MAX_COUNT, score } from './ballots.js';
import { createSync } from './sync.js';

const get = (id) => document.getElementById(id);
const form = get('vote-form');
const votingHeading = get('voting-heading');
const submit = get('vote-submit');
const feedback = get('vote-feedback');
const connection = get('vote-connection');
const confirmation = get('vote-confirmation');
const confirmationHeading = get('confirmation-heading');
const confirmationScore = get('confirmation-score');
const output = get('voter-score');
const steppers = Array.from(form.querySelectorAll('[data-action]'), (element) => ({
  action: element.dataset.action,
  count: element.querySelector('[data-count]'),
  decrease: element.querySelector('[data-step="-1"]'),
  increase: element.querySelector('[data-step="1"]'),
}));
const board = createSync();
let state = board.snapshot();
let draft = { ...EMPTY_BALLOT };
let confirmationForRound;
let submitting = false;

const connectionMessages = {
  local: 'This vote is shared within this browser.',
  connecting: 'Connecting to the board…',
  ready: '',
  waiting: 'Waiting for the presenter to open the board…',
  offline: 'The live board is offline. Try again when it reconnects.',
  error: 'The live board is unavailable. Ask the presenter to check the connection.',
  'missing-room': 'Open the voting link shared by the presenter.',
};

function render({ submitted = false } = {}) {
  const receipt = state.receipt ??
    (confirmationForRound?.round === state.round ? confirmationForRound.ballot : null);
  const focus = document.activeElement;
  form.hidden = Boolean(receipt);
  confirmation.hidden = !receipt;

  const message = connectionMessages[state.status];
  if (connection.textContent !== message) connection.textContent = message;
  if (receipt) {
    const points = score(receipt);
    const message = `You added ${points} ${points === 1 ? 'point' : 'points'} to the board.`;
    if (confirmationScore.textContent !== message) confirmationScore.textContent = message;
    if (form.contains(focus) || ((submitting || submitted) && focus === document.body)) confirmationHeading.focus();
  } else if (confirmation.contains(focus)) {
    votingHeading.focus();
  }

  const points = score(draft);
  const scoreText = `Your Score: ${points} ${points === 1 ? 'Point' : 'Points'}`;
  if (output.value !== scoreText) output.value = scoreText;
  for (const { action, count, decrease, increase } of steppers) {
    const value = draft[action];
    if (count.textContent !== String(value)) count.textContent = value;
    decrease.setAttribute('aria-disabled', String(submitting || value === 0));
    increase.setAttribute('aria-disabled', String(submitting || value === MAX_COUNT));
  }
  submit.disabled = !submitting && (points === 0 || !['ready', 'local'].includes(state.status));
  if (submitting) submit.setAttribute('aria-disabled', 'true');
  else submit.removeAttribute('aria-disabled');
  if (!receipt && submit.disabled && focus === submit) votingHeading.focus();
}

for (const { action, decrease, increase } of steppers) {
  function change(delta) {
    if (submitting) return;
    const next = Math.min(MAX_COUNT, Math.max(0, draft[action] + delta));
    if (draft[action] === next) return;
    draft[action] = next;
    feedback.textContent = '';
    render();
  }
  decrease.disabled = false;
  increase.disabled = false;
  decrease.addEventListener('click', () => change(-1));
  increase.addEventListener('click', () => change(1));
}

board.subscribe((update) => {
  if (!confirmation.hidden && state.round !== update.round) {
    draft = { ...EMPTY_BALLOT };
    confirmationForRound = undefined;
    feedback.textContent = '';
  }
  state = update;
  render();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (form.hidden || submit.disabled || submitting) return;

  const round = state.round;
  submitting = true;
  feedback.textContent = 'Sending your points…';
  render();
  try {
    const ballot = await board.submit(round, { ...draft });
    if (state.round === round) {
      confirmationForRound = { round, ballot };
      feedback.textContent = '';
    } else {
      feedback.textContent = 'A new round opened. Submit again to join it.';
    }
  } catch {
    feedback.textContent = state.round === round
      ? 'We could not confirm your vote. Try submitting again.'
      : 'A new round opened. Submit again to join it.';
  } finally {
    submitting = false;
    render({ submitted: true });
  }
});
