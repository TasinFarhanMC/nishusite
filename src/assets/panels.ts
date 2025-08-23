export type Panel = {
  watt: number;
  battary: number;
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

const url =
  "https://mayhiqsvljlyvismbpio.supabase.co/storage/v1/object/public/Nishsite/panels.json";


export async function fetchPanels() {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const data = await res.json();
  return data as Record<string, Panel>;
}
