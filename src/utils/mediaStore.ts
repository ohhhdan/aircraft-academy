const DB_NAME = 'runway-reference-media';
const DB_VERSION = 1;
const STORE = 'aircraft-media';

export interface AircraftMediaRecord {
  aircraftId: string;
  spotPhotoUrl?: string;
  spotPhotoBlobKey?: string;
  spotAttribution?: string;
  spotVariant?: string;
  diagramUrl?: string;
  diagramBlobKey?: string;
  diagramAttribution?: string;
  updatedAt: number;
}

export interface ResolvedMedia {
  spotPhoto: { url: string; attribution: string; variant?: string } | null;
  diagram: { url: string; attribution?: string } | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'aircraftId' });
      }
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs');
      }
    };
  });
}

async function getRecord(aircraftId: string): Promise<AircraftMediaRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(aircraftId);
    req.onsuccess = () => resolve((req.result as AircraftMediaRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function putRecord(record: AircraftMediaRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blobs', 'readonly');
    const req = tx.objectStore('blobs').get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function putBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blobs', 'readwrite');
    tx.objectStore('blobs').put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteBlob(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blobs', 'readwrite');
    tx.objectStore('blobs').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllRecords(): Promise<AircraftMediaRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as AircraftMediaRecord[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

function blobKey(aircraftId: string, type: 'spot' | 'diagram') {
  return `${aircraftId}:${type}`;
}

export async function resolveMedia(record: AircraftMediaRecord | null): Promise<ResolvedMedia> {
  if (!record) return { spotPhoto: null, diagram: null };

  let spotUrl: string | null = null;
  if (record.spotPhotoUrl) {
    spotUrl = record.spotPhotoUrl;
  } else if (record.spotPhotoBlobKey) {
    const blob = await getBlob(record.spotPhotoBlobKey);
    if (blob) spotUrl = URL.createObjectURL(blob);
  }

  let diagramUrl: string | null = null;
  if (record.diagramUrl) {
    diagramUrl = record.diagramUrl;
  } else if (record.diagramBlobKey) {
    const blob = await getBlob(record.diagramBlobKey);
    if (blob) diagramUrl = URL.createObjectURL(blob);
  }

  return {
    spotPhoto: spotUrl
      ? { url: spotUrl, attribution: record.spotAttribution ?? 'User provided', variant: record.spotVariant }
      : null,
    diagram: diagramUrl
      ? { url: diagramUrl, attribution: record.diagramAttribution }
      : null,
  };
}

export async function setSpotPhoto(
  aircraftId: string,
  input: { url?: string; file?: File; attribution?: string; variant?: string }
): Promise<AircraftMediaRecord> {
  const existing = (await getRecord(aircraftId)) ?? { aircraftId, updatedAt: 0 };
  const key = blobKey(aircraftId, 'spot');

  if (input.file) {
    if (existing.spotPhotoBlobKey) await deleteBlob(existing.spotPhotoBlobKey);
    await putBlob(key, input.file);
    existing.spotPhotoBlobKey = key;
    existing.spotPhotoUrl = undefined;
  } else if (input.url !== undefined) {
    if (existing.spotPhotoBlobKey) {
      await deleteBlob(existing.spotPhotoBlobKey);
      existing.spotPhotoBlobKey = undefined;
    }
    existing.spotPhotoUrl = input.url || undefined;
  }

  if (input.attribution !== undefined) existing.spotAttribution = input.attribution;
  if (input.variant !== undefined) existing.spotVariant = input.variant;
  existing.updatedAt = Date.now();
  await putRecord(existing);
  return existing;
}

export async function setDiagram(
  aircraftId: string,
  input: { url?: string; file?: File; attribution?: string }
): Promise<AircraftMediaRecord> {
  const existing = (await getRecord(aircraftId)) ?? { aircraftId, updatedAt: 0 };
  const key = blobKey(aircraftId, 'diagram');

  if (input.file) {
    if (existing.diagramBlobKey) await deleteBlob(existing.diagramBlobKey);
    await putBlob(key, input.file);
    existing.diagramBlobKey = key;
    existing.diagramUrl = undefined;
  } else if (input.url !== undefined) {
    if (existing.diagramBlobKey) {
      await deleteBlob(existing.diagramBlobKey);
      existing.diagramBlobKey = undefined;
    }
    existing.diagramUrl = input.url || undefined;
  }

  if (input.attribution !== undefined) existing.diagramAttribution = input.attribution;
  existing.updatedAt = Date.now();
  await putRecord(existing);
  return existing;
}

export async function clearSpotPhoto(aircraftId: string): Promise<void> {
  const existing = await getRecord(aircraftId);
  if (!existing) return;
  if (existing.spotPhotoBlobKey) await deleteBlob(existing.spotPhotoBlobKey);
  delete existing.spotPhotoBlobKey;
  delete existing.spotPhotoUrl;
  delete existing.spotAttribution;
  delete existing.spotVariant;
  existing.updatedAt = Date.now();
  await putRecord(existing);
}

export async function clearDiagram(aircraftId: string): Promise<void> {
  const existing = await getRecord(aircraftId);
  if (!existing) return;
  if (existing.diagramBlobKey) await deleteBlob(existing.diagramBlobKey);
  delete existing.diagramBlobKey;
  delete existing.diagramUrl;
  delete existing.diagramAttribution;
  existing.updatedAt = Date.now();
  await putRecord(existing);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportMediaPack(): Promise<string> {
  const records = await getAllRecords();
  const pack: Record<string, unknown>[] = [];

  for (const rec of records) {
    const entry: Record<string, unknown> = { aircraftId: rec.aircraftId };
    if (rec.spotPhotoUrl) {
      entry.spotPhotoUrl = rec.spotPhotoUrl;
      entry.spotAttribution = rec.spotAttribution;
      entry.spotVariant = rec.spotVariant;
    }
    if (rec.spotPhotoBlobKey) {
      const blob = await getBlob(rec.spotPhotoBlobKey);
      if (blob) {
        entry.spotPhotoData = await blobToBase64(blob);
        entry.spotAttribution = rec.spotAttribution;
        entry.spotVariant = rec.spotVariant;
      }
    }
    if (rec.diagramUrl) {
      entry.diagramUrl = rec.diagramUrl;
      entry.diagramAttribution = rec.diagramAttribution;
    }
    if (rec.diagramBlobKey) {
      const blob = await getBlob(rec.diagramBlobKey);
      if (blob) {
        entry.diagramData = await blobToBase64(blob);
        entry.diagramAttribution = rec.diagramAttribution;
      }
    }
    if (Object.keys(entry).length > 1) pack.push(entry);
  }

  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), aircraft: pack }, null, 2);
}

export async function importMediaPack(json: string): Promise<number> {
  const data = JSON.parse(json) as {
    aircraft: Array<{
      aircraftId: string;
      spotPhotoUrl?: string;
      spotPhotoData?: string;
      spotAttribution?: string;
      spotVariant?: string;
      diagramUrl?: string;
      diagramData?: string;
      diagramAttribution?: string;
    }>;
  };

  let count = 0;
  for (const item of data.aircraft) {
    if (item.spotPhotoData) {
      const res = await fetch(item.spotPhotoData);
      const blob = await res.blob();
      await setSpotPhoto(item.aircraftId, {
        file: new File([blob], 'spot.jpg', { type: blob.type }),
        attribution: item.spotAttribution,
        variant: item.spotVariant,
      });
    } else if (item.spotPhotoUrl) {
      await setSpotPhoto(item.aircraftId, {
        url: item.spotPhotoUrl,
        attribution: item.spotAttribution,
        variant: item.spotVariant,
      });
    }

    if (item.diagramData) {
      const res = await fetch(item.diagramData);
      const blob = await res.blob();
      await setDiagram(item.aircraftId, {
        file: new File([blob], 'diagram.png', { type: blob.type }),
        attribution: item.diagramAttribution,
      });
    } else if (item.diagramUrl) {
      await setDiagram(item.aircraftId, {
        url: item.diagramUrl,
        attribution: item.diagramAttribution,
      });
    }

    count++;
  }
  return count;
}
