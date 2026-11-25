import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { DownloadItem, Track } from '../types';
import { firestore } from './firebase';

const BATCH_LIMIT = 450;
const snapshotsByUid = new Map<string, Map<string, Map<string, string>>>();

async function readCollection<T extends { id: string }>(uid: string, collectionName: string): Promise<T[]> {
  if (!firestore) return [];
  const snapshot = await getDocs(collection(firestore, 'users', uid, collectionName));
  const cached = new Map<string, string>();
  const values = snapshot.docs
    .map((entry) => entry.data().value as T)
    .filter((value) => value && value.id);
  for (const value of values) cached.set(value.id, JSON.stringify(value));
  snapshotsByUid.set(uid, new Map(snapshotsByUid.get(uid)).set(collectionName, cached));
  return values;
}

async function syncCollection<T extends { id: string }>(
  uid: string,
  collectionName: string,
  values: T[]
): Promise<void> {
  const db = firestore;
  if (!db) return;

  const collectionRef = collection(db, 'users', uid, collectionName);
  const desired = new Map(values.map((value) => [value.id, value]));
  let cached = snapshotsByUid.get(uid)?.get(collectionName);
  if (!cached) {
    const snapshot = await getDocs(collectionRef);
    cached = new Map(snapshot.docs.map((entry) => [entry.id, JSON.stringify(entry.data().value)]));
  }
  let batch = writeBatch(db);
  let operationCount = 0;

  const commitIfFull = async () => {
    if (operationCount < BATCH_LIMIT) return;
    await batch.commit();
    batch = writeBatch(db);
    operationCount = 0;
  };

  for (const [id] of cached) {
    if (!desired.has(id)) {
      batch.delete(doc(collectionRef, id));
      operationCount += 1;
      await commitIfFull();
    }
  }

  for (const [id, value] of desired) {
    if (cached.get(id) === JSON.stringify(value)) continue;
    batch.set(doc(collectionRef, id), { value });
    operationCount += 1;
    await commitIfFull();
  }

  if (operationCount > 0) await batch.commit();
  snapshotsByUid.set(uid, new Map(snapshotsByUid.get(uid)).set(
    collectionName,
    new Map(values.map((value) => [value.id, JSON.stringify(value)]))
  ));
}

export async function loadUserData(uid: string): Promise<{ likedTracks: Track[]; downloads: DownloadItem[] }> {
  const [likedTracks, downloads] = await Promise.all([
    readCollection<Track>(uid, 'likedTracks'),
    readCollection<DownloadItem>(uid, 'downloads'),
  ]);
  return { likedTracks, downloads };
}

export async function saveUserData(uid: string, likedTracks: Track[], downloads: DownloadItem[]): Promise<void> {
  await Promise.all([
    syncCollection(uid, 'likedTracks', likedTracks),
    syncCollection(uid, 'downloads', downloads),
  ]);
}
