import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = path.join(scriptRoot, "release", "universal-ui-icons");
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
expect(catalog.schemaVersion === "1.1", "Catalog schemaVersion must be 1.1.");
const expectedIconCount = catalog.library?.iconCount;
const expectedSvgCount = expectedIconCount * 2;
expect(Number.isInteger(expectedIconCount) && expectedIconCount > 0, "Catalog iconCount must be a positive integer.");
expect(catalog.library?.svgCount === expectedSvgCount, `Catalog svgCount must be ${expectedSvgCount}.`);
expect(Array.isArray(catalog.categories) && catalog.categories.length > 0, "At least one category is required.");
expect(catalog.icons?.length === expectedIconCount, `Exactly ${expectedIconCount} catalog entries are required.`);

const ids = new Set();
const legacyIds = new Set();
const slugs = new Set();
const categoryCodes = new Map(catalog.categories.map((category) => [category.id, category.code]));
const categorySequence = new Map();
expect(categoryCodes.size === catalog.categories.length, "Category ids must be unique.");
expect(new Set(categoryCodes.values()).size === catalog.categories.length, "Category codes must be unique.");
for (const icon of catalog.icons) {
  expect(!ids.has(icon.id), `Duplicate id: ${icon.id}`);
  expect(!slugs.has(icon.slug), `Duplicate slug: ${icon.slug}`);
  ids.add(icon.id);
  slugs.add(icon.slug);
  expect(/^UUI-[A-Z0-9]{3}-\d{4}$/.test(icon.id), `Invalid id: ${icon.id}`);
  expect(icon.category?.code === categoryCodes.get(icon.category?.id), `Category code mismatch: ${icon.id}`);
  expect(icon.id.startsWith(`UUI-${icon.category?.code}-`), `ID category prefix mismatch: ${icon.id}`);
  const nextCategorySequence = (categorySequence.get(icon.category?.id) ?? 0) + 1;
  categorySequence.set(icon.category?.id, nextCategorySequence);
  expect(icon.id === `UUI-${icon.category?.code}-${String(nextCategorySequence).padStart(4, "0")}`, `Non-contiguous category sequence: ${icon.id}`);
  if (icon.legacyId) {
    expect(/^UUI-\d{4}$/.test(icon.legacyId), `Invalid legacy id: ${icon.legacyId}`);
    expect(!legacyIds.has(icon.legacyId), `Duplicate legacy id: ${icon.legacyId}`);
    legacyIds.add(icon.legacyId);
  }
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
    if (icon.legacyId) {
      expect(svg.includes(`legacyId="${icon.legacyId}"`), `Legacy ID missing in ${relative}`);
      expect(svg.includes(`data-icon-legacy-id="${icon.legacyId}"`), `Legacy data attribute missing in ${relative}`);
    }
    expect(svg.includes(`code="${icon.category.code}"`), `Category code missing in ${relative}`);
    expect(svg.includes(`data-icon-category-code="${icon.category.code}"`), `Category data attribute missing in ${relative}`);
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

expect(legacyIds.size === Math.min(1000, expectedIconCount), `Expected ${Math.min(1000, expectedIconCount)} legacy ids; found ${legacyIds.size}.`);
for (const category of catalog.categories) {
  expect(category.iconCount === categorySequence.get(category.id), `Category count mismatch: ${category.id}`);
}

const migrationPath = path.join(root, "catalog", "id-migration-v2-to-v3.csv");
expect(await exists(migrationPath), "ID migration CSV is missing.");
if (await exists(migrationPath)) {
  const migrationLines = (await readFile(migrationPath, "utf8")).trim().split(/\r?\n/);
  expect(migrationLines.length === legacyIds.size + 1, `ID migration row count mismatch: ${migrationLines.length - 1}`);
}

const colorFiles = await svgFiles(path.join(root, "color"));
const monochromeFiles = await svgFiles(path.join(root, "monochrome"));
expect(colorFiles.length === expectedIconCount, `Expected ${expectedIconCount} color SVGs; found ${colorFiles.length}.`);
expect(monochromeFiles.length === expectedIconCount, `Expected ${expectedIconCount} monochrome SVGs; found ${monochromeFiles.length}.`);

for (const variant of ["color", "monochrome"]) {
  const spritePath = path.join(root, "sprites", `${variant}.svg`);
  const sprite = await readFile(spritePath, "utf8");
  const symbols = sprite.match(/<symbol\b/g) ?? [];
  expect(symbols.length === expectedIconCount, `Expected ${expectedIconCount} symbols in ${variant} sprite; found ${symbols.length}.`);
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  if (errors.length > 100) console.error(`- ... ${errors.length - 100} more`);
  process.exitCode = 1;
} else {
  const digest = createHash("sha256").update(JSON.stringify(catalog.icons.map(({ id, legacyId, slug, geometrySha256 }) => ({ id, legacyId, slug, geometrySha256 })))).digest("hex");
  console.log(`Validation passed: ${expectedIconCount} icons, ${expectedSvgCount.toLocaleString("en-US")} paired SVGs, ${catalog.categories.length} categories.`);
  console.log(`Catalog identity SHA-256: ${digest}`);
}
