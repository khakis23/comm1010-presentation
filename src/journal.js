export function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function withBrowserLock(name, operation) {
  return navigator.locks ? navigator.locks.request(name, operation) : operation();
}

export function rememberRoom() {
  const key = 'comm1010:presenter-room';
  const freshRoom = randomId();
  try {
    const savedRoom = localStorage.getItem(key);
    if (savedRoom && /^[a-f0-9]{32}$/.test(savedRoom)) return savedRoom;
    localStorage.setItem(key, freshRoom);
  } catch {
    // The room can still be used until this page is closed.
  }
  return freshRoom;
}

export function createJournal(namespace, onChange, onMessage) {
  const prefix = `comm1010:${namespace}:`;
  const entries = new Map();
  let storage;
  let channel;

  try {
    storage = window.localStorage;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) entries.set(key.slice(prefix.length), storage.getItem(key));
    }
  } catch {
    storage = undefined;
  }

  function accept(key, value) {
    if (value === null) {
      if (entries.delete(key)) onChange();
    } else if (entries.get(key) !== value) {
      entries.set(key, value);
      onChange();
    }
  }

  function read(key) {
    try {
      return JSON.parse(entries.get(key) ?? 'null');
    } catch {
      return null;
    }
  }

  function refresh(key) {
    try {
      const value = storage?.getItem(prefix + key);
      if (typeof value === 'string') accept(key, value);
    } catch {
      // Continue with the in-memory copy.
    }
    return read(key);
  }

  try {
    channel = new BroadcastChannel(prefix);
    channel.addEventListener('message', ({ data }) => {
      if (data?.message) {
        onMessage?.(data.message);
        return;
      }
      if (typeof data?.key !== 'string' || typeof data.value !== 'string') return;
      if (data.durable && storage) {
        refresh(data.key);
      } else {
        accept(data.key, data.value);
      }
    });
  } catch {
    // Storage events still synchronize browsers without BroadcastChannel.
  }

  window.addEventListener('storage', (event) => {
    if (!event.key?.startsWith(prefix)) return;
    const key = event.key.slice(prefix.length);
    if (key === 'message') {
      if (!event.newValue || !onMessage) return;
      let payload;
      try {
        payload = JSON.parse(event.newValue);
      } catch {
        return;
      }
      if (payload?.message) onMessage(payload.message);
      return;
    }
    if (event.newValue === null) accept(key, null);
    else refresh(key);
  });

  return {
    read,
    refresh,
    values(start) {
      return Array.from(entries.keys())
        .filter((key) => key.startsWith(start))
        .map(read);
    },
    send(message) {
      if (channel) {
        channel.postMessage({ message });
      } else if (storage) {
        const key = prefix + 'message';
        try {
          storage.setItem(key, JSON.stringify({ message, id: randomId() }));
          storage.removeItem(key);
        } catch {
          // Without either cross-tab mechanism the peer will remain unavailable.
        }
      }
    },
    write(key, value) {
      const serialized = JSON.stringify(value);
      if (entries.get(key) === serialized) return;
      let durable = false;
      try {
        if (storage) {
          storage.setItem(prefix + key, serialized);
          durable = true;
        }
      } catch {
        // Keep the update available in memory and to open tabs.
      }
      accept(key, serialized);
      channel?.postMessage({ key, value: serialized, durable });
    },
  };
}
