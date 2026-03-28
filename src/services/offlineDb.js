import { openDB } from 'idb';

const DB_NAME = 'iddi-offline';
const DB_VERSION = 1;

function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache');
      }
      if (!db.objectStoreNames.contains('mutationQueue')) {
        db.createObjectStore('mutationQueue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function getCachedResponse(path) {
  const db = await getDb();
  return db.get('apiCache', path);
}

export async function setCachedResponse(path, data) {
  const db = await getDb();
  return db.put('apiCache', { data, timestamp: Date.now() }, path);
}

export async function addToMutationQueue(mutation) {
  const db = await getDb();
  return db.add('mutationQueue', {
    method: mutation.method,
    url: mutation.url,
    body: mutation.body,
    status: 'pending',
    createdAt: Date.now(),
  });
}

export async function getPendingMutations() {
  const db = await getDb();
  return db.getAll('mutationQueue');
}

export async function removeMutation(id) {
  const db = await getDb();
  return db.delete('mutationQueue', id);
}

export async function getPendingMutationCount() {
  const db = await getDb();
  return db.count('mutationQueue');
}

export async function clearVendorCache() {
  const db = await getDb();
  const tx = db.transaction(['apiCache', 'mutationQueue'], 'readwrite');
  await Promise.all([
    tx.objectStore('apiCache').clear(),
    tx.objectStore('mutationQueue').clear(),
    tx.done,
  ]);
}
