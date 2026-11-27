export function createPresenterMode({ lobby, stage, start, focusStation, onFullscreenUnavailable }) {
  const document = stage.ownerDocument;
  const isPresenting = () => document.body.dataset.mode === 'presenting';
  let enteringFullscreen = false;
  let exitingFullscreen = false;

  function show(presenting) {
    document.body.dataset.mode = presenting ? 'presenting' : 'lobby';
    const [inactive, active] = presenting ? [lobby, stage] : [stage, lobby];
    inactive.inert = true;
    inactive.hidden = true;
    active.hidden = false;
    active.inert = false;
  }

  async function exitFullscreen() {
    if (exitingFullscreen || !document.fullscreenElement) return;
    // Keep this set until fullscreenchange, even if exitFullscreen resolves first.
    exitingFullscreen = true;
    try {
      await document.exitFullscreen();
    } catch {
      exitingFullscreen = false;
      onFullscreenUnavailable();
    }
  }

  async function requestFullscreen() {
    if (enteringFullscreen || exitingFullscreen) return;
    enteringFullscreen = true;
    try {
      await document.documentElement.requestFullscreen();
      if (!isPresenting()) await exitFullscreen();
    } catch {
      onFullscreenUnavailable();
    } finally {
      enteringFullscreen = false;
    }
  }

  function enter({ fullscreen = false } = {}) {
    if (isPresenting()) return;
    show(true);
    focusStation();
    if (fullscreen) void requestFullscreen();
  }

  function leave() {
    show(false);
    start.focus({ preventScroll: true });
    void exitFullscreen();
  }

  function toggleFullscreen() {
    if (!isPresenting()) return;
    return document.fullscreenElement ? exitFullscreen() : requestFullscreen();
  }

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) return;
    if (exitingFullscreen) {
      exitingFullscreen = false;
    } else if (isPresenting()) {
      leave();
    }
  });

  return { isPresenting, enter, leave, toggleFullscreen };
}
