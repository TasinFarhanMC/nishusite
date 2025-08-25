import type { Panel } from "./panels";

type Query = Partial<Panel>;
type Weights = Partial<Record<keyof Panel, number>>;

function scorePanel(panel: Panel, query: Query, weights: Weights): number {
  let score = 0;

  for (const key in query) {
    const weight = weights[key as keyof Panel] ?? 1;
    const qVal = query[key as keyof Panel];
    const pVal = panel[key as keyof Panel];

    if (qVal === undefined) continue;

    if (typeof qVal === "number" && typeof pVal === "number") {
      // smaller difference → higher score
      const diff = Math.abs(pVal - qVal);
      score += weight * (1 / (1 + diff));
    } else if (typeof qVal === "string" && typeof pVal === "string") {
      // exact string match
      if (qVal.toLowerCase() === pVal.toLowerCase()) {
        score += weight;
      }
    }
  }

  return score;
}

export function weightedSearch(panels: Panel[], query: Query, weights: Weights) {
  return panels
    .map(panel => ({
      panel,
      score: scorePanel(panel, query, weights),
    }))
    .sort((a, b) => b.score - a.score);
}

