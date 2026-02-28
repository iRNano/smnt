/**
 * Mock map data for MVP UI when DATABASE_URL is not set.
 * Sierra Madre trail south to north through: Umiray, Dingalan, Gabaldon, Quezon–Baler (Aurora),
 * Maddela (Quirino), Mount Diminalno area, Mount Palanan, Divilacan peak, Mount Cresta, Mount Dos Cuernos (Isabela),
 * Mount Cetaceo, Mount Capulutan, Mount Lagit (Isabela), Mount Cagua, Mount Pamascanan (Cagayan).
 * Points kept inland where needed to avoid water.
 */

export type SectionRow = {
  id: string;
  slug: string;
  name: string;
  from_poi: string;
  to_poi: string;
  description: string | null;
  geometry: GeoJSON.LineString;
};

function getSectionsFromMainRoute(mainCoords: number[][]): SectionRow[] {
  const labels = [
    "Southern Start",
    "Umiray",
    "Dingalan",
    "Gabaldon",
    "Baler",
    "Maddela",
    "Mount Diminalno",
    "Mount Palanan",
    "Mount Cresta",
    "Mount Dos Cuernos",
    "Divilacan",
    "Mount Capulutan",
    "Mount Cetaceo",
    "Mount Lagit",
    "Mount Pamascanan",
    "Mount Cagua",
  ];
  const slugs = [
    "southern-start-umiray",
    "umiray-dingalan",
    "dingalan-gabaldon",
    "gabaldon-baler",
    "baler-maddela",
    "maddela-diminalno",
    "diminalno-palanan",
    "palanan-cresta",
    "cresta-dos-cuernos",
    "dos-cuernos-divilacan",
    "divilacan-capulutan",
    "capulutan-cetaceo",
    "cetaceo-lagit",
    "lagit-pamascanan",
    "pamascanan-cagua",
  ];
  const sections: SectionRow[] = [];
  for (let i = 0; i < mainCoords.length - 1; i++) {
    sections.push({
      id: `sec-${i + 1}`,
      slug: slugs[i]!,
      name: `${labels[i]} → ${labels[i + 1]}`,
      from_poi: labels[i]!,
      to_poi: labels[i + 1]!,
      description: null,
      geometry: {
        type: "LineString",
        coordinates: [mainCoords[i]!, mainCoords[i + 1]!],
      },
    });
  }
  return sections;
}

const MAIN_ROUTE_COORDINATES: [number, number][] = [
  [121.52, 14.62],
  [121.42, 15.2],
  [121.39, 15.39],
  [121.34, 15.45],
  [121.55, 15.76],
  [121.68, 16.34],
  [121.92, 16.88],
  [122.26, 17.05],
  [122.15, 17.18],
  [122.18, 17.25],
  [122.25, 17.33],
  [122.0, 17.55],
  [122.05, 17.7],
  [122.03, 17.85],
  [122.08, 18.12],
  [122.12, 18.22],
];

export const mockMapData = {
  sections: getSectionsFromMainRoute(MAIN_ROUTE_COORDINATES),
  routes: [
    {
      id: "a0000000-0000-4000-8000-000000000001",
      name: "Crow's Route",
      route_type: "main",
      explorer_credits: ["UST MC", "Crow Njjfdk", "Hdhkdh Udflj"],
      opened_at: "2025-06-03",
      geometry: {
        type: "LineString" as const,
        coordinates: MAIN_ROUTE_COORDINATES,
      },
    },
    {
      id: "a0000000-0000-4000-8000-000000000002",
      name: "North Exit",
      route_type: "exit",
      explorer_credits: ["MFPI"],
      opened_at: "2025-05-01",
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [122.18, 17.25],
          [122.22, 17.4],
          [122.28, 17.5],
        ],
      },
    },
    {
      id: "a0000000-0000-4000-8000-000000000003",
      name: "South Exit",
      route_type: "exit",
      explorer_credits: ["UPM"],
      opened_at: "2025-05-15",
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [121.42, 15.2],
          [121.38, 15.0],
          [121.35, 14.85],
        ],
      },
    },
    {
      id: "a0000000-0000-4000-8000-000000000004",
      name: "Unexplored segment",
      route_type: "not_passable",
      explorer_credits: [],
      opened_at: null,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [121.78, 16.5],
          [121.85, 16.65],
        ],
      },
    },
  ],
  pois: [
    { id: "b0000000-0000-4000-8000-000000000001", name: "Southern Jump-off (Quezon)", poi_type: "jump_off", description: "Trail start in northern Quezon. From Manila take bus to Infanta/Real area.", geometry: { type: "Point" as const, coordinates: [121.52, 14.62] } },
    { id: "b0000000-0000-4000-8000-000000000002", name: "Umiray (General Nakar, Quezon)", poi_type: "jump_off", description: "Umiray River area. Boundary Aurora–Quezon. Access from General Nakar.", geometry: { type: "Point" as const, coordinates: [121.42, 15.2] } },
    { id: "b0000000-0000-4000-8000-000000000003", name: "Dingalan, Aurora", poi_type: "supply", description: "Southern Aurora. Coastal municipality; trail passes inland.", geometry: { type: "Point" as const, coordinates: [121.39, 15.39] } },
    { id: "b0000000-0000-4000-8000-000000000004", name: "Gabaldon, Nueva Ecija", poi_type: "jump_off", description: "Western Sierra Madre. Access from Nueva Ecija.", geometry: { type: "Point" as const, coordinates: [121.34, 15.45] } },
    { id: "b0000000-0000-4000-8000-000000000005", name: "Baler, Aurora", poi_type: "supply", description: "Capital of Aurora. Resupply and jump-off; trail passes inland.", geometry: { type: "Point" as const, coordinates: [121.55, 15.76] } },
    { id: "b0000000-0000-4000-8000-000000000006", name: "Maddela, Quirino", poi_type: "jump_off", description: "Commercial hub of Quirino. Trail crosses Cagayan Valley side.", geometry: { type: "Point" as const, coordinates: [121.68, 16.34] } },
    { id: "b0000000-0000-4000-8000-000000000007", name: "Mount Diminalno area (Dinapigue, Isabela)", poi_type: "jump_off", description: "Diminalno Lake area. Central Sierra Madre, Quirino–Isabela.", geometry: { type: "Point" as const, coordinates: [121.92, 16.88] } },
    { id: "b0000000-0000-4000-8000-000000000008", name: "Mount Palanan, Isabela", poi_type: "jump_off", description: "Northern Sierra Madre Natural Park. Elevation ~1,202 m.", geometry: { type: "Point" as const, coordinates: [122.26, 17.05] } },
    { id: "b0000000-0000-4000-8000-000000000009", name: "Mount Cresta, Isabela", poi_type: "jump_off", description: "Second-highest in Northern Sierra Madre NP (~1,672 m).", geometry: { type: "Point" as const, coordinates: [122.15, 17.18] } },
    { id: "b0000000-0000-4000-8000-000000000010", name: "Mount Dos Cuernos, Isabela", poi_type: "jump_off", description: "Highest in Northern Sierra Madre NP (~1,736 m).", geometry: { type: "Point" as const, coordinates: [122.18, 17.25] } },
    { id: "b0000000-0000-4000-8000-000000000011", name: "Divilacan peak, Isabela", poi_type: "guides_shed", description: "Divilacan area. Northern Sierra Madre; coastal municipality.", geometry: { type: "Point" as const, coordinates: [122.25, 17.33] } },
    { id: "b0000000-0000-4000-8000-000000000012", name: "Mount Cetaceo, Isabela/Cagayan", poi_type: "jump_off", description: "High peak (~1,822 m). Cagayan Valley region.", geometry: { type: "Point" as const, coordinates: [122.05, 17.7] } },
    { id: "b0000000-0000-4000-8000-000000000013", name: "Mount Capulutan, Isabela", poi_type: "jump_off", description: "Sierra Madre peak, Isabela.", geometry: { type: "Point" as const, coordinates: [122.0, 17.55] } },
    { id: "b0000000-0000-4000-8000-000000000014", name: "Mount Lagit, Isabela", poi_type: "jump_off", description: "Sierra Madre peak, Isabela.", geometry: { type: "Point" as const, coordinates: [122.03, 17.85] } },
    { id: "b0000000-0000-4000-8000-000000000015", name: "Mount Cagua, Cagayan", poi_type: "jump_off", description: "Cagua Volcano (~1,133 m). Gonzaga, Cagayan. Active stratovolcano.", geometry: { type: "Point" as const, coordinates: [122.12, 18.22] } },
    { id: "b0000000-0000-4000-8000-000000000016", name: "Mount Pamascanan, Cagayan", poi_type: "jump_off", description: "Sierra Madre peak, Cagayan. Near Mount Cagua.", geometry: { type: "Point" as const, coordinates: [122.08, 18.12] } },
  ],
};
