import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetSlugs = new Set([
  "ui-checkbox-unchecked",
  "ui-checkbox-checked",
  "ui-checkbox-indeterminate",
  "ui-radio-unselected",
  "ui-radio-selected",
]);

const read = (relative) => readFile(path.join(root, relative), "utf8");
const write = (relative, content) => writeFile(path.join(root, relative), content, "utf8");
const sha256 = (content) => createHash("sha256").update(content).digest("hex");

function decodeXml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function localizedText(svg, tag, lang) {
  const match = svg.match(new RegExp(`<uui:${tag} xml:lang="${lang}">([\\s\\S]*?)<\\/uui:${tag}>`));
  if (!match) throw new Error(`Missing ${tag}[${lang}] metadata.`);
  return decodeXml(match[1]);
}

function geometryLines(svg) {
  const match = svg.match(/<g aria-hidden="true">\s*\n?([\s\S]*?)\n\s*<\/g>\s*<\/svg>\s*$/);
  if (!match) throw new Error("Could not locate icon geometry group.");
  return match[1].split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function geometryHash(svg) {
  const geometry = [];
  for (const line of geometryLines(svg)) {
    const element = line.match(/^<([a-zA-Z0-9:-]+)\s+([\s\S]*?)\/>$/);
    if (!element) throw new Error(`Unsupported geometry line: ${line}`);
    const [, name, rawAttributes] = element;
    const attributes = {};
    for (const match of rawAttributes.matchAll(/([a-zA-Z0-9:-]+)="([^"]*)"/g)) {
      const [, key, value] = match;
      if (key === "stroke" || key === "fill" || key === "data-uui-role") continue;
      attributes[key] = decodeXml(value);
    }
    geometry.push([name, attributes]);
  }
  return sha256(JSON.stringify(geometry));
}

function replaceGeometryHash(svg, hash) {
  return svg.replace(/(<uui:geometry\b[^>]*\bsha256=")[0-9a-f]{64}("\/>)/, `$1${hash}$2`);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildCsv(catalog) {
  const headers = [
    "id", "legacy_id", "slug", "name_ja", "name_en", "category_id", "category_code",
    "category_ja", "description_ja", "color_file", "monochrome_file",
    "recommended_sizes_px", "minimum_size_px", "geometry_sha256",
  ];
  const rows = [headers.map(csvCell).join(",")];
  for (const icon of catalog.icons) {
    rows.push([
      icon.id,
      icon.legacyId ?? "",
      icon.slug,
      icon.name.ja,
      icon.name.en,
      icon.category.id,
      icon.category.code,
      icon.category.ja,
      icon.description.ja,
      icon.files.color,
      icon.files.monochrome,
      icon.recommendedSizesPx.join("|"),
      icon.minimumSizePx,
      icon.geometrySha256,
    ].map(csvCell).join(","));
  }
  return `\uFEFF${rows.join("\n")}\n`;
}

async function buildSprite(catalog, variant) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg">',
    '  <defs>',
  ];
  for (const icon of catalog.icons) {
    const svg = await read(icon.files[variant]);
    lines.push(`    <symbol id="uui-${icon.slug}" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`);
    lines.push(`      <title xml:lang="ja">${escapeXml(icon.name.ja)}</title>`);
    for (const geometry of geometryLines(svg)) lines.push(`      ${geometry}`);
    lines.push('    </symbol>');
  }
  lines.push('  </defs>', '</svg>', '');
  return lines.join("\n");
}

async function buildCategoryPreview(catalog, variant) {
  const icons = catalog.icons.filter((icon) => icon.category.id === "ui-components");
  const monochrome = variant === "monochrome";
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="736" viewBox="0 0 840 736"${monochrome ? ' color="#1F2937"' : ""}>`,
    '  <rect width="100%" height="100%" fill="#F8FAFC"/>',
    `  <text x="24" y="34" font-size="22" font-weight="700" fill="#0F172A">UI部品 — ${monochrome ? "モノクロ版" : "カラー版"}</text>`,
    `  <text x="24" y="57" font-size="12" fill="#64748B">UI components · ${icons.length} icons</text>`,
  ];
  for (let index = 0; index < icons.length; index += 1) {
    const icon = icons[index];
    const x = (index % 5) * 168;
    const y = 76 + Math.floor(index / 5) * 132;
    const svg = await read(icon.files[variant]);
    lines.push(`    <g transform="translate(${x} ${y})">`);
    lines.push('      <rect x="8" y="8" width="152" height="116" rx="14" fill="#FFFFFF" stroke="#E5E7EB"/>');
    lines.push('      <g transform="translate(60 22) scale(2)" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">');
    for (const geometry of geometryLines(svg)) lines.push(`        ${geometry}`);
    lines.push('      </g>');
    lines.push(`      <text x="84" y="91" text-anchor="middle" font-size="13" font-weight="600" fill="#111827">${escapeXml(icon.name.ja)}</text>`);
    lines.push(`      <text x="84" y="110" text-anchor="middle" font-size="10" fill="#6B7280">${escapeXml(icon.id)} · ${escapeXml(icon.slug)}</text>`);
    lines.push('    </g>');
  }
  lines.push('</svg>', '');
  return lines.join("\n");
}

async function exists(relative) {
  try {
    await access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

async function refreshChecksums() {
  const current = await read("SHA256SUMS");
  const paths = current.split(/\r?\n/)
    .map((line) => line.match(/^[0-9a-f]{64}  (.+)$/)?.[1])
    .filter(Boolean);
  if (!paths.includes("tools/sync-generated.mjs")) {
    const validateIndex = paths.indexOf("tools/validate.mjs");
    if (validateIndex >= 0) paths.splice(validateIndex, 0, "tools/sync-generated.mjs");
    else paths.push("tools/sync-generated.mjs");
  }
  const output = [];
  for (const relative of paths) {
    if (!await exists(relative)) continue;
    const bytes = await readFile(path.join(root, relative));
    output.push(`${sha256(bytes)}  ${relative}`);
  }
  await write("SHA256SUMS", `${output.join("\n")}\n`);
}

const catalog = JSON.parse(await read("catalog/catalog-v1.json"));

for (const icon of catalog.icons) {
  if (!targetSlugs.has(icon.slug)) continue;
  const colorPath = icon.files.color;
  const monoPath = icon.files.monochrome;
  let colorSvg = await read(colorPath);
  let monoSvg = await read(monoPath);
  const colorHash = geometryHash(colorSvg);
  const monoHash = geometryHash(monoSvg);
  if (colorHash !== monoHash) throw new Error(`Color/monochrome geometry mismatch: ${icon.slug}`);
  colorSvg = replaceGeometryHash(colorSvg, colorHash);
  monoSvg = replaceGeometryHash(monoSvg, colorHash);
  await write(colorPath, colorSvg);
  await write(monoPath, monoSvg);
  icon.geometrySha256 = colorHash;
  icon.description.ja = localizedText(colorSvg, "description", "ja");
  icon.description.en = localizedText(colorSvg, "description", "en");
  icon.keywords.ja = localizedText(colorSvg, "keywords", "ja").split(/\s*,\s*/);
  icon.keywords.en = localizedText(colorSvg, "keywords", "en").split(/\s*,\s*/);
}

await write("catalog/catalog-v1.json", `${JSON.stringify(catalog, null, 2)}\n`);
await write("catalog/catalog-v1.csv", buildCsv(catalog));
await write("sprites/color.svg", await buildSprite(catalog, "color"));
await write("sprites/monochrome.svg", await buildSprite(catalog, "monochrome"));
await write("preview/categories/ui-components-color.svg", await buildCategoryPreview(catalog, "color"));
await write("preview/categories/ui-components-monochrome.svg", await buildCategoryPreview(catalog, "monochrome"));
await refreshChecksums();

console.log("Generated artifacts synchronized for UI component palette icons.");
