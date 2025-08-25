import type { Panel } from "./panels";
import { weightedSearch, type Query, type Weights } from "./search";

const panels: Panel[] = [
  { watt: 120, panelCable: 2, wiringCable: 5, light: 4, charger: 1, structure: "metal", hour: 8, extraHour: 2, dcFanSmall: 1, dcFanTable: 0, dcFanStand: 0, price: 5000, battery: 12 },
  { watt: 100, battery: 1800, panelCable: 1, wiringCable: 4, light: 3, charger: 1, structure: "plastic", hour: 7, extraHour: 1, dcFanSmall: 0, dcFanTable: 1, dcFanStand: 0, price: 4500 },
];

const query: Query = { watt: 120, price: 5000 };
const weights: Weights = { watt: 2, price: 1 }; // watt is more important

const ranked = weightedSearch(panels, query, weights);
console.log(ranked);
