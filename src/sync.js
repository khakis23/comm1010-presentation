import { INITIAL_ROUND, simulationBallot, tally, validBallot } from './ballots.js';
import { createJournal, randomId, rememberRoom, withBrowserLock } from './journal.js';

const firebaseConfig = import.meta.env?.VITE_FIREBASE_CONFIG?.trim();
const useEmulators = import.meta.env?.DEV && import.meta.env?.VITE_FIREBASE_EMULATORS === '1';

function withDeadline(operation) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Delivery could not be confirmed')), 8000);
  });
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer));
}

export function createSync({ presenter = false } = {}) {
  const requestedRoom = new URL(location.href).searchParams.get('room');
  const validRoom = requestedRoom && /^[a-zA-Z0-9_-]{1,80}$/.test(requestedRoom) ? requestedRoom : null;
  const remote = Boolean(firebaseConfig);
  const room = validRoom ?? (remote ? (presenter ? rememberRoom() : null) : 'classroom');
  const namespace = `${remote ? 'remote' : 'local'}:${room}`;
  const subscribers = new Set();
  const journal = createJournal(namespace, publish);
  let source = { status: remote ? (room ? 'connecting' : 'missing-room') : 'local' };
  let transport;
  let resetInFlight;
  let resetFailed = false;

  function currentRound(refresh = false) {
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
    };
  }

  function publish() {
    if (subscribers.size) {
      const state = snapshot();
      for (const listener of subscribers) listener(state);
    }
  }

  function flushReset() {
    const next = journal.refresh('pending-reset');
    if (!next || resetInFlight || !transport || source.status !== 'ready') return;
    resetFailed = false;
    resetInFlight = transport.reset(next).then(() => {
      if (journal.refresh('pending-reset') === next) journal.write('pending-reset', null);
    }).catch(() => {
      resetFailed = true;
    }).finally(() => {
      resetInFlight = undefined;
      if (journal.refresh('pending-reset') !== next) flushReset();
      publish();
    });
  }

  function receive(update) {
    const wasReady = source.status === 'ready';
    source = update;
    if (update.round) {
      if (presenter && update.ballots !== null) journal.write(`remote-board:${update.round}`, update.ballots);
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
      transport = createFirebaseTransport(config, { room, presenter, onChange: receive, useEmulators });
    } catch {
      receive({ status: 'error' });
    }
  }

  if (remote && room) void connect();

  return {
    room,
    snapshot,
    subscribe(listener) {
      subscribers.add(listener);
      listener(snapshot());
      return () => subscribers.delete(listener);
    },
    async submit(expectedRound, ballot) {
      if (presenter || !validBallot(ballot)) throw new Error('Invalid ballot');
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
