import { fetchNumber, getUrl } from "./file";
import { encode, decode } from "@msgpack/msgpack";

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

export function panel_to_array(panel: Panel): (number | string)[] {
  return [
    panel.watt,
    panel.battery,
    panel.panel_cable,
    panel.wiring_cable,
    panel.light,
    panel.charger,
    panel.structure,
    panel.hour,
    panel.extra_hour,
    panel.dc_fan_small,
    panel.dc_fan_table,
    panel.dc_fan_stand,
    panel.price,
  ];
}

export function array_to_panel(arr: (number | string)[]): Panel {
  return {
    watt: arr[0] as number,
    battery: arr[1] as number,
    panel_cable: arr[2] as number,
    wiring_cable: arr[3] as number,
    light: arr[4] as number,
    charger: arr[5] as number,
    structure: arr[6] as string,
    hour: arr[7] as number,
    extra_hour: arr[8] as number,
    dc_fan_small: arr[9] as number,
    dc_fan_table: arr[10] as number,
    dc_fan_stand: arr[11] as number,
    price: arr[12] as number,
  };
}

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

async function setInStore(storeName: string, key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function isStale(): Promise<boolean> {
  const serverTime = await fetchNumber("time");
  const storedTime = await getFromStore<bigint>("meta", "panelsTime") ?? BigInt(0);
  return storedTime <= serverTime;
}

// --- Fetch all panels and cache ---
export async function fetchPanels(getStale = false): Promise<Record<number, Panel>> {
  // fetch server time
  const cachedData = await getFromStore<Uint8Array>("panels", "data");

  if (cachedData && (getStale || !(await isStale()))) {
    const decoded = decode(cachedData) as [number, (number | string)[]][];
    const panels: Record<number, Panel> = {};
    for (const [id, arr] of decoded) panels[id] = array_to_panel(arr);
    return panels;
  }

  // fetch fresh panels
  const res = await fetch(getUrl("panels.msgpack"), { cache: "reload" });
  if (!res.ok) throw new Error(`Failed to fetch panels: ${res.status}`);
  const rawBuffer = new Uint8Array(await res.arrayBuffer());
  const decoded = decode(rawBuffer) as [number, (number | string)[]][];
  const panels: Record<number, Panel> = {};
  for (const [id, arr] of decoded) panels[id] = array_to_panel(arr);

  // cache
  await setInStore("panels", "data", rawBuffer);
  await setInStore("meta", "panelsTime", BigInt(Date.now()));

  return panels;
}

// --- Fetch a single panel by ID ---
export async function fetchPanel(key: number): Promise<Panel | null> {
  if (!(await isStale())) {
    // check cached panel
    const cached = await getFromStore<Uint8Array>("panels", key.toString());
    if (cached) return array_to_panel(decode(cached) as (number | string)[]);
  }

  // fetch all if missing
  const panels = await fetchPanels(true);
  const panel = panels[key];
  if (panel) {
    // cache individual panel
    await setInStore("panels", key.toString(), encode(panel_to_array(panel)));
    return panel;
  }

  return null;
}
