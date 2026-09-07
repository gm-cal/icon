import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [operation, sourceLabel, targetLabel, variant = "color", output] = process.argv.slice(2);
const operations = new Map([
  ["convert", "file-convert"],
  ["split", "file-split"],
  ["merge", "file-merge"],
]);

function usage(message) {
  if (message) console.error(message);
  console.error("Usage: node tools/render-file-operation.mjs <convert|split|merge> <source> <target> [color|monochrome] [output.svg]");
  process.exit(2);
}

function validateLabel(label, name) {
  if (!label) usage(`${name} label is required.`);
  const chars = Array.from(label);
  if (chars.length < 1 || chars.length > 5) usage(`${name} label must be 1 to 5 characters.`);
  if (/[\u0000-\u001F\u007F]/u.test(label)) usage(`${name} label must not contain control characters.`);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function replaceSlot(svg, slot, value) {
  const escaped = escapeXml(value);
  const expression = new RegExp(`(<text\\b[^>]*data-uui-label-slot="${slot}"[^>]*>)([^<]*)(<\\/text>)`, "g");
  let count = 0;
  const result = svg.replace(expression, (_all, open, _old, close) => {
    count += 1;
    return `${open}${escaped}${close}`;
  });
  if (count === 0) throw new Error(`Template does not contain label slot: ${slot}`);
  return result;
}

if (!operations.has(operation)) usage("Unknown operation.");
if (variant !== "color" && variant !== "monochrome") usage("Variant must be color or monochrome.");
validateLabel(sourceLabel, "Source");
validateLabel(targetLabel, "Target");

const slug = operations.get(operation);
const templatePath = path.join(root, variant, "file-operations", `${slug}.svg`);
let svg = await readFile(templatePath, "utf8");
svg = replaceSlot(svg, "source", sourceLabel);
svg = replaceSlot(svg, "target", targetLabel);
svg = svg.replace("<svg ", `<svg data-uui-derived-source="${escapeXml(sourceLabel)}" data-uui-derived-target="${escapeXml(targetLabel)}" `);

if (output) {
  const outputPath = path.resolve(output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, svg, "utf8");
  console.log(outputPath);
} else {
  process.stdout.write(svg);
}
