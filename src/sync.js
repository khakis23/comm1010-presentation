import { INITIAL_ROUND, simulationBallot, tally, validBallot } from './ballots.js';
import { createJournal, randomId, rememberRoom, withBrowserLock } from './journal.js';
import { COMMAND_LIFETIME, readStation, validCommand } from './presenter-control.js';

const firebaseConfig = import.meta.env?.VITE_FIREBASE_CONFIG?.trim();
const useEmulators = import.meta.env?.DEV && import.meta.env?.VITE_FIREBASE_EMULATORS === '1';

function withDeadline(operation) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Delivery could not be confirmed')), 8000);
  });
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer));
}

export function createSync({ role = 'voter' } = {}) {
  const presenter = role === 'presenter';
  const clicker = role === 'clicker';
  const url = new URL(location.href);
  const requestedRoom = url.searchParams.get('room');
  const validRoom = requestedRoom && /^[a-zA-Z0-9_-]{1,80}$/.test(requestedRoom) ? requestedRoom : null;
  const remote = Boolean(firebaseConfig);
  const room = validRoom ?? (clicker ? null : remote ? (presenter ? rememberRoom() : null) : 'classroom');
  const requestedKey = new URLSearchParams(url.hash.slice(1)).get('control');
  const controlKey = presenter ? randomId() : clicker && /^[a-f0-9]{32}$/.test(requestedKey) ? requestedKey : null;
  const namespace = `${remote ? 'remote' : 'local'}:${room}`;
  const subscribers = new Set();
  const commandListeners = new Set();
  const journal = createJournal(namespace, publish);
  let source = { status: remote ? (room ? 'connecting' : 'missing-room') : 'local' };
  let transport;
  let resetInFlight;
  let resetFailed = false;
  let station;
  let localStation;
  let localSeenAt;
  const control = room && controlKey
    ? createJournal(`control:${namespace}:${controlKey}`, () => {}, receiveLocal)
    : null;

  function dispatch(command) {
    if (!validCommand(command)) return;
    for (const listener of commandListeners) listener(command);
  }

  function receiveLocal(message) {
    if (presenter && message.type === 'probe' && station) {
      control.send({ type: 'station', station });
    } else if (presenter && message.type === 'command' && message.expiresAt > Date.now()) {
      dispatch(message.command);
    } else if (clicker && message.type === 'station') {
      const next = readStation(message.station);
      if (!next) return;
      localStation = next;
      localSeenAt = performance.now();
      publish();
    }
  }

  function localPresenterAvailable() {
    return localStation && performance.now() - localSeenAt < 9000;
  }

  if (clicker && control) {
    const probe = () => {
      control.send({ type: 'probe' });
      if (localStation && !localPresenterAvailable()) {
        localStation = undefined;
        publish();
      }
    };
    probe();
    setInterval(probe, 3000);
  }

  function currentRound(refresh = false) {
    if (remote && !presenter) return source.round ?? INITIAL_ROUND;
    const read = refresh ? journal.refresh : journal.read;
    return read('pending-reset') ?? read('round') ?? INITIAL_ROUND;
  }

  function snapshot() {
    const round = currentRound();
    const simulations = journal.values(`simulation:${round}:`);
    const ballots = remote
      ? (journal.read(`remote-board:${round}`) ?? [])
      : journal.values(`ballot:${round}:`);
    const receipt = remote
      ? (source.round === round ? source.receipt : null)
      : journal.read(`ballot:${round}:${journal.read('voter')}`);
    return {
      ...tally([...ballots, ...simulations]),
      simulated: simulations.length,
      round,
      receipt,
      status: source.status,
      pendingReset: Boolean(journal.read('pending-reset')),
      resetFailed,
      station: (localPresenterAvailable() ? localStation : source.station) ?? null,
      controlStatus: localPresenterAvailable() ? 'local' : source.controlStatus,
    };
  }

  function publish() {
    if (subscribers.size) {
      const state = snapshot();
      for (const listener of subscribers) listener(state);
    }
  }

  function flushReset() {
    if (resetInFlight || !transport || source.status !== 'ready' || !journal.refresh('pending-reset')) return;
    let attemptedRound;
    resetInFlight = withBrowserLock(`comm1010:reset:${namespace}`, async () => {
      if (source.status !== 'ready') return;
      attemptedRound = journal.refresh('pending-reset');
      if (!attemptedRound) return;
      resetFailed = false;
      await transport.reset(attemptedRound);
      if (journal.refresh('pending-reset') === attemptedRound) journal.write('pending-reset', null);
    }).catch(() => {
      resetFailed = true;
    }).finally(() => {
      resetInFlight = undefined;
      if (attemptedRound && journal.refresh('pending-reset') !== attemptedRound) flushReset();
      publish();
    });
  }

  function receive(update) {
    const wasReady = source.status === 'ready';
    source = update;
    if (update.round && presenter) {
      if (update.ballots !== null) journal.write(`remote-board:${update.round}`, update.ballots);
      journal.write('round', update.round);
    }
    if (!wasReady && update.status === 'ready') flushReset();
    publish();
  }

  async function connect() {
    try {
      const config = JSON.parse(firebaseConfig);
      if (!config?.apiKey || !config.databaseURL || !config.projectId) {
        throw new Error('Firebase API key, database URL, and project ID are required');
      }
      const { createFirebaseTransport } = await import('./firebase-transport.js');
      transport = createFirebaseTransport(config, {
        room, role, controlKey, onChange: receive, onCommand: dispatch, useEmulators,
      });
      if (station) transport.setStation(station);
    } catch {
      receive({ status: 'error' });
    }
  }

  if (remote && room && (!clicker || controlKey)) void connect();

  return {
    room,
    controlKey,
    snapshot,
    subscribe(listener) {
      subscribers.add(listener);
      listener(snapshot());
      return () => subscribers.delete(listener);
    },
    setStation(next) {
      if (!presenter) return;
      const current = readStation(next);
      if (!current) return;
      station = current;
      control.send({ type: 'station', station });
      transport?.setStation(station);
    },
    onCommand(listener) {
      if (presenter) commandListeners.add(listener);
      return () => commandListeners.delete(listener);
    },
    async sendCommand(command) {
      if (!clicker || !control || !validCommand(command)) throw new Error('Invalid presenter command');
      if (localPresenterAvailable()) {
        control.send({ type: 'command', command, expiresAt: Date.now() + COMMAND_LIFETIME });
        return;
      }
      if (!transport || source.status !== 'ready' || source.controlStatus !== 'ready') {
        throw new Error('Presenter unavailable');
      }
      return withDeadline(transport.sendCommand(command));
    },
    async submit(expectedRound, ballot) {
      if (role !== 'voter' || !validBallot(ballot)) throw new Error('Invalid ballot');
      if (remote) {
        if (!transport || source.status !== 'ready') throw new Error('Board unavailable');
        return withDeadline(transport.submit(expectedRound, ballot));
      }
      return withBrowserLock(`comm1010:vote:${namespace}`, () => {
        if (currentRound(true) !== expectedRound) throw new Error('Round changed');
        let voter = journal.refresh('voter');
        if (!voter) {
          voter = randomId();
          journal.write('voter', voter);
        }
        const key = `ballot:${expectedRound}:${voter}`;
        const saved = journal.refresh(key);
        if (saved) return saved;
        journal.write(key, ballot);
        return ballot;
      });
    },
    addSimulation(expectedRound, index) {
      if (!presenter || currentRound(true) !== expectedRound) return;
      const key = `simulation:${expectedRound}:${index}`;
      if (journal.refresh(key)) return;
      const ballot = simulationBallot(index, snapshot().points);
      if (ballot) journal.write(key, ballot);
    },
    reset() {
      if (!presenter) return;
      const next = randomId();
      if (!remote) {
        journal.write('round', next);
        return;
      }
      resetFailed = false;
      journal.write('pending-reset', next);
      flushReset();
    },
  };
}
