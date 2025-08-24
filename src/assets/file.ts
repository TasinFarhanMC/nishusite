export const endpoint = "https://mayhiqsvljlyvismbpio.supabase.co/storage/v1";

export function getUrl(file: string) {
  return `${endpoint}/object/public/Nishsite/${file}`;
}
