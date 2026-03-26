import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REF_PATTERN = /\b[a-z0-9]{20}\b/;

const STRICT_FILES = [
  ".env",
  ".env.development",
  ".env.vercel.web",
  ".env.vercel.api",
  "apps/web/.env",
  "apps/api/.env",
];

const REFERENCE_FILE = "supabase/config.toml";

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return fs.readFileSync(absolutePath, "utf8");
}

function extractRef(value) {
  const cleaned = value.trim().replace(/^['"]|['"]$/g, "");
  const directMatch = cleaned.match(REF_PATTERN);
  if (directMatch) return directMatch[0];

  try {
    const url = new URL(cleaned);
    const hostRef = url.hostname.split(".")[0];
    return REF_PATTERN.test(hostRef) ? hostRef : null;
  } catch {
    return null;
  }
}

function extractRefFromDatabaseUsername(value) {
  const cleaned = value.trim().replace(/^['"]|['"]$/g, "");
  const match = cleaned.match(/^postgres\.([a-z0-9]{20})$/);
  return match ? match[1] : null;
}

function extractRefFromConnectionString(value) {
  const cleaned = value.trim().replace(/^['"]|['"]$/g, "");
  const match = cleaned.match(/postgres\.([a-z0-9]{20})@/);
  return match ? match[1] : null;
}

function parseEnvRefs(content, filePath) {
  const refs = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1);

    let ref = null;

    if (key === "VITE_SUPABASE_PROJECT_ID") {
      ref = extractRef(rawValue);
    } else if (key === "VITE_SUPABASE_URL" || key === "SUPABASE_URL") {
      ref = extractRef(rawValue);
    } else if (key === "DATABASE_USERNAME") {
      ref = extractRefFromDatabaseUsername(rawValue);
    } else if (key === "DATABASE_URL" || key === "DIRECT_URL") {
      ref = extractRefFromConnectionString(rawValue);
    }

    if (ref) {
      refs.push({ filePath, key, ref });
    }
  }

  return refs;
}

function parseProjectIdFromToml(content) {
  const match = content.match(/^\s*project_id\s*=\s*["']([a-z0-9]{20})["']/m);
  return match ? match[1] : null;
}

function unique(values) {
  return [...new Set(values)];
}

const referenceContent = readFile(REFERENCE_FILE);
if (!referenceContent) {
  console.error(`[error] Missing required file: ${REFERENCE_FILE}`);
  process.exit(1);
}

const projectId = parseProjectIdFromToml(referenceContent);
if (!projectId) {
  console.error(`[error] Could not parse project_id from ${REFERENCE_FILE}`);
  process.exit(1);
}

const allRefs = [];
const fileToRefs = new Map();

for (const filePath of STRICT_FILES) {
  const content = readFile(filePath);
  if (!content) continue;

  const refs = parseEnvRefs(content, filePath);
  allRefs.push(...refs);
  fileToRefs.set(
    filePath,
    unique(refs.map((entry) => entry.ref))
  );
}

if (allRefs.length === 0) {
  console.error("[error] No Supabase refs found in strict env files.");
  process.exit(1);
}

const errors = [];

for (const [filePath, refs] of fileToRefs.entries()) {
  if (refs.length > 1) {
    errors.push(
      `[error] ${filePath} has multiple refs: ${refs.join(", ")}`
    );
  }
}

for (const entry of allRefs) {
  if (entry.ref !== projectId) {
    errors.push(
      `[error] ${entry.filePath} (${entry.key}) uses ${entry.ref}, expected ${projectId}`
    );
  }
}

if (errors.length > 0) {
  console.error(`[error] Supabase project ref mismatch detected. Expected: ${projectId}`);
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

console.log(`[ok] Supabase refs are aligned to ${projectId}`);
