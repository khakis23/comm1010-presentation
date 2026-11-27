import assert from 'node:assert/strict';
import test from 'node:test';
import { createPresenterMode } from '../src/presenter-mode.js';

function setup() {
  const document = new EventTarget();
  document.body = { dataset: { mode: 'lobby' } };
  document.fullscreenElement = null;
  document.documentElement = {
    async requestFullscreen() {
      document.fullscreenElement = this;
      document.dispatchEvent(new Event('fullscreenchange'));
    },
  };
  document.exitFullscreen = async () => {
    document.fullscreenElement = null;
  };

  const lobby = { inert: false, hidden: false };
  const stage = { ownerDocument: document, inert: true, hidden: true };
  const start = { focus: () => { document.activeElement = start; } };
  const heading = {};
  const errors = [];
  const mode = createPresenterMode({
    lobby,
    stage,
    start,
    focusStation: () => { document.activeElement = heading; },
    onFullscreenUnavailable: () => errors.push('unavailable'),
  });
  return { document, mode, lobby, stage, start, heading, errors };
}

test('starting shows the stage, isolates the lobby, and requests fullscreen', () => {
  const { document, mode, lobby, stage, heading } = setup();

  mode.enter({ fullscreen: true });

  assert.equal(document.body.dataset.mode, 'presenting');
  assert.equal(lobby.inert, true);
  assert.equal(lobby.hidden, true);
  assert.equal(stage.inert, false);
  assert.equal(stage.hidden, false);
  assert.equal(document.activeElement, heading);
  assert.equal(document.fullscreenElement, document.documentElement);
});

test('a rejected fullscreen request leaves the stage open', async () => {
  const { document, mode, errors } = setup();
  document.documentElement.requestFullscreen = async () => { throw new Error('Blocked'); };

  mode.enter({ fullscreen: true });
  await Promise.resolve();

  assert.equal(mode.isPresenting(), true);
  assert.equal(document.fullscreenElement, null);
  assert.deepEqual(errors, ['unavailable']);
});

test('the F toggle stays onstage after fullscreenchange, while a native dismissal returns to Start', async () => {
  const { document, mode, lobby, stage, start, heading } = setup();
  mode.enter();
  assert.equal(document.fullscreenElement, null);

  await mode.toggleFullscreen();
  assert.equal(document.fullscreenElement, document.documentElement);
  await mode.toggleFullscreen();
  document.dispatchEvent(new Event('fullscreenchange'));
  assert.equal(mode.isPresenting(), true);
  assert.equal(document.activeElement, heading);

  await mode.toggleFullscreen();
  document.fullscreenElement = null;
  document.dispatchEvent(new Event('fullscreenchange'));

  assert.equal(document.body.dataset.mode, 'lobby');
  assert.equal(stage.inert, true);
  assert.equal(stage.hidden, true);
  assert.equal(lobby.inert, false);
  assert.equal(lobby.hidden, false);
  assert.equal(document.activeElement, start);
});

test('leaving during a pending native fullscreen request also closes fullscreen', async () => {
  const { document, mode, start } = setup();
  let completeRequest;
  document.documentElement.requestFullscreen = () => new Promise((resolve) => {
    completeRequest = () => {
      document.fullscreenElement = document.documentElement;
      resolve();
    };
  });

  mode.enter({ fullscreen: true });
  mode.leave();
  completeRequest();
  await Promise.resolve();

  assert.equal(mode.isPresenting(), false);
  assert.equal(document.fullscreenElement, null);
  assert.equal(document.activeElement, start);
});
