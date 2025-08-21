export type Panel = {
  name: string;
  price: number;
};

export const panels: Panel[] = [
  { name: 'Basic', price: 100 },
  { name: 'Pro', price: 200 },
];

function hashStringToHex(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  // Convert to positive hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Auto-generate the map using the panel name as hash
export const panelMap: Record<string, Panel> = panels.reduce((acc, panel) => {
  const key = hashStringToHex(panel.name);
  acc[key] = panel;
  return acc;
}, {} as Record<string, Panel>);
