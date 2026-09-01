const DB_NAME = "proviquiz-offline";
const DB_VERSION = 1;
export const MAX_OFFLINE_SESSIONS = 5;
export const MAX_CACHED_PACKS = 5;

export type OfflineExamSession = {
  id: string;
  createdAt: number;
  synced: boolean;
  payload: {
    mode: "timed" | "practice";
    startedAt: string;
    completedAt: string;
    answers: Array<{ questionId: number; selected: "a" | "b" | "c" | "d" | null }>;
  };
  summary: {
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
  };
};

export type CachedExamPack = {
  id: string;
  cachedAt: number;
  questions: unknown[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("packs")) {
        db.createObjectStore("packs", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listOfflineSessions(): Promise<OfflineExamSession[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("sessions").objectStore("sessions").getAll();
    req.onsuccess = () => {
      const rows = (req.result as OfflineExamSession[]).sort((a, b) => a.createdAt - b.createdAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOfflineSession(session: OfflineExamSession): Promise<{ ok: boolean; droppedOldest?: boolean }> {
  const existing = await listOfflineSessions();
  const db = await openDb();
  const tx = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");

  let droppedOldest = false;
  if (existing.length >= MAX_OFFLINE_SESSIONS) {
    const oldest = existing[0];
    if (oldest) {
      store.delete(oldest.id);
      droppedOldest = true;
    }
  }
  store.put(session);
  await txDone(tx);
  return { ok: true, droppedOldest };
}

export async function markSessionSynced(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");
  const getReq = store.get(id);
  await new Promise<void>((resolve, reject) => {
    getReq.onsuccess = () => {
      const row = getReq.result as OfflineExamSession | undefined;
      if (row) {
        row.synced = true;
        store.put(row);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
  await txDone(tx);
}

export async function deleteOfflineSession(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("sessions", "readwrite");
  tx.objectStore("sessions").delete(id);
  await txDone(tx);
}

export async function unsyncedSessions(): Promise<OfflineExamSession[]> {
  const all = await listOfflineSessions();
  return all.filter((s) => !s.synced);
}

export async function saveExamPack(questions: unknown[]): Promise<void> {
  const packs = await listExamPacks();
  const db = await openDb();
  const tx = db.transaction("packs", "readwrite");
  const store = tx.objectStore("packs");
  if (packs.length >= MAX_CACHED_PACKS) {
    const oldest = packs[0];
    if (oldest) store.delete(oldest.id);
  }
  store.put({
    id: `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cachedAt: Date.now(),
    questions,
  } satisfies CachedExamPack);
  await txDone(tx);
}

export async function listExamPacks(): Promise<CachedExamPack[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("packs").objectStore("packs").getAll();
    req.onsuccess = () => {
      const rows = (req.result as CachedExamPack[]).sort((a, b) => a.cachedAt - b.cachedAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function takeOldestExamPack(): Promise<CachedExamPack | null> {
  const packs = await listExamPacks();
  const pack = packs[0];
  if (!pack) return null;
  const db = await openDb();
  const tx = db.transaction("packs", "readwrite");
  tx.objectStore("packs").delete(pack.id);
  await txDone(tx);
  return pack;
}

export async function peekExamPackCount(): Promise<number> {
  const packs = await listExamPacks();
  return packs.length;
}
