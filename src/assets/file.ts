export const endpoint = "https://mayhiqsvljlyvismbpio.supabase.co/storage/v1";

export function getUrl(file: string) {
  return `${endpoint}/object/public/Nishsite/${file}`;
}

export async function fetchNumber(file: string) {
  const timeRes = await fetch(getUrl(file), { cache: "no-cache" });
  if (!timeRes.ok) throw new Error(`Failed to fetch time: ${timeRes.status}`);
  return new DataView(await timeRes.arrayBuffer()).getBigUint64(0, false);
}
