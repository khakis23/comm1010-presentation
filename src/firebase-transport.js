import { initializeApp } from '@firebase/app';
import {
  browserLocalPersistence, connectAuthEmulator, initializeAuth, signInAnonymously,
} from '@firebase/auth';
import {
  connectDatabaseEmulator, getDatabase, onValue, ref, runTransaction,
} from '@firebase/database';
import { INITIAL_ROUND, validBallot } from './ballots.js';
import { withBrowserLock } from './journal.js';

const TX_OPTIONS = { applyLocally: false };

export function createFirebaseTransport(config, { room, presenter, onChange, useEmulators }) {
  const app = initializeApp(config);
  const db = getDatabase(app);
  if (useEmulators) connectDatabaseEmulator(db, '127.0.0.1', 19000);
  const base = `rooms/${room}`;
  const metaRef = ref(db, `${base}/meta`);
  let user;
  let connected = false;
  let everConnected = false;
  let metadata;
  let round = null;
  let observed = false;
  let ballots = null;
  let receipt = null;
  let error = false;
  let unwatchRound;
  let creating;
  let signingIn;

  function publish() {
    let status = 'connecting';
    if (error) status = 'error';
    else if (navigator.onLine === false || (!connected && everConnected)) status = 'offline';
    else if (connected && metadata === null && !presenter) status = 'waiting';
    else if (connected && observed) status = 'ready';

    onChange({ round, ballots, receipt, status });
  }

  function fail() {
    error = true;
    publish();
  }

  function createRoom() {
    if (!presenter || !connected || metadata !== null || creating) return;
    creating = runTransaction(metaRef, (current) => current === null ? {
      owner: user.uid,
      round: INITIAL_ROUND,
    } : undefined, TX_OPTIONS).catch(fail).finally(() => { creating = undefined; });
  }

  function observeRoom() {
    onValue(ref(db, '.info/connected'), (snapshot) => {
      connected = snapshot.val() === true;
      if (connected) everConnected = true;
      createRoom();
      publish();
    });

    onValue(metaRef, (snapshot) => {
      metadata = snapshot.val();
      const nextRound = metadata?.round ?? null;
      if (presenter && metadata && metadata.owner !== user.uid) {
        fail();
        return;
      }
      if (round !== nextRound) {
        unwatchRound?.();
        round = nextRound;
        observed = false;
        ballots = null;
        receipt = null;
        if (round) {
          const path = `${base}/votes/${round}${presenter ? '' : `/${user.uid}`}`;
          unwatchRound = onValue(ref(db, path), (result) => {
            if (presenter) ballots = Object.values(result.val() ?? {}).filter(validBallot);
            else receipt = validBallot(result.val()) ? result.val() : null;
            observed = true;
            publish();
          }, fail);
        }
      }
      createRoom();
      publish();
    }, fail);
  }

  let auth;
  function connect() {
    if (user || signingIn) return;
    signingIn = true;
    withBrowserLock(`comm1010:firebase-auth:${config.apiKey}`, async () => {
      if (!auth) {
        auth = initializeAuth(app, { persistence: browserLocalPersistence });
        if (useEmulators) {
          connectAuthEmulator(auth, 'http://127.0.0.1:19099', { disableWarnings: true });
        }
      }
      await auth.authStateReady();
      user = auth.currentUser ?? (await signInAnonymously(auth)).user;
    }).then(() => {
      error = false;
      observeRoom();
    }).catch((cause) => {
      if (cause.code === 'auth/network-request-failed') {
        if (navigator.onLine !== false) window.setTimeout(connect, 3000);
        everConnected = true;
        publish();
      } else {
        fail();
      }
    }).finally(() => { signingIn = false; });
  }

  window.addEventListener('online', () => {
    publish();
    connect();
  });
  window.addEventListener('offline', publish);
  connect();

  return {
    async submit(expectedRound, ballot) {
      if (!connected || !observed || round !== expectedRound) throw new Error('Round unavailable');
      const voteRef = ref(db, `${base}/votes/${round}/${user.uid}`);
      const result = await runTransaction(voteRef, (existing) =>
        existing === null ? ballot : undefined, TX_OPTIONS);
      const saved = result.snapshot.val();
      if (!validBallot(saved)) throw new Error('Ballot was not saved');
      return saved;
    },
    async reset(nextRound) {
      if (!connected || !metadata || !presenter) throw new Error('Board unavailable');
      const roundRef = ref(db, `${base}/meta/round`);
      await runTransaction(roundRef, () => nextRound, TX_OPTIONS);
    },
  };
}
