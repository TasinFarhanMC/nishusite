import type { Panel } from "./panels";

type Query = Partial<Panel>;
type Weights = Partial<Record<keyof Panel, number>>;

export type { Query, Weights };

function scorePanel(panel: Panel, query: Query, weights: Weights): number {
  let score = 0;

  for (const key in query) {
    const weight = weights[key as keyof Panel] ?? 1;
    const qVal = query[key as keyof Panel];
    const pVal = panel[key as keyof Panel];

    if (qVal === undefined) continue;

    if (typeof qVal === "number" && typeof pVal === "number") {
      const diff = Math.abs(pVal - qVal);
      score += weight * (1 / (1 + diff));
    } else if (typeof qVal === "string" && typeof pVal === "string") {
      if (qVal.toLowerCase() === pVal.toLowerCase()) {
        score += weight;
      }
    }
  }

  return score;
}

// Sort [string, Panel][] by score, return same type
export function weightedSearch(
  entries: [string, Panel][],
  query: Query,
  weights: Weights
): [string, Panel][] {
  return [...entries].sort((a, b) => {
    const scoreA = scorePanel(a[1], query, weights);
    const scoreB = scorePanel(b[1], query, weights);
    return scoreB - scoreA;
  });
}
