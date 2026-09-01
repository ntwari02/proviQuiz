import { submitExamApi } from "../api/premiumApi";
import { readAuthToken } from "../auth/authStorage";
import { deleteOfflineSession, unsyncedSessions } from "./examOfflineStore";

let syncing = false;

export async function syncOfflineExamSessions(): Promise<{ synced: number; failed: number }> {
  if (syncing || !navigator.onLine || !readAuthToken()) {
    return { synced: 0, failed: 0 };
  }
  syncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const pending = await unsyncedSessions();
    for (const session of pending) {
      try {
        await submitExamApi(session.payload);
        await deleteOfflineSession(session.id);
        synced += 1;
      } catch {
        failed += 1;
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failed };
}

export function startOfflineExamSync() {
  const run = () => {
    void syncOfflineExamSessions();
  };
  window.addEventListener("online", run);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
  run();
}
