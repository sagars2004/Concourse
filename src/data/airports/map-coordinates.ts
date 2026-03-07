/**
 * Map coordinates for terminal visualization.
 * Offsets are relative to terminal center (abstract layout for demo).
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

const JFK_T4_CENTER: [number, number] = [-73.7781, 40.6413];
const LAX_TB_CENTER: [number, number] = [-118.4081, 33.9425];
const ORD_T3_CENTER: [number, number] = [-87.9073, 41.9742];

function offset(center: [number, number], dx: number, dy: number): [number, number] {
  return [center[0] + dx * 0.001, center[1] + dy * 0.001];
}

export function getTerminalMapData(
  terminalLabel: string,
  gateId: string,
  vendorNames?: string[]
): TerminalMapData | null {
  const t = terminalLabel.toLowerCase();
  let center: [number, number];
  if (t.includes("4") || t.includes("terminal 4")) center = JFK_T4_CENTER;
  else if (t.includes("b") || t.includes("terminal b")) center = LAX_TB_CENTER;
  else if (t.includes("3") || t.includes("terminal 3")) center = ORD_T3_CENTER;
  else center = JFK_T4_CENTER;

  const points: MapPoint[] = [
    {
      id: "gate",
      lng: center[0],
      lat: center[1],
      label: `Gate ${gateId}`,
      type: "gate" as const,
    },
    {
      id: "v1",
      lng: offset(center, 2, 1)[0],
      lat: offset(center, 2, 1)[1],
      label: "Shake Shack",
      type: "vendor" as const,
      level: "green" as const,
    },
    {
      id: "v2",
      lng: offset(center, -1, 2)[0],
      lat: offset(center, -1, 2)[1],
      label: "Panda Express",
      type: "vendor" as const,
      level: "green" as const,
    },
    {
      id: "v3",
      lng: offset(center, 3, -1)[0],
      lat: offset(center, 3, -1)[1],
      label: "Blue Ribbon Sushi",
      type: "vendor" as const,
      level: "yellow" as const,
    },
  ].filter(
    (p) =>
      p.type === "gate" ||
      !vendorNames ||
      vendorNames.length === 0 ||
      vendorNames.some((v) => p.label?.toLowerCase().includes(v.toLowerCase()))
  );

  const route: [number, number][] = points.length
    ? [center, offset(center, 2, 1), offset(center, -1, 2)]
    : [];

  return { center, zoom: 17, points, route };
}
