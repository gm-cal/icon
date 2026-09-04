import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = path.join(scriptRoot, "release", "universal-ui-icons-500");
const root = process.argv[2]
  ? path.resolve(process.argv[2])
  : await exists(path.join(scriptRoot, "catalog", "catalog-v1.json")) ? scriptRoot : generatedRoot;
const errors = [];

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function svgFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await svgFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith(".svg")) result.push(absolute);
  }
  return result;
}

function expect(condition, message) {
  if (!condition) errors.push(message);
}

const catalogPath = path.join(root, "catalog", "catalog-v1.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
expect(catalog.schemaVersion === "1.0", "Catalog schemaVersion must be 1.0.");
expect(catalog.library?.iconCount === 500, "Catalog iconCount must be 500.");
expect(catalog.library?.svgCount === 1000, "Catalog svgCount must be 1000.");
expect(catalog.categories?.length === 20, "Exactly 20 categories are required.");
expect(catalog.icons?.length === 500, "Exactly 500 catalog entries are required.");

const ids = new Set();
const slugs = new Set();
for (const icon of catalog.icons) {
  expect(!ids.has(icon.id), `Duplicate id: ${icon.id}`);
  expect(!slugs.has(icon.slug), `Duplicate slug: ${icon.slug}`);
  ids.add(icon.id);
  slugs.add(icon.slug);
  expect(/^UUI-\d{4}$/.test(icon.id), `Invalid id: ${icon.id}`);
  expect(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon.slug), `Invalid slug: ${icon.slug}`);
  expect(icon.name?.ja && icon.name?.en, `Missing localized name: ${icon.id}`);
  expect(icon.geometrySha256?.length === 64, `Invalid geometry hash: ${icon.id}`);
  expect(JSON.stringify(icon.recommendedSizesPx) === JSON.stringify([16, 20, 24, 32, 48]), `Invalid recommended sizes: ${icon.id}`);

  for (const variant of ["color", "monochrome"]) {
    const relative = icon.files?.[variant];
    const absolute = path.join(root, relative ?? "__missing__");
    expect(await exists(absolute), `Missing ${variant} SVG: ${icon.id}`);
    if (!await exists(absolute)) continue;
    const svg = await readFile(absolute, "utf8");
    expect(svg.includes(`data-icon-id="${icon.id}"`), `ID mismatch in ${relative}`);
    expect(svg.includes(`data-icon-name="${icon.slug}"`), `Slug mismatch in ${relative}`);
    expect(svg.includes(`data-icon-variant="${variant}"`), `Variant mismatch in ${relative}`);
    expect(svg.includes("<metadata id=\"uui-metadata\">"), `Metadata missing in ${relative}`);
    expect(svg.includes("<title "), `Title missing in ${relative}`);
    expect(svg.includes("<desc "), `Description missing in ${relative}`);
    expect(svg.includes('<uui:name xml:lang="ja">') && svg.includes('<uui:name xml:lang="en">'), `Bilingual names missing in ${relative}`);
    expect(svg.includes('<uui:description xml:lang="ja">') && svg.includes('<uui:description xml:lang="en">'), `Bilingual descriptions missing in ${relative}`);
    expect(svg.includes("<uui:recommendedSizes unit=\"px\">16 20 24 32 48</uui:recommendedSizes>"), `Size metadata mismatch in ${relative}`);
    expect(svg.includes(`sha256="${icon.geometrySha256}"`), `Geometry hash mismatch in ${relative}`);
    expect(svg.includes('viewBox="0 0 24 24"'), `viewBox mismatch in ${relative}`);
    expect(svg.includes('stroke-width="2"'), `Stroke width mismatch in ${relative}`);
    if (variant === "monochrome") expect(svg.includes('stroke="currentColor"'), `currentColor missing in ${relative}`);
    else expect(/stroke="#[0-9A-F]{6}"/.test(svg), `Color stroke missing in ${relative}`);
  }
}

const colorFiles = await svgFiles(path.join(root, "color"));
const monochromeFiles = await svgFiles(path.join(root, "monochrome"));
expect(colorFiles.length === 500, `Expected 500 color SVGs; found ${colorFiles.length}.`);
expect(monochromeFiles.length === 500, `Expected 500 monochrome SVGs; found ${monochromeFiles.length}.`);

for (const variant of ["color", "monochrome"]) {
  const spritePath = path.join(root, "sprites", `${variant}.svg`);
  const sprite = await readFile(spritePath, "utf8");
  const symbols = sprite.match(/<symbol\b/g) ?? [];
  expect(symbols.length === 500, `Expected 500 symbols in ${variant} sprite; found ${symbols.length}.`);
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- ... ${errors.length - 100} more`);
  process.exitCode = 1;
} else {
  const digest = createHash("sha256").update(JSON.stringify(catalog.icons.map(({ id, slug, geometrySha256 }) => ({ id, slug, geometrySha256 })))).digest("hex");
  console.log(`Validation passed: 500 icons, 1,000 paired SVGs, 20 categories.`);
  console.log(`Catalog identity SHA-256: ${digest}`);
}
