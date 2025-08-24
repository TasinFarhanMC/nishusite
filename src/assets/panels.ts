import { getUrl } from "./file";

export type Panel = {
  watt: number;
  battery: number;
  panel_cable: number;
  wiring_cable: number;
  light: number;
  charger: number;
  structure: string;
  hour: number;
  extra_hour: number;
  dc_fan_small: number;
  dc_fan_table: number;
  dc_fan_stand: number;
  price: number;
};

// --- IndexedDB helpers ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("PanelDB", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("panels")) db.createObjectStore("panels");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
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

async function setInStore(storeName: string, key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- helper to read 64-bit big-endian Unix time ---
function parseBigEndian64(buffer: ArrayBuffer): bigint {
  const view = new DataView(buffer);
  return view.getBigUint64(0, false); // false = big-endian
}

// --- fetchPanels with raw 64-bit time ---
export async function fetchPanels(): Promise<Record<string, Panel>> {
  // fetch raw time
  const timeRes = await fetch(getUrl("time"));
  if (!timeRes.ok) throw new Error(`Failed to fetch time: ${timeRes.status}`);
  const buffer = await timeRes.arrayBuffer();
  const serverTime = parseBigEndian64(buffer); // bigint

  // get stored timestamp and cached panels
  const storedTime = await getFromStore<bigint>("meta", "panelsTime");
  const cachedPanels = await getFromStore<Record<string, Panel>>("panels", "data");

  if (cachedPanels && storedTime && storedTime >= serverTime) {
    return cachedPanels;
  }

  // fetch new panels
  const res = await fetch(getUrl("panels.json"), { cache: "reload" });
  if (!res.ok) throw new Error(`Failed to fetch panels: ${res.status}`);
  const data = (await res.json()) as Record<string, Panel>;

  // store in IndexedDB
  await setInStore("panels", "data", data);
  await setInStore("meta", "panelsTime", serverTime);

  return data;
}
