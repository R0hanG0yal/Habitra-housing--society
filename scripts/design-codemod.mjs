// Design-token codemod — one-shot migration of hardcoded hex utility classes
// to the premium semantic token palette. Run: node scripts/design-codemod.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "src");

// prefix:hex(lowercase) -> semantic token
const M = {
  // mocha cream #B7A89A — old card surface
  "bg:#b7a89a": "bg-surface-2",
  "text:#b7a89a": "text-ink-300",
  "border:#b7a89a": "border-line-strong",
  "ring:#b7a89a": "ring-ink-300",
  // #A99A8C — old hover surface
  "bg:#a99a8c": "bg-surface-3",
  "text:#a99a8c": "text-ink-400",
  "border:#a99a8c": "border-line-strong",
  // #9B8C7E — old active surface
  "bg:#9b8c7e": "bg-surface-3",
  // cosmic latte #E8DCC6 — old canvas / input bg
  "bg:#e8dcc6": "bg-canvas",
  "text:#e8dcc6": "text-ink-100",
  "border:#e8dcc6": "border-line",
  "ring:#e8dcc6": "ring-line",
  // lighter latte variants
  "bg:#ddd0b8": "bg-surface-3",
  "border:#ddd0b8": "border-line-strong",
  "bg:#d9cca6": "bg-surface-3",
  "border:#cfc0a7": "border-line",
  "bg:#cfc0a7": "bg-surface-3",
  // #9E8F82 — old border
  "bg:#9e8f82": "bg-surface-3",
  "text:#9e8f82": "text-ink-400",
  "border:#9e8f82": "border-line-strong",
  "divide:#9e8f82": "divide-line-strong",
  "ring:#9e8f82": "ring-line-strong",
  "placeholder:#9e8f82": "placeholder-ink-400",
  // deep burgundy brand
  "bg:#722f37": "bg-brand-600",
  "text:#722f37": "text-brand-600",
  "border:#722f37": "border-brand-600",
  "ring:#722f37": "ring-brand-600",
  "fill:#722f37": "fill-brand-600",
  "bg:#5c252c": "bg-brand-700",
  "text:#5c252c": "text-brand-700",
  "border:#5c252c": "border-brand-700",
  "bg:#461c22": "bg-brand-800",
  "text:#461c22": "text-brand-800",
  "bg:#321318": "bg-brand-900",
  "bg:#8c3d47": "bg-brand-500",
  "text:#8c3d47": "text-brand-500",
  "bg:#f7ecee": "bg-brand-50",
  "bg:#efd4d8": "bg-brand-100",
  "bg:#dfb0b7": "bg-brand-200",
  // espresso ink
  "bg:#2e1a11": "bg-ink-950",
  "text:#2e1a11": "text-ink-900",
  "border:#2e1a11": "border-ink-900",
  "ring:#2e1a11": "ring-ink-900",
  "from:#2e1a11": "from-ink-950",
  "via:#2e1a11": "via-ink-950",
  "to:#2e1a11": "to-ink-950",
  "text:#1f110b": "text-ink-950",
  "bg:#1f110b": "bg-ink-950",
  "text:#3e2b20": "text-ink-700",
  "text:#4d3b30": "text-ink-500",
  "border:#4d3b30": "border-ink-500",
  "placeholder:#4d3b30": "placeholder-ink-400",
  "text:#5c493d": "text-ink-500",
  "text:#756557": "text-ink-500",
  "placeholder:#756557": "placeholder-ink-400",
  "text:#8c7867": "text-ink-400",
  // status: success green
  "bg:#2e9b68": "bg-success-500",
  "text:#2e9b68": "text-success-500",
  "border:#2e9b68": "border-success-500",
  "ring:#2e9b68": "ring-success-500",
  "bg:#267d54": "bg-success-600",
  "bg:#237a52": "bg-success-600",
  "bg:#248255": "bg-success-600",
  "border:#248255": "border-success-600",
  "bg:#1d6c46": "bg-success-700",
  "bg:#eaf7ee": "bg-success-50",
  // status: pending amber / warning orange / info blue
  "text:#d99000": "text-pending-500",
  "ring:#d99000": "ring-pending-500",
  "bg:#fef6e6": "bg-pending-50",
  "text:#e07a3f": "text-warning-500",
  "ring:#e07a3f": "ring-warning-500",
  "bg:#fef0e8": "bg-warning-50",
  "text:#3b6b99": "text-info-500",
  "ring:#3b6b99": "ring-info-500",
  "bg:#eaf2fa": "bg-info-50",
};

// Literal hacks to remove outright (legacy text-shadow legibility patches)
const STRIP = [
  / ?drop-shadow-\[0_1px_1\.5px_rgba\(46,26,17,0\.85\)\]/g,
  / ?drop-shadow-\[0_1px_1px_rgba\(46,26,17,0\.85\)\]/g,
  / ?drop-shadow-\[0_1px_1\.5px_rgba\(46,26,17,0\.8\)\]/g,
  / ?drop-shadow-\[0_1px_1px_rgba\(46,26,17,0\.75\)\]/g,
  / ?drop-shadow-\[0_1px_1\.5px_rgba\(46,26,17,0\.7\)\]/g,
];

// Class-token regex: prefix-[#hex] optionally with opacity modifier
const TOKEN = /([a-zA-Z]+(?:-[a-zA-Z]+)?)-\[?(#[0-9A-Fa-f]{6})\]?(\/\d{1,3})?/g;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let totalTokens = 0;
const changed = [];

for (const file of files) {
  const src = readFileSync(file, "utf8");
  let next = src;
  let count = 0;

  next = next.replace(TOKEN, (match, prefix, hex, opacity) => {
    const key = `${prefix.toLowerCase()}:${hex.toLowerCase()}`;
    const token = M[key];
    if (!token) return match; // leave unknown tokens untouched
    count++;
    const base = token.split("-").slice(0, -1).join("-"); // utility prefix e.g. "bg"
    const color = token.slice(base.length + 1); // semantic color e.g. "brand-600"
    return `${base}-${color}${opacity ?? ""}`;
  });

  for (const re of STRIP) next = next.replace(re, "");

  if (next !== src) {
    writeFileSync(file, next);
    totalTokens += count;
    changed.push(`${file} (${count} tokens)`);
  }
}

console.log(`Migrated ${totalTokens} hex utility tokens across ${changed.length} files:`);
for (const c of changed) console.log("  " + c);
