/**
 * Map coordinates for terminal visualization.
 * Offsets are relative to terminal center (abstract layout for demo).
 * 50 popular airports (Northeast focus: EWR, LGA, ALB, etc.) + domestic & international.
 * Center is [lng, lat] for Mapbox.
 */

export interface MapPoint {
  id: string;
  lng: number;
  lat: number;
  label: string;
  type: "gate" | "vendor";
  level?: "green" | "yellow" | "red";
}

export interface TerminalMapData {
  center: [number, number];
  zoom: number;
  points: MapPoint[];
  route: [number, number][];
}

/** [lng, lat] for each supported airport (50 total). Northeast-heavy + major domestic/international. */
const AIRPORT_CENTERS: Record<string, [number, number]> = {
  // Northeast (incl. EWR, LGA, ALB)
  ewr: [-74.1745, 40.6895],   // Newark Liberty
  lga: [-73.874, 40.7769],    // LaGuardia
  jfk: [-73.7781, 40.6413],   // JFK
  alb: [-73.8017, 42.7483],   // Albany
  bos: [-71.0096, 42.3656],   // Boston Logan
  phl: [-75.2437, 39.8729],   // Philadelphia
  bwi: [-76.6683, 39.1754],   // Baltimore
  dca: [-77.0377, 38.8521],   // Reagan National
  iad: [-77.4558, 38.9445],   // Dulles
  pit: [-80.2329, 40.4915],   // Pittsburgh
  buf: [-78.7322, 42.9405],   // Buffalo
  roc: [-77.6724, 43.1189],   // Rochester
  syr: [-76.1063, 43.1112],   // Syracuse
  bdl: [-72.6832, 41.9389],   // Hartford
  pwm: [-70.3093, 43.6462],   // Portland ME
  mht: [-71.4357, 42.9326],   // Manchester NH
  pvd: [-71.4204, 41.7326],   // Providence
  ttn: [-74.8134, 40.2764],   // Trenton
  abe: [-75.4404, 40.6524],   // Allentown
  // Southeast
  atl: [-84.4281, 33.6367],   // Atlanta
  mia: [-80.287, 25.7959],    // Miami
  mco: [-81.3081, 28.4312],   // Orlando
  fll: [-80.1528, 26.0726],   // Fort Lauderdale
  tpa: [-82.5332, 27.9755],   // Tampa
  clt: [-80.9461, 35.2144],   // Charlotte
  rdu: [-78.7875, 35.8776],   // Raleigh-Durham
  bna: [-86.6782, 36.1245],   // Nashville
  mci: [-94.7139, 39.2976],   // Kansas City
  msy: [-90.258, 29.9934],    // New Orleans
  // Central / Texas
  dfw: [-97.038, 32.8968],    // Dallas/Fort Worth
  iah: [-95.3414, 29.9844],   // Houston Bush
  hou: [-95.2789, 29.6454],   // Houston Hobby
  aus: [-97.67, 30.1944],      // Austin
  stl: [-90.3700, 38.7487],   // St Louis
  dtw: [-83.3538, 42.2124],   // Detroit
  ord: [-87.9073, 41.9742],   // Chicago O'Hare
  msp: [-93.2218, 44.8820],   // Minneapolis-St Paul
  den: [-104.6731, 39.8617],   // Denver
  phx: [-112.0116, 33.4373],  // Phoenix
  slc: [-111.9778, 40.7899],  // Salt Lake City
  // West Coast
  lax: [-118.4081, 33.9425],  // LAX
  sfo: [-122.3750, 37.6190],  // San Francisco
  san: [-117.1896, 32.7338],  // San Diego
  sea: [-122.3088, 47.4502],  // Seattle
  pdx: [-122.5975, 45.5898],  // Portland OR
  smf: [-121.5922, 38.6954],  // Sacramento
  // Canada (major)
  yyz: [-79.6306, 43.6777],   // Toronto Pearson
  yul: [-73.7408, 45.4706],   // Montreal
  yvr: [-123.1844, 49.1967],  // Vancouver
  // International (common from Northeast)
  lhr: [-0.4614, 51.4700],    // London Heathrow
  cdg: [2.5700, 49.0097],     // Paris CDG
  ams: [4.7639, 52.3105],     // Amsterdam
  fco: [12.2500, 41.8003],    // Rome Fiumicino
  mad: [-3.5668, 40.4936],    // Madrid
  dxb: [55.3644, 25.2532],    // Dubai
  nrt: [140.3923, 35.7720],   // Tokyo Narita
};

const JFK_T4_CENTER: [number, number] = [-73.7781, 40.6413];
const LAX_TB_CENTER: [number, number] = [-118.4081, 33.9425];
const ORD_T3_CENTER: [number, number] = [-87.9073, 41.9742];

/** Small offset so gate/vendors sit in a terminal-style cluster, not on the runway. */
const TERMINAL_CLUSTER_OFFSET: [number, number] = [0.0008, 0.0012]; // [lng, lat] from airport center

function terminalCenter(airportCenter: [number, number]): [number, number] {
  return [
    airportCenter[0] + TERMINAL_CLUSTER_OFFSET[0],
    airportCenter[1] + TERMINAL_CLUSTER_OFFSET[1],
  ];
}

function offset(center: [number, number], dx: number, dy: number): [number, number] {
  return [center[0] + dx * 0.0003, center[1] + dy * 0.0003]; // tighter cluster
}

/**
 * Resolves map data: when airportIata is provided, use that airport's center if we support it
 * (50 airports). When not provided, fall back to terminal-only mapping (JFK T4, LAX TB, ORD T3).
 */
export function getTerminalMapData(
  terminalLabel: string,
  gateId: string,
  vendorNames?: string[],
  airportIata?: string | null
): TerminalMapData | null {
  const t = terminalLabel.toLowerCase().trim();
  const airport = (airportIata ?? "").toLowerCase().trim();

  let center: [number, number] | null = null;

  if (airport) {
    const fromList = AIRPORT_CENTERS[airport];
    if (fromList) {
      center = fromList;
    } else {
      return null;
    }
  }

  if (!center) {
    if (t.includes("4") || t === "terminal 4" || t === "4") center = JFK_T4_CENTER;
    else if (t.includes("b") || t === "terminal b" || t === "b") center = LAX_TB_CENTER;
    else if (t.includes("3") || t === "terminal 3" || t === "3") center = ORD_T3_CENTER;
    else center = JFK_T4_CENTER;
  }

  if (!center) return null;
  const base = center;
  const mapCenter = terminalCenter(base);

  const vendorOffsets: Array<[number, number]> = [
    [2, 1],
    [-1, 2],
    [3, -1],
    [-2, -1],
  ];

  const vendorLevels: Array<"green" | "yellow" | "red"> = [
    "green",
    "green",
    "yellow",
    "red",
  ];

  const vendorsToPlot =
    vendorNames && vendorNames.length > 0 ? vendorNames.slice(0, 4) : ["Shake Shack", "Panda Express", "Blue Ribbon Sushi"];

  const points: MapPoint[] = [
    {
      id: "gate",
      lng: mapCenter[0],
      lat: mapCenter[1],
      label: `Gate ${gateId}`,
      type: "gate" as const,
    },
    ...vendorsToPlot.map((name, idx) => {
      const [dx, dy] = vendorOffsets[idx] ?? vendorOffsets[0];
      const [lng, lat] = offset(mapCenter, dx, dy);
      return {
        id: `v${idx + 1}`,
        lng,
        lat,
        label: name,
        type: "vendor" as const,
        level: vendorLevels[idx] ?? "yellow",
      };
    }),
  ];

  const route: [number, number][] = points.map((p) => [p.lng, p.lat]);

  return { center: mapCenter, zoom: 17, points, route };
}
