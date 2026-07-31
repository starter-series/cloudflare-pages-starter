import { readFileSync } from "node:fs";

const lockfile = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const packages = lockfile.packages ?? {};
const bannedLicense = /(^|[^A-Z])(?:AGPL|GPL)-(?:2\.0|3\.0)(?:-only|-or-later)?([^A-Z]|$)/;
const counts = new Map();
const blocked = [];

for (const [path, meta] of Object.entries(packages)) {
  if (!path || !meta || typeof meta !== "object") {
    continue;
  }
  const license = meta.license;
  if (typeof license !== "string" || license.trim() === "") {
    continue;
  }
  counts.set(license, (counts.get(license) ?? 0) + 1);
  if (bannedLicense.test(license)) {
    blocked.push({ path, license });
  }
}

for (const [license, count] of [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  console.log(`${license}: ${count}`);
}

if (blocked.length > 0) {
  console.error("Blocked licenses found:");
  for (const item of blocked) {
    console.error(`- ${item.path}: ${item.license}`);
  }
  process.exit(1);
}
