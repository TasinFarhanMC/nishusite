import { fetchNumber, getUrl } from "./file";
import { PanelMap, Panel } from "./gen/panel.ts";

export { Panel, PanelMap };

export interface PanelRecord {
  [key: number]: Panel;
}

let cachedDB: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  // Return cached DB if available
  if (cachedDB) return Promise.resolve(cachedDB);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open("PanelDB", 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("panels")) db.createObjectStore("panels");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };

    req.onsuccess = () => {
      cachedDB = req.result; // Cache the DB
      resolve(cachedDB);
    };

    req.onerror = () => reject(req.error);
  });
}

async function getFromStore<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setInStore(storeName: string, key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function fetchPanels(fetchedServerTime?: bigint, fetchPanelsTime?: bigint): Promise<PanelMap> {
  const serverTime = fetchedServerTime ?? await fetchNumber("time");
  const storedTime = fetchPanelsTime ?? await getFromStore<bigint>("meta", "panelsTime") ?? BigInt(0);

  if (storedTime >= serverTime) {
    const cachedData = await getFromStore<Uint8Array>("panels", "data");

    if (cachedData) {
      return PanelMap.decode(cachedData);
    }
  }

  const res = await fetch(getUrl("panels.pb"), { cache: "no-cache", headers: { "Accept": "application/octet-stream" } }); // fetch protobuf binary
  if (!res.ok) throw new Error(`Failed to fetch panels: ${res.status}`);
  const rawBuffer = new Uint8Array(await res.arrayBuffer());
  const panels = PanelMap.decode(rawBuffer);

  // cache
  await setInStore("panels", "data", rawBuffer);
  await setInStore("meta", "panelsTime", serverTime);

  return panels;
}

// --- Fetch a single panel by ID ---

export async function fetchPanel(key: number): Promise<Panel | undefined> {
  const serverTime = await fetchNumber("time");
  const panelsTime = await getFromStore<bigint>("meta", "panelsTime") ?? BigInt(0);

  // Try to get cached panel
  const cached = await getFromStore<{ data: Uint8Array; time: bigint }>("panels", key.toString());

  if (cached && cached.time >= panelsTime && cached.time >= serverTime) {
    return Panel.decode(cached.data);
  }

  // If cache is missing or stale, fetch all panels
  const panels = await fetchPanels(serverTime, panelsTime);
  const panel = panels.panels[key];

  if (panel) {
    const encoded = Panel.encode(panel).finish();
    await setInStore("panels", key.toString(), { data: encoded, time: serverTime });
  }

  return panel;
}
