/**
 * CLI wrapper around lib/gpxStructure.ts — validates a .gpx file against the
 * structure recommended in docs/GPX_STRUCTURE.md and prints a report.
 *
 * Usage: npm run gpx:lint -- "path/to/file.gpx"
 */
import fs from "fs";
import path from "path";
import { analyzeGpx } from "../lib/gpxStructure";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npm run gpx:lint -- <path/to/file.gpx>");
  process.exit(1);
}

const resolved = path.resolve(process.cwd(), filePath);
if (!fs.existsSync(resolved)) {
  console.error(`File not found: ${resolved}`);
  process.exit(1);
}

const xml = fs.readFileSync(resolved, "utf-8");
const result = analyzeGpx(xml);

console.log(`\nGPX structure report — ${path.basename(resolved)}\n${"=".repeat(50)}`);

console.log(`\nTracks (${result.tracks.length}):`);
for (const t of result.tracks) {
  console.log(
    `  - ${t.name ?? "(unnamed)"}: ${t.pointCount} points, elevation ${t.elevationCoveragePct}%`
  );
}

console.log(`\nWaypoints (${result.waypoints.length}):`);
if (result.waypoints.length === 0) {
  console.log("  (none)");
} else {
  for (const w of result.waypoints) {
    const tag = w.classified ? w.role : `${w.role} (unclassified)`;
    console.log(`  - [${tag}] ${w.name} @ ${w.coordinates[1].toFixed(5)}, ${w.coordinates[0].toFixed(5)}`);
  }
}

if (result.inferredEndpoints) {
  console.log("\nNo waypoints found — start/exit would be inferred from track endpoints.");
}

console.log(`\nWarnings (${result.warnings.length}):`);
if (result.warnings.length === 0) {
  console.log("  (none — structure looks good)");
} else {
  for (const w of result.warnings) console.log(`  ! ${w}`);
}

console.log("");
process.exit(result.warnings.length > 0 ? 1 : 0);
