import { initializeApp } from '@firebase/app';
import {
  browserLocalPersistence, connectAuthEmulator, initializeAuth, signInAnonymously,
} from '@firebase/auth';
import {
  connectDatabaseEmulator, get, getDatabase, onChildAdded, onDisconnect, onValue, push, ref,
  remove, runTransaction, set,
} from '@firebase/database';
import { INITIAL_ROUND, validBallot } from './ballots.js';
import { withBrowserLock } from './journal.js';
import { COMMAND_LIFETIME, readStation, validCommand } from './presenter-control.js';

const TX_OPTIONS = { applyLocally: false };

export function createFirebaseTransport(config, { room, role, controlKey, onChange, onCommand, useEmulators }) {
  const presenter = role === 'presenter';
  const clicker = role === 'clicker';
  const app = initializeApp(config);
  const db = getDatabase(app);
  if (useEmulators) connectDatabaseEmulator(db, '127.0.0.1', 19000);
  const base = `rooms/${room}`;
  const metaRef = ref(db, `${base}/meta`);
  const stageRef = controlKey ? ref(db, `${base}/control/${controlKey}`) : null;
  const commandsRef = controlKey ? ref(db, `${base}/commands/${controlKey}`) : null;
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
  let localStation;
  let station;
  let controlError;
  let controlReady = false;
  let controlConnection;
  let unwatchCommands;
  let serverOffset = 0;
  const consumed = new Map();

  function publish() {
    let status = 'connecting';
    if (error) status = 'error';
    else if (navigator.onLine === false || (!connected && everConnected)) status = 'offline';
    else if (connected && metadata === null && !presenter) status = 'waiting';
    else if (connected && (clicker ? Boolean(metadata) : observed)) status = 'ready';

    const controlStatus = controlError ?? (status !== 'ready' ? status
      : (presenter ? controlReady : Boolean(station)) ? 'ready'
      : 'waiting');
    onChange({ round, ballots, receipt, status, station, controlStatus });
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

  function failControl() {
    controlReady = false;
    unwatchCommands?.();
    controlError = 'error';
    publish();
  }

  async function collectionIsPrivate(collection) {
    try {
      await get(collection);
      return false;
    } catch (error) {
      if (/permission[ _]denied/i.test(error.message)) return true;
      throw error;
    }
  }

  function armControl() {
    if (!presenter || !connected || metadata?.owner !== user.uid || !localStation || controlConnection) return;
    const connection = {};
    controlConnection = connection;
    const onError = () => {
      if (controlConnection === connection) failControl();
    };
    Promise.all([stageRef.parent, commandsRef.parent].map(collectionIsPrivate)).then(async (permissions) => {
      if (controlConnection !== connection) return;
      if (permissions.includes(false)) {
        controlError = 'rules';
        publish();
        return;
      }
      await onDisconnect(ref(db, base)).update({
        [`control/${controlKey}`]: null,
        [`commands/${controlKey}`]: null,
      });
      if (controlConnection !== connection) return;
      const initialStation = localStation;
      await set(stageRef, initialStation);
      if (controlConnection !== connection) return;
      controlError = undefined;
      controlReady = true;
      if (initialStation !== localStation) writeStation();
      watchCommands(connection, onError);
      publish();
    }).catch(onError);
  }

  function writeStation() {
    const connection = controlConnection;
    void set(stageRef, localStation).catch(() => {
      if (controlConnection === connection) failControl();
    });
  }

  function observeControl() {
    if (!controlKey) return;
    onValue(ref(db, '.info/serverTimeOffset'), (snapshot) => {
      serverOffset = snapshot.val() ?? 0;
    });
    if (clicker) {
      onValue(stageRef, (snapshot) => {
        station = readStation(snapshot.val());
        publish();
      }, failControl);
    }
  }

  function watchCommands(connection, onError) {
    unwatchCommands = onChildAdded(commandsRef, (snapshot) => {
      if (!controlReady || controlConnection !== connection) return;
      const now = Date.now() + serverOffset;
      for (const [key, expiration] of consumed) {
        if (expiration <= now) consumed.delete(key);
      }
      const { command, expiresAt } = snapshot.val() ?? {};
      if (validCommand(command) && expiresAt > now && !consumed.has(snapshot.key)) {
        consumed.set(snapshot.key, expiresAt);
        onCommand(command);
      }
      void remove(snapshot.ref).catch(onError);
    }, onError);
  }

  function observeRoom() {
    onValue(ref(db, '.info/connected'), (snapshot) => {
      connected = snapshot.val() === true;
      if (connected) {
        everConnected = true;
      } else {
        controlReady = false;
        controlConnection = undefined;
        unwatchCommands?.();
        unwatchCommands = undefined;
      }
      createRoom();
      armControl();
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
        if (round && !clicker) {
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
      armControl();
      publish();
    }, fail);
    observeControl();
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
    setStation(next) {
      if (!presenter) return;
      localStation = next;
      if (controlReady) writeStation();
      else armControl();
    },
    async sendCommand(command) {
      if (!clicker || !connected || !station || controlError || !validCommand(command)) {
        throw new Error('Presenter unavailable');
      }
      await set(push(commandsRef), { command, expiresAt: Date.now() + serverOffset + COMMAND_LIFETIME });
    },
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
