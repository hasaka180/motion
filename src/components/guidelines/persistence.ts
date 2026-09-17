/** IndexedDB holds image-heavy decks without localStorage's small string quota. */
const DATABASE = "darwin-guidelines";
const STORE = "documents";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other guideline tabs and try again."));
  });
}
export async function readSavedDocuments(): Promise<string | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get("state");
      request.onsuccess = () => resolve(request.result ? JSON.stringify(request.result) : undefined);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
// Serialise writes so an older save cannot finish after a newer one.
let pending = Promise.resolve();
export function writeSavedDocuments(value: unknown): Promise<void> {
  const next = pending.catch(() => {}).then(async () => {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, "readwrite");
        transaction.objectStore(STORE).put(value, "state");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally { db.close(); }
  });
  pending = next;
  return next;
}
