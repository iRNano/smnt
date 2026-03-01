const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "..", "node_modules", "@types", "mapbox__point-geometry");
if (fs.existsSync(p)) {
  fs.writeFileSync(
    path.join(p, "index.d.ts"),
    'export * from "@mapbox/point-geometry";\n'
  );
}
